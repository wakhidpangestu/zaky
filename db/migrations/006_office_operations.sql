-- Authenticated recording UI: no payment gateway, no autonomous transfers.
BEGIN;
ALTER TABLE penerimaan ADD COLUMN muzakki_tipe text NOT NULL DEFAULT 'anonim' CHECK(muzakki_tipe IN ('anonim','terdaftar')), ADD COLUMN muzakki_nama text CHECK(length(muzakki_nama)<=160), ADD COLUMN keterangan text CHECK(length(keterangan)<=500);
CREATE TABLE office_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lembaga_id uuid NOT NULL REFERENCES lembaga(id), akun_id uuid NOT NULL REFERENCES akun(id),
 filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 180), mime text NOT NULL CHECK(mime IN('application/pdf','image/png','image/jpeg','image/webp')),
 bytes bytea NOT NULL CHECK(octet_length(bytes) BETWEEN 1 AND 5242880),sha256 bytea NOT NULL CHECK(octet_length(sha256)=32),created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX office_evidence_owner ON office_evidence(lembaga_id,akun_id,created_at);
CREATE TABLE office_operation_requests (
 lembaga_id uuid NOT NULL REFERENCES lembaga(id),actor_id uuid NOT NULL REFERENCES akun(id),request_id uuid NOT NULL,kind text NOT NULL CHECK(kind IN('receipt','distribution','witness','approve','cancel')),payload_hash bytea NOT NULL CHECK(octet_length(payload_hash)=32),result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(lembaga_id,actor_id,request_id)
);
CREATE INDEX office_operations_rate ON office_operation_requests(actor_id,created_at DESC);
CREATE TRIGGER office_operation_immutable BEFORE UPDATE OR DELETE ON office_operation_requests FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE FUNCTION office_record_operation(p_actor uuid,p_request uuid,p_payload jsonb,p_token_hash bytea DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a akun;w work_items;p penyaluran;e office_evidence;previous office_operation_requests;v_id uuid;v_kind text;v_code text;v_status text;v_result jsonb;v_gross numeric;v_percent numeric;v_amount numeric;v_asnaf asnaf_enum;
BEGIN
 SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE';END IF;
 IF p_request IS NULL OR jsonb_typeof(p_payload)<>'object' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
 PERFORM pg_advisory_xact_lock(hashtext('office-operation:'||p_actor::text));
 SELECT * INTO previous FROM office_operation_requests WHERE lembaga_id=a.lembaga_id AND actor_id=p_actor AND request_id=p_request;
 IF FOUND THEN IF previous.payload_hash<>digest(p_payload::text,'sha256') THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;RETURN previous.result;END IF;
 IF(SELECT count(*) FROM office_operation_requests WHERE actor_id=p_actor AND created_at>clock_timestamp()-interval '60 seconds')>=20 THEN RAISE EXCEPTION 'RATE_LIMIT';END IF;
 v_kind:=p_payload->>'kind';
 IF v_kind IN('receipt','distribution') THEN
  IF a.peran<>'amil' THEN RAISE EXCEPTION 'FORBIDDEN';END IF;
  IF v_kind='receipt' THEN
   v_gross:=(p_payload->>'gross')::numeric;v_percent:=(p_payload->>'amilPercent')::numeric;
   IF v_gross IS NULL OR v_gross<=0 OR v_percent IS NULL OR v_percent<0 OR v_percent>100 OR length(btrim(coalesce(p_payload->>'channel','')))=0 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   IF v_percent>(SELECT persen_hak_amil_maks FROM lembaga WHERE id=a.lembaga_id) THEN RAISE EXCEPTION 'HAK_AMIL_MELEBIHI_BATAS_LEMBAGA';END IF;
   -- Conservative rounding preserves the legacy unrounded institutional cap.
   v_id:=catat_penerimaan(a.lembaga_id,(p_payload->>'posId')::uuid,v_gross,trunc(v_gross*v_percent/100,2),p_payload->>'channel',a.id);
   IF p_payload->>'donorType'='terdaftar' AND length(btrim(coalesce(p_payload->>'donorName','')))=0 THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   UPDATE penerimaan SET muzakki_tipe=coalesce(p_payload->>'donorType','anonim'),muzakki_nama=CASE WHEN p_payload->>'donorType'='terdaftar' THEN p_payload->>'donorName' END,keterangan=p_payload->>'note' WHERE id=v_id;
   SELECT kode_unik::text INTO v_code FROM penerimaan WHERE id=v_id;v_status:='recorded';
  ELSE
   SELECT * INTO e FROM office_evidence WHERE id=(p_payload->>'evidenceId')::uuid AND lembaga_id=a.lembaga_id AND akun_id=a.id;
   IF NOT FOUND THEN RAISE EXCEPTION 'EVIDENCE_NOT_FOUND';END IF;
   SELECT asnaf INTO v_asnaf FROM mustahik WHERE id=(p_payload->>'mustahikId')::uuid AND lembaga_id=a.lembaga_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
   v_amount:=(p_payload->>'amount')::numeric;IF v_amount IS NULL OR v_amount<=0 OR coalesce(p_payload->>'method','') NOT IN('saksi','mustahik') THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   IF p_payload->>'method'='mustahik' AND (p_token_hash IS NULL OR octet_length(p_token_hash)<>32) THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
   v_id:=buat_draf_penyaluran(a.lembaga_id,(p_payload->>'posId')::uuid,(p_payload->>'mustahikId')::uuid,v_asnaf,v_amount,p_payload->>'method',a.id,a.unit_id,'office-evidence:'||e.id::text,e.sha256,p_token_hash);
   SELECT kode_unik::text,status::text INTO v_code,v_status FROM penyaluran WHERE id=v_id;
  END IF;
 ELSE
  IF v_kind IS NULL OR v_kind NOT IN('witness','approve','cancel') THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
  SELECT * INTO w FROM work_items WHERE id=(p_payload->>'itemId')::uuid AND lembaga_id=a.lembaga_id AND reference_type='penyaluran';
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';END IF;
  -- Preserve global financial lock order: fund -> distribution -> work -> audit head.
  PERFORM 1 FROM pos_dana f JOIN penyaluran d ON d.pos_id=f.id WHERE d.id=w.reference_id AND d.lembaga_id=a.lembaga_id FOR UPDATE OF f;
  SELECT * INTO p FROM penyaluran WHERE id=w.reference_id AND lembaga_id=a.lembaga_id FOR UPDATE;
  SELECT * INTO w FROM work_items WHERE id=w.id AND lembaga_id=a.lembaga_id FOR UPDATE;
  IF w.version IS DISTINCT FROM (p_payload->>'version')::integer THEN RAISE EXCEPTION 'VERSION_CONFLICT';END IF;
  IF w.status<>'open' THEN RAISE EXCEPTION 'TERMINAL';END IF;
  IF v_kind='cancel' THEN
   IF a.peran<>'amil' OR p.dibuat_oleh<>a.id THEN RAISE EXCEPTION 'FORBIDDEN';END IF;
   PERFORM batalkan_penyaluran(p.id,a.id);
  ELSE
   IF w.assigned_user_id IS DISTINCT FROM a.id THEN RAISE EXCEPTION 'OWNER_REQUIRED';END IF;
   IF NOT office_eligible(w.id,a.id) THEN RAISE EXCEPTION 'INELIGIBLE';END IF;
   IF v_kind='witness' THEN
    IF w.stage<>'saksi' OR jsonb_typeof(p_payload->'accept') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
    PERFORM konfirmasi_saksi(p.id,a.id,(p_payload->>'accept')::boolean);
   ELSE
    IF w.stage<>'persetujuan' THEN RAISE EXCEPTION 'INVALID_INPUT';END IF;
    PERFORM setujui_penyaluran(p.id,a.id);
   END IF;
  END IF;
  v_id:=p.id;SELECT kode_unik::text,status::text INTO v_code,v_status FROM penyaluran WHERE id=p.id;
 END IF;
 SELECT * INTO w FROM work_items WHERE lembaga_id=a.lembaga_id AND reference_id=v_id AND reference_type=CASE WHEN v_kind='receipt' THEN 'penerimaan' ELSE 'penyaluran' END;
 v_result:=jsonb_build_object('id',v_id,'type',CASE WHEN v_kind='receipt' THEN 'penerimaan' ELSE 'penyaluran' END,'code',v_code,'status',v_status,'workItemId',w.id,'createdAt',w.created_at,'expiresAt',(SELECT kedaluwarsa_pada FROM penyaluran WHERE id=v_id));
 INSERT INTO office_operation_requests(lembaga_id,actor_id,request_id,kind,payload_hash,result) VALUES(a.lembaga_id,a.id,p_request,v_kind,digest(p_payload::text,'sha256'),v_result);
 RETURN v_result;
END $$;
CREATE INDEX office_recipient_token ON konfirmasi(token_hash) WHERE jenis='mustahik';
CREATE FUNCTION office_confirm_recipient(p_id uuid,p_hash bytea,p_accept boolean,p_reason text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE p penyaluran;k konfirmasi;v_pos uuid;
BEGIN
 SELECT pos_id INTO v_pos FROM penyaluran WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'TOKEN_TIDAK_VALID';END IF;
 PERFORM 1 FROM pos_dana WHERE id=v_pos FOR UPDATE;
 SELECT * INTO p FROM penyaluran WHERE id=p_id FOR UPDATE;
 SELECT * INTO k FROM konfirmasi WHERE penyaluran_id=p_id AND jenis='mustahik' FOR UPDATE;
 IF NOT FOUND OR k.token_hash IS DISTINCT FROM p_hash OR p_accept IS NULL THEN RAISE EXCEPTION 'TOKEN_TIDAK_VALID';END IF;
 IF k.dipakai_pada IS NOT NULL THEN
  IF k.hasil IS DISTINCT FROM (CASE WHEN p_accept THEN 'menerima' ELSE 'menolak' END) THEN RAISE EXCEPTION 'REQUEST_CONFLICT';END IF;
  RETURN p.status::text;
 END IF;
 RETURN konfirmasi_mustahik(p_id,p_hash,p_accept,p_reason);
END $$;
ALTER TABLE office_evidence ENABLE ROW LEVEL SECURITY;ALTER TABLE office_operation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON office_evidence,office_operation_requests FROM PUBLIC;
REVOKE ALL ON FUNCTION office_record_operation(uuid,uuid,jsonb,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION office_confirm_recipient(uuid,bytea,boolean,text) FROM PUBLIC;
DO $$ DECLARE r text;BEGIN FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON office_evidence,office_operation_requests FROM %I',r);EXECUTE format('REVOKE ALL ON FUNCTION office_record_operation(uuid,uuid,jsonb,bytea) FROM %I',r);EXECUTE format('REVOKE ALL ON FUNCTION office_confirm_recipient(uuid,bytea,boolean,text) FROM %I',r);END IF;END LOOP;END $$;
COMMIT;
