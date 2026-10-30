import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOperation, formatMoney, buildCalendar } from '../../src/lib/office/operations.ts';
import { validateEvidence } from '../../src/lib/office/evidence.ts';
const id = '11111111-1111-4111-8111-111111111111';
const receipt = {
  kind: 'receipt',
  requestId: id,
  posId: id,
  gross: '1000.50',
  amilPercent: '12.5',
  channel: 'Transfer tercatat',
};
test('money validation preserves decimal cents and rejects coercion, negative, overflow and extra control fields', () => {
  assert.equal(parseOperation(receipt).gross, '1000.50');
  for (const patch of [
    { gross: 1000 },
    { gross: 'NaN' },
    { gross: '-1' },
    { gross: '1.001' },
    { gross: '0' },
    { gross: '10000000000000000' },
    { amilPercent: '101' },
    { channel: '' },
    { actorId: id },
  ])
    assert.equal(parseOperation({ ...receipt, ...patch }), null);
  assert.equal(formatMoney('9007199254740991.99'), 'Rp 9.007.199.254.740.991,99');
});
test('workflow actions require current version and bounded decision; distribution requires actual upload ID', () => {
  assert.ok(
    parseOperation({ kind: 'witness', requestId: id, itemId: id, version: 1, accept: true }),
  );
  for (const patch of [{ version: 0 }, { accept: 'true' }, { itemId: 'demo' }])
    assert.equal(
      parseOperation({
        kind: 'witness',
        requestId: id,
        itemId: id,
        version: 1,
        accept: true,
        ...patch,
      }),
      null,
    );
  assert.equal(
    parseOperation({
      kind: 'distribution',
      requestId: id,
      posId: id,
      mustahikId: id,
      amount: '1000',
      method: 'saksi',
      evidenceId: 'fake.pdf',
    }),
    null,
  );
});
test('evidence validates real signatures, not extension or client-provided hash', () => {
  assert.equal(
    validateEvidence(new TextEncoder().encode('%PDF-1.7\nfixture'), 'application/pdf'),
    null,
  );
  assert.ok(validateEvidence(new TextEncoder().encode('<html>not a pdf'), 'application/pdf'));
  assert.ok(validateEvidence(new Uint8Array(0), 'image/png'));
  assert.ok(validateEvidence(new Uint8Array(5 * 1024 * 1024 + 1), 'application/pdf'));
  assert.ok(validateEvidence(new Uint8Array([255, 216, 255, 0]), 'image/svg+xml'));
});
test('calendar export escapes text and uses actual expiry instead of invented appointment times', () => {
  const text = buildCalendar({
    code: 'ZK1234567890',
    title: 'Tindak lanjut, amanah; A\nB',
    deadline: '2026-10-30T12:00:00Z',
    url: 'https://zaky.test/pekerjaan?record=' + id,
  });
  assert.match(text, /DTSTART:20261030T120000Z/);
  assert.match(text, /SUMMARY:Tindak lanjut\\, amanah\\; A\\nB/);
  assert.doesNotMatch(text, /undefined|NaN/);
});
test('receipt preserves optional muzakki data without allowing a blank registered donor', () => {
  assert.ok(
    parseOperation({
      ...receipt,
      donorType: 'terdaftar',
      donorName: 'Muzakki uji',
      note: 'Catatan uji',
    }),
  );
  assert.equal(parseOperation({ ...receipt, donorType: 'terdaftar', donorName: '' }), null);
});
test('PostgreSQL UUID identifiers from the seeded catalog remain valid without an RFC variant constraint', () => {
  assert.ok(parseOperation({ ...receipt, posId: 'c1111111-1111-1111-1111-111111111111' }));
  assert.ok(
    parseOperation({
      kind: 'witness',
      requestId: id,
      itemId: '11111111-1111-1111-1111-111111111111',
      version: 1,
      accept: true,
    }),
  );
  assert.equal(parseOperation({ ...receipt, posId: 'c1111111-1111-1111-1111-11111111111Z' }), null);
});
