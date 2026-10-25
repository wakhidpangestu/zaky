-- ============================================================================
-- db/tests/test_stored_procedures.sql
-- Uji Fungsi SQL Inti (Reservasi Saldo, Segregasi, Log Append-Only)
-- Sesuai Bab 7 dan Bab 12
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_pos uuid := '11111111-1111-1111-1111-111111111111';
  v_mustahik uuid := '66666666-6666-6666-6666-666666666661';
  v_amil uuid := '11111111-1111-1111-1111-111111111111';
  v_unit_amil uuid := 'u1111111-1111-1111-1111-111111111111';
  v_penyetuju uuid := '22222222-2222-2222-2222-222222222222';
  v_unit_penyetuju uuid := 'u2222222-2222-2222-2222-222222222222';
  v_penyaluran_id uuid;
  v_saldo_awal numeric;
  v_cadangan_awal numeric;
  v_saldo_akhir numeric;
  v_cadangan_akhir numeric;
BEGIN
  -- 1. Baca saldo awal pos dana
  SELECT saldo_tersedia, saldo_dicadangkan INTO v_saldo_awal, v_cadangan_awal
    FROM pos_dana WHERE id = v_pos;

  -- 2. Uji Penolakan jika saldo tidak cukup
  BEGIN
    PERFORM buat_draf_penyaluran(
      v_pos, v_mustahik, 999999999999, v_amil, v_unit_amil, 'ZKFAILOVER01', now() + interval '3 days'
    );
    RAISE EXCEPTION 'GAGAL: Seharusnya ditolak karena saldo tersedia tidak cukup!';
  EXCEPTION
    WHEN SQLSTATE 'P0002' THEN
      RAISE NOTICE '✓ buat_draf_penyaluran menolak pengajuan yang melebihi saldo tersedia (ERRCODE P0002).';
  END;

  -- 3. Uji Draf Sah & Reservasi Saldo
  v_penyaluran_id := buat_draf_penyaluran(
    v_pos, v_mustahik, 1000000, v_amil, v_unit_amil, 'ZKTESTOK0001', now() + interval '3 days'
  );

  SELECT saldo_tersedia, saldo_dicadangkan INTO v_saldo_akhir, v_cadangan_akhir
    FROM pos_dana WHERE id = v_pos;

  IF v_saldo_akhir <> (v_saldo_awal - 1000000) OR v_cadangan_akhir <> (v_cadangan_awal + 1000000) THEN
    RAISE EXCEPTION 'GAGAL: Saldo dicadangkan tidak bertambah sesuai nominal draf!';
  END IF;

  RAISE NOTICE '✓ Draf berhasil dibuat dan saldo Rp 1.000.000 resmi direservasi secara atomik.';
END $$;

ROLLBACK;
