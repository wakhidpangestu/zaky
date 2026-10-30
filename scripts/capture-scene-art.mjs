// Renders the landing page's 3D scene into still illustrations for the other public pages.
// Needs the dev server (npm run dev) and Microsoft Edge: node scripts/capture-scene-art.mjs [baseUrl]
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:3000';
const SHOTS = [
  ['gedung', 0],
  ['penerimaan', 0.14],
  ['penyaluran', 0.34],
  ['konfirmasi', 0.54],
  ['persetujuan', 0.74],
  ['catatan', 0.94],
];
await mkdir('public/scenes', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
// Keep only the canvas: hide copy, navigation and overlays.
await page.addStyleTag({
  content:
    '.zj-copy,.zj-bottom,.zj-handnote,.zs-nav-wrap,.zj-veil,nextjs-portal{display:none!important}.zj-copy-wash,.zj-visual::before,.zj-visual::after{display:none!important}',
});
for (const [name, p] of SHOTS) {
  await page.evaluate((p) => {
    const t = document.querySelector('.zj-track');
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, t.offsetTop + p * (t.offsetHeight - innerHeight));
  }, p);
  await page.waitForTimeout(1500);
  const box = await page.locator('.zj-canvas canvas').boundingBox();
  // The scene is framed on the right of the canvas, leaving room for the copy on the left.
  const clip = { x: box.x + box.width * 0.42, y: box.y + 60, width: box.width * 0.58, height: box.height - 120 };
  const raw = await page.screenshot({ clip });
  await sharp(raw).resize({ width: 1400 }).webp({ quality: 86 }).toFile(`public/scenes/${name}.webp`);
  console.log('saved', name);
}
await browser.close();
