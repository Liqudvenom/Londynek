import { tubeLineColours, TUBE_LINE_IDS } from '../../data/tube-colors';
import { normalizeName } from './names';
import type { TubeNetwork, TubeStation } from './types';

export interface TransportMatch {
  stations: TubeStation[];
  lines: { id: string; name: string; colour: string }[];
}

const STRIP = /\b(station|stacja|stacji|underground|tube|metro|metrem|linia|linii|line|lin)\b/g;
const KEYWORD = /\b(station|stacja|stacji|underground|tube|metro|metrem|linia|linii|line)\b/;

/** True when the query explicitly asks about transport ("Victoria station", "metro Waterloo"). */
export function hasTransportKeyword(query: string): boolean {
  return KEYWORD.test(normalizeName(query));
}

/** Local search over the cached network: "Victoria station", "Central line", "metro Waterloo". */
export function matchTransport(network: TubeNetwork, query: string, limit = 8): TransportMatch {
  const raw = normalizeName(query);
  const q = raw.replace(STRIP, ' ').replace(/\s+/g, ' ').trim();
  if (!q) return { stations: [], lines: [] };
  const lines = TUBE_LINE_IDS.filter((id) => normalizeName(tubeLineColours[id].name).includes(q)).map((id) => ({
    id,
    name: tubeLineColours[id].name,
    colour: tubeLineColours[id].colour,
  }));
  const scored: [number, TubeStation][] = [];
  for (const s of Object.values(network.stations)) {
    const n = normalizeName(s.name);
    const score = n === q ? 0 : n.startsWith(q) ? 1 : n.split(' ').some((w) => w.startsWith(q)) ? 2 : n.includes(q) ? 3 : -1;
    if (score >= 0) scored.push([score * 10 - s.lines.length, s]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name));
  return { stations: scored.slice(0, limit).map(([, s]) => s), lines };
}

/**
 * Site-wide variant: without a transport keyword only confident matches are returned
 * (station name starts with the query, line name matches), so "praca" or "ham" don't
 * flood general search results with stations.
 */
export function matchTransportForSiteSearch(network: TubeNetwork, query: string, limit = 4): TransportMatch {
  if (normalizeName(query).length < 3) return { stations: [], lines: [] };
  if (hasTransportKeyword(query)) return matchTransport(network, query, limit);
  const q = normalizeName(query);
  const all = matchTransport(network, query, 20);
  return {
    stations: all.stations.filter((s) => normalizeName(s.name).startsWith(q)).slice(0, limit),
    lines: all.lines.filter((l) => normalizeName(l.name).startsWith(q)),
  };
}
