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
-- ============================================================
-- Zaky v4.0 — Data Demo untuk Lembaga A
-- ============================================================

-- ID tetap agar bisa direferensikan antardata
DO $$
DECLARE
  v_lembaga_id  uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_unit_1      uuid := 'a1111111-1111-1111-1111-111111111111'; -- Unit Pelayanan
  v_unit_2      uuid := 'a2222222-2222-2222-2222-222222222222'; -- Unit Keuangan
  v_unit_3      uuid := 'a3333333-3333-3333-3333-333333333333'; -- Unit Penyaluran
  v_unit_4      uuid := 'a4444444-4444-4444-4444-444444444444'; -- Unit Pengawasan
  v_akun_budi   uuid := '11111111-1111-1111-1111-111111111111'; -- Amil Budi
  v_akun_hari   uuid := '22222222-2222-2222-2222-222222222222'; -- Penyetuju Hari
  v_akun_dewi   uuid := '33333333-3333-3333-3333-333333333333'; -- Saksi Dewi
  v_akun_rian   uuid := '44444444-4444-4444-4444-444444444444'; -- Saksi Rian
  v_pos_maal    uuid := 'c1111111-1111-1111-1111-111111111111'; -- Zakat Maal
  v_pos_fitrah  uuid := 'c2222222-2222-2222-2222-222222222222'; -- Zakat Fitrah
  v_mustahik_1  uuid := 'd1111111-1111-1111-1111-111111111111';
  v_mustahik_2  uuid := 'd2222222-2222-2222-2222-222222222222';
  -- Password hash untuk "demo123" — menggunakan PBKDF2 placeholder
  v_pwd_hash    text := 'demo';
BEGIN

  -- ---- Lembaga ----
  INSERT INTO lembaga (id, nama, kunci_publik_ed25519, persen_hak_amil_maks)
  VALUES (v_lembaga_id, 'Lembaga Zakat A', decode(repeat('00', 32), 'hex'), 12.50);

  -- ---- Unit ----
  INSERT INTO unit (id, lembaga_id, nama) VALUES
    (v_unit_1, v_lembaga_id, 'Unit Pelayanan'),
    (v_unit_2, v_lembaga_id, 'Unit Keuangan'),
    (v_unit_3, v_lembaga_id, 'Unit Penyaluran'),
    (v_unit_4, v_lembaga_id, 'Unit Pengawasan');

  -- ---- Akun ----
  INSERT INTO akun (id, lembaga_id, unit_id, peran, nama, email, password_hash) VALUES
    (v_akun_budi, v_lembaga_id, v_unit_1, 'amil',      'Amil Budi',       'budi@lembaga-a.test', v_pwd_hash),
    (v_akun_hari, v_lembaga_id, v_unit_2, 'penyetuju', 'Penyetuju Hari',  'hari@lembaga-a.test', v_pwd_hash),
    (v_akun_dewi, v_lembaga_id, v_unit_3, 'amil',      'Saksi Dewi',      'dewi@lembaga-a.test', v_pwd_hash),
    (v_akun_rian, v_lembaga_id, v_unit_4, 'amil',      'Saksi Rian',      'rian@lembaga-a.test', v_pwd_hash);

  -- ---- Pos Dana ----
  -- Invariant: total_masuk = tersedia + dicadangkan + tersalurkan
  INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan) VALUES
    (v_pos_maal,   v_lembaga_id, 'Zakat Maal',        6000000, 1800000, 0, 4200000),
    (v_pos_fitrah, v_lembaga_id, 'Zakat Fitrah Uang', 1400000,  400000, 0, 1000000);

  -- ---- Mustahik ----
  INSERT INTO mustahik (id, lembaga_id, nama_samaran, kabupaten, asnaf, telepon_hmac, consent_at) VALUES
    (v_mustahik_1, v_lembaga_id, 'S***', 'Kabupaten Sleman', 'fakir',
     decode(repeat('aa', 32), 'hex'), now()),
    (v_mustahik_2, v_lembaga_id, 'A***', 'Kabupaten Bantul', 'miskin',
     decode(repeat('bb', 32), 'hex'), now());

  -- ---- Rantai Kepala ----
  INSERT INTO rantai_kepala (lembaga_id, nomor, hash_kepala)
  VALUES (v_lembaga_id, 0, decode(repeat('00', 32), 'hex'));

END $$;
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
