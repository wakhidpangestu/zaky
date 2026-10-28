import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { testServer, root, base } from './server.mjs';
const phase = process.env.ZAKY_VISUAL_PHASE ?? 'after';
if (!['before', 'after'].includes(phase))
  throw new Error('Use before or after for ZAKY_VISUAL_PHASE');
const output = root + '.next/visual-results/' + phase;
await mkdir(output, { recursive: true });
const fixture = await testServer();
let browser;
const measurements = {
  phase,
  viewport: { width: 1024, height: 576 },
  chapters: [],
  errors: [],
};
async function settled(page, chapter = 0) {
  await page.addStyleTag({ content: 'nextjs-portal {display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction((index) => {
    const scene = document.querySelector('.zj-canvas');
    const copy = document.querySelector('.zj-copy');
    return (
      scene?.dataset.chapter === String(index) &&
      scene.dataset.motion === 'idle' &&
      copy?.getAnimations({ subtree: true }).every((a) => a.playState === 'finished')
    );
  }, chapter);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
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
  const context = await browser.newContext({
    viewport: measurements.viewport,
    deviceScaleFactor: 1,
    ...(process.env.ZAKY_RECORD_VIDEO === 'true'
      ? { recordVideo: { dir: output + '/video', size: measurements.viewport } }
      : {}),
  });
  const finances = async () => ({
    funds: (
      await fixture.db.query(
        'SELECT id,total_masuk::text,saldo_tersedia::text,saldo_dicadangkan::text,total_tersalurkan::text FROM pos_dana ORDER BY id',
      )
    ).rows,
    receipts: (await fixture.db.query('SELECT count(*)::int AS n FROM penerimaan')).rows[0].n,
  });
  const initialFinance = await finances();
  const page = await context.newPage();
  page.on('pageerror', (e) => measurements.errors.push(e.message));
  const home = await page.goto(base);
  assert.equal(home.status(), 200, 'landing must return HTTP 200');
  await page.getByRole('heading', { level: 1, name: /Zakat Tercatat/ }).waitFor();
  await page.locator('.zj-canvas canvas').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settled(page);
  for (let i = 0; i < 6; i++) {
    await page
      .getByRole('navigation', { name: 'Tahap perjalanan' })
      .getByRole('button')
      .nth(i)
      .click();
    await page.waitForFunction(
      (index) =>
        document.querySelectorAll('.zj-bottom nav button')[index]?.getAttribute('aria-current') ===
        'step',
      i,
    );
    await settled(page, i);
    await page.screenshot({ path: output + '/chapter-' + i + '.png' });
    if (phase === 'after' && (i === 0 || i === 1)) {
      const hidden = await page.addStyleTag({
        content: '.zj-copy,.zj-nav,.zj-bottom,.zj-handnote{display:none!important}',
      });
      await page.waitForFunction(
        () => getComputedStyle(document.querySelector('.zj-copy')).display === 'none',
      );
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.screenshot({ path: output + '/scene-' + i + '.png' });
      await hidden.evaluate((el) => el.remove());
    }
    const boxes = await page.evaluate(() => {
      const box = (s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return {
        header: box('.zj-nav'),
        copy: box('.zj-copy'),
        heading: box('.zj-copy h1'),
        canvas: box('.zj-canvas'),
        drawCalls: Number(document.querySelector('.zj-canvas').dataset.drawCalls),
        navigation: box('.zj-bottom nav'),
        overflow: document.body.scrollWidth > innerWidth + 1,
      };
    });
    assert.equal(boxes.overflow, false);
    if (phase === 'after') {
      assert.ok(Math.abs(boxes.header.width - 681) < 10);
      assert.ok(Math.abs(boxes.copy.x - 167) < 8);
    }
    measurements.chapters.push({ index: i, ...boxes });
  }
  for (const [selector, name] of [
    ['#pelacakan', 'tracking'],
    ['#layanan', 'services'],
    ['#peran', 'roles'],
    ['#aplikasi', 'mobile-preview'],
    ['#cara-kerja', 'modes'],
    ['.zj-trust-section', 'trust'],
    ['.zj-final', 'final'],
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.screenshot({ path: output + '/' + name + '.png' });
  }
  await page.getByRole('button', { name: 'Mulai mencatat', exact: true }).first().click();
  await page.getByRole('dialog').waitFor();
  const modal = await page.getByRole('dialog').boundingBox();
  const sidebar = await page.locator('.zw-progress').boundingBox();
  if (phase === 'after') {
    assert.ok(Math.abs(modal.width - 523) < 18);
    assert.ok(Math.abs(modal.height - 470) < 18);
    assert.ok(Math.abs(sidebar.width / modal.width - 0.294) < 0.02);
  }
  measurements.modal = { ...modal, sidebarRatio: sidebar.width / modal.width };
  await page.screenshot({ path: output + '/wizard-0.png' });
  const lockedScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(25, 250);
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(250);
  assert.equal(
    await page.evaluate(() => scrollY),
    lockedScroll,
    'scrolling the modal backdrop must not advance the journey',
  );

  await page.keyboard.press('Escape');
  assert.deepEqual(
    await finances(),
    initialFinance,
    'landing scene and guest wizard navigation must not write financial data',
  );
  await context.addCookies([
    {
      name: 'zaky-session',
      value: (await fixture.cookie('budi')).slice('zaky-session='.length),
      url: base,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  await page.goto(base);
  await page.getByRole('button', { name: 'Mulai mencatat', exact: true }).first().click();
  const d = page.getByRole('dialog');
  await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await d.getByRole('radio').first().waitFor();
  await d.screenshot({ path: output + '/wizard-1.png' });
  await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await d.getByLabel(/Nominal bruto/).fill('2500');
  await d.screenshot({ path: output + '/wizard-2.png' });
  await d.getByRole('button', { name: 'Lanjut', exact: true }).click();
  await d.getByRole('checkbox').check();
  await d.screenshot({ path: output + '/wizard-3.png' });
  await d.getByRole('button', { name: 'Simpan catatan', exact: true }).click();
  await d.getByRole('heading', { name: 'Catatan berhasil disimpan.' }).waitFor();
  await d.getByAltText(/QR untuk membuka catatan/).waitFor();
  await d.screenshot({ path: output + '/wizard-4.png' });
  const finish = await d.getByRole('button', { name: 'Selesai', exact: true }).boundingBox();
  const dialogBox = await d.boundingBox();
  assert.ok(
    finish.y + finish.height <= dialogBox.y + dialogBox.height,
    'completion button remains inside the modal',
  );
  await d.getByRole('button', { name: 'Selesai', exact: true }).click();
  const officeFinance = await finances();
  await page.goto(base + '/dasbor?mode=standard');
  await page.getByText('Terhubung', { exact: true }).waitFor();
  assert.equal(await page.locator('canvas').count(), 0);
  await page.screenshot({ path: output + '/standard.png' });
  await page.goto(base + '/dasbor?mode=3d');
  await page.locator('.zo-canvas canvas').waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: output + '/office.png' });
  assert.deepEqual(
    await finances(),
    officeFinance,
    'standard/3D navigation must not alter financial sources',
  );
  const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    }),
    mp = await mobile.newPage();
  mp.on('pageerror', (e) => measurements.errors.push(e.message));
  await mp.goto(base);
  await mp.getByRole('heading', { level: 1, name: /Zakat Tercatat/ }).waitFor();
  await settled(mp);
  await mp.screenshot({ path: output + '/mobile-hero.png' });
  assert.ok(await mp.evaluate(() => document.body.scrollWidth <= innerWidth + 1));
  await mp.getByRole('navigation', { name: 'Tahap perjalanan' }).getByRole('button').nth(1).click();
  await mp.getByRole('heading', { name: /Catat Zakat/, level: 1 }).waitFor();
  await settled(mp, 1);
  await mp.screenshot({ path: output + '/mobile-reception.png' });
  await mp.getByRole('button', { name: 'Mulai mencatat', exact: true }).first().click();
  await mp.getByRole('dialog').waitFor();
  await mp.screenshot({ path: output + '/mobile-wizard.png' });
  const wide = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    }),
    wp = await wide.newPage();
  wp.on('pageerror', (e) => measurements.errors.push(e.message));
  await wp.goto(base);
  await wp.getByRole('heading', { name: /Zakat Tercatat/, level: 1 }).waitFor();
  await settled(wp);
  await wp.screenshot({ path: output + '/wide-hero.png' });
  await wp.getByRole('navigation', { name: 'Tahap perjalanan' }).getByRole('button').nth(3).click();
  await wp.getByRole('heading', { name: /Dua Unit Saksi/, level: 1 }).waitFor();
  await settled(wp, 3);
  await wp.screenshot({ path: output + '/wide-witness.png' });
  assert.ok(await wp.evaluate(() => document.body.scrollWidth <= innerWidth + 1));
  await wp.setViewportSize({ width: 820, height: 1180 });
  await wp.goto(base);
  await wp.getByRole('heading', { name: /Zakat Tercatat/, level: 1 }).waitFor();
  await settled(wp);
  await wp.screenshot({ path: output + '/tablet.png' });
  assert.ok(await wp.evaluate(() => document.body.scrollWidth <= innerWidth + 1));
  if (process.env.ZAKY_RECORD_VIDEO === 'true') {
    await context.close();
  }
  assert.deepEqual(measurements.errors, []);
  await writeFile(output + '/measurements.json', JSON.stringify(measurements, null, 2));
  console.log('VISUAL_CAPTURE_OK ' + output);
} finally {
  await browser?.close();
  await fixture.close();
}
