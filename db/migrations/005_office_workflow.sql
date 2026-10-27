-- Additive operational workflow. Existing financial functions and hash audit stay authoritative.
BEGIN;
CREATE TABLE work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  reference_type text NOT NULL CHECK(reference_type IN ('penerimaan','penyaluran')),
  reference_id uuid NOT NULL,
  stage text NOT NULL CHECK(stage IN ('penerimaan','saksi','persetujuan','penyaluran','catatan')),
  status text NOT NULL CHECK(status IN ('open','completed','cancelled')),
  assigned_role text NOT NULL CHECK(assigned_role IN ('amil','penyetuju')),
  assigned_user_id uuid REFERENCES akun(id),
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  source_revision text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  completed_at timestamptz,
  UNIQUE(lembaga_id,reference_type,reference_id),
  UNIQUE(lembaga_id,id)
);
CREATE INDEX work_items_queue ON work_items(lembaga_id,status,stage,updated_at DESC);
CREATE TABLE work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  assigned_user_id uuid NOT NULL REFERENCES akun(id),
  assigned_role text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  ended_at timestamptz,
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE UNIQUE INDEX work_assignments_one_active ON work_assignments(work_item_id) WHERE ended_at IS NULL;
CREATE TABLE work_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  from_user_id uuid REFERENCES akun(id),
  to_user_id uuid REFERENCES akun(id),
  from_stage text NOT NULL,
  to_stage text NOT NULL,
  actor_id uuid REFERENCES akun(id),
  reason text NOT NULL CHECK(char_length(reason)<=500),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE TABLE work_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lembaga_id uuid NOT NULL,
  work_item_id uuid NOT NULL,
  type text NOT NULL,
  actor_id uuid REFERENCES akun(id),
  request_id uuid,
  request_payload jsonb,
  snapshot jsonb NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(lembaga_id,actor_id,request_id),
  FOREIGN KEY(lembaga_id,work_item_id) REFERENCES work_items(lembaga_id,id)
);
CREATE INDEX work_events_history ON work_events(lembaga_id,work_item_id,id DESC);
CREATE INDEX work_events_rate ON work_events(actor_id,created_at DESC);
CREATE TRIGGER work_events_append_only BEFORE UPDATE OR DELETE ON work_events FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE TRIGGER work_handoffs_append_only BEFORE UPDATE OR DELETE ON work_handoffs FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
CREATE TABLE office_presence (
  session_id uuid PRIMARY KEY,
  lembaga_id uuid NOT NULL REFERENCES lembaga(id),
  akun_id uuid NOT NULL REFERENCES akun(id),
  station text CHECK(station IN ('penerimaan','saksi','persetujuan','penyaluran','catatan')),
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX office_presence_active ON office_presence(lembaga_id,expires_at,akun_id);

CREATE FUNCTION office_eligible(p_work uuid,p_user uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_items w JOIN penyaluran p ON w.reference_type='penyaluran' AND p.id=w.reference_id AND p.lembaga_id=w.lembaga_id
    JOIN akun a ON a.id=p_user AND a.lembaga_id=w.lembaga_id
    JOIN unit u ON u.id=a.unit_id AND u.lembaga_id=a.lembaga_id
    JOIN lembaga l ON l.id=a.lembaga_id
    WHERE w.id=p_work AND w.status='open' AND p.kedaluwarsa_pada>clock_timestamp() AND a.aktif AND l.aktif AND a.peran=w.assigned_role
    AND CASE WHEN w.stage='penyaluran' THEN a.id=p.dibuat_oleh
      WHEN w.stage IN ('saksi','persetujuan') THEN
        a.id<>p.dibuat_oleh AND a.unit_id<>p.dibuat_unit
        AND NOT EXISTS(SELECT 1 FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi' AND (k.akun_saksi_id=a.id OR k.unit_saksi=a.unit_id))
        AND (w.stage<>'saksi' OR (SELECT count(*) FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi')<2)
      ELSE false END
  )
$$;

CREATE FUNCTION office_sync_penyaluran(p_id uuid) RETURNS void LANGUAGE plpgsql AS $$
DECLARE p penyaluran; w work_items; n work_items; v_stage text; v_status text; v_revision text;
BEGIN
  SELECT * INTO STRICT p FROM penyaluran WHERE id=p_id;
  v_stage:=CASE WHEN p.status IN ('tersalurkan','ditolak_penerima','dibatalkan','kedaluwarsa') THEN 'catatan'
    WHEN p.status='dikonfirmasi' THEN 'persetujuan'
    WHEN p.status IN ('dibuat','menunggu_konfirmasi') AND p.metode='saksi' THEN 'saksi' ELSE 'penyaluran' END;
  v_status:=CASE WHEN p.status='tersalurkan' THEN 'completed' WHEN p.status IN ('ditolak_penerima','dibatalkan','kedaluwarsa') THEN 'cancelled' ELSE 'open' END;
  v_revision:=p.status::text||':'||p.metode||':'||coalesce((SELECT string_agg(k.akun_saksi_id::text||':'||k.unit_saksi::text,',' ORDER BY k.akun_saksi_id) FROM konfirmasi k WHERE k.penyaluran_id=p.id AND k.jenis='saksi'),'');
  SELECT * INTO w FROM work_items WHERE lembaga_id=p.lembaga_id AND reference_type='penyaluran' AND reference_id=p.id FOR UPDATE;
  IF FOUND THEN
    IF w.source_revision=v_revision THEN RETURN; END IF;
    UPDATE work_assignments SET ended_at=clock_timestamp() WHERE work_item_id=w.id AND ended_at IS NULL;
    UPDATE work_items SET stage=v_stage,status=v_status,assigned_role=CASE WHEN v_stage='persetujuan' THEN 'penyetuju' ELSE 'amil' END,
      assigned_user_id=NULL,version=version+1,source_revision=v_revision,updated_at=clock_timestamp(),completed_at=CASE WHEN v_status<>'open' THEN clock_timestamp() END
      WHERE id=w.id RETURNING * INTO n;
    INSERT INTO work_handoffs(lembaga_id,work_item_id,from_user_id,from_stage,to_stage,reason)
      VALUES(p.lembaga_id,w.id,w.assigned_user_id,w.stage,v_stage,'Perubahan sumber transaksi');
  ELSE
    INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
      VALUES(p.lembaga_id,'penyaluran',p.id,v_stage,v_status,CASE WHEN v_stage='persetujuan' THEN 'penyetuju' ELSE 'amil' END,v_revision,CASE WHEN v_status<>'open' THEN clock_timestamp() END) RETURNING * INTO n;
  END IF;
  INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) VALUES(p.lembaga_id,n.id,CASE WHEN w.id IS NULL THEN 'created' ELSE 'source_changed' END,to_jsonb(n));
END $$;
CREATE FUNCTION office_source_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE n work_items;
BEGIN
  IF TG_TABLE_NAME='penerimaan' THEN
    INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
      VALUES(NEW.lembaga_id,'penerimaan',NEW.id,'catatan','completed','amil','recorded',clock_timestamp()) ON CONFLICT DO NOTHING RETURNING * INTO n;
    IF n.id IS NOT NULL THEN INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) VALUES(n.lembaga_id,n.id,'created',to_jsonb(n)); END IF;
  ELSIF TG_TABLE_NAME='konfirmasi' THEN
    PERFORM office_sync_penyaluran(NEW.penyaluran_id);
  ELSE
    PERFORM office_sync_penyaluran(NEW.id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER office_distribution AFTER INSERT OR UPDATE OF status,metode ON penyaluran FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
CREATE TRIGGER office_confirmation AFTER INSERT OR UPDATE ON konfirmasi FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
CREATE TRIGGER office_receipt AFTER INSERT ON penerimaan FOR EACH ROW EXECUTE FUNCTION office_source_trigger();
-- Backfill uses only persisted domain records, never browser/demo data.
SELECT office_sync_penyaluran(id) FROM penyaluran ORDER BY id;
INSERT INTO work_items(lembaga_id,reference_type,reference_id,stage,status,assigned_role,source_revision,completed_at)
  SELECT lembaga_id,'penerimaan',id,'catatan','completed','amil','recorded',dicatat_pada FROM penerimaan;
INSERT INTO work_events(lembaga_id,work_item_id,type,snapshot) SELECT lembaga_id,id,'created',to_jsonb(w) FROM work_items w WHERE reference_type='penerimaan';

CREATE FUNCTION office_assign_work(p_item uuid,p_actor uuid,p_version integer,p_request uuid,p_action text,p_target uuid,p_reason text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE a akun; w work_items; v_payload jsonb; e work_events; v_target uuid; v_old uuid;
BEGIN
  SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE'; END IF;
  IF p_request IS NULL OR p_version IS NULL OR p_version<1 OR p_action IS NULL OR p_action NOT IN ('claim','handoff','release') OR p_reason IS NULL OR length(p_reason)>500 OR p_reason~'[[:cntrl:]]' THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  IF p_action='handoff' AND (p_target IS NULL OR length(btrim(p_reason))=0) OR p_action<>'handoff' AND p_target IS NOT NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  v_payload:=jsonb_build_object('item',p_item,'version',p_version,'action',p_action,'target',p_target,'reason',p_reason);
  PERFORM pg_advisory_xact_lock(hashtext('office-request:'||p_actor::text));
  SELECT * INTO e FROM work_events WHERE lembaga_id=a.lembaga_id AND actor_id=p_actor AND request_id=p_request;
  IF FOUND THEN
    IF e.request_payload<>v_payload THEN RAISE EXCEPTION 'REQUEST_CONFLICT'; END IF;
    RETURN e.snapshot;
  END IF;
  IF (SELECT count(*) FROM work_events WHERE actor_id=p_actor AND created_at>clock_timestamp()-interval '60 seconds')>=30 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  -- Source lock precedes work lock, same direction as domain triggers.
  PERFORM 1 FROM penyaluran p JOIN work_items wi ON wi.reference_type='penyaluran' AND wi.reference_id=p.id WHERE wi.id=p_item AND wi.lembaga_id=a.lembaga_id FOR SHARE OF p;
  SELECT * INTO w FROM work_items WHERE id=p_item AND lembaga_id=a.lembaga_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF w.version<>p_version THEN RAISE EXCEPTION 'VERSION_CONFLICT'; END IF;
  IF w.status<>'open' THEN RAISE EXCEPTION 'TERMINAL'; END IF;
  v_old:=w.assigned_user_id;
  IF p_action='claim' THEN
    IF v_old IS NOT NULL THEN RAISE EXCEPTION 'ALREADY_ASSIGNED'; END IF;
    v_target:=p_actor;
  ELSE
    IF v_old IS DISTINCT FROM p_actor THEN RAISE EXCEPTION 'OWNER_REQUIRED'; END IF;
    IF p_action='handoff' AND p_target=p_actor THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
    v_target:=CASE WHEN p_action='handoff' THEN p_target END;
  END IF;
  IF p_action<>'release' AND NOT office_eligible(w.id,p_actor) THEN RAISE EXCEPTION 'INELIGIBLE'; END IF;
  IF v_target IS NOT NULL AND NOT office_eligible(w.id,v_target) THEN RAISE EXCEPTION 'INELIGIBLE'; END IF;
  UPDATE work_assignments SET ended_at=clock_timestamp() WHERE work_item_id=w.id AND ended_at IS NULL;
  IF v_target IS NOT NULL THEN INSERT INTO work_assignments(lembaga_id,work_item_id,assigned_user_id,assigned_role) VALUES(w.lembaga_id,w.id,v_target,w.assigned_role); END IF;
  UPDATE work_items SET assigned_user_id=v_target,version=version+1,updated_at=clock_timestamp() WHERE id=w.id RETURNING * INTO w;
  INSERT INTO work_handoffs(lembaga_id,work_item_id,from_user_id,to_user_id,from_stage,to_stage,actor_id,reason) VALUES(w.lembaga_id,w.id,v_old,v_target,w.stage,w.stage,p_actor,p_reason);
  INSERT INTO work_events(lembaga_id,work_item_id,type,actor_id,request_id,request_payload,snapshot,reason) VALUES(w.lembaga_id,w.id,p_action,p_actor,p_request,v_payload,to_jsonb(w),p_reason);
  RETURN to_jsonb(w);
END $$;

CREATE FUNCTION office_heartbeat(p_actor uuid,p_session uuid,p_station text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE a akun;
BEGIN
  SELECT a0.* INTO a FROM akun a0 JOIN lembaga l ON l.id=a0.lembaga_id JOIN unit u ON u.id=a0.unit_id AND u.lembaga_id=a0.lembaga_id WHERE a0.id=p_actor AND a0.aktif AND l.aktif;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACCOUNT_INACTIVE'; END IF;
  IF p_session IS NULL OR p_station IS NOT NULL AND p_station NOT IN ('penerimaan','saksi','persetujuan','penyaluran','catatan') THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('office-presence:'||p_actor::text));
  IF EXISTS(SELECT 1 FROM office_presence WHERE session_id=p_session AND akun_id<>p_actor) THEN RAISE EXCEPTION 'SESSION_OWNER'; END IF;
  -- Only sweep this actor; no per-heartbeat global table sweep.
  DELETE FROM office_presence WHERE akun_id=p_actor AND expires_at<clock_timestamp();
  IF NOT EXISTS(SELECT 1 FROM office_presence WHERE session_id=p_session) AND (SELECT count(*) FROM office_presence WHERE akun_id=p_actor)>=4 THEN RAISE EXCEPTION 'RATE_LIMIT'; END IF;
  INSERT INTO office_presence(session_id,lembaga_id,akun_id,station,expires_at) VALUES(p_session,a.lembaga_id,p_actor,p_station,clock_timestamp()+interval '60 seconds')
    ON CONFLICT(session_id) DO UPDATE SET station=EXCLUDED.station,last_seen_at=clock_timestamp(),expires_at=EXCLUDED.expires_at;
END $$;

-- No browser/Supabase direct access. Use the existing trusted server DB role.
DO $$ DECLARE t text; r text; f regprocedure; BEGIN
  FOREACH t IN ARRAY ARRAY['work_items','work_assignments','work_handoffs','work_events','office_presence'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON %I FROM %I',t,r); END IF;
    END LOOP;
  END LOOP;
  FOR f IN SELECT oid::regprocedure FROM pg_proc WHERE proname IN ('office_eligible','office_sync_penyaluran','office_source_trigger','office_assign_work','office_heartbeat') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON FUNCTION %s FROM %I',f,r); END IF;
    END LOOP;
  END LOOP;
END $$;
COMMIT;
