import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
let db;
const institution='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const budi='11111111-1111-1111-1111-111111111111',hari='22222222-2222-2222-2222-222222222222',dewi='33333333-3333-3333-3333-333333333333',rian='44444444-4444-4444-4444-444444444444';
const one=async(sql,args=[])=>(await db.query(sql,args)).rows[0];
const read=async id=>one('SELECT * FROM work_items WHERE reference_id=$1',[id]);
const mutate=async(w,who,action='claim',target=null,requestId=crypto.randomUUID(),reason='Alih tugas')=>one('SELECT office_assign_work($1,$2,$3,$4,$5,$6,$7) AS result',[w.id,who,w.version,requestId,action,target,reason]);
async function draft(){return (await one("SELECT buat_draf_penyaluran($1,'c1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','fakir',1000,'saksi',$2,'a1111111-1111-1111-1111-111111111111','test/proof',decode(repeat('ab',32),'hex')) AS id",[institution,budi])).id;}
before(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  for(const file of ['001_initial_schema.sql','002_seed_demo.sql','003_stored_procedures.sql','005_office_workflow.sql'])await db.exec(await readFile(new URL('../../db/migrations/'+file,import.meta.url),'utf8'));
  // The seed starts every pos at zero; fund Zakat Maal through a real receipt so drafts can reserve.
  await db.query("SELECT catat_penerimaan($1,'c1111111-1111-1111-1111-111111111111',200000,0,'tunai',$2,'Modal uji') AS id",[institution,budi]);
});
after(async()=>{await db?.close();});
test('valid domain draft creates one persistent work item; failed balance operation creates none',async()=>{
  const id=await draft(),w=await read(id);assert.equal(w.stage,'saksi');assert.equal(w.status,'open');assert.equal(w.version,1);
  const before=await one('SELECT count(*)::int AS n FROM work_items');
  await assert.rejects(()=>db.query("SELECT buat_draf_penyaluran($1,'c1111111-1111-1111-1111-111111111111','d1111111-1111-1111-1111-111111111111','fakir',999999999,'saksi',$2,'a1111111-1111-1111-1111-111111111111','test/proof',decode('ab','hex'))",[institution,budi]),/BALANCE/);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_items')).n,before.n);
});
test('receipt is recorded as completed without introducing a witness approval or another ledger entry',async()=>{
  const receipt=await one("SELECT catat_penerimaan($1,'c1111111-1111-1111-1111-111111111111',1000,125,'tunai',$2) AS id",[institution,budi]);
  const w=await read(receipt.id);assert.equal(w.reference_type,'penerimaan');assert.equal(w.stage,'catatan');assert.equal(w.status,'completed');
  assert.equal((await one('SELECT count(*)::int AS n FROM penerimaan WHERE id=$1',[receipt.id])).n,1);
  await assert.rejects(()=>mutate(w,dewi),/TERMINAL/);
});
test('competing versions allow one claim and reject the stale contender',async()=>{
  const w=await read(await draft());
  const outcomes=await Promise.allSettled([mutate(w,dewi),mutate(w,rian)]);
  assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(outcomes.filter(r=>r.status==='rejected').length,1);
  assert.match(outcomes.find(r=>r.status==='rejected').reason.message,/VERSION_CONFLICT/);
});
test('claim, idempotent retry, mismatched replay and stale version preserve single owner',async()=>{
  const w=await read(await draft()),request=crypto.randomUUID();
  const a=await mutate(w,dewi,'claim',null,request);assert.equal(a.result.assigned_user_id,dewi);assert.equal(a.result.version,2);
  assert.deepEqual((await mutate(w,dewi,'claim',null,request)).result,a.result);
  await assert.rejects(()=>mutate(w,dewi,'release',null,request),/REQUEST_CONFLICT/);
  await assert.rejects(()=>mutate(w,rian),/VERSION_CONFLICT/);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_assignments WHERE work_item_id=$1 AND ended_at IS NULL',[w.id])).n,1);
});
test('only owner can hand off; handoff retains history and cannot target maker or wrong role',async()=>{
  let w=await read(await draft());await mutate(w,dewi);w=await read(w.reference_id);
  await assert.rejects(()=>mutate(w,rian,'handoff',rian),/OWNER_REQUIRED/);
  await assert.rejects(()=>mutate(w,dewi,'handoff',budi),/INELIGIBLE/);
  await assert.rejects(()=>mutate(w,dewi,'handoff',hari),/INELIGIBLE/);
  await mutate(w,dewi,'handoff',rian);w=await read(w.reference_id);assert.equal(w.assigned_user_id,rian);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_assignments WHERE work_item_id=$1',[w.id])).n,2);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_handoffs WHERE work_item_id=$1 AND from_user_id=$2 AND to_user_id=$3',[w.id,dewi,rian])).n,1);
  await mutate(w,rian,'release');assert.equal((await read(w.reference_id)).assigned_user_id,null);
});
test('cross institution, inactive accounts and same unit witnesses cannot claim',async()=>{
  const w=await read(await draft());
  await db.exec("INSERT INTO lembaga(id,nama,kunci_publik_ed25519) VALUES('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Lain',decode(repeat('00',32),'hex')); INSERT INTO unit(id,lembaga_id,nama) VALUES('b1111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Lain'); INSERT INTO akun(id,lembaga_id,unit_id,peran,nama,email,password_hash) VALUES('55555555-5555-5555-5555-555555555555','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','b1111111-1111-1111-1111-111111111111','amil','Lain','other@test','x')");
  await assert.rejects(()=>mutate(w,'55555555-5555-5555-5555-555555555555'),/NOT_FOUND/);
  await assert.rejects(()=>mutate(w,budi),/INELIGIBLE/);
  await db.query('UPDATE akun SET aktif=false WHERE id=$1',[dewi]);await assert.rejects(()=>mutate(w,dewi),/ACCOUNT_INACTIVE/);await db.query('UPDATE akun SET aktif=true WHERE id=$1',[dewi]);
});
test('first witness releases owner; second hands off to approver; source approval completes without double finance',async()=>{
  const id=await draft();let w=await read(id);await mutate(w,dewi);
  await db.query('SELECT konfirmasi_saksi($1,$2,true)',[id,dewi]);w=await read(id);assert.equal(w.stage,'saksi');assert.equal(w.assigned_user_id,null);
  await assert.rejects(()=>mutate(w,dewi),/INELIGIBLE/);await mutate(w,rian);
  await db.query('SELECT konfirmasi_saksi($1,$2,true)',[id,rian]);w=await read(id);assert.equal(w.stage,'persetujuan');assert.equal(w.assigned_user_id,null);
  await mutate(w,hari);const before=await one("SELECT total_tersalurkan FROM pos_dana WHERE id='c1111111-1111-1111-1111-111111111111'");
  await db.query('SELECT setujui_penyaluran($1,$2)',[id,hari]);w=await read(id);assert.equal(w.status,'completed');assert.equal(w.stage,'catatan');
  assert.equal(Number((await one("SELECT total_tersalurkan FROM pos_dana WHERE id='c1111111-1111-1111-1111-111111111111'")).total_tersalurkan)-Number(before.total_tersalurkan),1000);
  await assert.rejects(()=>mutate(w,hari),/TERMINAL/);await assert.rejects(()=>db.query('SELECT setujui_penyaluran($1,$2)',[id,hari]));
});
test('negative terminal and transaction rollback never report completion; history is append only',async()=>{
  const id=await draft();await db.query('SELECT konfirmasi_saksi($1,$2,false)',[id,dewi]);const w=await read(id);assert.equal(w.status,'cancelled');
  await assert.rejects(()=>db.query('DELETE FROM work_events WHERE work_item_id=$1',[w.id]),/append-only/);
  const before=(await one('SELECT count(*)::int AS n FROM work_items')).n;await db.exec('BEGIN');await draft();await db.exec('ROLLBACK');assert.equal((await one('SELECT count(*)::int AS n FROM work_items')).n,before);
});
test('presence TTL, multiple tabs and tenant ownership use database clock',async()=>{
  const sid=crypto.randomUUID();await db.query('SELECT office_heartbeat($1,$2,$3)',[dewi,sid,'saksi']);await db.query('SELECT office_heartbeat($1,$2,$3)',[dewi,sid,'catatan']);
  assert.equal((await one('SELECT count(*)::int AS n FROM office_presence WHERE akun_id=$1',[dewi])).n,1);
  await assert.rejects(()=>db.query('SELECT office_heartbeat($1,$2,$3)',[rian,sid,'saksi']),/SESSION_OWNER/);
  await db.query("UPDATE office_presence SET expires_at=clock_timestamp()-interval '1 second' WHERE session_id=$1",[sid]);
  assert.equal((await one('SELECT count(*)::int AS n FROM office_presence WHERE expires_at>clock_timestamp()')).n,0);
});
test('expired source cannot be newly claimed and inactive target cannot receive handoff',async()=>{
  const id=await draft();let w=await read(id);await mutate(w,dewi);w=await read(id);
  await db.query('UPDATE akun SET aktif=false WHERE id=$1',[rian]);await assert.rejects(()=>mutate(w,dewi,'handoff',rian),/INELIGIBLE/);await db.query('UPDATE akun SET aktif=true WHERE id=$1',[rian]);
  await mutate(w,dewi,'release');await db.query("UPDATE penyaluran SET kedaluwarsa_pada=clock_timestamp()-interval '1 second' WHERE id=$1",[id]);
  await assert.rejects(async()=>mutate(await read(id),rian),/INELIGIBLE/);
});
test('confirmed work remains claimable for approval after the confirmation deadline',async()=>{
  const id=await draft();await db.query('SELECT konfirmasi_saksi($1,$2,true)',[id,dewi]);await db.query('SELECT konfirmasi_saksi($1,$2,true)',[id,rian]);
  await db.query("UPDATE penyaluran SET kedaluwarsa_pada=clock_timestamp()-interval '1 second' WHERE id=$1",[id]);
  const w=await read(id);await mutate(w,hari);assert.equal((await read(id)).assigned_user_id,hari);
});
test('eligible colleague can recover an inactive owner, preserving history; cannot take valid ownership',async()=>{
  const id=await draft();await mutate(await read(id),dewi);let w=await read(id);
  await assert.rejects(()=>mutate(w,rian),/ALREADY_ASSIGNED/);
  await db.query('UPDATE akun SET aktif=false WHERE id=$1',[dewi]);await mutate(w,rian);w=await read(id);assert.equal(w.assigned_user_id,rian);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_assignments WHERE work_item_id=$1 AND ended_at IS NOT NULL',[w.id])).n,1);
  assert.equal((await one('SELECT count(*)::int AS n FROM work_handoffs WHERE work_item_id=$1 AND from_user_id=$2 AND to_user_id=$3',[w.id,dewi,rian])).n,1);
  await db.query('UPDATE akun SET aktif=true WHERE id=$1',[dewi]);
});
test('tenant transfer invalidates ownership and heartbeat replaces the stale tenant',async()=>{
  const id=await draft();await mutate(await read(id),dewi);const session=crypto.randomUUID();await db.query('SELECT office_heartbeat($1,$2,NULL)',[dewi,session]);
  await db.query("UPDATE akun SET lembaga_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',unit_id='b1111111-1111-1111-1111-111111111111' WHERE id=$1",[dewi]);
  await mutate(await read(id),rian);assert.equal((await read(id)).assigned_user_id,rian);
  await db.query('SELECT office_heartbeat($1,$2,NULL)',[dewi,session]);assert.equal((await one('SELECT lembaga_id FROM office_presence WHERE session_id=$1',[session])).lembaga_id,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  await db.query("UPDATE akun SET lembaga_id=$2,unit_id='a3333333-3333-3333-3333-333333333333' WHERE id=$1",[dewi,institution]);
});
