// Schematic ("LED board") layout derived from the real network: real station order, branches and
// interchanges, with a fisheye that enlarges central London and octilinear (0/45/90°) segments.
import { LONDON_PROJECTION as P, THAMES_PATH } from '@/data/london-geo.generated';
import { TUBE_LINE_IDS } from '@/data/tube-colors';
import type { TubeNetwork } from '@/lib/tfl/types';

export type Pt = [number, number];

export interface LedLayout {
  /** Station centre in grid units */
  stations: Map<string, Pt>;
  /** Drawn path per line (grid units), one polyline per contiguous run */
  lines: Map<string, Pt[][]>;
  /** Directed drawn path between adjacent stations, keyed "lineId:from>to" */
  edges: Map<string, Pt[]>;
  /** Thames polylines in grid units */
  thames: Pt[][];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const CENTRE = { lat: 51.5113, lon: -0.1235 };
const CELLS_PER_UNIT = 4.2;
const FISHEYE_KM = 7;
const BUNDLE_GAP = 0.3;

/** Project a London point onto the octilinear schematic. */
export function schematic(lat: number, lon: number): Pt {
  const x = (lon - CENTRE.lon) * 69.3;
  const y = -(lat - CENTRE.lat) * 111.2;
  const r = Math.hypot(x, y);
  if (r === 0) return [0, 0];
  const k = 1 / (1 + r / FISHEYE_KM);
  return [x * k * CELLS_PER_UNIT, y * k * CELLS_PER_UNIT];
}

/** Snaps to the grid; occupied cells push the station to the nearest free neighbour. */
function snapAll(raw: [string, Pt][]): Map<string, Pt> {
  const taken = new Set<string>();
  const out = new Map<string, Pt>();
  const sorted = [...raw].sort((a, b) => Math.hypot(...a[1]) - Math.hypot(...b[1]));
  for (const [id, [x, y]] of sorted) {
    const gx = Math.round(x);
    const gy = Math.round(y);
    let placed: Pt | null = null;
    for (let ring = 0; ring < 4 && !placed; ring++) {
      let best: Pt | null = null;
      let bestD = Infinity;
      for (let dx = -ring; dx <= ring; dx++)
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const c: Pt = [gx + dx, gy + dy];
          if (taken.has(`${c[0]},${c[1]}`)) continue;
          const d = Math.hypot(c[0] - x, c[1] - y);
          if (d < bestD) {
            best = c;
            bestD = d;
          }
        }
      placed = best;
    }
    const p = placed ?? [gx, gy];
    taken.add(`${p[0]},${p[1]}`);
    out.set(id, p);
  }
  return out;
}

/** Octilinear route A→B: straight run first, then a 45° diagonal. */
function octi(a: Pt, b: Pt): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax === 0 || ay === 0 || ax === ay) return [a, b];
  const d = Math.min(ax, ay);
  const straight = ax > ay ? [a[0] + Math.sign(dx) * (ax - d), a[1]] : [a[0], a[1] + Math.sign(dy) * (ay - d)];
  return [a, straight as Pt, b];
}

/** Offsets a polyline sideways by `off` using mitred joins. */
function offsetPolyline(pts: Pt[], off: number): Pt[] {
  if (!off) return pts;
  const normal = (p: Pt, q: Pt): Pt => {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [-(q[1] - p[1]) / len, (q[0] - p[0]) / len];
  };
  return pts.map((p, i) => {
    const n1 = i > 0 ? normal(pts[i - 1]!, p) : normal(p, pts[i + 1]!);
    const n2 = i < pts.length - 1 ? normal(p, pts[i + 1]!) : n1;
    const nx = n1[0] + n2[0];
    const ny = n1[1] + n2[1];
    const len = Math.hypot(nx, ny) || 1;
    const cos = (nx * n1[0] + ny * n1[1]) / len;
    const scale = off / Math.max(0.5, cos);
    return [p[0] + (nx / len) * scale, p[1] + (ny / len) * scale];
  });
}

function parseThames(): Pt[][] {
  const out: Pt[][] = [];
  for (const part of THAMES_PATH.split('M').filter(Boolean)) {
    const nums = part.split(/[L\s]+/).filter(Boolean).map(Number);
    const pts: Pt[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lon = (nums[i]! - P.pad) / (P.cos * P.k) + P.minLon;
      const lat = P.maxLat - (nums[i + 1]! - P.pad) / P.k;
      pts.push(schematic(lat, lon));
    }
    if (pts.length > 1) out.push(pts);
  }
  return out;
}

export function buildLedLayout(network: TubeNetwork): LedLayout {
  const stations = snapAll(Object.values(network.stations).map((s) => [s.id, schematic(s.lat, s.lon)]));
  const order = (id: string) => TUBE_LINE_IDS.indexOf(id as (typeof TUBE_LINE_IDS)[number]);

  // Which lines share each undirected edge – used to fan them out side by side.
  const edgeLines = new Map<string, string[]>();
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const line of network.lines)
    for (const br of line.branches)
      for (let i = 0; i < br.stationIds.length - 1; i++) {
        const k = key(br.stationIds[i]!, br.stationIds[i + 1]!);
        const list = edgeLines.get(k) ?? [];
        if (!list.includes(line.id)) list.push(line.id);
        edgeLines.set(k, list);
      }
  for (const list of edgeLines.values()) list.sort((a, b) => order(a) - order(b));

  const lines = new Map<string, Pt[][]>();
  const edges = new Map<string, Pt[]>();
  for (const line of network.lines) {
    const drawn = new Set<string>();
    const runs: Pt[][] = [];
    for (const br of line.branches) {
      let run: Pt[] = [];
      for (let i = 0; i < br.stationIds.length - 1; i++) {
        const a = br.stationIds[i]!;
        const b = br.stationIds[i + 1]!;
        const k = key(a, b);
        const pa = stations.get(a);
        const pb = stations.get(b);
        if (drawn.has(k) || !pa || !pb) {
          if (run.length > 1) runs.push(run);
          run = [];
          continue;
        }
        drawn.add(k);
        const shared = edgeLines.get(k)!;
        const off = (shared.indexOf(line.id) - (shared.length - 1) / 2) * BUNDLE_GAP;
        // Offset in canonical direction so every line on the edge agrees which side is which.
        const forward = a < b;
        const canon = forward ? octi(pa, pb) : octi(pb, pa);
        let seg = offsetPolyline(canon, off);
        if (!forward) seg = seg.reverse();
        edges.set(`${line.id}:${a}>${b}`, seg);
        edges.set(`${line.id}:${b}>${a}`, [...seg].reverse());
        run.push(...(run.length ? seg.slice(1) : seg));
      }
      if (run.length > 1) runs.push(run);
    }
    lines.set(line.id, runs);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of stations.values()) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { stations, lines, edges, thames: parseThames(), bounds: { minX: minX - 2, minY: minY - 2, maxX: maxX + 2, maxY: maxY + 2 } };
}

/** Point and direction at fraction `p` along a polyline. */
export function alongPolyline(pts: Pt[], p: number): { pos: Pt; heading: Pt } {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1]![0] - pts[i]![0], pts[i + 1]![1] - pts[i]![1]);
    lens.push(l);
    total += l;
  }
  let d = p * total;
  for (let i = 0; i < lens.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    if (d <= lens[i]! || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, d / lens[i]!) : 0;
      return { pos: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], heading: [b[0] - a[0], b[1] - a[1]] };
    }
    d -= lens[i]!;
  }
  const last = pts[pts.length - 1]!;
  return { pos: last, heading: [0, 0] };
}
