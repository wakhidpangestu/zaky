-- ============================================================================
-- 001_initial_schema.sql
-- Zaky – Zakat Distribution Verification Network
-- Initial database schema migration
-- ============================================================================

BEGIN;

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
