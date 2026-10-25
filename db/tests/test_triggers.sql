-- ============================================================================
-- db/tests/test_triggers.sql
-- Uji Trigger Pertahanan Append-Only pada Tabel audit_log
-- Sesuai Bab 6.6 dan Bab 12
-- ============================================================================

BEGIN;

-- 1. Uji Penolakan UPDATE pada audit_log
DO $$
BEGIN
  BEGIN
    UPDATE audit_log
       SET aksi = 'MANIPULASI_SUPERUSER'
     WHERE nomor = 1;
    RAISE EXCEPTION 'GAGAL: Trigger seharusnya menolak operasi UPDATE pada audit_log!';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE NOTICE '✓ Trigger audit_log_tanpa_ubah berhasil menggagalkan upaya UPDATE (ERRCODE P0001).';
  END;
END $$;

-- 2. Uji Penolakan DELETE pada audit_log
DO $$
BEGIN
  BEGIN
    DELETE FROM audit_log WHERE nomor = 1;
    RAISE EXCEPTION 'GAGAL: Trigger seharusnya menolak operasi DELETE pada audit_log!';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      RAISE NOTICE '✓ Trigger audit_log_tanpa_ubah berhasil menggagalkan upaya DELETE (ERRCODE P0001).';
  END;
END $$;

ROLLBACK;
