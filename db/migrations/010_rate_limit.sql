-- 010: Pembatas laju bersama di PostgreSQL.
-- Pembatas di memori proses hanya berlaku per instans dan hilang saat cold start,
-- sehingga pada serverless (Vercel) penyerang bisa melampauinya. Tabel ini dibagi
-- semua instans. Kunci disimpan sebagai SHA-256 (IP dan email tidak tersimpan mentah).
BEGIN;
CREATE TABLE rate_limit (
  kunci bytea PRIMARY KEY CHECK (octet_length(kunci) = 32),
  jendela_mulai timestamptz NOT NULL,
  jumlah integer NOT NULL CHECK (jumlah >= 0),
  terblokir_sampai timestamptz
);
CREATE INDEX rate_limit_kedaluwarsa ON rate_limit (jendela_mulai);

-- Catat satu percobaan. Mengembalikan detik tunggu (0 = boleh lanjut).
CREATE FUNCTION rate_limit_hit(p_kunci bytea, p_batas integer, p_jendela_detik integer, p_blokir_detik integer)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE r rate_limit; v_now timestamptz := clock_timestamp();
BEGIN
  IF p_batas < 1 OR p_jendela_detik < 1 OR p_blokir_detik < 1 THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  INSERT INTO rate_limit (kunci, jendela_mulai, jumlah) VALUES (p_kunci, v_now, 0) ON CONFLICT (kunci) DO NOTHING;
  SELECT * INTO r FROM rate_limit WHERE kunci = p_kunci FOR UPDATE;
  IF r.terblokir_sampai > v_now THEN
    RETURN ceil(extract(epoch FROM r.terblokir_sampai - v_now))::integer;
  END IF;
  IF r.terblokir_sampai IS NOT NULL OR r.jendela_mulai <= v_now - make_interval(secs => p_jendela_detik) THEN
    r.jendela_mulai := v_now; r.jumlah := 0; r.terblokir_sampai := NULL;
  END IF;
  r.jumlah := r.jumlah + 1;
  IF r.jumlah > p_batas THEN r.terblokir_sampai := v_now + make_interval(secs => p_blokir_detik); END IF;
  UPDATE rate_limit SET jendela_mulai = r.jendela_mulai, jumlah = r.jumlah, terblokir_sampai = r.terblokir_sampai
  WHERE kunci = p_kunci;
  -- Bersihkan baris basi sesekali agar tabel tidak tumbuh tanpa batas.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit WHERE jendela_mulai < v_now - interval '1 day'
      AND (terblokir_sampai IS NULL OR terblokir_sampai < v_now);
  END IF;
  RETURN CASE WHEN r.jumlah > p_batas THEN p_blokir_detik ELSE 0 END;
END $$;

-- Sisa detik blokir tanpa mencatat percobaan.
CREATE FUNCTION rate_limit_sisa(p_kunci bytea) RETURNS integer LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT ceil(extract(epoch FROM terblokir_sampai - clock_timestamp()))::integer
                   FROM rate_limit WHERE kunci = p_kunci AND terblokir_sampai > clock_timestamp()), 0)
$$;

CREATE FUNCTION rate_limit_reset(p_kunci bytea) RETURNS void LANGUAGE sql AS $$
  DELETE FROM rate_limit WHERE kunci = p_kunci
$$;

ALTER TABLE rate_limit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rate_limit FROM PUBLIC;
REVOKE ALL ON FUNCTION rate_limit_hit(bytea, integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION rate_limit_sisa(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION rate_limit_reset(bytea) FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON rate_limit FROM %I', r);
      EXECUTE format('REVOKE ALL ON FUNCTION rate_limit_hit(bytea, integer, integer, integer) FROM %I', r);
      EXECUTE format('REVOKE ALL ON FUNCTION rate_limit_sisa(bytea) FROM %I', r);
      EXECUTE format('REVOKE ALL ON FUNCTION rate_limit_reset(bytea) FROM %I', r);
    END IF;
  END LOOP;
END $$;
COMMIT;
