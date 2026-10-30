-- >>> 001_initial_schema.sql
-- ============================================================================
-- 001_initial_schema.sql
-- Zaky – Zakat Distribution Verification Network
-- Initial database schema migration
-- ============================================================================

BEGIN;

-- Ekstensi pgcrypto untuk fungsi digest() SHA-256 pada rantai hash audit_log
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================================

-- Delapan golongan penerima zakat sesuai QS At-Taubah:60
CREATE TYPE asnaf_enum AS ENUM (
    'fakir',
    'miskin',
    'amil',
    'muallaf',
    'riqab',
    'gharimin',
    'fisabilillah',
    'ibnu_sabil'
);

-- Status siklus hidup penyaluran zakat
CREATE TYPE status_penyaluran AS ENUM (
    'dibuat',
    'menunggu_konfirmasi',
    'ditolak_penerima',
    'dikonfirmasi',
    'disetujui',
    'tersalurkan',
    'kedaluwarsa',
    'dibatalkan'
);

-- ============================================================================
-- 2. LEMBAGA (Institution)
-- ============================================================================

CREATE TABLE lembaga (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    nama                  text        NOT NULL,
    kunci_publik_ed25519  bytea       NOT NULL,
    persen_hak_amil_maks  numeric(5,2) NOT NULL DEFAULT 12.50 CHECK (persen_hak_amil_maks >= 0 AND persen_hak_amil_maks <= 100),
    aktif                 boolean     NOT NULL DEFAULT true
);

COMMENT ON TABLE  lembaga IS 'Lembaga zakat yang terdaftar dalam jaringan';
COMMENT ON COLUMN lembaga.kunci_publik_ed25519 IS 'Ed25519 public key (32 bytes) untuk verifikasi tanda tangan';

-- ============================================================================
-- 3. UNIT (Organizational unit within a lembaga)
-- ============================================================================

CREATE TABLE unit (
    id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id  uuid    NOT NULL REFERENCES lembaga(id),
    nama        text    NOT NULL
);

COMMENT ON TABLE unit IS 'Unit organisasi di bawah lembaga (mis. Unit Pelayanan, Unit Keuangan)';

-- ============================================================================
-- 4. AKUN (User account)
-- ============================================================================

CREATE TABLE akun (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id      uuid        NOT NULL REFERENCES lembaga(id),
    unit_id         uuid        NOT NULL REFERENCES unit(id),
    peran           text        NOT NULL CHECK (peran IN ('amil', 'penyetuju', 'admin')),
    nama            text        NOT NULL,
    email           text        UNIQUE NOT NULL,
    password_hash   text        NOT NULL,
    aktif           boolean     NOT NULL DEFAULT true
);

COMMENT ON TABLE akun IS 'Akun pengguna sistem (amil, penyetuju, atau admin)';

-- ============================================================================
-- 5. POS DANA (Fund pool)
-- ============================================================================

CREATE TABLE pos_dana (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id          uuid            NOT NULL REFERENCES lembaga(id),
    nama                text            NOT NULL,
    total_masuk         numeric(18,2)   NOT NULL DEFAULT 0,
    saldo_tersedia      numeric(18,2)   NOT NULL DEFAULT 0,
    saldo_dicadangkan   numeric(18,2)   NOT NULL DEFAULT 0,
    total_tersalurkan   numeric(18,2)   NOT NULL DEFAULT 0,

    -- Invariant: saldo tidak boleh negatif
    CONSTRAINT pos_dana_saldo_tersedia_non_negatif
        CHECK (saldo_tersedia >= 0),
    CONSTRAINT pos_dana_saldo_dicadangkan_non_negatif
        CHECK (saldo_dicadangkan >= 0),
    CONSTRAINT pos_dana_total_tersalurkan_non_negatif
        CHECK (total_tersalurkan >= 0),

    -- Invariant: total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
    CONSTRAINT pos_dana_keseimbangan
        CHECK (total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan)
);

COMMENT ON TABLE pos_dana IS 'Pos/pool dana zakat dengan pelacakan saldo double-entry';

-- ============================================================================
-- 6. MUSTAHIK (Zakat recipient – pseudonymised)
-- ============================================================================

CREATE TABLE mustahik (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id      uuid            NOT NULL REFERENCES lembaga(id),
    nama_samaran    text            NOT NULL,
    kabupaten       text            NOT NULL,
    asnaf           asnaf_enum      NOT NULL,
    telepon_hmac    bytea           NOT NULL,
    consent_at      timestamptz     NOT NULL
);

COMMENT ON TABLE  mustahik IS 'Data penerima zakat (mustahik) – disimpan dengan nama samaran';
COMMENT ON COLUMN mustahik.telepon_hmac IS 'HMAC-SHA256 dari nomor telepon untuk pencarian tanpa menyimpan plaintext';
COMMENT ON COLUMN mustahik.consent_at IS 'Waktu persetujuan mustahik untuk pengolahan data';

-- ============================================================================
-- 7. PENERIMAAN (Incoming zakat receipt)
-- ============================================================================

CREATE TABLE penerimaan (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unik       char(12)        UNIQUE NOT NULL,
    lembaga_id      uuid            NOT NULL REFERENCES lembaga(id),
    pos_id          uuid            NOT NULL REFERENCES pos_dana(id),
    bruto           numeric(18,2)   NOT NULL CHECK (bruto > 0),
    hak_amil        numeric(18,2)   NOT NULL CHECK (hak_amil >= 0),
    masuk_pos       numeric(18,2)   NOT NULL CHECK (masuk_pos >= 0),
    kanal           text            NOT NULL,
    dicatat_oleh    uuid            NOT NULL REFERENCES akun(id),
    dicatat_pada    timestamptz     NOT NULL DEFAULT now(),

    -- Invariant: bruto = hak_amil + masuk_pos
    CONSTRAINT penerimaan_keseimbangan
        CHECK (bruto = hak_amil + masuk_pos)
);

COMMENT ON TABLE penerimaan IS 'Pencatatan penerimaan dana zakat masuk';

-- ============================================================================
-- 8. PENYALURAN (Distribution / disbursement)
-- ============================================================================

CREATE TABLE penyaluran (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unik       char(12)            UNIQUE NOT NULL,
    lembaga_id      uuid                NOT NULL REFERENCES lembaga(id),
    pos_id          uuid                NOT NULL REFERENCES pos_dana(id),
    mustahik_id     uuid                NOT NULL REFERENCES mustahik(id),
    asnaf           asnaf_enum          NOT NULL,
    nominal         numeric(18,2)       NOT NULL CHECK (nominal > 0),
    status          status_penyaluran   NOT NULL,
    metode          text                NOT NULL CHECK (metode IN ('mustahik', 'saksi')),
    dibuat_oleh     uuid                NOT NULL REFERENCES akun(id),
    dibuat_unit     uuid                NOT NULL REFERENCES unit(id),
    penyetuju_akun  uuid                REFERENCES akun(id),
    penyetuju_unit  uuid                REFERENCES unit(id),
    penyetuju_waktu timestamptz,
    kedaluwarsa_pada timestamptz        NOT NULL,
    dibuat_pada     timestamptz         NOT NULL DEFAULT now(),

    -- Penyetuju harus berbeda dari pembuat (akun maupun unit)
    CONSTRAINT penyaluran_penyetuju_beda_pembuat
        CHECK (penyetuju_akun IS NULL OR penyetuju_akun <> dibuat_oleh),
    CONSTRAINT penyaluran_penyetuju_unit_beda_pembuat
        CHECK (penyetuju_unit IS NULL OR penyetuju_unit <> dibuat_unit),

    -- Status 'tersalurkan' membutuhkan penyetuju lengkap
    CONSTRAINT penyaluran_tersalurkan_butuh_penyetuju
        CHECK (status <> 'tersalurkan' OR (penyetuju_akun IS NOT NULL AND penyetuju_unit IS NOT NULL))
);

COMMENT ON TABLE penyaluran IS 'Penyaluran dana zakat kepada mustahik';

-- ============================================================================
-- 9. KONFIRMASI (Confirmation by mustahik or witness)
-- ============================================================================

CREATE TABLE konfirmasi (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    penyaluran_id       uuid        NOT NULL REFERENCES penyaluran(id),
    jenis               text        NOT NULL CHECK (jenis IN ('mustahik', 'saksi')),
    akun_saksi_id       uuid        REFERENCES akun(id),
    unit_saksi          uuid        REFERENCES unit(id),
    token_hash          bytea,
    dipakai_pada        timestamptz,
    kedaluwarsa_pada    timestamptz NOT NULL,
    hasil               text        CHECK (hasil IN ('menerima', 'menolak')),

    -- Mustahik: token_hash wajib, saksi fields harus NULL
    -- Saksi: akun_saksi_id & unit_saksi wajib, token_hash harus NULL
    CONSTRAINT konfirmasi_jenis_konsisten
        CHECK (
            (jenis = 'mustahik'
                AND akun_saksi_id IS NULL
                AND unit_saksi IS NULL
                AND token_hash IS NOT NULL)
            OR
            (jenis = 'saksi'
                AND akun_saksi_id IS NOT NULL
                AND unit_saksi IS NOT NULL
                AND token_hash IS NULL)
        ),

    -- Satu saksi hanya bisa mengkonfirmasi satu penyaluran sekali
    CONSTRAINT konfirmasi_unik_saksi
        UNIQUE (penyaluran_id, akun_saksi_id)
);

COMMENT ON TABLE konfirmasi IS 'Konfirmasi penerimaan zakat oleh mustahik atau saksi';

-- Hanya satu konfirmasi mustahik per penyaluran
CREATE UNIQUE INDEX konfirmasi_unik_mustahik
    ON konfirmasi (penyaluran_id)
    WHERE jenis = 'mustahik';

-- ============================================================================
-- 10. BUKTI (Evidence / proof of distribution)
-- ============================================================================

CREATE TABLE bukti (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    penyaluran_id   uuid        NOT NULL REFERENCES penyaluran(id),
    berkas_path     text        NOT NULL,
    sha256          bytea       NOT NULL,
    diunggah_pada   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE bukti IS 'Bukti/berkas pendukung penyaluran (foto, dokumen)';

-- ============================================================================
-- 11. RANTAI KEPALA (Hash chain head per lembaga)
-- ============================================================================

CREATE TABLE rantai_kepala (
    lembaga_id      uuid    PRIMARY KEY REFERENCES lembaga(id),
    nomor           bigint  NOT NULL DEFAULT 0,
    hash_kepala     bytea   NOT NULL
);

COMMENT ON TABLE rantai_kepala IS 'Kepala rantai hash audit per lembaga – menyimpan hash terbaru';

-- ============================================================================
-- 12. AUDIT_LOG (Append-only audit trail with hash chain)
-- ============================================================================

CREATE TABLE audit_log (
    nomor           bigint      PRIMARY KEY,
    lembaga_id      uuid        NOT NULL REFERENCES lembaga(id),
    entitas         text        NOT NULL,
    entitas_id      uuid        NOT NULL,
    aksi            text        NOT NULL,
    pelaku          uuid        NOT NULL,
    sebelum         jsonb,
    sesudah         jsonb,
    waktu           timestamptz NOT NULL DEFAULT now(),
    hash_sebelumnya bytea       NOT NULL,
    hash_saat_ini   bytea       NOT NULL UNIQUE
);

COMMENT ON TABLE audit_log IS 'Log audit append-only dengan rantai hash untuk integritas';

-- Trigger: mencegah UPDATE dan DELETE pada audit_log
CREATE OR REPLACE FUNCTION audit_log_append_only()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log bersifat append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_append_only
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_append_only();

-- ============================================================================
-- 13. HASH HARIAN (Daily hash digest per lembaga)
-- ============================================================================

CREATE TABLE hash_harian (
    lembaga_id          uuid        NOT NULL,
    tanggal             date        NOT NULL,
    payload_jcs         bytea       NOT NULL,
    hash_kepala         bytea       NOT NULL,
    tanda_tangan        bytea       NOT NULL,
    kunci_id            text        NOT NULL,
    diterbitkan_pada    timestamptz NOT NULL,

    PRIMARY KEY (lembaga_id, tanggal)
);

COMMENT ON TABLE hash_harian IS 'Digest hash harian yang ditandatangani oleh lembaga';

-- ============================================================================
-- 14. KESAKSIAN (Cross-institution witness attestation)
-- ============================================================================

CREATE TABLE kesaksian (
    saksi_lembaga_id    uuid        NOT NULL,
    lembaga_id          uuid        NOT NULL,
    tanggal             date        NOT NULL,
    hash_disaksikan     bytea       NOT NULL,
    tanda_tangan_saksi  bytea       NOT NULL,
    diamati_pada        timestamptz NOT NULL,

    PRIMARY KEY (saksi_lembaga_id, lembaga_id, tanggal),

    -- Lembaga tidak boleh menyaksikan dirinya sendiri
    CONSTRAINT kesaksian_beda_lembaga
        CHECK (saksi_lembaga_id <> lembaga_id)
);

COMMENT ON TABLE kesaksian IS 'Kesaksian antar-lembaga atas hash harian (cross-verification)';

-- ============================================================================
-- INDEXES (Performance)
-- ============================================================================

-- Lookup by lembaga
CREATE INDEX idx_unit_lembaga          ON unit(lembaga_id);
CREATE INDEX idx_akun_lembaga          ON akun(lembaga_id);
CREATE INDEX idx_akun_unit             ON akun(unit_id);
CREATE INDEX idx_pos_dana_lembaga      ON pos_dana(lembaga_id);
CREATE INDEX idx_mustahik_lembaga      ON mustahik(lembaga_id);
CREATE INDEX idx_penerimaan_lembaga    ON penerimaan(lembaga_id);
CREATE INDEX idx_penerimaan_pos        ON penerimaan(pos_id);
CREATE INDEX idx_penyaluran_lembaga    ON penyaluran(lembaga_id);
CREATE INDEX idx_penyaluran_pos        ON penyaluran(pos_id);
CREATE INDEX idx_penyaluran_mustahik   ON penyaluran(mustahik_id);
CREATE INDEX idx_penyaluran_status     ON penyaluran(status);
CREATE INDEX idx_bukti_penyaluran      ON bukti(penyaluran_id);
CREATE INDEX idx_konfirmasi_penyaluran ON konfirmasi(penyaluran_id);
CREATE INDEX idx_audit_log_lembaga     ON audit_log(lembaga_id);
CREATE INDEX idx_audit_log_entitas     ON audit_log(entitas, entitas_id);

-- Mustahik lookup by telepon_hmac (for deduplication)
CREATE INDEX idx_mustahik_telepon_hmac ON mustahik(telepon_hmac);

COMMIT;

-- >>> 002_seed_demo.sql
-- ============================================================
-- Zaky — Data induk demo Lembaga Zakat A
-- Hanya data induk: lembaga, unit, akun, pos dana (saldo nol), mustahik.
-- Semua transaksi dibuat di 007_demo_activity.sql lewat stored procedure resmi,
-- sehingga saldo, grafik, dan rantai audit selalu sinkron.
-- ============================================================

DO $$
DECLARE
  v_lembaga_id  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_unit_1      uuid := 'a1111111-1111-1111-1111-111111111111'; -- Unit Pelayanan
  v_unit_2      uuid := 'a2222222-2222-2222-2222-222222222222'; -- Unit Keuangan
  v_unit_3      uuid := 'a3333333-3333-3333-3333-333333333333'; -- Unit Penyaluran
  v_unit_4      uuid := 'a4444444-4444-4444-4444-444444444444'; -- Unit Pengawasan

  -- Empat akun, satu per unit: pembuat, dua saksi dari unit berbeda, dan penyetuju.
  v_akun_budi    uuid := '11111111-1111-1111-1111-111111111111'; -- Amil Budi
  v_akun_hari    uuid := '22222222-2222-2222-2222-222222222222'; -- Penyetuju Hari
  v_akun_dewi    uuid := '33333333-3333-3333-3333-333333333333'; -- Saksi Dewi
  v_akun_rian    uuid := '44444444-4444-4444-4444-444444444444'; -- Saksi Rian

  v_pos_maal     uuid := 'c1111111-1111-1111-1111-111111111111'; -- Zakat Maal
  v_pos_fitrah   uuid := 'c2222222-2222-2222-2222-222222222222'; -- Zakat Fitrah
  v_pos_infak    uuid := 'c3333333-3333-3333-3333-333333333333'; -- Infak & Sedekah Terikat

  -- Password demo "demo123" (penanda; login demo memeriksa di aplikasi)
  v_pwd_hash    text := 'demo';
BEGIN
  INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks)
  VALUES (v_lembaga_id, 'Lembaga Zakat A', decode(repeat('00', 32), 'hex'), 12.50);

  INSERT INTO unit (id, lembaga_id, nama) VALUES
    (v_unit_1, v_lembaga_id, 'Unit Pelayanan'),
    (v_unit_2, v_lembaga_id, 'Unit Keuangan'),
    (v_unit_3, v_lembaga_id, 'Unit Penyaluran'),
    (v_unit_4, v_lembaga_id, 'Unit Pengawasan');

  INSERT INTO akun (id, lembaga_id, unit_id, peran, nama, email, password_hash) VALUES
    (v_akun_budi,   v_lembaga_id, v_unit_1, 'amil',      'Amil Budi',       'budi@lembaga-a.test',   v_pwd_hash),
    (v_akun_hari,   v_lembaga_id, v_unit_2, 'penyetuju', 'Penyetuju Hari',  'hari@lembaga-a.test',   v_pwd_hash),
    (v_akun_dewi,   v_lembaga_id, v_unit_3, 'amil',      'Saksi Dewi',      'dewi@lembaga-a.test',   v_pwd_hash),
    (v_akun_rian,   v_lembaga_id, v_unit_4, 'amil',      'Saksi Rian',      'rian@lembaga-a.test',   v_pwd_hash);

  -- Pos dana mulai dari nol; saldo terbentuk dari transaksi di 007.
  -- Invariant: total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
  INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan) VALUES
    (v_pos_maal,   v_lembaga_id, 'Zakat Maal',              0, 0, 0, 0),
    (v_pos_fitrah, v_lembaga_id, 'Zakat Fitrah Uang',       0, 0, 0, 0),
    (v_pos_infak,  v_lembaga_id, 'Infak & Sedekah Terikat', 0, 0, 0, 0);

  -- Satu mustahik per asnaf (nama samaran; telepon hanya HMAC) agar grafik asnaf lengkap.
  INSERT INTO mustahik (id, lembaga_id, nama_samaran, kabupaten, asnaf, telepon_hmac, consent_at) VALUES
    ('d1111111-1111-1111-1111-111111111111', v_lembaga_id, 'S***', 'Kabupaten Sleman',      'fakir',        decode(repeat('a1', 32), 'hex'), now()),
    ('d2222222-2222-2222-2222-222222222222', v_lembaga_id, 'A***', 'Kabupaten Bantul',      'miskin',       decode(repeat('a2', 32), 'hex'), now()),
    ('d3333333-3333-3333-3333-333333333333', v_lembaga_id, 'M***', 'Kota Yogyakarta',       'gharimin',     decode(repeat('a3', 32), 'hex'), now()),
    ('d4444444-4444-4444-4444-444444444444', v_lembaga_id, 'H***', 'Kabupaten Gunungkidul', 'muallaf',      decode(repeat('a4', 32), 'hex'), now()),
    ('d5555555-5555-5555-5555-555555555555', v_lembaga_id, 'R***', 'Kabupaten Kulon Progo', 'riqab',        decode(repeat('a5', 32), 'hex'), now()),
    ('d6666666-6666-6666-6666-666666666666', v_lembaga_id, 'F***', 'Kota Yogyakarta',       'fisabilillah', decode(repeat('a6', 32), 'hex'), now()),
    ('d7777777-7777-7777-7777-777777777777', v_lembaga_id, 'I***', 'Kabupaten Sleman',      'ibnu_sabil',   decode(repeat('a7', 32), 'hex'), now()),
    ('d8888888-8888-8888-8888-888888888888', v_lembaga_id, 'N***', 'Kabupaten Bantul',      'amil',         decode(repeat('a8', 32), 'hex'), now());

  INSERT INTO rantai_kepala (lembaga_id, nomor, hash_kepala)
  VALUES (v_lembaga_id, 0, decode(repeat('00', 32), 'hex'));
END $$;

-- >>> 003_stored_procedures.sql
-- ============================================================================
-- Zaky v4.0 — Migration 003: Stored Procedures & Invariant Functions
-- ============================================================================
-- Sesuai PRD v4.0 Bagian 4, 5, 6, 7 & Acceptance Criteria AC-01 s/d AC-16
-- Menjamin urutan penguncian global: pos_dana -> penyaluran -> rantai_kepala (FR-35)
-- ============================================================================

-- Helper: Append to audit log & update head hash
CREATE OR REPLACE FUNCTION append_audit_log(
    p_lembaga_id UUID,
    p_entitas TEXT,
    p_entitas_id UUID,
    p_aksi TEXT,
    p_pelaku UUID,
    p_sebelum JSONB,
    p_sesudah JSONB
) RETURNS BYTEA AS $$
DECLARE
    v_prev_hash BYTEA;
    v_new_hash BYTEA;
    v_nomor BIGINT;
    v_waktu TIMESTAMPTZ := clock_timestamp();
    v_payload TEXT;
BEGIN
    SELECT nomor, hash_kepala INTO v_nomor, v_prev_hash
    FROM rantai_kepala WHERE lembaga_id = p_lembaga_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rantai kepala untuk lembaga % tidak ditemukan', p_lembaga_id;
    END IF;

    v_nomor := v_nomor + 1;

    v_payload := json_build_object(
        'aksi', p_aksi,
        'entitas', p_entitas,
        'entitas_id', p_entitas_id,
        'lembaga_id', p_lembaga_id,
        'nomor', v_nomor,
        'pelaku', p_pelaku,
        'sebelum', p_sebelum,
        'sesudah', p_sesudah,
        'waktu', to_char(v_waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    )::text;

    v_new_hash := digest(convert_to(v_payload, 'UTF8') || v_prev_hash, 'sha256');

    INSERT INTO audit_log (nomor, lembaga_id, entitas, entitas_id, aksi, pelaku,
                           sebelum, sesudah, waktu, hash_sebelumnya, hash_saat_ini)
    VALUES (v_nomor, p_lembaga_id, p_entitas, p_entitas_id, p_aksi, p_pelaku,
            p_sebelum, p_sesudah, v_waktu, v_prev_hash, v_new_hash);

    UPDATE rantai_kepala SET nomor = v_nomor, hash_kepala = v_new_hash
    WHERE lembaga_id = p_lembaga_id;

    RETURN v_new_hash;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 0. HELPER: GENERATE KODE UNIK DENGAN CSPRNG (T8)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_kode_unik(p_prefix TEXT) RETURNS CHAR(12) AS $$
DECLARE
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_len INT := length(v_chars);
    v_bytes BYTEA;
    v_code TEXT;
    v_tries INT := 0;
    v_collision BOOLEAN;
BEGIN
    LOOP
        v_bytes := gen_random_bytes(10);
        v_code := p_prefix;
        FOR i IN 0..9 LOOP
            v_code := v_code || substr(v_chars, (get_byte(v_bytes, i) % v_len) + 1, 1);
        END LOOP;

        IF p_prefix = 'ZK' THEN
            SELECT EXISTS (SELECT 1 FROM penyaluran WHERE kode_unik = v_code) INTO v_collision;
        ELSE
            SELECT EXISTS (SELECT 1 FROM penerimaan WHERE kode_unik = v_code) INTO v_collision;
        END IF;

        IF NOT v_collision THEN
            RETURN v_code::CHAR(12);
        END IF;

        v_tries := v_tries + 1;
        IF v_tries > 10 THEN
            RAISE EXCEPTION 'GAGAL_GENERATE_KODE_UNIK_COLLISION';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. CATAT PENERIMAAN (FR-09 s/d FR-13, D4, D6, T8)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION catat_penerimaan(
    p_lembaga_id UUID,
    p_pos_id UUID,
    p_bruto NUMERIC(18,2),
    p_hak_amil NUMERIC(18,2),
    p_kanal TEXT,
    p_dicatat_oleh UUID,
    p_keterangan TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_penerimaan_id UUID := gen_random_uuid();
    v_masuk_pos NUMERIC(18,2);
    v_kode_unik CHAR(12);
    v_pos_record RECORD;
    v_pencatat RECORD;
    v_persen_hak_amil_maks NUMERIC(5,2);
    v_tries INT := 0;
BEGIN
    IF p_bruto <= 0 THEN
        RAISE EXCEPTION 'Nominal bruto harus lebih dari 0';
    END IF;

    -- Validasi akun pencatat: amil di lembaga yang sama
    SELECT peran, lembaga_id INTO v_pencatat FROM akun WHERE id = p_dicatat_oleh;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'AKUN_PENCATAT_TIDAK_DITEMUKAN';
    END IF;
    IF v_pencatat.lembaga_id <> p_lembaga_id THEN
        RAISE EXCEPTION 'LEMBAGA_PENCATAT_BERBEDA';
    END IF;
    IF v_pencatat.peran <> 'amil' THEN
        RAISE EXCEPTION 'HANYA_AMIL_YANG_BERHAK_MENCATAT_PENERIMAAN';
    END IF;

    -- D4: Validasi hak amil terhadap konfigurasi persentase batas lembaga (FR-10)
    SELECT persen_hak_amil_maks INTO v_persen_hak_amil_maks
    FROM lembaga WHERE id = p_lembaga_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LEMBAGA_TIDAK_DITEMUKAN';
    END IF;

    IF p_hak_amil > (p_bruto * (v_persen_hak_amil_maks / 100.0)) THEN
        RAISE EXCEPTION 'HAK_AMIL_MELEBIHI_BATAS_LEMBAGA: Hak amil (%) melebihi batas konfigurasi lembaga (% persen dari bruto %)',
            p_hak_amil, v_persen_hak_amil_maks, p_bruto;
    END IF;

    v_masuk_pos := p_bruto - p_hak_amil;

    -- 1. Kunci baris pos_dana (Urutan penguncian global: pos_dana pertama)
    SELECT * INTO v_pos_record
    FROM pos_dana
    WHERE id = p_pos_id AND lembaga_id = p_lembaga_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pos dana tidak ditemukan';
    END IF;

    -- 2. Update saldo pos dana: total_masuk dan saldo_tersedia bertambah
    UPDATE pos_dana
    SET total_masuk = total_masuk + v_masuk_pos,
        saldo_tersedia = saldo_tersedia + v_masuk_pos
    WHERE id = p_pos_id;

    -- 3. Masukkan record penerimaan dengan penanganan tabrakan unik (D6, T8)
    LOOP
        v_kode_unik := generate_kode_unik('RC');
        BEGIN
            INSERT INTO penerimaan (
                id, kode_unik, lembaga_id, pos_id, bruto, hak_amil, masuk_pos,
                kanal, dicatat_oleh, dicatat_pada
            ) VALUES (
                v_penerimaan_id, v_kode_unik, p_lembaga_id, p_pos_id, p_bruto, p_hak_amil, v_masuk_pos,
                p_kanal, p_dicatat_oleh, now()
            );
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            v_tries := v_tries + 1;
            IF v_tries > 5 THEN
                RAISE EXCEPTION 'GAGAL_INSERT_PENERIMAAN_KODE_UNIK_COLLISION';
            END IF;
        END;
    END LOOP;

    -- 4. Audit log & rantai kepala
    PERFORM append_audit_log(
        p_lembaga_id,
        'penerimaan',
        v_penerimaan_id,
        'TAMBAH_PENERIMAAN',
        p_dicatat_oleh,
        jsonb_build_object('saldo_tersedia_sebelum', v_pos_record.saldo_tersedia),
        jsonb_build_object('bruto', p_bruto, 'hak_amil', p_hak_amil, 'masuk_pos', v_masuk_pos, 'saldo_tersedia_baru', v_pos_record.saldo_tersedia + v_masuk_pos)
    );

    RETURN v_penerimaan_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. BUAT DRAF PENYALURAN & RESERVASI SALDO (FR-04, FR-14, AC-01, AC-02, AC-05, AC-06, B3, D6, E2, T8)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS buat_draf_penyaluran(UUID, UUID, UUID, asnaf_enum, NUMERIC, TEXT, UUID, UUID, TEXT, BYTEA);
DROP FUNCTION IF EXISTS buat_draf_penyaluran(UUID, UUID, UUID, asnaf_enum, NUMERIC, TEXT, UUID, UUID, TEXT, BYTEA, BYTEA);

CREATE OR REPLACE FUNCTION buat_draf_penyaluran(
    p_lembaga_id UUID,
    p_pos_id UUID,
    p_mustahik_id UUID,
    p_asnaf asnaf_enum,
    p_nominal NUMERIC(18,2),
    p_metode TEXT,
    p_dibuat_oleh UUID,
    p_dibuat_unit UUID,
    p_berkas_path TEXT,
    p_berkas_sha256 BYTEA,
    p_token_hash BYTEA DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_penyaluran_id UUID := gen_random_uuid();
    v_kode_unik CHAR(12);
    v_pos_record RECORD;
    v_mustahik_asnaf asnaf_enum;
    v_pembuat RECORD;
    v_tries INT := 0;
BEGIN
    IF p_nominal <= 0 THEN
        RAISE EXCEPTION 'Nominal penyaluran harus lebih besar dari 0';
    END IF;

    -- Validasi akun pembuat: amil di lembaga dan unit yang sesuai
    SELECT peran, unit_id, lembaga_id INTO v_pembuat FROM akun WHERE id = p_dibuat_oleh;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'AKUN_PEMBUAT_TIDAK_DITEMUKAN';
    END IF;
    IF v_pembuat.lembaga_id <> p_lembaga_id THEN
        RAISE EXCEPTION 'LEMBAGA_PEMBUAT_BERBEDA';
    END IF;
    IF v_pembuat.peran <> 'amil' THEN
        RAISE EXCEPTION 'HANYA_AMIL_YANG_BERHAK_MEMBUAT_DRAF';
    END IF;
    IF v_pembuat.unit_id <> p_dibuat_unit THEN
        RAISE EXCEPTION 'UNIT_PEMBUAT_TIDAK_COCOK';
    END IF;

    -- E2: Jika metode mustahik, token hash wajib dikirim oleh aplikasi
    IF p_metode = 'mustahik' AND p_token_hash IS NULL THEN
        RAISE EXCEPTION 'TOKEN_HASH_WAJIB_UNTUK_METODE_MUSTAHIK (E2)';
    END IF;

    -- Validasi bukti wajib diunggah (FR-16, AC-05)
    IF p_berkas_path IS NULL OR length(trim(p_berkas_path)) = 0 OR p_berkas_sha256 IS NULL THEN
        RAISE EXCEPTION 'Bukti penerimaan wajib diunggah (AC-05)';
    END IF;

    -- Validasi asnaf mustahik harus cocok (FR-15, AC-06)
    SELECT asnaf INTO v_mustahik_asnaf
    FROM mustahik
    WHERE id = p_mustahik_id AND lembaga_id = p_lembaga_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mustahik tidak ditemukan';
    END IF;

    IF v_mustahik_asnaf <> p_asnaf THEN
        RAISE EXCEPTION 'Asnaf penyaluran (%) tidak sesuai dengan asnaf mustahik terdaftar (%) (AC-06)', p_asnaf, v_mustahik_asnaf;
    END IF;

    -- Kunci baris pos_dana (Urutan penguncian global: 1. pos_dana FOR UPDATE)
    SELECT * INTO v_pos_record
    FROM pos_dana
    WHERE id = p_pos_id AND lembaga_id = p_lembaga_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pos dana tidak ditemukan';
    END IF;

    -- Validasi saldo tersedia mencukupi (AC-01, AC-02)
    IF v_pos_record.saldo_tersedia < p_nominal THEN
        RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_BALANCE: Saldo tersedia (%) tidak mencukupi untuk reservasi draf nominal (%)',
            v_pos_record.saldo_tersedia, p_nominal;
    END IF;

    -- Reservasi saldo: pindah dari saldo_tersedia ke saldo_dicadangkan (FR-04)
    UPDATE pos_dana
    SET saldo_tersedia = saldo_tersedia - p_nominal,
        saldo_dicadangkan = saldo_dicadangkan + p_nominal
    WHERE id = p_pos_id;

    -- Insert penyaluran dengan penanganan tabrakan unik (D6, T8)
    LOOP
        v_kode_unik := generate_kode_unik('ZK');
        BEGIN
            INSERT INTO penyaluran (
                id, kode_unik, lembaga_id, pos_id, mustahik_id, asnaf, nominal,
                status, metode, dibuat_oleh, dibuat_unit, kedaluwarsa_pada
            ) VALUES (
                v_penyaluran_id, v_kode_unik, p_lembaga_id, p_pos_id, p_mustahik_id, p_asnaf, p_nominal,
                'menunggu_konfirmasi', p_metode, p_dibuat_oleh, p_dibuat_unit, now() + interval '72 hours'
            );
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            v_tries := v_tries + 1;
            IF v_tries > 5 THEN
                RAISE EXCEPTION 'GAGAL_INSERT_PENYALURAN_KODE_UNIK_COLLISION';
            END IF;
        END;
    END LOOP;

    -- Simpan bukti berkas & sha256 (FR-16)
    INSERT INTO bukti (
        id, penyaluran_id, berkas_path, sha256
    ) VALUES (
        gen_random_uuid(), v_penyaluran_id, p_berkas_path, p_berkas_sha256
    );

    -- B3 & E2: Simpan token_hash mustahik yang dikirim aplikasi (dipakai_pada = NULL)
    IF p_metode = 'mustahik' THEN
        INSERT INTO konfirmasi (
            id, penyaluran_id, jenis, token_hash, dipakai_pada, kedaluwarsa_pada, hasil
        ) VALUES (
            gen_random_uuid(), v_penyaluran_id, 'mustahik', p_token_hash, NULL,
            now() + interval '72 hours', NULL
        );
    END IF;

    -- Audit log
    PERFORM append_audit_log(
        p_lembaga_id,
        'penyaluran',
        v_penyaluran_id,
        'BUAT_DRAF_RESERVASI',
        p_dibuat_oleh,
        jsonb_build_object('saldo_tersedia', v_pos_record.saldo_tersedia, 'saldo_dicadangkan', v_pos_record.saldo_dicadangkan),
        jsonb_build_object('status', 'menunggu_konfirmasi', 'nominal', p_nominal, 'saldo_tersedia', v_pos_record.saldo_tersedia - p_nominal, 'saldo_dicadangkan', v_pos_record.saldo_dicadangkan + p_nominal)
    );

    RETURN v_penyaluran_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. KONFIRMASI MUSTAHIK (FR-21 s/d FR-24, AC-09, AC-10, AC-11, AC-12, B1, B3)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS konfirmasi_mustahik(UUID, BYTEA, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION konfirmasi_mustahik(
    p_penyaluran_id UUID,
    p_token_hash BYTEA,
    p_menerima BOOLEAN,
    p_alasan_tolak TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_pos_id UUID;
    v_penyaluran RECORD;
    v_konfirmasi RECORD;
BEGIN
    -- 0. Dapatkan pos_id tanpa kunci (periksa eksistensi penyaluran)
    SELECT pos_id INTO v_pos_id FROM penyaluran WHERE id = p_penyaluran_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PENYALURAN_TIDAK_DITEMUKAN';
    END IF;

    -- 1. Kunci baris pos_dana dahulu (Urutan penguncian global FR-35: 1. pos_dana FOR UPDATE)
    PERFORM 1 FROM pos_dana WHERE id = v_pos_id FOR UPDATE;

    -- 2. Kunci baris penyaluran (Urutan penguncian global FR-35: 2. penyaluran FOR UPDATE)
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    -- Pemeriksaan metode
    IF v_penyaluran.metode <> 'mustahik' THEN
        RAISE EXCEPTION 'METODE_BUKAN_MUSTAHIK: Penyaluran ini menggunakan metode %', v_penyaluran.metode;
    END IF;

    -- Pemeriksaan status
    IF v_penyaluran.status <> 'menunggu_konfirmasi' THEN
        RAISE EXCEPTION 'STATUS_TIDAK_VALID: %', v_penyaluran.status;
    END IF;

    -- 3. Kunci dan validasi baris token konfirmasi (B3)
    SELECT * INTO v_konfirmasi
    FROM konfirmasi
    WHERE penyaluran_id = p_penyaluran_id AND jenis = 'mustahik'
    FOR UPDATE;

    IF NOT FOUND OR v_konfirmasi.token_hash <> p_token_hash THEN
        RAISE EXCEPTION 'TOKEN_TIDAK_VALID';
    END IF;

    IF v_konfirmasi.dipakai_pada IS NOT NULL THEN
        RAISE EXCEPTION 'TOKEN_SUDAH_DIPAKAI';
    END IF;

    -- B1: Pemeriksaan tautan kedaluwarsa (AC-12)
    IF now() > v_penyaluran.kedaluwarsa_pada THEN
        -- Ubah status ke kedaluwarsa
        UPDATE penyaluran SET status = 'kedaluwarsa' WHERE id = p_penyaluran_id;

        -- Lepas reservasi kembali ke saldo tersedia (FR-05)
        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_pos_id;

        -- Tandai token dipakai
        UPDATE konfirmasi
        SET dipakai_pada = now()
        WHERE id = v_konfirmasi.id;

        -- Audit log kedaluwarsa
        PERFORM append_audit_log(
            v_penyaluran.lembaga_id,
            'penyaluran',
            p_penyaluran_id,
            'KEDALUWARSA_MUSTAHIK',
            v_penyaluran.dibuat_oleh,
            jsonb_build_object('status_sebelum', 'menunggu_konfirmasi'),
            jsonb_build_object('status_sesudah', 'kedaluwarsa')
        );

        -- B1: commit status kedaluwarsa, jangan lempar exception
        RETURN 'KEDALUWARSA';
    END IF;

    -- Tandai token telah dipakai
    UPDATE konfirmasi
    SET dipakai_pada = now(),
        hasil = CASE WHEN p_menerima THEN 'menerima' ELSE 'menolak' END
    WHERE id = v_konfirmasi.id;

    IF p_menerima THEN
        -- AC-09: Mustahik menerima -> status menjadi dikonfirmasi
        UPDATE penyaluran SET status = 'dikonfirmasi' WHERE id = p_penyaluran_id;

        -- Audit log penerimaan
        PERFORM append_audit_log(
            v_penyaluran.lembaga_id,
            'penyaluran',
            p_penyaluran_id,
            'KONFIRMASI_MUSTAHIK_TERIMA',
            v_penyaluran.dibuat_oleh,
            jsonb_build_object('status_sebelum', 'menunggu_konfirmasi'),
            jsonb_build_object('status_sesudah', 'dikonfirmasi')
        );

        RETURN 'OK';
    ELSE
        -- AC-10: Mustahik menolak -> status ditolak_penerima, reservasi dilepas
        UPDATE penyaluran SET status = 'ditolak_penerima' WHERE id = p_penyaluran_id;

        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_pos_id;

        -- Audit log penolakan
        PERFORM append_audit_log(
            v_penyaluran.lembaga_id,
            'penyaluran',
            p_penyaluran_id,
            'KONFIRMASI_MUSTAHIK_TOLAK',
            v_penyaluran.dibuat_oleh,
            jsonb_build_object('status_sebelum', 'menunggu_konfirmasi'),
            jsonb_build_object('status_sesudah', 'ditolak_penerima', 'alasan', p_alasan_tolak)
        );

        RETURN 'DITOLAK';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. KONFIRMASI DUA SAKSI (FR-25 s/d FR-28, AC-13, AC-14, AC-15, N1, N2)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS konfirmasi_saksi(UUID, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION konfirmasi_saksi(
    p_penyaluran_id UUID,
    p_akun_saksi_id UUID,
    p_menerima BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_pos_id UUID;
    v_penyaluran RECORD;
    v_saksi RECORD;
    v_jumlah_saksi_ada INTEGER;
    v_saksi_list UUID[];
    v_unit_list UUID[];
    v_jumlah_terima INTEGER;
BEGIN
    -- 0. Dapatkan pos_id tanpa kunci (periksa eksistensi penyaluran)
    SELECT pos_id INTO v_pos_id FROM penyaluran WHERE id = p_penyaluran_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PENYALURAN_TIDAK_DITEMUKAN';
    END IF;

    -- 1. Kunci baris pos_dana dahulu (Urutan penguncian global FR-35: 1. pos_dana FOR UPDATE)
    PERFORM 1 FROM pos_dana WHERE id = v_pos_id FOR UPDATE;

    -- 2. Kunci baris penyaluran (Urutan penguncian global FR-35: 2. penyaluran FOR UPDATE)
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    -- Pemeriksaan metode penyaluran
    IF v_penyaluran.metode <> 'saksi' THEN
        RAISE EXCEPTION 'METODE_BUKAN_SAKSI: Penyaluran ini menggunakan metode %', v_penyaluran.metode;
    END IF;

    -- T7: Pemeriksaan status dan kedaluwarsa
    IF v_penyaluran.status <> 'menunggu_konfirmasi' THEN
        RAISE EXCEPTION 'STATUS_TIDAK_VALID: %', v_penyaluran.status;
    END IF;

    IF now() > v_penyaluran.kedaluwarsa_pada THEN
        RAISE EXCEPTION 'TAUTAN_KEDALUWARSA';
    END IF;

    -- T5: Ambil data akun saksi dari tabel akun (bukan parameter)
    SELECT * INTO v_saksi FROM akun WHERE id = p_akun_saksi_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'AKUN_SAKSI_TIDAK_DITEMUKAN';
    END IF;

    IF NOT v_saksi.aktif THEN
        RAISE EXCEPTION 'AKUN_SAKSI_TIDAK_AKTIF';
    END IF;

    -- N2 (Opsi A): Hanya peran amil yang sah menjadi saksi
    IF v_saksi.peran <> 'amil' THEN
        RAISE EXCEPTION 'PERAN_SAKSI_TIDAK_VALID: Hanya peran amil yang sah menjadi saksi (peran saat ini: %)', v_saksi.peran;
    END IF;

    -- Lembaga saksi harus sama dengan lembaga penyaluran
    IF v_saksi.lembaga_id <> v_penyaluran.lembaga_id THEN
        RAISE EXCEPTION 'LEMBAGA_SAKSI_BERBEDA';
    END IF;

    -- FR-27: Saksi tidak boleh sama dengan amil pembuat draf
    IF p_akun_saksi_id = v_penyaluran.dibuat_oleh THEN
        RAISE EXCEPTION 'SAKSI_SAMA_DENGAN_PEMBUAT (FR-27)';
    END IF;

    -- AC-15 & N1: Unit saksi tidak boleh sama dengan unit amil pembuat
    IF v_saksi.unit_id = v_penyaluran.dibuat_unit THEN
        RAISE EXCEPTION 'UNIT_SAKSI_SAMA_DENGAN_PEMBUAT (AC-15)';
    END IF;

    -- Periksa konfirmasi saksi sebelumnya pada penyaluran ini
    SELECT count(*), coalesce(array_agg(akun_saksi_id), '{}'), coalesce(array_agg(unit_saksi), '{}')
    INTO v_jumlah_saksi_ada, v_saksi_list, v_unit_list
    FROM konfirmasi
    WHERE penyaluran_id = p_penyaluran_id AND jenis = 'saksi';

    -- T7: Batas saksi maksimal 2 (saksi ke-3 ditolak)
    IF v_jumlah_saksi_ada >= 2 THEN
        RAISE EXCEPTION 'BATAS_SAKSI_TERPENUHI: Penyaluran sudah memiliki 2 konfirmasi saksi';
    END IF;

    -- AC-14: Saksi yang sama dua kali ditolak
    IF p_akun_saksi_id = ANY(v_saksi_list) THEN
        RAISE EXCEPTION 'SAKSI_GANDA: Saksi % sudah memberikan konfirmasi untuk penyaluran ini (AC-14)', p_akun_saksi_id;
    END IF;

    -- N1: Unit saksi 2 tidak boleh sama dengan unit saksi 1 (semua unit saksi harus berbeda)
    IF v_saksi.unit_id = ANY(v_unit_list) THEN
        RAISE EXCEPTION 'UNIT_SAKSI_SAMA_DENGAN_SAKSI_LAIN: Setiap saksi harus berasal dari unit yang berbeda (Keputusan N1)';
    END IF;

    -- Simpan konfirmasi saksi
    INSERT INTO konfirmasi (
        id, penyaluran_id, jenis, akun_saksi_id, unit_saksi, dipakai_pada, kedaluwarsa_pada, hasil
    ) VALUES (
        gen_random_uuid(), p_penyaluran_id, 'saksi', p_akun_saksi_id, v_saksi.unit_id, now(),
        v_penyaluran.kedaluwarsa_pada, CASE WHEN p_menerima THEN 'menerima' ELSE 'menolak' END
    );

    IF NOT p_menerima THEN
        -- Saksi menolak: ubah status, lepas reservasi, dan catat audit log (T6)
        UPDATE penyaluran SET status = 'ditolak_penerima' WHERE id = p_penyaluran_id;

        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_pos_id;

        -- T6: Audit log pada jalur tolak saksi
        PERFORM append_audit_log(
            v_penyaluran.lembaga_id,
            'penyaluran',
            p_penyaluran_id,
            'KONFIRMASI_SAKSI_TOLAK',
            p_akun_saksi_id,
            jsonb_build_object('status_sebelum', 'menunggu_konfirmasi'),
            jsonb_build_object('status_sesudah', 'ditolak_penerima', 'saksi_ke', v_jumlah_saksi_ada + 1)
        );
        RETURN;
    END IF;

    -- Jalur terima
    v_jumlah_terima := v_jumlah_saksi_ada + 1;

    -- AC-13: Baru 1 saksi -> status tetap menunggu_konfirmasi
    -- FR-28: Tepat 2 saksi -> status berpindah ke dikonfirmasi
    IF v_jumlah_terima >= 2 THEN
        UPDATE penyaluran SET status = 'dikonfirmasi' WHERE id = p_penyaluran_id;
    END IF;

    -- Audit log penerimaan saksi
    PERFORM append_audit_log(
        v_penyaluran.lembaga_id,
        'penyaluran',
        p_penyaluran_id,
        'KONFIRMASI_SAKSI_TERIMA',
        p_akun_saksi_id,
        jsonb_build_object('status_sebelum', 'menunggu_konfirmasi', 'saksi_ke', v_jumlah_terima),
        jsonb_build_object('status_sesudah', CASE WHEN v_jumlah_terima >= 2 THEN 'dikonfirmasi' ELSE 'menunggu_konfirmasi' END)
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 5. PERSETUJUAN PENYALURAN (FR-29 s/d FR-31, AC-04, AC-07, AC-08, AC-16, B2, T4, T5, N1)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS setujui_penyaluran(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS setujui_penyaluran(UUID, UUID);

CREATE OR REPLACE FUNCTION setujui_penyaluran(
    p_penyaluran_id UUID,
    p_penyetuju_akun UUID
) RETURNS VOID AS $$
DECLARE
    v_pos_id UUID;
    v_penyaluran RECORD;
    v_pos RECORD;
    v_peran TEXT;
    v_unit_penyetuju UUID;
    v_aktif BOOLEAN;
    v_pos_dicadangkan_baru NUMERIC(18,2);
    v_pos_tersalurkan_baru NUMERIC(18,2);
BEGIN
    -- 0. Dapatkan pos_id tanpa kunci (periksa eksistensi penyaluran)
    SELECT pos_id INTO v_pos_id FROM penyaluran WHERE id = p_penyaluran_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PENYALURAN_TIDAK_DITEMUKAN';
    END IF;

    -- 1. Kunci baris pos_dana dahulu (Urutan penguncian global FR-35: 1. pos_dana FOR UPDATE)
    SELECT * INTO v_pos
    FROM pos_dana
    WHERE id = v_pos_id
    FOR UPDATE;

    -- 2. Kunci baris penyaluran (Urutan penguncian global FR-35: 2. penyaluran FOR UPDATE)
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    -- Syarat: Status harus dikonfirmasi (FR-29)
    IF v_penyaluran.status <> 'dikonfirmasi' THEN
        RAISE EXCEPTION 'Penyaluran hanya dapat disetujui jika berstatus dikonfirmasi (status saat ini: %)', v_penyaluran.status;
    END IF;

    -- B2 & T4 & T5: Validasi akun penyetuju dari database (bukan parameter)
    SELECT peran, unit_id, aktif INTO v_peran, v_unit_penyetuju, v_aktif
    FROM akun
    WHERE id = p_penyetuju_akun AND lembaga_id = v_penyaluran.lembaga_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'AKUN_PENYETUJU_TIDAK_DITEMUKAN';
    END IF;

    IF NOT v_aktif THEN
        RAISE EXCEPTION 'AKUN_PENYETUJU_TIDAK_AKTIF';
    END IF;

    IF v_peran <> 'penyetuju' THEN
        RAISE EXCEPTION 'PENYETUJU_TIDAK_VALID: Hanya peran penyetuju yang sah (peran: %)', v_peran;
    END IF;

    -- FR-30, AC-07: Pembuat tidak boleh menyetujui sendiri
    IF p_penyetuju_akun = v_penyaluran.dibuat_oleh THEN
        RAISE EXCEPTION 'Amil pembuat draf tidak boleh menyetujui penyaluran yang dibuat sendiri (AC-07)';
    END IF;

    -- FR-30, AC-08: Penyetuju harus dari unit berbeda dengan pembuat
    IF v_unit_penyetuju = v_penyaluran.dibuat_unit THEN
        RAISE EXCEPTION 'UNIT_PENYETUJU_SAMA_DENGAN_PEMBUAT (AC-08)';
    END IF;

    -- FR-27, AC-16: Saksi tidak boleh sama dengan penyetuju
    IF EXISTS (
        SELECT 1 FROM konfirmasi
        WHERE penyaluran_id = p_penyaluran_id AND akun_saksi_id = p_penyetuju_akun
    ) THEN
        RAISE EXCEPTION 'Penyetuju tidak boleh orang yang sama dengan salah satu saksi (AC-16)';
    END IF;

    -- B2 & N1: Unit penyetuju tidak boleh sama dengan unit saksi mana pun (4 unit berbeda)
    IF v_penyaluran.metode = 'saksi' THEN
        IF EXISTS (
            SELECT 1 FROM konfirmasi
            WHERE penyaluran_id = p_penyaluran_id
              AND jenis = 'saksi'
              AND unit_saksi = v_unit_penyetuju
        ) THEN
            RAISE EXCEPTION 'UNIT_PENYETUJU_SAMA_DENGAN_SAKSI (N1)';
        END IF;
    END IF;

    -- FR-06 & AC-04: Pindahkan nominal dari saldo_dicadangkan ke total_tersalurkan (C5: gunakan RETURNING)
    UPDATE pos_dana
    SET saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal,
        total_tersalurkan = total_tersalurkan + v_penyaluran.nominal
    WHERE id = v_pos_id
    RETURNING saldo_dicadangkan, total_tersalurkan
    INTO v_pos_dicadangkan_baru, v_pos_tersalurkan_baru;

    -- Update status penyaluran menjadi tersalurkan
    UPDATE penyaluran
    SET status = 'tersalurkan',
        penyetuju_akun = p_penyetuju_akun,
        penyetuju_unit = v_unit_penyetuju,
        penyetuju_waktu = now()
    WHERE id = p_penyaluran_id;

    -- Audit log
    PERFORM append_audit_log(
        v_penyaluran.lembaga_id,
        'penyaluran',
        p_penyaluran_id,
        'SETUJUI_PENYALURAN',
        p_penyetuju_akun,
        jsonb_build_object('status_sebelum', 'dikonfirmasi', 'saldo_dicadangkan_sebelum', v_pos.saldo_dicadangkan),
        jsonb_build_object('status_sesudah', 'tersalurkan', 'saldo_dicadangkan_sesudah', v_pos_dicadangkan_baru, 'total_tersalurkan_sesudah', v_pos_tersalurkan_baru)
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. BATALKAN DRAF PENYALURAN (FR-05, FR-19, AC-03, B4, C4)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS batalkan_penyaluran(UUID, UUID);

CREATE OR REPLACE FUNCTION batalkan_penyaluran(
    p_penyaluran_id UUID,
    p_pelaku_id UUID
) RETURNS VOID AS $$
DECLARE
    v_pos_id UUID;
    v_penyaluran RECORD;
    v_pelaku RECORD;
BEGIN
    -- 0. Dapatkan pos_id tanpa kunci (periksa eksistensi penyaluran)
    SELECT pos_id INTO v_pos_id FROM penyaluran WHERE id = p_penyaluran_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PENYALURAN_TIDAK_DITEMUKAN';
    END IF;

    -- 1. Kunci baris pos_dana dahulu (Urutan penguncian global FR-35: 1. pos_dana FOR UPDATE)
    PERFORM 1 FROM pos_dana WHERE id = v_pos_id FOR UPDATE;

    -- 2. Kunci baris penyaluran (Urutan penguncian global FR-35: 2. penyaluran FOR UPDATE)
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    -- FR-19 & C4: Hanya draf yang menunggu konfirmasi yang dapat dibatalkan oleh amil
    IF v_penyaluran.status <> 'menunggu_konfirmasi' THEN
        RAISE EXCEPTION 'Hanya draf yang belum dikonfirmasi yang dapat dibatalkan oleh amil (status: %)', v_penyaluran.status;
    END IF;

    -- Validasi akun pelaku
    SELECT * INTO v_pelaku
    FROM akun
    WHERE id = p_pelaku_id AND lembaga_id = v_penyaluran.lembaga_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'AKUN_PELAKU_TIDAK_DITEMUKAN';
    END IF;

    IF NOT v_pelaku.aktif THEN
        RAISE EXCEPTION 'AKUN_PELAKU_TIDAK_AKTIF';
    END IF;

    -- FR-19: Hanya amil pembuat draf yang berhak membatalkan
    IF v_penyaluran.dibuat_oleh <> p_pelaku_id THEN
        RAISE EXCEPTION 'HANYA_PEMBUAT_YANG_DAPAT_MEMBATALKAN_DRAF';
    END IF;

    -- Lepas reservasi saldo kembali ke saldo_tersedia (FR-05, AC-03)
    UPDATE pos_dana
    SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
        saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
    WHERE id = v_pos_id;

    -- Update status penyaluran
    UPDATE penyaluran
    SET status = 'dibatalkan'
    WHERE id = p_penyaluran_id;

    -- Audit log pembatalan
    PERFORM append_audit_log(
        v_penyaluran.lembaga_id,
        'penyaluran',
        p_penyaluran_id,
        'BATALKAN_DRAF',
        p_pelaku_id,
        jsonb_build_object('status_sebelum', v_penyaluran.status),
        jsonb_build_object('status_sesudah', 'dibatalkan')
    );
END;
$$ LANGUAGE plpgsql;

-- >>> 004_office_chat.sql
-- Optional demo collaboration. No financial schema or status is changed.
-- Apply only to a test database, using the trusted server role.
BEGIN;
CREATE TABLE IF NOT EXISTS office_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  akun_id uuid NOT NULL REFERENCES akun(id),
  client_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (lembaga_id, akun_id, client_id)
);
CREATE INDEX IF NOT EXISTS office_messages_room ON office_messages (lembaga_id, id DESC);
CREATE INDEX IF NOT EXISTS office_messages_rate ON office_messages (akun_id, created_at DESC);
ALTER TABLE office_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON office_messages FROM PUBLIC;
-- No direct client access policies. Only the server owner/BYPASSRLS role may
-- access this table after session/tenant checks in the Next.js route.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON office_messages FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON office_messages FROM authenticated;
  END IF;
END $$;
COMMENT ON TABLE office_messages IS 'Demo coordination; not transaction approval or audit evidence';
COMMIT;

-- >>> 005_office_workflow.sql
-- Additive operational workflow. Existing financial functions and hash audit stay authoritative.
BEGIN;
CREATE TABLE work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  reference_type text NOT NULL CHECK(reference_type IN ('penerimaan','penyaluran')),
  reference_id uuid NOT NULL,
  stage text NOT NULL CHECK(stage IN ('penerimaan','saksi','persetujuan','penyaluran','catatan')),
  status text NOT NULL CHECK(status IN ('open','completed','cancelled')),
  assigned_role text NOT NULL CHECK(assigned_role IN ('amil','penyetuju')),
  assigned_user_id uuid REFERENCES akun(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  source_revision text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz,
  UNIQUE(lembaga_id,reference_type,reference_id),
  UNIQUE(lembaga_id,id)
);
CREATE INDEX work_items_queue ON work_items(lembaga_id,status,stage,updated_at DESC);
CREATE TABLE work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  assigned_user_id uuid NOT NULL REFERENCES akun(id),
  assigned_role text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  ended_at timestamptz,
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE UNIQUE INDEX work_assignments_one_active ON work_assignments(work_item_id) WHERE ended_at IS NULL;
CREATE TABLE work_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  from_user_id uuid REFERENCES akun(id),
  to_user_id uuid REFERENCES akun(id),
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  actor_id uuid REFERENCES akun(id),
  reason text NOT NULL CHECK(char_length(reason)<=500),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE TABLE work_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  type text NOT NULL,
  actor_id uuid REFERENCES akun(id),
  request_id uuid,
  request_payload jsonb,
  snapshot jsonb NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(lembaga_id,actor_id,request_id),
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE INDEX work_events_history ON work_events(lembaga_id,work_item_id,id DESC);
CREATE INDEX work_events_rate ON work_events(actor_id,created_at DESC);
CREATE TRIGGER work_events_append_only BEFORE UPDATE OR DELETE ON work_events FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE TRIGGER work_handoffs_append_only BEFORE UPDATE OR DELETE ON work_handoffs FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE TABLE office_presence (
  session_id uuid PRIMARY KEY,
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  akun_id uuid NOT NULL REFERENCES akun(id),
  station text CHECK(station IN ('penerimaan','saksi','persetujuan','penyaluran','catatan')),
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX office_presence_active ON office_presence(lembaga_id,expires_at,akun_id);

CREATE FUNCTION office_eligible(p_work uuid,p_user uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_items w JOIN penyaluran p ON w.reference_type='penyaluran' AND p.id=w.reference_id AND p.lembaga_id=w.lembaga_id
    JOIN akun a ON a.id=p_user AND a.lembaga_id=w.lembaga_id
    JOIN unit u ON u.id=a.unit_id AND u.lembaga_id=a.lembaga_id
    JOIN lembaga l ON l.id=a.lembaga_id
    WHERE w.id=p_work AND w.status='open' AND (p.status NOT IN ('dibuat','menunggu_konfirmasi') OR p.kedaluwarsa_pada>clock_timestamp()) AND a.aktif AND l.aktif AND a.peran=w.assigned_role
    AND CASE WHEN w.stage='penyaluran' THEN a.id=p.dibuat_oleh
      WHEN w.stage IN ('saksi','persetujuan') THEN
        a.id<>p.dibuat_oleh AND a.unit_id<>p.dibuat_unit
        AND NOT EXISTS(SELECT 1 FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi' AND (k.akun_saksi_id=a.id OR k.unit_saksi=a.unit_id))
        AND (w.stage<>'saksi' OR (SELECT count(*) FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi')<2)
      ELSE false END
  )
$$;

CREATE FUNCTION office_sync_penyaluran(p_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p penyaluran; w work_items; n work_items; v_stage text; v_status text; v_revision text;
BEGIN
  SELECT * INTO STRICT p FROM penyaluran WHERE id=p_id;
  v_stage:=CASE WHEN p.status IN ('tersalurkan','ditolak_penerima','dibatalkan','kedaluwarsa') THEN 'catatan'
    WHEN p.status='dikonfirmasi' THEN 'persetujuan'
    WHEN p.status IN ('dibuat','menunggu_konfirmasi') AND p.metode='saksi' THEN 'saksi' ELSE 'penyaluran' END;
  v_status:=CASE WHEN p.status='tersalurkan' THEN 'completed' WHEN p.status IN ('ditolak_penerima','dibatalkan','kedaluwarsa') THEN 'cancelled' ELSE 'open' END;
  v_revision:=p.status::text||':'||p.metode||':'||coalesce((SELECT string_agg(k.akun_saksi_id::text||':'||k.unit_saksi::text,',' ORDER BY k.akun_saksi_id) FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi'),'');
  SELECT * INTO w FROM work_items WHERE lembaga_id=p.lembaga_id AND reference_type='penyaluran' AND reference_id=p.id FOR UPDATE;
  IF FOUND THEN
    IF w.source_revision=v_revision THEN RETURN; END IF;
    UPDATE work_assignments SET ended_at=clock_timestamp() WHERE work_item_id=w.id AND ended_at IS NULL;
    UPDATE work_items SET stage=v_stage,status=v_status,assigned_role=CASE WHEN v_stage='persetujuan' THEN 'penyetuju' ELSE 'amil' END,
      assigned_user_id=NULL,version=version+1,source_revision=v_revision,updated_at=clock_timestamp(),completed_at=CASE WHEN v_status<>'open' THEN clock_timestamp() END
      WHERE id=w.id RETURNING * INTO n;
    INSERT INTO work_handoffs(lembaga_id,work_item_id,from_user_id,from_stage,to_stage,reason)
      VALUES(p.lembaga_id,w.id,w.assigned_user_id,w.stage,v_stage,'Perubahan sumber transaksi');
  ELSE
    INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
      VALUES(p.lembaga_id,'penyaluran',p.id,v_stage,v_status,CASE WHEN v_stage='persetujuan' THEN 'penyetuju' ELSE 'amil' END,v_revision,CASE WHEN v_status<>'open' THEN clock_timestamp() END) RETURNING * INTO n;
  END IF;
  INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) VALUES(p.lembaga_id,n.id,CASE WHEN w.id IS NULL THEN 'created' ELSE 'source_changed' END,to_jsonb(n));
END $$;
CREATE FUNCTION office_source_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n work_items;
BEGIN
  IF TG_TABLE_NAME='penerimaan' THEN
    INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
      VALUES(NEW.lembaga_id,'penerimaan',NEW.id,'catatan','completed','amil','recorded',clock_timestamp()) ON CONFLICT DO NOTHING RETURNING * INTO n;
    IF n.id IS NOT NULL THEN INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) VALUES(n.lembaga_id,n.id,'created',to_jsonb(n)); END IF;
  ELSIF TG_TABLE_NAME='konfirmasi' THEN
    PERFORM office_sync_penyaluran(NEW.penyaluran_id);
  ELSE
    PERFORM office_sync_penyaluran(NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER office_distribution AFTER INSERT OR UPDATE OF status,metode ON penyaluran FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
CREATE TRIGGER office_confirmation AFTER INSERT OR UPDATE ON konfirmasi FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
CREATE TRIGGER office_receipt AFTER INSERT ON penerimaan FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
-- Backfill uses only persisted domain records, never browser/demo data.
SELECT office_sync_penyaluran(id) FROM penyaluran ORDER BY id;
INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
  SELECT lembaga_id,'penerimaan',id,'catatan','completed','amil','recorded',dicatat_pada FROM penerimaan;
INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) SELECT lembaga_id,id,'created',to_jsonb(w) FROM work_items w WHERE reference_type='penerimaan';

CREATE FUNCTION office_assign_work(p_item uuid,p_actor uuid,p_version integer,p_request uuid,p_action text,p_target uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a akun; w work_items; v_payload jsonb; e work_events; v_target uuid; v_old uuid; v_reason text;
BEGIN
  SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE'; END IF;
  IF p_request IS NULL OR p_version IS NULL OR p_version<1 OR p_action IS NULL OR p_action NOT IN ('claim','handoff','release') OR p_reason IS NULL OR length(p_reason)>500 OR p_reason~'[[:cntrl:]]' THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  IF p_action='handoff' AND (p_target IS NULL OR length(btrim(p_reason))=0) OR p_action<>'handoff' AND p_target IS NOT NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_payload:=jsonb_build_object('item',p_item,'version',p_version,'action',p_action,'target',p_target,'reason',p_reason);
  PERFORM pg_advisory_xact_lock(hashtext('office-request:'||p_actor::text));
  SELECT * INTO e FROM work_events WHERE lembaga_id=a.lembaga_id AND actor_id=p_actor AND request_id=p_request;
  IF FOUND THEN
    IF e.request_payload<>v_payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT'; END IF;
    RETURN e.snapshot;
  END IF;
  IF (SELECT count(*) FROM work_events WHERE actor_id=p_actor AND created_at>clock_timestamp()-interval '60 seconds')>=30 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  -- Source lock precedes work lock, same direction as domain triggers.
  PERFORM 1 FROM penyaluran p JOIN work_items wi ON wi.reference_type='penyaluran' AND wi.reference_id=p.id WHERE wi.id=p_item AND wi.lembaga_id=a.lembaga_id FOR SHARE OF p;
  SELECT * INTO w FROM work_items WHERE id=p_item AND lembaga_id=a.lembaga_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF w.version<>p_version THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
  IF w.status<>'open' THEN RAISE EXCEPTION 'TERMINAL'; END IF;
  v_old:=w.assigned_user_id;
  v_reason:=p_reason;
  IF p_action='claim' THEN
    IF v_old IS NOT NULL THEN
      IF office_eligible(w.id,v_old) THEN RAISE EXCEPTION 'ALREADY_ASSIGNED'; END IF;
      v_reason:='Pemulihan assignment: pemilik sebelumnya tidak lagi memenuhi syarat.';
    END IF;
    v_target:=p_actor;
  ELSE
    IF v_old IS DISTINCT FROM p_actor THEN RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
    IF p_action='handoff' AND p_target=p_actor THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
    v_target:=CASE WHEN p_action='handoff' THEN p_target END;
  END IF;
  IF p_action<>'release' AND NOT office_eligible(w.id,p_actor) THEN RAISE EXCEPTION 'INELIGIBLE'; END IF;
  IF v_target IS NOT NULL AND NOT office_eligible(w.id,v_target) THEN RAISE EXCEPTION 'INELIGIBLE'; END IF;
  UPDATE work_assignments SET ended_at=clock_timestamp() WHERE work_item_id=w.id AND ended_at IS NULL;
  IF v_target IS NOT NULL THEN INSERT INTO work_assignments(lembaga_id,work_item_id,assigned_user_id,assigned_role) VALUES(w.lembaga_id,w.id,v_target,w.assigned_role); END IF;
  UPDATE work_items SET assigned_user_id=v_target,version=version+1,updated_at=clock_timestamp() WHERE id=w.id RETURNING * INTO w;
  INSERT INTO work_handoffs(lembaga_id,work_item_id,from_user_id,to_user_id,from_stage,to_stage,actor_id,reason) VALUES(w.lembaga_id,w.id,v_old,v_target,w.stage,w.stage,p_actor,v_reason);
  INSERT INTO work_events(lembaga_id,work_item_id,type,actor_id,request_id,request_payload,snapshot,reason) VALUES(w.lembaga_id,w.id,p_action,p_actor,p_request,v_payload,to_jsonb(w),v_reason);
  RETURN to_jsonb(w);
END $$;

CREATE FUNCTION office_heartbeat(p_actor uuid,p_session uuid,p_station text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE a akun;
BEGIN
  SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE'; END IF;
  IF p_session IS NULL OR p_station IS NOT NULL AND p_station NOT IN ('penerimaan','saksi','persetujuan','penyaluran','catatan') THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('office-presence:'||p_actor::text));
  IF EXISTS(SELECT 1 FROM office_presence WHERE session_id=p_session AND akun_id<>p_actor) THEN RAISE EXCEPTION 'SESSION_OWNER'; END IF;
  -- Only sweep this actor; no per-heartbeat global table sweep.
  DELETE FROM office_presence WHERE akun_id=p_actor AND expires_at<clock_timestamp();
  IF NOT EXISTS(SELECT 1 FROM office_presence WHERE session_id=p_session) AND (SELECT count(*) FROM office_presence WHERE akun_id=p_actor)>=4 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  INSERT INTO office_presence(session_id,lembaga_id,akun_id,station,expires_at) VALUES(p_session,a.lembaga_id,p_actor,p_station,clock_timestamp()+interval '60 seconds')
    ON CONFLICT(session_id) DO UPDATE SET lembaga_id=EXCLUDED.lembaga_id,station=EXCLUDED.station,last_seen_at=clock_timestamp(),expires_at=EXCLUDED.expires_at;
END $$;

-- No browser/Supabase direct access. Use the existing trusted server DB role.
DO $$ DECLARE t text; r text; f regprocedure; BEGIN
  FOREACH t IN ARRAY ARRAY['work_items','work_assignments','work_handoffs','work_events','office_presence'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r); END IF;
    END LOOP;
  END LOOP;
  FOR f IN SELECT oid::regprocedure FROM pg_proc WHERE proname IN ('office_eligible','office_sync_penyaluran','office_source_trigger','office_assign_work','office_heartbeat') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f,r); END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;

-- >>> 006_office_operations.sql
-- Authenticated recording UI: no payment gateway, no autonomous transfers.
BEGIN;
ALTER TABLE penerimaan ADD COLUMN muzakki_tipe text NOT NULL DEFAULT 'anonim' CHECK(muzakki_tipe IN ('anonim','terdaftar')), ADD COLUMN muzakki_nama text CHECK(length(muzakki_nama)<=160), ADD COLUMN keterangan text CHECK(length(keterangan)<=500);
CREATE TABLE office_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lembaga_id uuid NOT NULL REFERENCES lembaga(id), akun_id uuid NOT NULL REFERENCES akun(id),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180), mime text NOT NULL CHECK(mime IN('application/pdf','image/png','image/jpeg','image/webp')),
 bytes bytea NOT NULL CHECK(octet_length(bytes) BETWEEN 1 AND 5242880),sha256 bytea NOT NULL CHECK(octet_length(sha256)=32),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX office_evidence_owner ON office_evidence(lembaga_id,akun_id,created_at);
CREATE TABLE office_operation_requests (
 lembaga_id uuid NOT NULL REFERENCES lembaga(id),actor_id uuid NOT NULL REFERENCES akun(id),request_id uuid NOT NULL,kind text NOT NULL CHECK(kind IN('receipt','distribution','witness','approve','cancel')),payload_hash bytea NOT NULL CHECK(octet_length(payload_hash)=32),result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(lembaga_id,actor_id,request_id)
);
CREATE INDEX office_operations_rate ON office_operation_requests(actor_id,created_at DESC);
CREATE TRIGGER office_operation_immutable BEFORE UPDATE OR DELETE ON office_operation_requests FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE FUNCTION office_record_operation(p_actor uuid,p_request uuid,p_payload jsonb,p_token_hash bytea DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a akun;w work_items;p penyaluran;e office_evidence;previous office_operation_requests;v_id uuid;v_kind text;v_code text;v_status text;v_result jsonb;v_gross numeric;v_percent numeric;v_amount numeric;v_asnaf asnaf_enum;
BEGIN
 SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE';END IF;
 IF p_request IS NULL OR jsonb_typeof(p_payload)<>'object' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 PERFORM pg_advisory_xact_lock(hashtext('office-operation:'||p_actor::text));
 SELECT * INTO previous FROM office_operation_requests WHERE lembaga_id=a.lembaga_id AND actor_id=p_actor AND request_id=p_request;
 IF FOUND THEN IF previous.payload_hash<>digest(p_payload::text,'sha256') THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN previous.result;END IF;
 IF(SELECT count(*) FROM office_operation_requests WHERE actor_id=p_actor AND created_at>clock_timestamp()-interval '60 seconds')>=20 THEN RAISE EXCEPTION 'RATE_LIMIT';END IF;
 v_kind:=p_payload->>'kind';
 IF v_kind IN('receipt','distribution') THEN
  IF a.peran<>'amil' THEN RAISE EXCEPTION 'FORBIDDEN';END IF;
  IF v_kind='receipt' THEN
   v_gross:=(p_payload->>'gross')::numeric;v_percent:=(p_payload->>'amilPercent')::numeric;
   IF v_gross IS NULL OR v_gross<=0 OR v_percent IS NULL OR v_percent<0 OR v_percent>100 OR length(btrim(coalesce(p_payload->>'channel','')))=0 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   IF v_percent>(SELECT persen_hak_amil_maks FROM lembaga WHERE id=a.lembaga_id) THEN RAISE EXCEPTION 'HAK_AMIL_MELEBIHI_BATAS_LEMBAGA';END IF;
   -- Conservative rounding preserves the legacy unrounded institutional cap.
   v_id:=catat_penerimaan(a.lembaga_id,(p_payload->>'posId')::uuid,v_gross,trunc(v_gross*v_percent/100,2),p_payload->>'channel',a.id);
   IF p_payload->>'donorType'='terdaftar' AND length(btrim(coalesce(p_payload->>'donorName','')))=0 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   UPDATE penerimaan SET muzakki_tipe=coalesce(p_payload->>'donorType','anonim'),muzakki_nama=CASE WHEN p_payload->>'donorType'='terdaftar' THEN p_payload->>'donorName' END,keterangan=p_payload->>'note' WHERE id=v_id;
   SELECT kode_unik::text INTO v_code FROM penerimaan WHERE id=v_id;v_status:='recorded';
  ELSE
   SELECT * INTO e FROM office_evidence WHERE id=(p_payload->>'evidenceId')::uuid AND lembaga_id=a.lembaga_id AND akun_id=a.id;
   IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_NOT_FOUND';END IF;
   SELECT asnaf INTO v_asnaf FROM mustahik WHERE id=(p_payload->>'mustahikId')::uuid AND lembaga_id=a.lembaga_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   v_amount:=(p_payload->>'amount')::numeric;IF v_amount IS NULL OR v_amount<=0 OR coalesce(p_payload->>'method','') NOT IN('saksi','mustahik') THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   IF p_payload->>'method'='mustahik' AND (p_token_hash IS NULL OR octet_length(p_token_hash)<>32) THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   v_id:=buat_draf_penyaluran(a.lembaga_id,(p_payload->>'posId')::uuid,(p_payload->>'mustahikId')::uuid,v_asnaf,v_amount,p_payload->>'method',a.id,a.unit_id,'office-evidence:'||e.id::text,e.sha256,p_token_hash);
   SELECT kode_unik::text,status::text INTO v_code,v_status FROM penyaluran WHERE id=v_id;
  END IF;
 ELSE
  IF v_kind IS NULL OR v_kind NOT IN('witness','approve','cancel') THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
  SELECT * INTO w FROM work_items WHERE id=(p_payload->>'itemId')::uuid AND lembaga_id=a.lembaga_id AND reference_type='penyaluran';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  -- Preserve global financial lock order: fund -> distribution -> work -> audit head.
  PERFORM 1 FROM pos_dana f JOIN penyaluran d ON d.pos_id=f.id WHERE d.id=w.reference_id AND d.lembaga_id=a.lembaga_id FOR UPDATE OF f;
  SELECT * INTO p FROM penyaluran WHERE id=w.reference_id AND lembaga_id=a.lembaga_id FOR UPDATE;
  SELECT * INTO w FROM work_items WHERE id=w.id AND lembaga_id=a.lembaga_id FOR UPDATE;
  IF w.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RAISE EXCEPTION 'VERSION_CONFLICT';END IF;
  IF w.status<>'open' THEN RAISE EXCEPTION 'TERMINAL';END IF;
  IF v_kind='cancel' THEN
   IF a.peran<>'amil' OR p.dibuat_oleh<>a.id THEN RAISE EXCEPTION 'FORBIDDEN';END IF;
   PERFORM batalkan_penyaluran(p.id,a.id);
  ELSE
   IF w.assigned_user_id IS DISTINCT FROM a.id THEN RAISE EXCEPTION 'OWNER_REQUIRED';END IF;
   IF NOT office_eligible(w.id,a.id) THEN RAISE EXCEPTION 'INELIGIBLE';END IF;
   IF v_kind='witness' THEN
    IF w.stage<>'saksi' OR jsonb_typeof(p_payload->'accept') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
    PERFORM konfirmasi_saksi(p.id,a.id,(p_payload->>'accept')::boolean);
   ELSE
    IF w.stage<>'persetujuan' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
    PERFORM setujui_penyaluran(p.id,a.id);
   END IF;
  END IF;
  v_id:=p.id;SELECT kode_unik::text,status::text INTO v_code,v_status FROM penyaluran WHERE id=p.id;
 END IF;
 SELECT * INTO w FROM work_items WHERE lembaga_id=a.lembaga_id AND reference_id=v_id AND reference_type=CASE WHEN v_kind='receipt' THEN 'penerimaan' ELSE 'penyaluran' END;
 v_result:=jsonb_build_object('id',v_id,'type',CASE WHEN v_kind='receipt' THEN 'penerimaan' ELSE 'penyaluran' END,'code',v_code,'status',v_status,'workItemId',w.id,'createdAt',w.created_at,'expiresAt',(SELECT kedaluwarsa_pada FROM penyaluran WHERE id=v_id));
 INSERT INTO office_operation_requests(lembaga_id,actor_id,request_id,kind,payload_hash,result) VALUES(a.lembaga_id,a.id,p_request,v_kind,digest(p_payload::text,'sha256'),v_result);
 RETURN v_result;
END $$;
CREATE INDEX office_recipient_token ON konfirmasi(token_hash) WHERE jenis='mustahik';
CREATE FUNCTION office_confirm_recipient(p_id uuid,p_hash bytea,p_accept boolean,p_reason text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE p penyaluran;k konfirmasi;v_pos uuid;
BEGIN
 SELECT pos_id INTO v_pos FROM penyaluran WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'TOKEN_TIDAK_VALID';END IF;
 PERFORM 1 FROM pos_dana WHERE id=v_pos FOR UPDATE;
 SELECT * INTO p FROM penyaluran WHERE id=p_id FOR UPDATE;
 SELECT * INTO k FROM konfirmasi WHERE penyaluran_id=p_id AND jenis='mustahik' FOR UPDATE;
 IF NOT FOUND OR k.token_hash IS DISTINCT FROM p_hash OR p_accept IS NULL THEN RAISE EXCEPTION 'TOKEN_TIDAK_VALID';END IF;
 IF k.dipakai_pada IS NOT NULL THEN
  IF k.hasil IS DISTINCT FROM (CASE WHEN p_accept THEN 'menerima' ELSE 'menolak' END) THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;
  RETURN p.status::text;
 END IF;
 RETURN konfirmasi_mustahik(p_id,p_hash,p_accept,p_reason);
END $$;
ALTER TABLE office_evidence ENABLE ROW LEVEL SECURITY;ALTER TABLE office_operation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON office_evidence,office_operation_requests FROM PUBLIC;
REVOKE ALL ON FUNCTION office_record_operation(uuid,uuid,jsonb,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION office_confirm_recipient(uuid,bytea,boolean,text) FROM PUBLIC;
DO $$ DECLARE r text;BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON office_evidence,office_operation_requests FROM %I',r);EXECUTE format('REVOKE ALL ON FUNCTION office_record_operation(uuid,uuid,jsonb,bytea) FROM %I',r);EXECUTE format('REVOKE ALL ON FUNCTION office_confirm_recipient(uuid,bytea,boolean,text) FROM %I',r);END IF;END LOOP;END $$;
COMMIT;

-- >>> 007_demo_activity.sql
-- ============================================================
-- Zaky — Aktivitas demo 30 hari untuk Lembaga Zakat A
--
-- Semua transaksi dibuat lewat stored procedure resmi (catat_penerimaan,
-- buat_draf_penyaluran, konfirmasi_saksi, setujui_penyaluran), berurutan
-- menurut waktu, sehingga saldo, invariant, dan antrean kerja sinkron.
--
-- Nominal kecil (ratusan ribu); total penerimaan Rp 7.100.000 (< Rp 10 juta).
-- Penyaluran mencakup kedelapan asnaf agar seluruh grafik dasbor terisi.
--
-- Stored procedure mencatat waktu "sekarang". Setelah semua transaksi dibuat,
-- waktu tiap peristiwa dipindah ke tanggal historisnya dan rantai hash audit
-- dihitung ulang dengan rumus yang identik dengan append_audit_log(),
-- sehingga verifikasi rantai tetap lolos. Hanya berjalan sekali saat
-- inisialisasi volume database demo.
-- ============================================================

CREATE TEMP TABLE seed_clock (nomor_dari bigint, nomor_sampai bigint, waktu timestamptz);

-- Catat rentang nomor audit yang dihasilkan sejak penanda terakhir, beserta waktu historisnya.
CREATE FUNCTION pg_temp.stamp(p_waktu timestamptz) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_dari bigint; v_sampai bigint;
BEGIN
  SELECT coalesce(max(nomor_sampai), 0) + 1 INTO v_dari FROM seed_clock;
  SELECT coalesce(max(nomor), 0) INTO v_sampai FROM audit_log;
  IF v_sampai >= v_dari THEN
    INSERT INTO seed_clock VALUES (v_dari, v_sampai, p_waktu);
  END IF;
END $$;

DO $$
DECLARE
  L       uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  u_pel   uuid := 'a1111111-1111-1111-1111-111111111111';
  budi    uuid := '11111111-1111-1111-1111-111111111111';
  hari    uuid := '22222222-2222-2222-2222-222222222222';
  dewi    uuid := '33333333-3333-3333-3333-333333333333';
  rian    uuid := '44444444-4444-4444-4444-444444444444';
  maal    uuid := 'c1111111-1111-1111-1111-111111111111';
  fitrah  uuid := 'c2222222-2222-2222-2222-222222222222';
  infak   uuid := 'c3333333-3333-3333-3333-333333333333';
  t0      timestamptz := date_trunc('hour', now());
  ev      record;
  v_id    uuid;
  v_at    timestamptz;
BEGIN
  -- Linimasa: tipe, hari lalu, jam, pos, nominal, hak amil, pencatat / mustahik, asnaf, tahap akhir.
  -- Tahap akhir penyaluran: 'terbit' (tersalurkan), 'disetujui_tunggu' (2 saksi, menunggu
  -- persetujuan), 'saksi1' (baru 1 saksi), 'draf' (baru dibuat).
  FOR ev IN
    SELECT * FROM (VALUES
      ('terima', 29, 9,  'maal',   600000, 75000, 'budi',   NULL, NULL, NULL),
      ('terima', 27, 10, 'fitrah', 350000, 43750, 'budi',   NULL, NULL, NULL),
      ('terima', 25, 13, 'infak',  250000, 25000, 'budi',   NULL, NULL, NULL),
      ('salur',  24, 14, 'maal',   300000, 0,     'budi',   'd1111111-1111-1111-1111-111111111111', 'fakir', 'terbit'),
      ('terima', 23, 9,  'maal',   750000, 93750, 'budi',   NULL, NULL, NULL),
      ('terima', 21, 15, 'fitrah', 300000, 37500, 'budi',   NULL, NULL, NULL),
      ('salur',  20, 10, 'fitrah', 250000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'terbit'),
      ('terima', 19, 11, 'infak',  200000, 20000, 'budi',   NULL, NULL, NULL),
      ('terima', 17, 10, 'maal',   500000, 62500, 'budi',   NULL, NULL, NULL),
      ('salur',  16, 13, 'maal',   400000, 0,     'budi',   'd3333333-3333-3333-3333-333333333333', 'gharimin', 'terbit'),
      ('terima', 15, 14, 'maal',   450000, 56250, 'budi',   NULL, NULL, NULL),
      ('salur',  14, 10, 'infak',  200000, 0,     'budi',   'd6666666-6666-6666-6666-666666666666', 'fisabilillah', 'terbit'),
      ('terima', 13, 9,  'fitrah', 400000, 50000, 'budi',   NULL, NULL, NULL),
      ('terima', 11, 16, 'infak',  300000, 30000, 'budi',   NULL, NULL, NULL),
      ('salur',  10, 11, 'maal',   150000, 0,     'budi',   'd4444444-4444-4444-4444-444444444444', 'muallaf', 'terbit'),
      ('terima', 9,  10, 'maal',   650000, 81250, 'budi',   NULL, NULL, NULL),
      ('salur',  8,  13, 'infak',  175000, 0,     'budi',   'd7777777-7777-7777-7777-777777777777', 'ibnu_sabil', 'terbit'),
      ('terima', 7,  13, 'fitrah', 250000, 31250, 'budi',   NULL, NULL, NULL),
      ('terima', 6,  9,  'maal',   550000, 68750, 'budi',   NULL, NULL, NULL),
      ('salur',  5,  10, 'maal',   200000, 0,     'budi',   'd5555555-5555-5555-5555-555555555555', 'riqab', 'terbit'),
      ('terima', 4,  11, 'infak',  350000, 35000, 'budi',   NULL, NULL, NULL),
      ('salur',  3,  14, 'fitrah', 225000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'terbit'),
      ('terima', 2,  10, 'maal',   400000, 50000, 'budi',   NULL, NULL, NULL),
      ('salur',  2,  15, 'maal',   100000, 0,     'budi',   'd8888888-8888-8888-8888-888888888888', 'amil', 'terbit'),
      ('terima', 1,  15, 'fitrah', 300000, 37500, 'budi',   NULL, NULL, NULL),
      ('salur',  1,  16, 'maal',   250000, 0,     'budi',   'd1111111-1111-1111-1111-111111111111', 'fakir', 'disetujui_tunggu'),
      ('terima', 0,  -4, 'maal',   500000, 62500, 'budi',   NULL, NULL, NULL),
      ('salur',  0,  -3, 'fitrah', 150000, 0,     'budi',   'd2222222-2222-2222-2222-222222222222', 'miskin', 'saksi1'),
      ('salur',  0,  -2, 'maal',   200000, 0,     'budi',   'd3333333-3333-3333-3333-333333333333', 'gharimin', 'draf')
    ) AS t(jenis, hari_lalu, jam, pos, nominal, hak_amil, oleh, mustahik, asnaf, akhir)
  LOOP
    -- Jam dibaca sebagai jam kerja WIB; jam negatif = "beberapa jam yang lalu" hari ini.
    v_at := CASE WHEN ev.jam < 0 THEN t0 + make_interval(hours => ev.jam)
                 ELSE (date_trunc('day', t0 AT TIME ZONE 'Asia/Jakarta')
                       - make_interval(days => ev.hari_lalu)
                       + make_interval(hours => ev.jam)) AT TIME ZONE 'Asia/Jakarta' END;

    IF ev.jenis = 'terima' THEN
      PERFORM catat_penerimaan(
        L,
        CASE ev.pos WHEN 'maal' THEN maal WHEN 'fitrah' THEN fitrah ELSE infak END,
        ev.nominal, ev.hak_amil,
        (ARRAY['tunai','transfer','qris'])[1 + (ev.hari_lalu % 3)],
        budi,
        'Data demo');
      PERFORM pg_temp.stamp(v_at);
    ELSE
      v_id := buat_draf_penyaluran(
        L,
        CASE ev.pos WHEN 'maal' THEN maal WHEN 'fitrah' THEN fitrah ELSE infak END,
        ev.mustahik::uuid, ev.asnaf::asnaf_enum, ev.nominal, 'saksi',
        budi, u_pel,
        'demo/bukti-' || ev.hari_lalu || '-' || ev.asnaf || '.jpg',
        digest('bukti demo ' || ev.hari_lalu || ev.asnaf, 'sha256'));
      PERFORM pg_temp.stamp(v_at);

      IF ev.akhir IN ('terbit', 'disetujui_tunggu', 'saksi1') THEN
        -- Saksi dari unit berbeda dengan pembuat dan dengan satu sama lain
        PERFORM konfirmasi_saksi(v_id, dewi, true);
        PERFORM pg_temp.stamp(v_at + interval '2 hours');
      END IF;
      IF ev.akhir IN ('terbit', 'disetujui_tunggu') THEN
        PERFORM konfirmasi_saksi(v_id, rian, true);
        PERFORM pg_temp.stamp(v_at + interval '3 hours');
      END IF;
      IF ev.akhir = 'terbit' THEN
        PERFORM setujui_penyaluran(v_id, hari);
        PERFORM pg_temp.stamp(v_at + interval '5 hours');
      END IF;
    END IF;
  END LOOP;
END $$;

-- ---- Pindahkan waktu ke tanggal historis ----------------------------------
ALTER TABLE audit_log DISABLE TRIGGER trg_audit_log_append_only;
ALTER TABLE work_events DISABLE TRIGGER work_events_append_only;
ALTER TABLE work_handoffs DISABLE TRIGGER work_handoffs_append_only;

-- Setiap baris audit mendapat waktu peristiwanya, berjarak 1 detik agar urutan tetap.
UPDATE audit_log a
SET waktu = c.waktu + make_interval(secs => a.nomor - c.nomor_dari)
FROM seed_clock c
WHERE a.nomor BETWEEN c.nomor_dari AND c.nomor_sampai;

-- Hitung ulang rantai hash dengan rumus yang identik dengan append_audit_log().
DO $$
DECLARE
  r      audit_log;
  v_prev bytea := decode(repeat('00', 32), 'hex');
  v_hash bytea;
BEGIN
  FOR r IN SELECT * FROM audit_log WHERE lembaga_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' ORDER BY nomor LOOP
    v_hash := digest(convert_to(json_build_object(
        'aksi', r.aksi,
        'entitas', r.entitas,
        'entitas_id', r.entitas_id,
        'lembaga_id', r.lembaga_id,
        'nomor', r.nomor,
        'pelaku', r.pelaku,
        'sebelum', r.sebelum,
        'sesudah', r.sesudah,
        'waktu', to_char(r.waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text, 'UTF8') || v_prev, 'sha256');
    UPDATE audit_log SET hash_sebelumnya = v_prev, hash_saat_ini = v_hash WHERE nomor = r.nomor;
    v_prev := v_hash;
  END LOOP;
  UPDATE rantai_kepala SET hash_kepala = v_prev
  WHERE lembaga_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
END $$;

-- Waktu transaksi mengikuti peristiwa audit pertama/terakhirnya.
UPDATE penerimaan p
SET dicatat_pada = (SELECT min(a.waktu) FROM audit_log a WHERE a.entitas_id = p.id);

UPDATE penyaluran d
SET dibuat_pada = s.awal,
    kedaluwarsa_pada = s.awal + interval '72 hours',
    penyetuju_waktu = CASE WHEN d.penyetuju_waktu IS NOT NULL THEN s.akhir END
FROM (SELECT entitas_id, min(waktu) AS awal, max(waktu) AS akhir FROM audit_log GROUP BY entitas_id) s
WHERE s.entitas_id = d.id;

UPDATE konfirmasi k
SET dipakai_pada = CASE WHEN k.dipakai_pada IS NOT NULL THEN d.dibuat_pada + interval '2 hours' END,
    kedaluwarsa_pada = d.kedaluwarsa_pada
FROM penyaluran d
WHERE d.id = k.penyaluran_id;

-- Antrean kerja mengikuti waktu sumbernya.
UPDATE work_items w
SET created_at = s.awal,
    updated_at = s.akhir,
    completed_at = CASE WHEN w.completed_at IS NOT NULL THEN s.akhir END
FROM (SELECT entitas_id, min(waktu) AS awal, max(waktu) AS akhir FROM audit_log GROUP BY entitas_id) s
WHERE s.entitas_id = w.reference_id;

UPDATE work_events e SET created_at = w.updated_at FROM work_items w WHERE w.id = e.work_item_id;
UPDATE work_handoffs h SET created_at = w.updated_at FROM work_items w WHERE w.id = h.work_item_id;

ALTER TABLE audit_log ENABLE TRIGGER trg_audit_log_append_only;
ALTER TABLE work_events ENABLE TRIGGER work_events_append_only;
ALTER TABLE work_handoffs ENABLE TRIGGER work_handoffs_append_only;

-- >>> 008_jaringan_saksi.sql
-- ============================================================
-- Zaky — Jaringan saksi silang: Lembaga B dan C
--
-- Satu basis data menyimpan buku besar SATU lembaga (nomor audit_log global).
-- Lembaga B (Bandung) dan C (Surabaya) memegang buku besarnya di server sendiri;
-- di sini mereka tercatat sebagai anggota jaringan beserta kunci publik Ed25519,
-- agar kesaksian yang mereka tandatangani bisa diverifikasi.
--
-- Kunci publik di bawah adalah kunci DEMO, diturunkan dari seed terbuka
-- (lihat src/lib/jaringan/kunci.ts). Produksi wajib memakai kunci sendiri
-- lewat ZAKY_ED25519_SEED_A/B/C dan memperbarui direktori/anggota.json.
-- ============================================================

UPDATE lembaga
SET kunci_publik_ed25519 = decode('dabda8d21e90c87ba12a818d63c8228fbc6bd1d197db6de91ec7cb1427e421ee', 'hex')
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lembaga Amil Zakat Peduli B',
   decode('c75d1a17d996494d306773de18c0dcb40288b94b96ea78597567c18b75bf6238', 'hex'), 12.50),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lembaga Amil Zakat Amanah C',
   decode('283c0c292bf1c1f90cff72b18fea84f2db0fc890f7eb3fd2e7e511dc815e6f4e', 'hex'), 12.50)
ON CONFLICT (id) DO NOTHING;

-- Hitung ulang rantai hash dari entri pertama sampai p_sampai dengan rumus yang
-- identik dengan append_audit_log(). Saksi memakainya secara mandiri, tanpa
-- mempercayai kolom hash_saat_ini yang tersimpan.
--
-- p_ubah_nomor mensimulasikan perubahan paksa satu baris (hanya di memori,
-- tidak menyentuh tabel), untuk memperlihatkan bahwa hasilnya langsung berbeda.
-- rusak_di = nomor pertama yang hasil hitung ulangnya berbeda dari yang tersimpan.
CREATE OR REPLACE FUNCTION hitung_ulang_rantai(
  p_lembaga uuid,
  p_sampai bigint,
  p_ubah_nomor bigint DEFAULT NULL
) RETURNS TABLE (hash bytea, jumlah bigint, rusak_di bigint)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r       audit_log;
  v_prev  bytea := decode(repeat('00', 32), 'hex');
  v_hash  bytea;
  v_n     bigint := 0;
  v_rusak bigint;
  v_isi   jsonb;
BEGIN
  FOR r IN
    SELECT * FROM audit_log
    WHERE lembaga_id = p_lembaga AND nomor <= p_sampai
    ORDER BY nomor
  LOOP
    v_isi := r.sesudah;
    IF r.nomor = p_ubah_nomor THEN
      v_isi := coalesce(r.sesudah, '{}'::jsonb) || '{"nominal_diubah_langsung": true}'::jsonb;
    END IF;
    v_hash := digest(convert_to(json_build_object(
        'aksi', r.aksi,
        'entitas', r.entitas,
        'entitas_id', r.entitas_id,
        'lembaga_id', r.lembaga_id,
        'nomor', r.nomor,
        'pelaku', r.pelaku,
        'sebelum', r.sebelum,
        'sesudah', v_isi,
        'waktu', to_char(r.waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text, 'UTF8') || v_prev, 'sha256');
    IF v_rusak IS NULL AND (v_hash <> r.hash_saat_ini OR v_prev <> r.hash_sebelumnya) THEN
      v_rusak := r.nomor;
    END IF;
    v_prev := v_hash;
    v_n := v_n + 1;
  END LOOP;
  RETURN QUERY SELECT v_prev, v_n, v_rusak;
END $$;

