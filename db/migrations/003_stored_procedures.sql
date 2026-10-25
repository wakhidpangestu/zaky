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
    v_payload TEXT;
BEGIN
    -- Kunci baris rantai_kepala untuk lembaga ini (FR-35, FR-37 < 2ms)
    SELECT nomor, hash_kepala 
    INTO v_nomor, v_prev_hash
    FROM rantai_kepala
    WHERE lembaga_id = p_lembaga_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rantai kepala untuk lembaga % tidak ditemukan', p_lembaga_id;
    END IF;

    v_nomor := v_nomor + 1;
    v_payload := (p_sebelum::text || '->' || p_sesudah::text);
    v_new_hash := digest(v_payload || encode(v_prev_hash, 'hex'), 'sha256');

    INSERT INTO audit_log (
        nomor, lembaga_id, entitas, entitas_id, aksi, pelaku,
        sebelum, sesudah, waktu, hash_sebelumnya, hash_saat_ini
    ) VALUES (
        v_nomor, p_lembaga_id, p_entitas, p_entitas_id, p_aksi, p_pelaku,
        p_sebelum, p_sesudah, now(), v_prev_hash, v_new_hash
    );

    UPDATE rantai_kepala
    SET nomor = v_nomor,
        hash_kepala = v_new_hash
    WHERE lembaga_id = p_lembaga_id;

    RETURN v_new_hash;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. CATAT PENERIMAAN (FR-09 s/d FR-13)
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
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_pos_record RECORD;
BEGIN
    IF p_bruto <= 0 THEN
        RAISE EXCEPTION 'Nominal bruto harus lebih dari 0';
    END IF;

    -- Batas hak amil maks 12.5% (1/8 asnaf)
    IF p_hak_amil > (p_bruto * 0.125) THEN
        RAISE EXCEPTION 'Hak amil tidak boleh melebihi 12.5 persen dari bruto (kaidah 1/8 asnaf)';
    END IF;

    v_masuk_pos := p_bruto - p_hak_amil;

    -- Generate 12-char alphanumeric code (e.g. ZK + 10 chars)
    v_kode_unik := 'RC';
    FOR i IN 1..10 LOOP
        v_kode_unik := v_kode_unik || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;

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

    -- 3. Masukkan record penerimaan
    INSERT INTO penerimaan (
        id, kode_unik, lembaga_id, pos_id, bruto, hak_amil, masuk_pos,
        kanal, dicatat_oleh, dicatat_pada
    ) VALUES (
        v_penerimaan_id, v_kode_unik, p_lembaga_id, p_pos_id, p_bruto, p_hak_amil, v_masuk_pos,
        p_kanal, p_dicatat_oleh, now()
    );

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
-- 2. BUAT DRAF PENYALURAN & RESERVASI SALDO (FR-04, FR-14, AC-01, AC-02, AC-05, AC-06)
-- ----------------------------------------------------------------------------
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
    p_berkas_sha256 BYTEA
) RETURNS UUID AS $$
DECLARE
    v_penyaluran_id UUID := gen_random_uuid();
    v_kode_unik CHAR(12);
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_pos_record RECORD;
    v_mustahik_asnaf asnaf_enum;
BEGIN
    IF p_nominal <= 0 THEN
        RAISE EXCEPTION 'Nominal penyaluran harus lebih besar dari 0';
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

    -- Generate kode unik 12-char
    v_kode_unik := 'ZK';
    FOR i IN 1..10 LOOP
        v_kode_unik := v_kode_unik || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;

    -- Insert penyaluran dengan status dibuat / menunggu_konfirmasi
    INSERT INTO penyaluran (
        id, kode_unik, lembaga_id, pos_id, mustahik_id, asnaf, nominal,
        status, metode, dibuat_oleh, dibuat_unit, kedaluwarsa_pada
    ) VALUES (
        v_penyaluran_id, v_kode_unik, p_lembaga_id, p_pos_id, p_mustahik_id, p_asnaf, p_nominal,
        'menunggu_konfirmasi', p_metode, p_dibuat_oleh, p_dibuat_unit, now() + interval '72 hours'
    );

    -- Simpan bukti berkas & sha256 (FR-16)
    INSERT INTO bukti (
        id, penyaluran_id, berkas_path, sha256
    ) VALUES (
        gen_random_uuid(), v_penyaluran_id, p_berkas_path, p_berkas_sha256
    );

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
-- 3. KONFIRMASI MUSTAHIK (FR-21 s/d FR-24, AC-09, AC-10, AC-11, AC-12)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION konfirmasi_mustahik(
    p_penyaluran_id UUID,
    p_token_hash BYTEA,
    p_menerima BOOLEAN,
    p_alasan_tolak TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_penyaluran RECORD;
BEGIN
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Penyaluran tidak ditemukan';
    END IF;

    IF v_penyaluran.status <> 'menunggu_konfirmasi' THEN
        RAISE EXCEPTION 'Penyaluran sudah tidak menunggu konfirmasi (status: %)', v_penyaluran.status;
    END IF;

    IF now() > v_penyaluran.kedaluwarsa_pada THEN
        -- Tautan melewati 72 jam (AC-12)
        UPDATE penyaluran SET status = 'kedaluwarsa' WHERE id = p_penyaluran_id;
        
        -- Lepas reservasi kembali ke saldo tersedia (FR-05)
        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_penyaluran.pos_id;

        RAISE EXCEPTION 'Tautan konfirmasi telah kedaluwarsa (> 72 jam) (AC-12)';
    END IF;

    -- Catat konfirmasi
    INSERT INTO konfirmasi (
        id, penyaluran_id, jenis, token_hash, dipakai_pada, kedaluwarsa_pada, hasil
    ) VALUES (
        gen_random_uuid(), p_penyaluran_id, 'mustahik', p_token_hash, now(),
        v_penyaluran.kedaluwarsa_pada, CASE WHEN p_menerima THEN 'menerima' ELSE 'menolak' END
    );

    IF p_menerima THEN
        -- AC-09: Mustahik menerima -> status menjadi dikonfirmasi
        UPDATE penyaluran SET status = 'dikonfirmasi' WHERE id = p_penyaluran_id;
    ELSE
        -- AC-10: Mustahik menolak -> status ditolak_penerima, reservasi dilepas
        UPDATE penyaluran SET status = 'ditolak_penerima' WHERE id = p_penyaluran_id;

        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_penyaluran.pos_id;
    END IF;

    -- Audit log
    PERFORM append_audit_log(
        v_penyaluran.lembaga_id,
        'penyaluran',
        p_penyaluran_id,
        CASE WHEN p_menerima THEN 'KONFIRMASI_MUSTAHIK_TERIMA' ELSE 'KONFIRMASI_MUSTAHIK_TOLAK' END,
        v_penyaluran.dibuat_oleh,
        jsonb_build_object('status_sebelum', 'menunggu_konfirmasi'),
        jsonb_build_object('status_sesudah', CASE WHEN p_menerima THEN 'dikonfirmasi' ELSE 'ditolak_penerima' END, 'alasan', p_alasan_tolak)
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. KONFIRMASI DUA SAKSI (FR-25 s/d FR-28, AC-13, AC-14, AC-15)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION konfirmasi_saksi(
    p_penyaluran_id UUID,
    p_akun_saksi_id UUID,
    p_unit_saksi UUID,
    p_menerima BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_penyaluran RECORD;
    v_jumlah_saksi_terima INTEGER;
BEGIN
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Penyaluran tidak ditemukan';
    END IF;

    -- Saksi tidak boleh sama dengan pembuat (FR-27)
    IF p_akun_saksi_id = v_penyaluran.dibuat_oleh THEN
        RAISE EXCEPTION 'Saksi tidak boleh sama dengan amil pembuat draf (FR-27)';
    END IF;

    -- Unit saksi harus berbeda dengan unit pembuat (FR-26, AC-15)
    IF p_unit_saksi = v_penyaluran.dibuat_unit THEN
        RAISE EXCEPTION 'Unit saksi (%) tidak boleh sama dengan unit amil pembuat (%) (AC-15)', p_unit_saksi, v_penyaluran.dibuat_unit;
    END IF;

    -- Simpan konfirmasi saksi (UNIQUE constraint akan menolak saksi yang sama dua kali, AC-14)
    INSERT INTO konfirmasi (
        id, penyaluran_id, jenis, akun_saksi_id, unit_saksi, dipakai_pada, kedaluwarsa_pada, hasil
    ) VALUES (
        gen_random_uuid(), p_penyaluran_id, 'saksi', p_akun_saksi_id, p_unit_saksi, now(),
        v_penyaluran.kedaluwarsa_pada, CASE WHEN p_menerima THEN 'menerima' ELSE 'menolak' END
    );

    IF NOT p_menerima THEN
        -- Saksi menyatakan tidak valid
        UPDATE penyaluran SET status = 'ditolak_penerima' WHERE id = p_penyaluran_id;

        UPDATE pos_dana
        SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
            saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
        WHERE id = v_penyaluran.pos_id;
        RETURN;
    END IF;

    -- Hitung jumlah saksi yang menerima
    SELECT count(*) INTO v_jumlah_saksi_terima
    FROM konfirmasi
    WHERE penyaluran_id = p_penyaluran_id AND jenis = 'saksi' AND hasil = 'menerima';

    -- AC-13: Jika baru 1 saksi, status tetap 'menunggu_konfirmasi'.
    -- FR-28: Jika tepat 2 saksi, status berpindah ke 'dikonfirmasi'.
    IF v_jumlah_saksi_terima >= 2 THEN
        UPDATE penyaluran SET status = 'dikonfirmasi' WHERE id = p_penyaluran_id;
    END IF;

    -- Audit log
    PERFORM append_audit_log(
        v_penyaluran.lembaga_id,
        'penyaluran',
        p_penyaluran_id,
        'KONFIRMASI_SAKSI',
        p_akun_saksi_id,
        jsonb_build_object('saksi_ke', v_jumlah_saksi_terima),
        jsonb_build_object('status_akhir', CASE WHEN v_jumlah_saksi_terima >= 2 THEN 'dikonfirmasi' ELSE 'menunggu_konfirmasi' END)
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 5. PERSETUJUAN PENYALURAN (FR-29 s/d FR-31, AC-04, AC-07, AC-08, AC-16)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION setujui_penyaluran(
    p_penyaluran_id UUID,
    p_penyetuju_akun UUID,
    p_penyetuju_unit UUID
) RETURNS VOID AS $$
DECLARE
    v_penyaluran RECORD;
    v_pos RECORD;
    v_ada_saksi_sama BOOLEAN;
BEGIN
    -- 1. Kunci baris pos_dana dahulu (Urutan penguncian global: 1. pos_dana FOR UPDATE)
    SELECT p.* INTO v_penyaluran
    FROM penyaluran p
    WHERE p.id = p_penyaluran_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Penyaluran tidak ditemukan';
    END IF;

    SELECT * INTO v_pos
    FROM pos_dana
    WHERE id = v_penyaluran.pos_id
    FOR UPDATE;

    -- 2. Kunci baris penyaluran (Urutan penguncian global: 2. penyaluran FOR UPDATE)
    SELECT * INTO v_penyaluran
    FROM penyaluran
    WHERE id = p_penyaluran_id
    FOR UPDATE;

    -- Syarat: Status harus dikonfirmasi (FR-29)
    IF v_penyaluran.status <> 'dikonfirmasi' THEN
        RAISE EXCEPTION 'Penyaluran hanya dapat disetujui jika berstatus dikonfirmasi (status saat ini: %)', v_penyaluran.status;
    END IF;

    -- Syarat: Pembuat tidak boleh menyetujui sendiri (FR-30, AC-07)
    IF p_penyetuju_akun = v_penyaluran.dibuat_oleh THEN
        RAISE EXCEPTION 'Amil pembuat draf tidak boleh menyetujui penyaluran yang dibuat sendiri (AC-07)';
    END IF;

    -- Syarat: Penyetuju harus dari unit berbeda dengan pembuat (FR-30, AC-08)
    IF p_penyetuju_unit = v_penyaluran.dibuat_unit THEN
        RAISE EXCEPTION 'Unit penyetuju (%) tidak boleh sama dengan unit pembuat (%) (AC-08)', p_penyetuju_unit, v_penyaluran.dibuat_unit;
    END IF;

    -- Syarat: Saksi tidak boleh sama dengan penyetuju (FR-27, AC-16)
    SELECT EXISTS (
        SELECT 1 FROM konfirmasi
        WHERE penyaluran_id = p_penyaluran_id AND akun_saksi_id = p_penyetuju_akun
    ) INTO v_ada_saksi_sama;

    IF v_ada_saksi_sama THEN
        RAISE EXCEPTION 'Penyetuju tidak boleh orang yang sama dengan salah satu saksi (AC-16)';
    END IF;

    -- FR-06 & AC-04: Pindahkan nominal dari saldo_dicadangkan ke total_tersalurkan
    UPDATE pos_dana
    SET saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal,
        total_tersalurkan = total_tersalurkan + v_penyaluran.nominal
    WHERE id = v_penyaluran.pos_id;

    -- Update status penyaluran menjadi tersalurkan
    UPDATE penyaluran
    SET status = 'tersalurkan',
        penyetuju_akun = p_penyetuju_akun,
        penyetuju_unit = p_penyetuju_unit,
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
        jsonb_build_object('status_sesudah', 'tersalurkan', 'saldo_dicadangkan_sesudah', v_pos.saldo_dicadangkan - v_penyaluran.nominal, 'total_tersalurkan_sesudah', v_pos.total_tersalurkan + v_penyaluran.nominal)
    );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. BATALKAN DRAF PENYALURAN (FR-05, FR-19, AC-03)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION batalkan_penyaluran(
    p_penyaluran_id UUID,
    p_pelaku_id UUID
) RETURNS VOID AS $$
DECLARE
    v_penyaluran RECORD;
BEGIN
    -- 1. Kunci pos_dana
    SELECT p.* INTO v_penyaluran FROM penyaluran p WHERE p.id = p_penyaluran_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Penyaluran tidak ditemukan';
    END IF;

    PERFORM 1 FROM pos_dana WHERE id = v_penyaluran.pos_id FOR UPDATE;

    -- 2. Kunci penyaluran
    SELECT * INTO v_penyaluran FROM penyaluran WHERE id = p_penyaluran_id FOR UPDATE;

    IF v_penyaluran.status NOT IN ('dibuat', 'menunggu_konfirmasi') THEN
        RAISE EXCEPTION 'Hanya draf yang belum dikonfirmasi yang dapat dibatalkan oleh amil';
    END IF;

    -- Lepas reservasi (AC-03)
    UPDATE pos_dana
    SET saldo_tersedia = saldo_tersedia + v_penyaluran.nominal,
        saldo_dicadangkan = saldo_dicadangkan - v_penyaluran.nominal
    WHERE id = v_penyaluran.pos_id;

    UPDATE penyaluran
    SET status = 'dibatalkan'
    WHERE id = p_penyaluran_id;

    -- Audit log
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
