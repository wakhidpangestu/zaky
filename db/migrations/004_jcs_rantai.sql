-- ============================================================================
-- Zaky v4.0 — Migration 004: Samakan Format Kanonik Rantai ke JCS (RFC 8785)
-- ============================================================================
-- Menutup temuan audit T1: lapisan SQL sebelumnya membangun payload rantai
-- dengan json_build_object()::text (urutan kunci sesuai penulisan, pemisah
-- ": " dan ", ", angka NUMERIC tercetak dengan skala tersimpan), sedangkan
-- verifikator TypeScript memakai JCS/RFC 8785 (ADR-06). Hasilnya dua format
-- yang tidak dapat saling memverifikasi.
--
-- Migrasi ini menetapkan JCS sebagai SATU-SATUNYA format kanonik:
-- - jcs_teks(TEXT)         : serialisasi string RFC 8785
-- - jcs_angka(NUMERIC)     : serialisasi angka gaya ECMAScript untuk cakupan
--                            skema ini (bulat dan pecahan maks 2 desimal)
-- - jcs_dari_jsonb(JSONB)  : serialisasi rekursif objek/array JSONB ke JCS
--                            (kunci objek diurutkan COLLATE "C" = urutan titik
--                            kode, setara urutan unit UTF-16 untuk karakter BMP)
-- - append_audit_log(...)  : dibangun ulang agar payload rantai = teks JCS
--
-- Kontrak lintas implementasi dikunci oleh pasangan uji:
-- - tests/kripto/test_jcs_lintas_implementasi.ts (sisi TypeScript)
-- - db/tests/test_jcs_rantai.sql (sisi SQL, dijalankan pada PostgreSQL)
-- Keduanya menegaskan string payload dan hash rantai yang IDENTIK untuk
-- entri fikstur yang sama.
--
-- Catatan cakupan: seed demo hanya memasang rantai_kepala genesis (nomor 0),
-- sehingga tidak ada rantai lama berformat lama yang perlu dimigrasikan.
-- ============================================================================

-- Serialisasi string sesuai RFC 8785: hanya ", \, dan karakter kontrol yang
-- diescape; \b \t \n \f \r memakai bentuk pendek, kontrol lain \u00xx heksa kecil.
CREATE OR REPLACE FUNCTION jcs_teks(p TEXT) RETURNS TEXT AS $$
DECLARE
    v_out TEXT := '"';
    v_ch TEXT;
    v_code INT;
    v_i INT;
BEGIN
    IF p IS NULL THEN
        RETURN 'null';
    END IF;
    FOR v_i IN 1..length(p) LOOP
        v_ch := substr(p, v_i, 1);
        v_code := ascii(v_ch);
        IF v_ch = '"' THEN
            v_out := v_out || '\"';
        ELSIF v_ch = '\' THEN
            v_out := v_out || '\\';
        ELSIF v_code = 8 THEN
            v_out := v_out || '\b';
        ELSIF v_code = 9 THEN
            v_out := v_out || '\t';
        ELSIF v_code = 10 THEN
            v_out := v_out || '\n';
        ELSIF v_code = 12 THEN
            v_out := v_out || '\f';
        ELSIF v_code = 13 THEN
            v_out := v_out || '\r';
        ELSIF v_code < 32 THEN
            v_out := v_out || '\u' || lpad(to_hex(v_code), 4, '0');
        ELSE
            v_out := v_out || v_ch;
        END IF;
    END LOOP;
    RETURN v_out || '"';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Serialisasi angka: NUMERIC tercetak Postgres mempertahankan skala tersimpan
-- (800000.00), sedangkan JCS/ECMAScript mencetak nilai terpendek (800000).
-- Untuk cakupan skema (nominal 2 desimal, hitungan bulat) pemangkasan nol
-- ekor menghasilkan bentuk yang sama dengan ECMAScript Number::toString.
CREATE OR REPLACE FUNCTION jcs_angka(p NUMERIC) RETURNS TEXT AS $$
DECLARE
    v TEXT := p::TEXT;
BEGIN
    IF v LIKE '%E%' OR v LIKE '%e%' THEN
        RAISE EXCEPTION 'jcs_angka: notasi ilmiah di luar cakupan format kanonik rantai';
    END IF;
    IF v LIKE '%.%' THEN
        v := rtrim(v, '0');
        v := rtrim(v, '.');
    END IF;
    IF v = '-0' OR v = '' THEN
        v := '0';
    END IF;
    RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Serialisasi rekursif JSONB -> teks JCS
CREATE OR REPLACE FUNCTION jcs_dari_jsonb(p JSONB) RETURNS TEXT AS $$
DECLARE
    v_type TEXT := jsonb_typeof(p);
    v_body TEXT;
BEGIN
    IF p IS NULL THEN
        RETURN 'null';
    END IF;
    CASE v_type
        WHEN 'null' THEN
            RETURN 'null';
        WHEN 'boolean' THEN
            RETURN p::TEXT;
        WHEN 'number' THEN
            RETURN jcs_angka((p::TEXT)::NUMERIC);
        WHEN 'string' THEN
            RETURN jcs_teks(p #>> '{}');
        WHEN 'array' THEN
            SELECT string_agg(jcs_dari_jsonb(elem), ',' ORDER BY ord)
            INTO v_body
            FROM jsonb_array_elements(p) WITH ORDINALITY AS t(elem, ord);
            RETURN '[' || coalesce(v_body, '') || ']';
        WHEN 'object' THEN
            SELECT string_agg(jcs_teks(key) || ':' || jcs_dari_jsonb(value), ',' ORDER BY key COLLATE "C")
            INTO v_body
            FROM jsonb_each(p);
            RETURN '{' || coalesce(v_body, '') || '}';
        ELSE
            RAISE EXCEPTION 'jcs_dari_jsonb: tipe JSONB tidak dikenal: %', v_type;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Bangun payload rantai dalam format JCS.
-- Urutan kunci leksikografis: aksi, entitas, entitas_id, lembaga_id, nomor,
-- pelaku, sebelum, sesudah, waktu (sama dengan objek payload verifikator TS).
CREATE OR REPLACE FUNCTION payload_rantai_jcs(
    p_aksi TEXT,
    p_entitas TEXT,
    p_entitas_id UUID,
    p_lembaga_id UUID,
    p_nomor BIGINT,
    p_pelaku UUID,
    p_sebelum JSONB,
    p_sesudah JSONB,
    p_waktu TIMESTAMPTZ
) RETURNS TEXT AS $$
BEGIN
    RETURN '{'
        || '"aksi":' || jcs_teks(p_aksi)
        || ',"entitas":' || jcs_teks(p_entitas)
        || ',"entitas_id":' || jcs_teks(p_entitas_id::TEXT)
        || ',"lembaga_id":' || jcs_teks(p_lembaga_id::TEXT)
        || ',"nomor":' || p_nomor::TEXT
        || ',"pelaku":' || jcs_teks(p_pelaku::TEXT)
        || ',"sebelum":' || coalesce(jcs_dari_jsonb(p_sebelum), 'null')
        || ',"sesudah":' || coalesce(jcs_dari_jsonb(p_sesudah), 'null')
        || ',"waktu":' || jcs_teks(to_char(p_waktu AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
        || '}';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- append_audit_log versi JCS (menggantikan versi json_build_object di 003)
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

    v_payload := payload_rantai_jcs(
        p_aksi, p_entitas, p_entitas_id, p_lembaga_id, v_nomor, p_pelaku,
        p_sebelum, p_sesudah, v_waktu
    );

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
