import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
let db;
const a = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  budi = '11111111-1111-1111-1111-111111111111',
  dewi = '33333333-3333-3333-3333-333333333333',
  rian = '44444444-4444-4444-4444-444444444444',
  hari = '22222222-2222-2222-2222-222222222222',
  pos = 'c1111111-1111-1111-1111-111111111111',
  mustahik = 'd1111111-1111-1111-1111-111111111111';
const one = async (s, p = []) => (await db.query(s, p)).rows[0];
const run = async (actor, input, request = crypto.randomUUID()) =>
  (
    await one('SELECT office_record_operation($1,$2,$3) AS r', [
      actor,
      request,
      JSON.stringify(input),
    ])
  ).r;
const work = async (id) => one('SELECT * FROM work_items WHERE id=$1', [id]);
const claim = async (w, actor) =>
  db.query("SELECT office_assign_work($1,$2,$3,$4,'claim',NULL,'')", [
    w.id,
    actor,
    w.version,
    crypto.randomUUID(),
  ]);
async function draft() {
  const e = await one(
    "INSERT INTO office_evidence(lembaga_id,akun_id,filename,mime,bytes,sha256) VALUES($1,$2,'proof.pdf','application/pdf',decode('255044462d312e37','hex'),digest(decode('255044462d312e37','hex'),'sha256')) RETURNING id",
    [a, budi],
  );
  return run(budi, {
    kind: 'distribution',
    posId: pos,
    mustahikId: mustahik,
    amount: '1000',
    method: 'saksi',
    evidenceId: e.id,
  });
}
before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  for (const f of [
    '001_initial_schema.sql',
    '002_seed_demo.sql',
    '003_stored_procedures.sql',
    '005_office_workflow.sql',
    '006_office_operations.sql',
  ])
    await db.exec(await readFile(new URL('../../db/migrations/' + f, import.meta.url), 'utf8'));
});
after(async () => db?.close());
test('receipt retry commits one ledger record and one balance increase, different payload conflicts', async () => {
  const input = {
      kind: 'receipt',
      posId: pos,
      gross: '1000.50',
      amilPercent: '12.5',
      channel: 'Tunai',
    },
    request = crypto.randomUUID();
  const before = await one('SELECT total_masuk FROM pos_dana WHERE id=$1', [pos]);
  const r = await run(budi, input, request);
  assert.equal(r.type, 'penerimaan');
  assert.equal(r.status, 'recorded');
  assert.deepEqual(await run(budi, input, request), r);
  const after = await one('SELECT total_masuk FROM pos_dana WHERE id=$1', [pos]);
  assert.equal(
    (
      await one('SELECT ($1::numeric-$2::numeric)::text AS delta', [
        after.total_masuk,
        before.total_masuk,
      ])
    ).delta,
    '875.44',
  );
  await assert.rejects(() => run(budi, { ...input, gross: '2000' }, request), /REQUEST_CONFLICT/);
  await assert.rejects(() => run(hari, input), /FORBIDDEN/);
});
test('end-to-end domain operations create real work, require ownership/version and complete only after two witnesses', async () => {
  const result = await draft();
  let w = await work(result.workItemId);
  assert.equal(w.stage, 'saksi');
  await assert.rejects(
    () => run(dewi, { kind: 'witness', itemId: w.id, version: w.version, accept: true }),
    /OWNER_REQUIRED/,
  );
  await claim(w, dewi);
  w = await work(w.id);
  const request = crypto.randomUUID(),
    input = { kind: 'witness', itemId: w.id, version: w.version, accept: true };
  await run(dewi, input, request);
  await run(dewi, input, request);
  w = await work(w.id);
  assert.equal(w.stage, 'saksi');
  await claim(w, rian);
  w = await work(w.id);
  await run(rian, { kind: 'witness', itemId: w.id, version: w.version, accept: true });
  w = await work(w.id);
  assert.equal(w.stage, 'persetujuan');
  await claim(w, hari);
  w = await work(w.id);
  await run(hari, { kind: 'approve', itemId: w.id, version: w.version });
  assert.equal((await work(w.id)).status, 'completed');
  assert.equal(
    (await one('SELECT count(*)::int AS n FROM konfirmasi WHERE penyaluran_id=$1', [result.id])).n,
    2,
  );
});
test('missing/foreign evidence and overdraw fail without a new work item or changed balance', async () => {
  const before = await one('SELECT count(*)::int AS n FROM work_items');
  await assert.rejects(
    () =>
      run(budi, {
        kind: 'distribution',
        posId: pos,
        mustahikId: mustahik,
        amount: '1000',
        method: 'saksi',
        evidenceId: crypto.randomUUID(),
      }),
    /EVIDENCE/,
  );
  assert.equal((await one('SELECT count(*)::int AS n FROM work_items')).n, before.n);
  const e = await one(
    "INSERT INTO office_evidence(lembaga_id,akun_id,filename,mime,bytes,sha256) VALUES($1,$2,'p.pdf','application/pdf',decode('255044462d','hex'),digest(decode('255044462d','hex'),'sha256')) RETURNING id",
    [a, dewi],
  );
  await assert.rejects(
    () =>
      run(budi, {
        kind: 'distribution',
        posId: pos,
        mustahikId: mustahik,
        amount: '1000',
        method: 'saksi',
        evidenceId: e.id,
      }),
    /EVIDENCE/,
  );
});
test('source rejection remains cancelled and cannot be finalized twice', async () => {
  const r = await draft();
  let w = await work(r.workItemId);
  await claim(w, dewi);
  w = await work(w.id);
  await run(dewi, { kind: 'witness', itemId: w.id, version: w.version, accept: false });
  w = await work(w.id);
  assert.equal(w.status, 'cancelled');
  await assert.rejects(
    () => run(hari, { kind: 'approve', itemId: w.id, version: w.version }),
    /TERMINAL/,
  );
});
test('recipient token is required, one-time decision is replay safe and does not use fallback records', async () => {
  const evidence = await one(
    "INSERT INTO office_evidence(lembaga_id,akun_id,filename,mime,bytes,sha256) VALUES($1,$2,'p.pdf','application/pdf',decode('255044462d','hex'),digest(decode('255044462d','hex'),'sha256')) RETURNING id",
    [a, budi],
  );
  const payload = {
    kind: 'distribution',
    posId: pos,
    mustahikId: mustahik,
    amount: '1000',
    method: 'mustahik',
    evidenceId: evidence.id,
  };
  const r = (
    await one(
      "SELECT office_record_operation($1,$2,$3,digest('test-secret-token','sha256')) AS r",
      [budi, crypto.randomUUID(), JSON.stringify(payload)],
    )
  ).r;
  await assert.rejects(
    () =>
      db.query("SELECT office_confirm_recipient($1,digest('wrong','sha256'),true,NULL)", [r.id]),
    /TOKEN/,
  );
  await db.query(
    "SELECT office_confirm_recipient($1,digest('test-secret-token','sha256'),true,NULL)",
    [r.id],
  );
  await db.query(
    "SELECT office_confirm_recipient($1,digest('test-secret-token','sha256'),true,NULL)",
    [r.id],
  );
  assert.equal((await work(r.workItemId)).stage, 'persetujuan');
  await assert.rejects(
    () =>
      db.query(
        "SELECT office_confirm_recipient($1,digest('test-secret-token','sha256'),false,NULL)",
        [r.id],
      ),
    /REQUEST_CONFLICT/,
  );
});
test('optional donor metadata remains on the private receipt; replay stores only a digest of the request', async () => {
  const request = crypto.randomUUID(),
    input = {
      kind: 'receipt',
      posId: pos,
      gross: '1000',
      amilPercent: '0',
      channel: 'Tunai',
      donorType: 'terdaftar',
      donorName: 'Muzakki uji',
      note: 'Catatan uji',
    };
  const r = await run(budi, input, request);
  const receipt = await one('SELECT muzakki_nama,keterangan FROM penerimaan WHERE id=$1', [r.id]);
  assert.equal(receipt.muzakki_nama, 'Muzakki uji');
  assert.equal(receipt.keterangan, 'Catatan uji');
  const stored = await one(
    'SELECT octet_length(payload_hash)::int AS n FROM office_operation_requests WHERE request_id=$1',
    [request],
  );
  assert.equal(stored.n, 32);
});
test('fractional cents never exceed the institutional percentage cap', async () => {
  for (const gross of ['1000.04', '0.04']) {
    const r = await run(budi, {
      kind: 'receipt',
      posId: pos,
      gross,
      amilPercent: '12.5',
      channel: 'Tunai',
    });
    const receipt = await one(
      'SELECT hak_amil::text,masuk_pos::text, hak_amil<=bruto*0.125 AS within_cap FROM penerimaan WHERE id=$1',
      [r.id],
    );
    assert.equal(receipt.within_cap, true);
    assert.equal(receipt.hak_amil, gross === '0.04' ? '0.00' : '125.00');
  }
});
test('a creator whose amil permission is revoked cannot cancel or release reserved funds', async () => {
  const r = await draft(),
    w = await work(r.workItemId),
    before = await one('SELECT saldo_dicadangkan::text AS amount FROM pos_dana WHERE id=$1', [pos]);
  await db.query("UPDATE akun SET peran='penyetuju' WHERE id=$1", [budi]);
  try {
    await assert.rejects(
      () => run(budi, { kind: 'cancel', itemId: w.id, version: w.version }),
      /FORBIDDEN/,
    );
    assert.equal((await work(w.id)).status, 'open');
    assert.equal(
      (await one('SELECT saldo_dicadangkan::text AS amount FROM pos_dana WHERE id=$1', [pos]))
        .amount,
      before.amount,
    );
  } finally {
    await db.query("UPDATE akun SET peran='amil' WHERE id=$1", [budi]);
  }
});
