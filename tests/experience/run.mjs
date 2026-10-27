import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { testServer, root, base } from './server.mjs';
const fixture = await testServer();
let browser;
const db = fixture.db,
  output = root + '.next/experience-results';
await mkdir(output, { recursive: true });
async function context(who, options = {}) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  if (who)
    await c.addCookies([
      {
        name: 'zaky-session',
        value: (await fixture.cookie(who)).slice('zaky-session='.length),
        url: base,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  return c;
}
const check = async (name, fn) => {
  await fn();
  console.log('PASS ' + name);
};
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE_PATH
      ? {
          executablePath: process.env.BROWSER_EXECUTABLE_PATH,
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--enable-unsafe-swiftshader',
            '--use-gl=angle',
            '--use-angle=swiftshader',
          ],
        }
      : {}),
  });
  const guest = await context(),
    gp = await guest.newPage();
  const runtimeErrors = [];
  gp.on('pageerror', (e) => runtimeErrors.push(e.message));
  await check('video layout, scroll chapters, native wizard focus and escape', async () => {
    await gp.goto(base);
    await gp.getByRole('heading', { level: 1, name: /Zakat Tercatat/ }).waitFor();
    await gp
      .getByRole('navigation', { name: 'Tahap perjalanan' })
      .getByRole('button', { name: /Penerimaan/ })
      .click();
    await gp.getByRole('heading', { level: 1, name: /Catat Penerimaan/ }).waitFor();
    await gp.getByRole('button', { name: 'Mulai mencatat', exact: true }).first().click();
    await gp.getByRole('dialog').waitFor();
    assert.ok(await gp.evaluate(() => !!document.activeElement?.closest('dialog')));
    await gp.keyboard.press('Escape');
    await gp.getByRole('dialog').waitFor({ state: 'hidden' });
    await gp.screenshot({ path: output + '/journey-reception.png' });
  });
  const maker = await context('budi');
  const authProbe = await maker.request.get(base + '/api/office/catalog');
  assert.equal(authProbe.status(), 200, await authProbe.text());
  const mp = await maker.newPage();
  mp.on('dialog', (d) => d.accept());
  mp.on('pageerror', (e) => runtimeErrors.push(e.message));
  let result;
  await check('real receipt wizard, QR and exact record', async () => {
    await mp.goto(base + '/penerimaan/buat');
    const d = mp.getByRole('dialog');
    await d.waitFor();
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByRole('radio').first().waitFor({ timeout: 8000 });
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByLabel(/Nominal bruto/).fill('2500');
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByRole('checkbox').check();
    const response = mp.waitForResponse(
      (r) => r.url().endsWith('/api/office/operations') && r.request().method() === 'POST',
    );
    await d.getByRole('button', { name: 'Simpan catatan', exact: true }).click();
    const r = await response;
    assert.equal(r.status(), 200);
    result = await r.json();
    await d.getByRole('heading', { name: 'Catatan berhasil disimpan.' }).waitFor();
    await d.getByAltText('QR untuk membuka catatan ' + result.code).waitFor();
    await d.screenshot({ path: output + '/wizard-receipt.png' });
    await d.getByRole('button', { name: 'Selesai', exact: true }).click();
    const publicResult = await fetch(base + '/api/publik/verifikasi/' + result.code);
    assert.equal(publicResult.status, 200);
    const body = await publicResult.json();
    assert.equal(body.nominal, '2500.00');
    assert.equal(body.penerima_samaran, undefined);
  });
  await check('distribution wizard uploads actual evidence', async () => {
    await mp.goto(base + '/penyaluran/buat');
    const d = mp.getByRole('dialog');
    await d.waitFor();
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByRole('radio').first().waitFor({ timeout: 8000 });
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByLabel(/Nominal penyaluran/).fill('1000');
    await d.getByLabel(/Bukti penyaluran/).setInputFiles({
      name: 'proof.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7\ncontrolled integration fixture'),
    });
    await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await d.getByRole('checkbox').check();
    const response = mp.waitForResponse(
      (r) => r.url().endsWith('/api/office/operations') && r.request().method() === 'POST',
    );
    await d.getByRole('button', { name: 'Simpan catatan', exact: true }).click();
    const r = await response;
    assert.equal(r.status(), 200);
    result = await r.json();
    await d.getByRole('heading', { name: 'Catatan berhasil disimpan.' }).waitFor();
  });
  for (const who of ['dewi', 'rian', 'hari'])
    await check('authenticated ' + who + ' processes the same domain record', async () => {
      const c = await context(who),
        p = await c.newPage();
      p.on('dialog', (d) => d.accept());
      p.on('pageerror', (e) => runtimeErrors.push(e.message));
      await p.goto(base + '/pekerjaan?item=' + result.workItemId);
      await p.getByRole('button', { name: 'Ambil tugas', exact: true }).waitFor();
      await p.getByRole('button', { name: 'Ambil tugas', exact: true }).click();
      const b = p.getByRole('button', {
        name: who === 'hari' ? 'Sahkan penyaluran' : 'Konfirmasi diterima',
        exact: true,
      });
      await b.waitFor();
      const response = p.waitForResponse(
        (r) => r.url().endsWith('/api/office/operations') && r.request().method() === 'POST',
      );
      await b.click();
      assert.equal((await response).status(), 200);
    });
  const state = (await db.query('SELECT status FROM work_items WHERE id=$1', [result.workItemId]))
    .rows[0];
  assert.equal(state.status, 'completed');
  await check('mobile view and reduced motion remain usable', async () => {
    const c = await context(null, {
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      }),
      p = await c.newPage();
    await p.goto(base);
    await p.getByRole('heading', { level: 1, name: /Zakat Tercatat/ }).waitFor();
    assert.ok(await p.evaluate(() => document.body.scrollWidth <= window.innerWidth + 1));
    await p
      .getByRole('navigation', { name: 'Tahap perjalanan' })
      .getByRole('button', { name: /Catatan/ })
      .click();
    await p.getByRole('heading', { level: 1, name: /Satu Catatan/ }).waitFor();
    await p.screenshot({ path: output + '/mobile.png' });
  });
  await check('WebGL loss has a usable content fallback', async () => {
    const c = await context();
    await c.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).includes('webgl')) return null;
        return original.call(this, type, ...rest);
      };
    });
    const p = await c.newPage();
    await p.goto(base);
    await p.getByText('Ilustrasi 3D tidak tersedia. Semua langkah tetap dapat dibuka.').waitFor();
  });
  await check('server SSE interruption reconnects automatically', async () => {
    let intercepted = false;
    await mp.route('**/api/office/stream', async (route) => {
      if (!intercepted) {
        intercepted = true;
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: 'event: unavailable\ndata: {}\n\n',
        });
      } else await route.continue();
    });
    await mp.goto(base + '/dasbor?mode=standard');
    await mp.getByText('Terhubung', { exact: true }).waitFor({ timeout: 12000 });
  });
  assert.deepEqual(runtimeErrors, []);
  console.log('EXPERIENCE_TESTS_OK');
} catch (error) {
  if (browser) {
    for (const p of browser.contexts().flatMap((c) => c.pages())) {
      console.log(
        'PAGE_DIAGNOSTIC',
        p.url(),
        (
          await p
            .locator('dialog')
            .innerText({ timeout: 3000 })
            .catch(() => '')
        ).slice(0, 2200),
      );
    }
  }
  throw error;
} finally {
  await browser?.close().catch(() => {});
  await fixture.close();
}
