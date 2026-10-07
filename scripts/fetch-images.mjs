// Downloads curated Unsplash photos (Unsplash License) as local responsive WebP files
// and generates a typed manifest consumed by <Img />.
import sharp from 'sharp';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'public/img';
const PRESETS = {
  hero: { ratio: [16, 9], widths: [960, 1920] },
  card: { ratio: [4, 3], widths: [480, 800] },
  avatar: { ratio: [1, 1], widths: [160, 320] },
};

const PHOTOS = {
  hero: {
    'hero-westminster': '1529655683826-aba9b3e77383',
    'tower-bridge-dusk': '1543832923-44667a44c804',
    'london-night': '1513026705753-bc3fffca8bf4',
    'london-thames': '1513635269975-59663e0ac1ad',
    'westminster-bus': '1488747279002-c8523379faaa',
    'city-towers': '1486406146926-c627a92ad1ab',
    'office': '1556761175-b413da4baf72',
    'books': '1543248939-4296e1fea89b',
    'festival': '1470229722913-7c0e2dbbafd3',
  },
  card: {
    'westminster-bridge': '1505761671935-60b3a7427bad',
    'big-ben': '1486299267070-83823f5448dd',
    'bigben-bus': '1520986606214-8b456906c813',
    'tower-bridge': '1533929736458-ca588d08c8be',
    'london-street': '1526129318478-62ed807ebdf9',
    'big-ben-statue': '1500380804539-4e1e8c1e7118',
    'flat-living-1': '1522708323590-d24dbb6b0267',
    'flat-living-2': '1560448204-e02f11c3d0e2',
    'bedroom': '1505693416388-ac5ce068fe85',
    'living-3': '1502672260266-1c1ef2d93688',
    'living-4': '1493809842364-78817add7ffb',
    'living-5': '1513694203232-719a280e022f',
    'kitchen': '1484154218962-a197022b5858',
    'kitchen-2': '1556911220-bff31c812dba',
    'house-modern': '1600585154340-be6161a56a0c',
    'house': '1570129477492-45c003edd2be',
    'sofa': '1555041469-a586c61ea9bc',
    'chair': '1586023492125-27b2c045efd7',
    'electronics': '1498049794561-7780e7231661',
    'garden': '1416879595882-3373a0480b5b',
    'kids': '1503454537195-1dcabb73ffb9',
    'sport-run': '1461896836934-ffe607ba8211',
    'football': '1517466787929-bc90951d0974',
    'restaurant': '1517248135467-4c7edcad34c4',
    'construction': '1504307651254-35680f356dfd',
    'cleaning': '1581578731548-c64695cc6952',
    'electrician': '1621905251189-08b45d6a269e',
    'moving': '1600518464441-9154a4dea21b',
    'warehouse': '1586528116311-ad8dd3c8310d',
    'care': '1576765608535-5f04d1e3f289',
    'car-bmw': '1555215695-3004980ad54e',
    'car-mustang': '1494976388531-d1058494cdd8',
    'car-porsche': '1503376780353-7e6692767b70',
    'car-m4': '1580273916550-e323be2ae537',
    'car-garage': '1607860108855-64acf2078ed9',
    'concert': '1501281668745-f7f57925c3b4',
    'concert-2': '1514525253161-7a46d19cd819',
    'crowd-concert': '1533174072545-7a4b6ad7a6c3',
    'party': '1492684223066-81342ee5ff30',
    'conference': '1540575467063-178a50c2df87',
    'audience': '1517457373958-b7bdd4587205',
    'theatre': '1587825140708-dfaf72ae4b04',
    'art': '1460661419201-fd4cecdf8a8b',
    'food': '1512621776951-a57141f2eefd',
    'grocery': '1542838132-92c53300491e',
    'sweets': '1606787366850-de6330128bfc',
    'shop-open': '1472851294608-062f824d29cc',
    'crossing': '1517732306149-e8f829eb588a',
    'plane': '1436491865332-7a61a109cc05',
    'travel': '1504609773096-104ff2c73ba4',
    'laptops': '1519389950473-47ba0277781c',
    'team': '1521737604893-d14cc237f11d',
    'doctor': '1576091160399-112ba8d25d1d',
    'dentist': '1606811971618-4486d14f3f99',
    'xray': '1588776814546-1ffcf47267a5',
    'education': '1503676260728-1c00da094a0b',
    'documents': '1450101499163-c8848c66ca85',
    'accounting': '1554224155-6726b3ff858f',
    'money': '1579621970563-ebec7560ff3e',
    'nails': '1604654894610-df63bc536371',
    'salon': '1560066984-138dadb4c035',
    'it': '1498050108023-c5249f4df085',
    'friends': '1529156069898-49953e39b3ac',
    'friends-sunset': '1511632765486-a01980e01a18',
    'friends-selfie': '1491438590914-bc09fcaaf77a',
    'study-group': '1543269865-cbf427effbad',
    'train': '1474487548417-781cb71495f3',
  },
  avatar: {
    'person-1': '1573497019940-1c28c88b4f3e',
    'person-2': '1607746882042-944635dfe10e',
    'person-3': '1500648767791-00dcc994a43e',
    'person-4': '1494790108377-be9c29b29330',
    'person-5': '1527980965255-d3b416303d12',
  },
};

mkdirSync(OUT, { recursive: true });
const manifest = {};
const jobs = [];

for (const [preset, photos] of Object.entries(PHOTOS)) {
  const { ratio, widths } = PRESETS[preset];
  for (const [name, id] of Object.entries(photos)) {
    manifest[name] = { preset, ratio, widths, id };
    for (const w of widths) {
      const file = `${OUT}/${name}-${w}.webp`;
      if (existsSync(file)) continue;
      const h = Math.round((w * ratio[1]) / ratio[0]);
      jobs.push(async () => {
        const res = await fetch(`https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&fm=jpg&q=85`);
        if (!res.ok) throw new Error(`${name} ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await sharp(buf).resize(w, h, { fit: 'cover' }).webp({ quality: 68 }).toFile(file);
      });
    }
  }
}

const POOL = 8;
for (let i = 0; i < jobs.length; i += POOL) {
  await Promise.all(jobs.slice(i, i + POOL).map((job) => job()));
}

const ts = `// Generated by scripts/fetch-images.mjs. Do not edit by hand.
export const IMAGES = ${JSON.stringify(
  Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, { ratio: v.ratio, widths: v.widths, unsplashId: v.id }])),
  null,
  2,
)} as const;

export type ImageName = keyof typeof IMAGES;
`;
writeFileSync('src/data/images.generated.ts', ts);
console.log(`downloaded ${jobs.length} files, ${Object.keys(manifest).length} images`);
