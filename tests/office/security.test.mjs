import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isStrongSecret, jwtSecretText, safeEqual } from '../../src/lib/secret.ts';
import { RateLimiter, clientIp } from '../../src/lib/rate-limit.ts';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');

test('secret: nilai bawaan, pendek, atau kosong ditolak', () => {
  assert.equal(isStrongSecret(undefined), false);
  assert.equal(isStrongSecret('short'), false);
  assert.equal(isStrongSecret('zaky-dev-secret-change-in-production'), false);
  assert.equal(isStrongSecret('x'.repeat(32)), true);
});

test('secret: jwtSecretText fail-closed tanpa env yang kuat', () => {
  const saved = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => jwtSecretText(), /JWT_SECRET/);
    process.env.JWT_SECRET = 'zaky-dev-secret-change-in-production';
    assert.throws(() => jwtSecretText(), /JWT_SECRET/);
    process.env.JWT_SECRET = 'k'.repeat(48);
    assert.equal(jwtSecretText(), 'k'.repeat(48));
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved;
  }
});

test('secret: tidak ada fallback secret yang tertinggal di kode sumber', () => {
  for (const f of ['src/lib/auth.ts', 'src/proxy.ts', 'src/app/api/office/operations/route.ts', 'src/lib/office/record-server.ts'])
    assert.doesNotMatch(read(f), /JWT_SECRET\s*(\|\||!)/, f);
});

test('sesi: token sah membawa exp; secret lain & alg lain ditolak', async () => {
  const { SignJWT } = await import('jose');
  const { verifySessionToken } = await import('../../src/lib/session-token.ts');
  const saved = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 's'.repeat(40);
  try {
    const claims = { userId: 'u', lembagaId: 'l', unitId: 'n', email: 'e@x.id', nama: 'N', peran: 'amil' };
    const sign = (secret, extra = claims) =>
      new SignJWT(extra).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret));
    const ok = await verifySessionToken(await sign('s'.repeat(40)));
    assert.equal(typeof ok?.exp, 'number', 'getOfficeActor membutuhkan exp');
    assert.equal(await verifySessionToken(await sign('zaky-dev-secret-change-in-production')), null);
    assert.equal(await verifySessionToken(await sign('s'.repeat(40), { ...claims, peran: 'root' })), null);
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved;
  }
});

test('safeEqual membandingkan isi, bukan panjang saja', () => {
  assert.equal(safeEqual('demo123', 'demo123'), true);
  assert.equal(safeEqual('demo124', 'demo123'), false);
  assert.equal(safeEqual('demo', 'demo123'), false);
});

test('rate limiter mengunci setelah batas lalu pulih setelah jendela', () => {
  const rl = new RateLimiter(3, 1000);
  const t = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(rl.hit('k', t + i), 0);
  assert.ok(rl.hit('k', t + 3) > 0, 'percobaan ke-4 dikunci');
  assert.ok(rl.retryAfter('k', t + 500) > 0, 'masih terkunci');
  assert.equal(rl.retryAfter('k', t + 2000), 0, 'pulih setelah blockMs');
  rl.reset('k');
  assert.equal(rl.hit('k', t + 2001), 0);
});

test('clientIp mengambil alamat pertama dari x-forwarded-for', () => {
  assert.equal(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' })), '203.0.113.9');
  assert.equal(clientIp(new Headers()), 'unknown');
});

test('header keamanan dikonfigurasi global', () => {
  const cfg = read('next.config.ts');
  for (const h of ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy'])
    assert.match(cfg, new RegExp(h), h);
  assert.match(cfg, /frame-ancestors 'none'/);
  assert.match(cfg, /poweredByHeader:\s*false/);
});

test('cron fail-closed dan kesaksian memakai waktu bertanda tangan', () => {
  const cron = read('src/app/api/cron/hash-harian/route.ts');
  assert.match(cron, /isStrongSecret\(cronSecret\)/);
  assert.match(cron, /safeEqual\(/);
  const ks = read('src/app/api/jaringan/kesaksian/route.ts');
  assert.match(ks, /diamati_pada/);
  assert.match(ks, /\.strict\(\)/);
  // Replay ditolak oleh kunci utama tabel kesaksian (berlaku lintas instans), bukan cache memori.
  const masuk = read('src/lib/jaringan/kesaksian-masuk.ts');
  assert.match(masuk, /MAX_SKEW_MS/);
  assert.match(masuk, /ON CONFLICT DO NOTHING RETURNING/);
});

test('penyaluran hanya lewat operasi kantor yang tervalidasi dan diaudit', () => {
  const src = read('src/app/api/office/operations/route.ts');
  assert.match(src, /requireOfficeOrigin/);
  assert.match(src, /parseOperation/);
  assert.match(src, /office_record_operation/);
});
