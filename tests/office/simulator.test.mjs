import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  simRole,
  myQueue,
  requestProblem,
  evidenceProblem,
  createWalker,
  walk,
  walkToTarget,
  blocked,
  nearStation,
  DESK_FRONT,
  PELAYANAN_UNIT,
} from '../../src/lib/office/simulator.ts';
import {
  createWorld,
  tick,
  act,
  viewFor,
  verifyChain,
  transactions,
  SimError,
} from '../../src/lib/office/sim-world.ts';

const NOW = Date.UTC(2026, 9, 28, 3);
const budi = { id: 'budi', nama: 'Amil Budi', unitId: PELAYANAN_UNIT, role: 'petugas' };
const dewi = { id: 'dewi', nama: 'Saksi Dewi', unitId: 'u3', role: 'saksi' };
const rian = { id: 'rian', nama: 'Saksi Rian', unitId: 'u4', role: 'saksi' };
const hari = { id: 'hari', nama: 'Penyetuju Hari', unitId: 'u2', role: 'penyetuju' };
const world = () => createWorld(NOW, 11);
const eligible = (w, o = {}) => {
  const r = { id: w.nextId++, name: 'Uji', asnaf: 'Fakir', registered: true, evidence: true, nominal: 500_000, at: NOW, ...o };
  w.requests.push(r);
  return r;
};

test('roles come from the account: service unit receives, other amil witness', () => {
  assert.equal(simRole({ peran: 'amil', unitId: PELAYANAN_UNIT }), 'petugas');
  assert.equal(simRole({ peran: 'amil', unitId: 'u3333333-3333-3333-3333-333333333333' }), 'saksi');
  assert.equal(simRole({ peran: 'penyetuju' }), 'penyetuju');
  assert.equal(simRole({ peran: 'admin' }), 'pengamat');
});

test('a new office has history, an intact hash chain and work waiting for the petugas', () => {
  const w = world();
  assert.ok(w.receipts.length > 30, 'seeded receipts');
  assert.equal(verifyChain(w.audit), 0);
  const v = viewFor(w, budi, NOW);
  assert.ok(myQueue(v, 'penerimaan') > 0);
  assert.equal(myQueue(viewFor(w, dewi, NOW), 'penerimaan'), 0, 'witness sees no receipt work');
  assert.ok(v.unread > 0, 'petugas is notified');
  assert.equal(viewFor(w, hari, NOW).unread, 0, 'approver has nothing yet');
});

test('accounts can only act on their own desk', () => {
  const w = world();
  const id = w.deposits[0].id;
  assert.throws(() => act(w, dewi, { type: 'receive', id, fund: 'zakat' }), SimError);
  assert.throws(() => act(w, hari, { type: 'receive', id, fund: 'zakat' }), SimError);
  assert.equal(w.deposits[0].id, id, 'queue untouched by refused actions');
});

test('a receipt books the right fund, closes its notification and adds a transaction', () => {
  const w = world();
  const d = w.deposits[0];
  const fund = d.jenis === 'Infak' ? 'infak' : 'zakat';
  const before = w.funds[fund];
  const r = act(w, budi, { type: 'receive', id: d.id, fund }, NOW + 1);
  assert.equal(r.ok, true);
  assert.ok(w.funds[fund] > before);
  assert.equal(w.notices.find((n) => n.ref === `deposit:${d.id}`).done, true);
  assert.equal(transactions(w)[0].ref, `deposit:${d.id}`);
  assert.equal(transactions(w)[0].hash, w.audit.at(-1).hash);
  assert.throws(() => act(w, budi, { type: 'receive', id: d.id, fund }), /sudah dilayani/);
});

test('full chain: draft, two different witnesses, approval, published record with hash', () => {
  const w = world();
  const r = eligible(w);
  assert.equal(requestProblem(r, w.funds.zakat), null);
  assert.equal(act(w, budi, { type: 'distribute', id: r.id, choice: 'draft' }, NOW).ok, true);
  const c = w.cases.find((x) => x.id === r.id);
  c.receiptNominal = c.nominal;
  c.signed = true;
  c.confirmedNominal = c.nominal;
  assert.equal(evidenceProblem(c), null);
  assert.equal(viewFor(w, dewi, NOW).unread > 0, true, 'witnesses notified');
  act(w, dewi, { type: 'witness', id: c.id, choice: 'confirm' }, NOW);
  assert.throws(() => act(w, dewi, { type: 'witness', id: c.id, choice: 'confirm' }), /sudah bersaksi/);
  assert.equal(c.stage, 'saksi', 'one witness is not enough');
  act(w, rian, { type: 'witness', id: c.id, choice: 'confirm' }, NOW);
  assert.equal(c.stage, 'persetujuan');
  assert.ok(viewFor(w, hari, NOW).unread > 0, 'approver notified');
  const reserved = w.funds.reserved;
  const res = act(w, hari, { type: 'approve', id: c.id, choice: 'approve' }, NOW + 5);
  assert.equal(res.ok, true);
  assert.equal(c.stage, 'terbit');
  assert.match(c.code, /^[A-Z0-9]{12}$/);
  assert.equal(c.hash, w.audit.at(-1).hash);
  assert.equal(w.funds.reserved, reserved - c.nominal);
  assert.equal(viewFor(w, hari, NOW).unread, 0, 'finished task is no longer unread');
  assert.deepEqual(c.history.map((h) => h.role), ['petugas', 'saksi', 'saksi', 'penyetuju']);
  assert.equal(verifyChain(w.audit), 0);
});

test('bad evidence and changed amounts are caught and release the reserved money', () => {
  const w = world();
  const r = eligible(w);
  act(w, budi, { type: 'distribute', id: r.id, choice: 'draft' });
  const c = w.cases.find((x) => x.id === r.id);
  c.signed = false;
  const zakat = w.funds.zakat;
  assert.equal(act(w, dewi, { type: 'witness', id: c.id, choice: 'reject' }).ok, true);
  assert.equal(c.stage, 'ditolak');
  assert.equal(w.funds.zakat, zakat + c.nominal);
  const r2 = eligible(w);
  act(w, budi, { type: 'distribute', id: r2.id, choice: 'draft' });
  const c2 = w.cases.find((x) => x.id === r2.id);
  Object.assign(c2, { receiptNominal: c2.nominal, signed: true, confirmedNominal: c2.nominal + 100_000 });
  act(w, dewi, { type: 'witness', id: c2.id, choice: 'confirm' });
  act(w, rian, { type: 'witness', id: c2.id, choice: 'confirm' });
  assert.equal(act(w, hari, { type: 'approve', id: c2.id, choice: 'approve' }).ok, false);
  assert.equal(c2.stage, 'dikembalikan');
});

test('ineligible requests cannot become drafts', () => {
  const w = world();
  const r = eligible(w, { asnaf: 'Pedagang mampu' });
  assert.equal(act(w, budi, { type: 'distribute', id: r.id, choice: 'draft' }).ok, false);
  assert.equal(w.cases.some((c) => c.id === r.id), false);
  const r2 = eligible(w, { evidence: false });
  assert.equal(act(w, budi, { type: 'distribute', id: r2.id, choice: 'reject' }).ok, true);
});

test('reading notifications is per account and tampering breaks the audit chain', () => {
  const w = world();
  act(w, budi, { type: 'read', id: 'all' });
  assert.equal(viewFor(w, budi, NOW).unread, 0);
  const seq = w.audit[5].seq;
  w.audit[5].detail = 'diubah';
  assert.equal(verifyChain(w.audit), seq);
});

test('visitors keep arriving up to the queue limit', () => {
  const w = world();
  const deposits = w.deposits.length;
  tick(w, NOW + 41_000);
  assert.equal(w.deposits.length, deposits + 1);
  tick(w, NOW + 3_600_000);
  assert.ok(w.deposits.length <= 4 && w.requests.length <= 3);
});

test('walls block movement except through the side door', () => {
  assert.equal(blocked(7.05, 0.5), true);
  assert.equal(blocked(7.05, 3), false);
  const g = createWalker();
  g.player = { x: 5, z: 0.5, facing: 0, moving: false };
  for (let i = 0; i < 100; i++) walk(g, 1, 0, 0.1);
  assert.ok(g.player.x < 7, 'wall stops the player');
  g.player = { x: 2, z: 1, facing: 0, moving: false };
  g.target = { ...DESK_FRONT.saksi };
  for (let i = 0; i < 1000 && g.target; i++) walkToTarget(g, 0.1);
  assert.equal(nearStation(g), 'saksi');
});

test('dashboard layout is per account, keeps known cards and never records audit', async () => {
  const { normalizeLayout, DASHBOARD_CARDS } = await import('../../src/lib/office/simulator.ts');
  const clean = normalizeLayout({ order: ['audit', 'audit', 'bogus', 'saldo'], hidden: ['tim', 'nope'] });
  assert.deepEqual(clean.order.slice(0, 2), ['audit', 'saldo']);
  assert.equal(clean.order.length, DASHBOARD_CARDS.length, 'missing cards are appended');
  assert.deepEqual(clean.hidden, ['tim']);
  const w = world();
  const audit = w.audit.length;
  act(w, budi, { type: 'layout', layout: { order: ['tim', 'saldo'], hidden: ['akses'] } });
  assert.equal(w.audit.length, audit);
  assert.equal(viewFor(w, budi, NOW).layout.order[0], 'tim');
  assert.equal(viewFor(w, dewi, NOW).layout.order[0], DASHBOARD_CARDS[0], 'other accounts keep theirs');
  assert.equal(w.scores.budi, undefined, 'preferences do not count as work');
});
