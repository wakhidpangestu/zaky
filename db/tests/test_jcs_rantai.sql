-- ============================================================================
-- Uji SQL: Format Kanonik JCS Rantai (pasangan tests/kripto/test_jcs_lintas_implementasi.ts)
-- ============================================================================
-- Menegaskan bahwa fungsi SQL migrasi 004 menghasilkan string payload dan
-- hash rantai yang IDENTIK dengan verifikator TypeScript untuk entri fikstur
-- yang sama. Jalankan pada PostgreSQL yang sudah dimigrasi s/d 004:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/tests/test_jcs_rantai.sql
-- ============================================================================

DO $$
DECLARE
    v_payload TEXT;
    v_expected TEXT := '{"aksi":"BUAT_DRAF","entitas":"penyaluran","entitas_id":"d1111111-1111-1111-1111-111111111111","lembaga_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","nomor":1,"pelaku":"11111111-1111-1111-1111-111111111111","sebelum":null,"sesudah":{"catatan":"Zakat \"maal\" tahunan","nominal":800000,"status":"dibuat"},"waktu":"2026-10-27T03:00:00.000000Z"}';
    v_hash TEXT;
    v_expected_hash TEXT := '213b0cb2c833096d0b8713da453259dc700c6f29d89a2dd8f84b5b199042a65b';
BEGIN
    -- Payload dibangun dari nilai fikstur yang sama dengan uji TypeScript.
    -- Perhatikan: nominal ditulis 800000.00 (skala NUMERIC tersimpan) dan
    -- harus terserialisasi menjadi 800000 persis seperti JCS/ECMAScript.
    v_payload := payload_rantai_jcs(
        'BUAT_DRAF',
        'penyaluran',
        'd1111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        1,
        '11111111-1111-1111-1111-111111111111'::uuid,
        NULL,
        '{"nominal": 800000.00, "status": "dibuat", "catatan": "Zakat \"maal\" tahunan"}'::jsonb,
        '2026-10-27T03:00:00+00'::timestamptz
    );

    IF v_payload <> v_expected THEN
        RAISE EXCEPTION 'PAYLOAD JCS SQL TIDAK COCOK.%Terbangun: % %Seharusnya: %', chr(10), v_payload, chr(10), v_expected;
    END IF;

    -- Hash rantai entri pertama: sha256(utf8(payload) || 32 byte nol)
    v_hash := encode(digest(convert_to(v_payload, 'UTF8') || decode(repeat('00', 32), 'hex'), 'sha256'), 'hex');
    IF v_hash <> v_expected_hash THEN
        RAISE EXCEPTION 'HASH RANTAI SQL TIDAK COCOK: % (seharusnya %)', v_hash, v_expected_hash;
    END IF;

    RAISE NOTICE 'LULUS: payload JCS SQL identik dengan kontrak TypeScript, hash rantai cocok.';
END $$;
