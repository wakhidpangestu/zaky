-- 009: Deny-by-default untuk seluruh skema public.
-- Migrasi 004-006 sudah mengunci tabel office; tabel inti 001-008 (akun, mustahik, penyaluran,
-- audit_log, hash_harian, ...) belum. Di Supabase, peran anon/authenticated mendapat grant
-- bawaan sehingga tabel tersebut terbuka lewat Data API (PostgREST) bagi pemegang anon key.
-- Aplikasi memakai peran pemilik tabel (server-side pg.Pool) yang tidak terkena RLS,
-- jadi RLS tanpa policy + REVOKE menutup akses langsung tanpa mengubah perilaku aplikasi.
BEGIN;
DO $$ DECLARE rel regclass; f regprocedure; r text; BEGIN
  FOR rel IN
    SELECT c.oid::regclass FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', rel);
    EXECUTE format('REVOKE ALL ON %s FROM PUBLIC', rel);
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('REVOKE ALL ON %s FROM %I', rel, r); END IF;
    END LOOP;
  END LOOP;

  FOR rel IN
    SELECT c.oid::regclass FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace AND c.relkind = 'S'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM PUBLIC', rel);
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('REVOKE ALL ON SEQUENCE %s FROM %I', rel, r); END IF;
    END LOOP;
  END LOOP;

  -- Fungsi milik ekstensi (pgcrypto dsb.) tidak disentuh.
  FOR f IN
    SELECT p.oid::regprocedure FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I', f, r); END IF;
    END LOOP;
  END LOOP;

  -- Objek yang dibuat kemudian oleh peran ini juga tertutup untuk peran publik Supabase.
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM %I', r);
    END IF;
  END LOOP;
END $$;
COMMIT;
