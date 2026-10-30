-- ============================================================================
-- db/tests/test_constraints.sql
-- Uji Invariant, Constraint CHECK, dan UNIQUE Langsung di PostgreSQL
-- Sesuai Bab 4, Bab 6, dan Bab 12
-- ============================================================================

BEGIN;

-- 1. Uji Invariant Saldo Pos Dana: Saldo Tersedia tidak boleh negatif
DO $$
BEGIN
  BEGIN
    INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan)
    VALUES (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Negatif', 100, -10, 50, 60);
    RAISE EXCEPTION 'GAGAL: Seharusnya ditolak oleh constraint saldo_tersedia_non_negatif!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ Constraint saldo_tersedia_non_negatif berhasil menolak nilai negatif.';
  END;
END $$;

-- 2. Uji Invariant Persamaan Keseimbangan Saldo: total_masuk = saldo_tersedia + saldo_dicadangkan + total_tersalurkan
DO $$
BEGIN
  BEGIN
    INSERT INTO pos_dana (id, lembaga_id, nama, total_masuk, saldo_tersedia, saldo_dicadangkan, total_tersalurkan)
    VALUES (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Invariant', 1000, 500, 200, 200); -- Total 900 != 1000
    RAISE EXCEPTION 'GAGAL: Seharusnya ditolak oleh constraint pos_dana_keseimbangan!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ Constraint pos_dana_keseimbangan berhasil menolak inkonsistensi saldo.';
  END;
END $$;

-- 3. Uji Invariant Penerimaan: bruto = hak_amil + masuk_pos
DO $$
DECLARE
  v_pos uuid := '11111111-1111-1111-1111-111111111111';
  v_akun uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  BEGIN
    INSERT INTO penerimaan (id, kode_unik, lembaga_id, pos_id, bruto, hak_amil, masuk_pos, kanal, dicatat_oleh)
    VALUES (gen_random_uuid(), 'ZKTESTINV001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_pos, 1000000, 200000, 700000, 'Bank', v_akun); -- 200rb + 700rb != 1jt
    RAISE EXCEPTION 'GAGAL: Seharusnya ditolak oleh constraint penerimaan_keseimbangan!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ Constraint penerimaan_keseimbangan berhasil menolak selisih nilai alokasi amil.';
  END;
END $$;

ROLLBACK;
