// Dev helper: builds numbered contact sheets of candidate photos for manual curation.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const ids = process.argv.slice(2);
const W = 240;
const H = 160;
const COLS = 6;
mkdirSync('.tmp', { recursive: true });

const tiles = await Promise.all(
  ids.map(async (id, i) => {
    const res = await fetch(`https://images.unsplash.com/photo-${id}?w=${W}&h=${H}&fit=crop&fm=jpg`);
    if (!res.ok) return sharp({ create: { width: W, height: H, channels: 3, background: '#f00' } }).png().toBuffer();
    const buf = Buffer.from(await res.arrayBuffer());
    const label = Buffer.from(
      `<svg width="${W}" height="${H}"><rect width="34" height="24" fill="#000"/><text x="5" y="18" font-size="16" fill="#fff" font-family="Arial">${i}</text></svg>`,
    );
    return sharp(buf).resize(W, H).composite([{ input: label }]).png().toBuffer();
  }),
);

const rows = Math.ceil(tiles.length / COLS);
const sheet = sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: '#fff' } }).composite(
  tiles.map((input, i) => ({ input, left: (i % COLS) * W, top: Math.floor(i / COLS) * H })),
);
await sheet.png().toFile('.tmp/sheet.png');
writeFileSync('.tmp/sheet.json', JSON.stringify(ids, null, 2));
console.log('ok', tiles.length);
