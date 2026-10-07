import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const src = readFileSync('src/data/london-geo.generated.ts', 'utf8');
const grab = (name) => JSON.parse(src.match(new RegExp(`export const ${name}[^=]*= ([\\s\\S]*?);\\n`))[1]);
const regions = grab('LONDON_REGIONS');
const boroughs = grab('LONDON_BOROUGHS');
const thames = grab('THAMES_PATH');
const outline = grab('LONDON_OUTLINE');
const W = Number(src.match(/width: (\d+)/)[1]);
const fill = { central: '#f4b6c2', north: '#f6a04d', east: '#b6d65a', south: '#f7d64a', west: '#8ec5d6' };
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 100" width="${W * 8}" height="800">
<rect width="100%" height="100%" fill="#f8f7f2"/>
${Object.entries(regions).map(([id, d]) => `<path d="${d}" fill="${fill[id]}" fill-rule="evenodd" stroke="#555" stroke-width="0.3"/>`).join('')}
${boroughs.map((b) => `<path d="${b.d}" fill="none" stroke="#0003" stroke-width="0.15"/>`).join('')}
<path d="${outline}" fill="none" stroke="#102a4c" stroke-width="0.5"/>
<path d="${thames}" fill="none" stroke="#3b82c4" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(process.argv[2] ?? 'scripts/geo/preview.png');
