import assert from 'node:assert/strict';
import { testServer, base, ids } from './server.mjs';
const server = await testServer();
try {
  const cookies = Object.fromEntries(
    await Promise.all(Object.keys(ids).map(async (who) => [who, await server.cookie(who)])),
  );
  async function request(who, path, body, expected = 200, options = {}) {
    const response = await fetch(base + path, {
      ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
      ...options,
      headers: {
        ...(who ? { Cookie: cookies[who] } : {}),
        ...(body === undefined ? {} : { Origin: base, 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    return result;
  }
  const operation = (who, body, expected = 200) =>
    request(who, '/api/office/operations', { requestId: crypto.randomUUID(), ...body }, expected);
  await request(null, '/api/office/catalog', undefined, 401);
  await operation('budi', { kind: 'receipt', posId: 'invalid' }, 400);
  const catalog = await request('budi', '/api/office/catalog');
  assert.equal(catalog.actor.peran, 'amil');
  const posId = catalog.funds[0].id,
    mustahikId = catalog.recipients[0].id;
  await request('budi', '/api/office/operations', {}, 403, {
    headers: { Origin: 'https://foreign.invalid' },
  });
  const receiptBody = {
    requestId: crypto.randomUUID(),
    kind: 'receipt',
    posId,
    gross: '1000.04',
    amilPercent: '12.5',
    channel: 'Tunai',
    donorType: 'terdaftar',
    donorName: 'Private donor',
    note: 'Private note',
  };
  const receipt = await operation('budi', receiptBody);
  assert.deepEqual(await operation('budi', receiptBody), receipt);
  await operation('budi', { ...receiptBody, gross: '2000' }, 409);
  const detail = await request('budi', '/api/office/records/' + receipt.workItemId);
  assert.equal(detail.amilAmount, '125.00');
  assert.equal(detail.donorName, 'Private donor');
  const publicReceipt = await request(null, '/api/publik/verifikasi/' + receipt.code);
  assert.equal(publicReceipt.nominal, '1000.04');
  assert.ok(!JSON.stringify(publicReceipt).includes('Private'));
  console.log('PASS HTTP auth/origin, decimal receipt, immutable replay, private/public record');
  const pdf = '%PDF-1.7\ncontrolled HTTP fixture';
  const upload = async (body) =>
    request('budi', '/api/office/evidence', undefined, body === pdf ? 201 : 400, {
      method: 'POST',
      body,
      headers: { Origin: base, 'Content-Type': 'application/pdf', 'X-Filename': 'proof.pdf' },
    });
  await upload('<html>invalid</html>');
  const evidence = await upload(pdf);
  const distribution = await operation('budi', {
    kind: 'distribution',
    posId,
    mustahikId,
    amount: '1000',
    method: 'saksi',
    evidenceId: evidence.id,
  });
  async function record(who) {
    return request(who, '/api/office/records/' + distribution.workItemId);
  }
  async function assign(who, action, targetUserId = null) {
    const d = await record(who);
    return request(who, '/api/office/work-items', {
      requestId: crypto.randomUUID(),
      itemId: d.workItemId,
      version: d.version,
      action,
      targetUserId,
      reason: action === 'handoff' ? 'Pemindahan pengujian' : '',
    });
  }
  await assign('dewi', 'claim');
  await assign('dewi', 'handoff', ids.rian);
  for (const who of ['rian', 'dewi', 'hari']) {
    if (who !== 'rian') await assign(who, 'claim');
    const d = await record(who);
    await operation(who, {
      kind: who === 'hari' ? 'approve' : 'witness',
      itemId: d.workItemId,
      version: d.version,
      ...(who === 'hari' ? {} : { accept: true }),
    });
  }
  assert.equal((await record('budi')).workStatus, 'completed');
  console.log(
    'PASS HTTP actual evidence, assignment, handoff, two witnesses, independent approval',
  );
  const pending = await operation('budi', {
    kind: 'distribution',
    posId,
    mustahikId,
    amount: '1000',
    method: 'mustahik',
    evidenceId: evidence.id,
  });
  const reopened = await request('budi', '/api/office/records/' + pending.workItemId);
  assert.equal(reopened.confirmationUrl, pending.confirmationUrl);
  assert.equal(
    (await request('dewi', '/api/office/records/' + pending.workItemId)).confirmationUrl,
    undefined,
  );
  const token = new URL(pending.confirmationUrl, base).pathname.split('/').pop();
  await request(
    null,
    '/api/office/recipient-confirmation?record=' + pending.id + '&token=' + token,
  );
  await request(null, '/api/office/recipient-confirmation', {
    record: pending.id,
    token,
    accept: true,
  });
  await request(null, '/api/office/recipient-confirmation', {
    record: pending.id,
    token,
    accept: true,
  });
  await request(
    null,
    '/api/office/recipient-confirmation',
    { record: pending.id, token, accept: false },
    409,
  );
  assert.equal(
    (await request('budi', '/api/office/records/' + pending.workItemId)).confirmationUrl,
    undefined,
  );
  console.log(
    'PASS HTTP creator-only recovered mustahik link, one-time decision, replay, no stale link',
  );
  const sessionId = crypto.randomUUID();
  await request('dewi', '/api/office/presence', { sessionId, station: 'saksi' });
  const snapshot = await request('budi', '/api/office/work-items');
  assert.ok(snapshot.presence.some((p) => p.userId === ids.dewi));
  assert.ok(snapshot.financial.totals.available);
  const abort = new AbortController(),
    stream = await fetch(base + '/api/office/stream', {
      headers: { Cookie: cookies.budi },
      signal: abort.signal,
    });
  assert.equal(stream.status, 200);
  const reader = stream.body.getReader();
  let content = '';
  while (!content.includes('event: snapshot')) {
    const next = await reader.read();
    assert.equal(next.done, false);
    content += new TextDecoder().decode(next.value);
  }
  abort.abort();
  await request('dewi', '/api/office/presence', { sessionId, station: 'saksi' }, 200, {
    method: 'DELETE',
  });
  assert.ok(
    !(await request('budi', '/api/office/work-items')).presence.some((p) => p.userId === ids.dewi),
  );
  console.log('PASS HTTP realtime snapshot and source-backed presence join/leave');
  await server.db.query(
    `INSERT INTO mustahik(lembaga_id,nama_samaran,kabupaten,asnaf,telepon_hmac,consent_at) SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Penerima uji '||n,'Kota uji','fakir',decode(repeat('00',32),'hex'),clock_timestamp() FROM generate_series(1,105) n`,
  );
  assert.equal((await request('budi', '/api/office/catalog')).recipientsHasMore, true);
  const search = await request('budi', '/api/office/catalog?q=Penerima%20uji%20105');
  assert.equal(search.recipients.length, 1);
  assert.equal(search.recipients[0].nama, 'Penerima uji 105');
  console.log('PASS HTTP bounded recipient catalog and server-side search beyond the first page');

  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Zakat Tercatat/);
  console.log('EXPERIENCE_API_TESTS_OK');
} finally {
  await server.close();
}
