// Builds src/data/london-geo.generated.ts from real geography:
//  - London borough boundaries (GeoJSON, scripts/geo/boroughs.geojson)
//  - River Thames centreline from OpenStreetMap (Overpass API, cached in scripts/geo/thames.json)
// Boroughs are grouped into the five Londynek regions; region outlines are derived by
// cancelling shared borough edges. Output is projected into an SVG viewBox (height 100).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BOROUGHS_URL = 'https://raw.githubusercontent.com/radoi90/housequest-data/master/london_boroughs.geojson';
const BOROUGHS_FILE = 'scripts/geo/boroughs.geojson';
const THAMES_FILE = 'scripts/geo/thames.json';
const OUT = 'src/data/london-geo.generated.ts';

const REGION_OF = {
  'City of London': 'central', Westminster: 'central',
  Barnet: 'north', Enfield: 'north', Haringey: 'north', Camden: 'north', Islington: 'north',
  'Tower Hamlets': 'east', Hackney: 'east', Newham: 'east', 'Waltham Forest': 'east', Redbridge: 'east', 'Barking and Dagenham': 'east', Havering: 'east',
  Lambeth: 'south', Southwark: 'south', Lewisham: 'south', Greenwich: 'south', Bexley: 'south', Bromley: 'south', Croydon: 'south', Sutton: 'south', Merton: 'south', Wandsworth: 'south', 'Kingston upon Thames': 'south',
  'Hammersmith and Fulham': 'west', 'Kensington and Chelsea': 'west', Ealing: 'west', Brent: 'west', Harrow: 'west', Hillingdon: 'west', Hounslow: 'west', 'Richmond upon Thames': 'west',
};

async function load() {
  if (!existsSync(BOROUGHS_FILE)) writeFileSync(BOROUGHS_FILE, await (await fetch(BOROUGHS_URL)).text());
  if (!existsSync(THAMES_FILE)) {
    const q = '[out:json][timeout:60];way["waterway"="river"]["name"="River Thames"](51.38,-0.55,51.52,0.30);out geom;';
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'londynek-redesign-build/0.1', Accept: 'application/json' },
      body: 'data=' + encodeURIComponent(q),
    });
    if (!res.ok) throw new Error(`Overpass ${res.status}`);
    writeFileSync(THAMES_FILE, await res.text());
  }
  return { boroughs: JSON.parse(readFileSync(BOROUGHS_FILE, 'utf8')), thames: JSON.parse(readFileSync(THAMES_FILE, 'utf8')) };
}

const rings = (geom) => (geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat());

function douglasPeucker(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  if (a[0] === b[0] && a[1] === b[1]) {
    let far = 1;
    for (let i = 1; i < pts.length - 1; i++) if (Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]) > Math.hypot(pts[far][0] - a[0], pts[far][1] - a[1])) far = i;
    return [...douglasPeucker(pts.slice(0, far + 1), tol).slice(0, -1), ...douglasPeucker(pts.slice(far), tol)];
  }
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1e-9;
    const d = Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) [max, idx] = [d, i];
  }
  if (max <= tol) return [a, b];
  return [...douglasPeucker(pts.slice(0, idx + 1), tol).slice(0, -1), ...douglasPeucker(pts.slice(idx), tol)];
}

const { boroughs, thames } = await load();

let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const f of boroughs.features) for (const r of rings(f.geometry)) for (const [lon, lat] of r) {
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon); minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
}
const PAD = 2;
const lat0 = (minLat + maxLat) / 2;
const k = (100 - 2 * PAD) / (maxLat - minLat);
const cos = Math.cos((lat0 * Math.PI) / 180);
const W = Math.round((maxLon - minLon) * cos * k + 2 * PAD);
const H = 100;
const project = ([lon, lat]) => [(lon - minLon) * cos * k + PAD, (maxLat - lat) * k + PAD];

const r1 = (n) => Math.round(n * 10) / 10;
const toPath = (ring, tol, close = true) => {
  const pts = douglasPeucker(ring.map(project), tol).map(([x, y]) => [r1(x), r1(y)]);
  return 'M' + pts.map((p) => p.join(' ')).join('L') + (close ? 'Z' : '');
};

// Region outlines: edges shared by two boroughs of the same region cancel out.
const key = ([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)}`;
function outline(features) {
  const edges = new Map();
  for (const f of features) for (const r of rings(f.geometry)) for (let i = 0; i < r.length - 1; i++) {
    const a = key(r[i]);
    const b = key(r[i + 1]);
    if (a === b) continue;
    const id = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (edges.has(id)) edges.delete(id);
    else edges.set(id, [r[i], r[i + 1]]);
  }
  const next = new Map();
  for (const [a, b] of edges.values()) {
    (next.get(key(a)) ?? next.set(key(a), []).get(key(a))).push(b);
    (next.get(key(b)) ?? next.set(key(b), []).get(key(b))).push(a);
  }
  const used = new Set();
  const out = [];
  for (const [a, b] of edges.values()) {
    const id0 = key(a) < key(b) ? `${key(a)}|${key(b)}` : `${key(b)}|${key(a)}`;
    if (used.has(id0)) continue;
    used.add(id0);
    const ring = [a, b];
    let cur = b;
    for (;;) {
      const cand = (next.get(key(cur)) ?? []).find((p) => {
        const id = key(cur) < key(p) ? `${key(cur)}|${key(p)}` : `${key(p)}|${key(cur)}`;
        return !used.has(id);
      });
      if (!cand) break;
      used.add(key(cur) < key(cand) ? `${key(cur)}|${key(cand)}` : `${key(cand)}|${key(cur)}`);
      ring.push(cand);
      cur = cand;
      if (key(cand) === key(a)) break;
    }
    if (ring.length > 8) out.push(ring);
  }
  return out;
}

const regions = {};
for (const id of ['central', 'north', 'east', 'south', 'west']) {
  const feats = boroughs.features.filter((f) => REGION_OF[f.properties.name] === id);
  regions[id] = outline(feats).map((r) => toPath(r, 0.25)).join('');
}
const outer = outline(boroughs.features).map((r) => toPath(r, 0.2)).join('');
const boroughPaths = boroughs.features.map((f) => ({
  name: f.properties.name,
  region: REGION_OF[f.properties.name],
  d: rings(f.geometry).map((r) => toPath(r, 0.3)).join(''),
}));

// Thames: merge OSM ways (main channel only – skip tiny side channels), then simplify.
const ways = thames.elements.filter((e) => e.geometry?.length > 1).map((e) => e.geometry.map((p) => [p.lon, p.lat]));
const thamesPath = ways
  .filter((w) => w.length > 1)
  .map((w) => toPath(w, 0.15, false))
  .join('');

const unmatched = boroughs.features.filter((f) => !REGION_OF[f.properties.name]).map((f) => f.properties.name);
if (unmatched.length) throw new Error('Unmapped boroughs: ' + unmatched.join(', '));

const ts = `// Generated by scripts/build-london-map.mjs – do not edit by hand.
// Sources: London borough boundaries (ONS-derived GeoJSON), River Thames © OpenStreetMap contributors (ODbL).
import type { RegionId } from '@/types';

export const LONDON_VIEWBOX = { width: ${W}, height: ${H} } as const;
/** Equirectangular projection used for the paths below. */
export const LONDON_PROJECTION = { minLon: ${minLon}, maxLat: ${maxLat}, k: ${k}, cos: ${cos}, pad: ${PAD} } as const;

export const LONDON_OUTLINE = ${JSON.stringify(outer)};

export const LONDON_REGIONS: Record<RegionId, string> = ${JSON.stringify(regions, null, 2)};

export const LONDON_BOROUGHS: { name: string; region: RegionId; d: string }[] = ${JSON.stringify(boroughPaths)};

export const THAMES_PATH = ${JSON.stringify(thamesPath)};
`;
writeFileSync(OUT, ts);
console.log(`viewBox ${W}x${H}; outline ${outer.length}b; regions ${Object.values(regions).map((r) => r.length).join('/')}; thames ${ways.length} ways ${thamesPath.length}b; out ${ts.length}b`);
