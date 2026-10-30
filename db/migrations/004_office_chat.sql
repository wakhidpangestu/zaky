-- Optional demo collaboration. No financial schema or status is changed.
-- Apply only to a test database, using the trusted server role.
BEGIN;
CREATE TABLE IF NOT EXISTS office_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  akun_id uuid NOT NULL REFERENCES akun(id),
  client_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (lembaga_id, akun_id, client_id)
);
CREATE INDEX IF NOT EXISTS office_messages_room ON office_messages (lembaga_id, id DESC);
CREATE INDEX IF NOT EXISTS office_messages_rate ON office_messages (akun_id, created_at DESC);
ALTER TABLE office_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON office_messages FROM PUBLIC;
-- No direct client access policies. Only the server owner/BYPASSRLS role may
-- access this table after session/tenant checks in the Next.js route.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON office_messages FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON office_messages FROM authenticated;
  END IF;
END $$;
COMMENT ON TABLE office_messages IS 'Demo coordination; not transaction approval or audit evidence';
COMMIT;
