// Rasterises the Zaky mark (public/icon.svg) into the favicon, app icons and brand kit.
// Run with: node scripts/generate-brand-assets.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const TILE = '#0F5C4D';
const svg = await readFile('public/icon.svg', 'utf8');
const path = svg.match(/\sd="([^"]+)"/)[1];

/** The mark on its tile; `inset` shrinks the glyph for maskable safe zones. */
const tile = ({ radius = 220, inset = 1, bg = TILE, fg = '#FFFFFF' } = {}) => {
  const scale = 0.72 * inset,
    offset = (1000 - 1000 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><rect width="1000" height="1000" rx="${radius}" fill="${bg}"/><path transform="translate(${offset} ${offset + 1}) scale(${scale})" fill="${fg}" fill-rule="evenodd" d="${path}"/></svg>`;
};
const mark = (fg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path fill="${fg}" fill-rule="evenodd" d="${path}"/></svg>`;
const png = (source, size) => sharp(Buffer.from(source), { density: 300 }).resize(size, size).png().toBuffer();

/** ICO container holding PNG frames (supported by every current browser). */
function ico(frames) {
  const header = Buffer.alloc(6 + 16 * frames.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...frames.map((f) => f.data)]);
}

await mkdir('public/icons', { recursive: true });
await mkdir('public/brand', { recursive: true });

const favicon = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(tile(), size) })));
await writeFile('src/app/favicon.ico', ico(favicon));
// iOS draws its own rounded corners, so the touch icon is a full square.
await writeFile('src/app/apple-icon.png', await png(tile({ radius: 0 }), 180));
await writeFile('public/icons/icon-192.png', await png(tile(), 192));
await writeFile('public/icons/icon-512.png', await png(tile(), 512));
await writeFile('public/icons/icon-maskable-512.png', await png(tile({ radius: 0, inset: 0.78 }), 512));

await writeFile('public/brand/zaky-tile.svg', tile());
await writeFile('public/brand/zaky-mark.svg', mark(TILE));
await writeFile('public/brand/zaky-mark-white.svg', mark('#FFFFFF'));
await writeFile('public/brand/zaky-tile-1024.png', await png(tile(), 1024));
console.log('Brand assets written.');
