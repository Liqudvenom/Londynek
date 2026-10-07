// Graph helpers over the Tube network. Shared with the server – keep imports relative.
import { normalizeName } from './names';
import type { NetworkLine, TubeNetwork, TubeStation } from './types';

export interface NetworkIndex {
  network: TubeNetwork;
  /** lineId → stationId → adjacent stationIds on that line */
  adjacency: Map<string, Map<string, Set<string>>>;
  /** normalized name → station ids (several ids may share a name, e.g. Paddington) */
  byName: Map<string, string[]>;
  lines: Map<string, NetworkLine>;
}

export function indexNetwork(network: TubeNetwork): NetworkIndex {
  const adjacency = new Map<string, Map<string, Set<string>>>();
  for (const line of network.lines) {
    const adj = new Map<string, Set<string>>();
    for (const b of line.branches) {
      for (let i = 0; i < b.stationIds.length - 1; i++) {
        const a = b.stationIds[i]!;
        const c = b.stationIds[i + 1]!;
        (adj.get(a) ?? adj.set(a, new Set()).get(a)!).add(c);
        (adj.get(c) ?? adj.set(c, new Set()).get(c)!).add(a);
      }
    }
    adjacency.set(line.id, adj);
  }
  const byName = new Map<string, string[]>();
  for (const s of Object.values(network.stations)) {
    const key = normalizeName(s.name);
    byName.set(key, [...(byName.get(key) ?? []), s.id]);
  }
  return { network, adjacency, byName, lines: new Map(network.lines.map((l) => [l.id, l])) };
}

/** Resolves a TfL free-text station name to a station on `lineId` (falls back to any line). */
export function resolveStationName(index: NetworkIndex, name: string, lineId?: string): TubeStation | null {
  const key = normalizeName(name);
  const candidates = index.byName.get(key) ?? index.byName.get(key.replace(/ and /g, ' ')) ?? [];
  const stations = candidates.map((id) => index.network.stations[id]!).filter(Boolean);
  return stations.find((s) => !lineId || s.lines.includes(lineId)) ?? stations[0] ?? null;
}

export function neighbours(index: NetworkIndex, lineId: string, stationId: string): string[] {
  return [...(index.adjacency.get(lineId)?.get(stationId) ?? [])];
}

export const distance = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) =>
  Math.hypot((a.lat - b.lat) * 111.2, (a.lon - b.lon) * 69.3);

/** Ordered unique stations of a line (longest branch first) – for route explorers and the LED board. */
export function lineStationOrder(line: NetworkLine): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of [...line.branches].sort((x, y) => y.stationIds.length - x.stationIds.length)) {
    for (const id of b.stationIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Splits a line into distinct "segments" for display: the longest branch, then the parts of
 * other branches that are not already covered (e.g. Northern's Mill Hill East spur).
 */
export function lineSegments(line: NetworkLine): string[][] {
  const covered = new Set<string>();
  const out: string[][] = [];
  const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  for (const b of [...line.branches].sort((x, y) => y.stationIds.length - x.stationIds.length)) {
    let run: string[] = [];
    for (let i = 0; i < b.stationIds.length - 1; i++) {
      const a = b.stationIds[i]!;
      const c = b.stationIds[i + 1]!;
      const k = edgeKey(a, c);
      if (covered.has(k)) {
        if (run.length > 1) out.push(run);
        run = [];
        continue;
      }
      covered.add(k);
      if (!run.length) run.push(a);
      run.push(c);
    }
    if (run.length > 1) out.push(run);
  }
  return out;
}
