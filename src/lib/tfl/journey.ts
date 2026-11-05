// TfL Journey Planner → domain model. Relative imports only (bundled with the server).
import { lineColour } from '../../data/tube-colors';
import type { RawJourney, RawJourneyLeg, RawJourneyPoint, RawJourneyResponse } from './raw';
import type { Journey, JourneyLeg, JourneyStop } from './types';

const WALK_COLOUR = '#667085';
const BUS_COLOUR = '#DC241F';

function parsePath(lineString: string | undefined): [number, number][] {
  if (!lineString) return [];
  try {
    const pts = JSON.parse(lineString) as unknown;
    if (!Array.isArray(pts)) return [];
    const out: [number, number][] = [];
    for (const p of pts) {
      if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') out.push([p[1], p[0]]);
    }
    return out;
  } catch {
    return [];
  }
}

const cleanName = (n: string | undefined) =>
  (n ?? '').replace(/\s+Underground Station$/i, '').replace(/\s+\(London\)$/i, '').replace(/\s+(DLR|Rail) Station$/i, '').trim() || 'Punkt na trasie';

function stop(p: RawJourneyPoint | undefined): JourneyStop {
  return {
    name: cleanName(p?.commonName),
    lat: typeof p?.lat === 'number' ? p.lat : null,
    lng: typeof p?.lon === 'number' ? p.lon : null,
    stationId: p?.naptanId ?? null,
  };
}

function direction(leg: RawJourneyLeg): string | null {
  const d = leg.routeOptions?.[0]?.directions?.[0];
  if (d) return cleanName(d);
  const m = leg.instruction?.detailed?.match(/towards (.+)$/i);
  return m ? cleanName(m[1]) : null;
}

export function adaptLeg(leg: RawJourneyLeg): JourneyLeg {
  const mode = leg.mode?.id ?? 'walking';
  const line = leg.routeOptions?.[0]?.lineIdentifier;
  const lineId = mode === 'walking' ? null : (line?.id ?? null);
  const colour = mode === 'walking' ? WALK_COLOUR : mode === 'bus' ? BUS_COLOUR : lineColour(lineId ?? mode);
  const stops = leg.path?.stopPoints ?? [];
  return {
    mode,
    lineId,
    lineName: mode === 'walking' ? null : (line?.name ?? leg.routeOptions?.[0]?.name ?? leg.mode?.name ?? null),
    colour,
    from: stop(leg.departurePoint),
    to: stop(leg.arrivalPoint),
    departure: leg.departureTime,
    arrival: leg.arrivalTime,
    durationMin: leg.duration,
    summary: leg.instruction?.summary ?? '',
    direction: mode === 'walking' ? null : direction(leg),
    stopCount: mode === 'walking' ? 0 : Math.max(0, stops.length - 1),
    path: parsePath(leg.path?.lineString),
    distanceM: typeof leg.distance === 'number' ? Math.round(leg.distance) : null,
    disrupted: !!leg.isDisrupted,
  };
}

export function adaptJourney(raw: RawJourney, index: number): Journey {
  const legs = raw.legs.map(adaptLeg);
  const rides = legs.filter((l) => l.mode !== 'walking');
  return {
    id: `j${index}-${raw.startDateTime}-${raw.duration}`,
    departure: raw.startDateTime,
    arrival: raw.arrivalDateTime,
    durationMin: raw.duration,
    walkMin: legs.filter((l) => l.mode === 'walking').reduce((s, l) => s + l.durationMin, 0),
    transfers: Math.max(0, rides.length - 1),
    legs,
    farePence: typeof raw.fare?.totalCost === 'number' ? raw.fare.totalCost : null,
  };
}

export function adaptJourneys(raw: RawJourneyResponse): Journey[] {
  return (raw.journeys ?? []).filter((j) => Array.isArray(j.legs) && j.legs.length).map(adaptJourney);
}

export type JourneyRank = 'fastest' | 'fewest-changes' | 'least-walking';

export const JOURNEY_RANK_LABEL: Record<JourneyRank, string> = {
  fastest: 'Najszybsza',
  'fewest-changes': 'Najmniej przesiadek',
  'least-walking': 'Najmniej chodzenia',
};

export interface RankedJourney {
  journey: Journey;
  ranks: JourneyRank[];
}

/**
 * Picks up to three alternatives: fastest, fewest changes, least walking. When one journey wins
 * several categories it is shown once with every label it earned, and the next best fills in.
 */
export function rankJourneys(journeys: Journey[]): RankedJourney[] {
  if (!journeys.length) return [];
  const pick = (cmp: (a: Journey, b: Journey) => number) => [...journeys].sort(cmp)[0]!;
  const winners: [JourneyRank, Journey][] = [
    ['fastest', pick((a, b) => a.durationMin - b.durationMin || a.transfers - b.transfers)],
    ['fewest-changes', pick((a, b) => a.transfers - b.transfers || a.durationMin - b.durationMin)],
    ['least-walking', pick((a, b) => a.walkMin - b.walkMin || a.durationMin - b.durationMin)],
  ];
  const out: RankedJourney[] = [];
  for (const [rank, j] of winners) {
    const hit = out.find((r) => r.journey.id === j.id);
    if (hit) hit.ranks.push(rank);
    else out.push({ journey: j, ranks: [rank] });
  }
  for (const j of [...journeys].sort((a, b) => a.durationMin - b.durationMin)) {
    if (out.length >= 3) break;
    if (!out.some((r) => r.journey.id === j.id)) out.push({ journey: j, ranks: [] });
  }
  return out;
}
