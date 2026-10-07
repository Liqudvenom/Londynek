// Raw TfL JSON → domain models. Pure functions, shared by the server and unit tests.
// Shared with the server – keep imports relative.
import { isTubeLineId, lineColour, tubeLineColours, type TubeLineId } from '../../data/tube-colors';
import { cleanStationName } from './names';
import type { RawLine, RawMatchedStop, RawPrediction, RawRoute, RawRouteSequence, RawSearchResponse, RawStopPoint, RawTimetableResponse } from './raw';
import type {
  Disruption,
  LineRoute,
  LineStatus,
  NetworkLine,
  StationDetail,
  StationSearchResult,
  StatusLevel,
  Timetable,
  TrainPrediction,
  TubeNetwork,
  TubeStation,
} from './types';

const CLOSED = new Set([1, 2, 4, 16, 20]);
const SEVERE = new Set([3, 5, 6, 11]);
const GOOD = new Set([10, 18, 19]);

/** TfL statusSeverity → coarse level used for colour/iconography. */
export function severityLevel(code: number): StatusLevel {
  if (CLOSED.has(code)) return 'closed';
  if (SEVERE.has(code)) return 'severe';
  if (GOOD.has(code)) return 'good';
  if (Number.isFinite(code)) return 'minor';
  return 'unknown';
}

const LEVEL_RANK: Record<StatusLevel, number> = { closed: 4, severe: 3, minor: 2, unknown: 1, good: 0 };
export const worseLevel = (a: StatusLevel, b: StatusLevel) => (LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b);

const tidy = (s: string | undefined | null) => (s ?? '').replace(/\s+/g, ' ').trim();

export function adaptLineStatuses(raw: RawLine[]): LineStatus[] {
  return raw.map((line) => {
    const statuses = line.lineStatuses ?? [];
    let level: StatusLevel = statuses.length ? 'good' : 'unknown';
    let worst = statuses[0];
    for (const s of statuses) {
      const l = severityLevel(s.statusSeverity);
      if (LEVEL_RANK[l] > LEVEL_RANK[level] || !worst) worst = s;
      level = worseLevel(level, l);
    }
    const disruptions: Disruption[] = statuses
      .filter((s) => !GOOD.has(s.statusSeverity))
      .map((s) => ({
        lineId: line.id,
        severity: severityLevel(s.statusSeverity),
        severityDescription: s.statusSeverityDescription,
        description: tidy(s.reason || s.disruption?.description),
        reason: tidy(s.disruption?.additionalInfo) || null,
        category: s.disruption?.categoryDescription ?? null,
      }));
    return {
      id: line.id,
      name: isTubeLineId(line.id) ? tubeLineColours[line.id].name : line.name,
      mode: line.modeName,
      colour: lineColour(line.id),
      level,
      severity: worst?.statusSeverity ?? -1,
      statusDescription: worst?.statusSeverityDescription ?? 'Unknown',
      disruptions,
    };
  });
}

const stationIdOf = (s: RawMatchedStop) => s.stationId ?? s.id;
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/** Ramer–Douglas–Peucker on [lon, lat] points (tolerance in degrees). */
export function simplifyLine(pts: [number, number][], tol = 2e-5): [number, number][] {
  if (pts.length < 3) return pts;
  const a = pts[0]!;
  const b = pts[pts.length - 1]!;
  let max = 0;
  let idx = 0;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const d = len === 0 ? Math.hypot(p[0] - a[0], p[1] - a[1]) : Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) [max, idx] = [d, i];
  }
  if (max <= tol) return [a, b];
  return [...simplifyLine(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplifyLine(pts.slice(idx), tol)];
}

export function parseLineStrings(lineStrings: string[]): [number, number][][] {
  const out: [number, number][][] = [];
  for (const s of new Set(lineStrings)) {
    try {
      const parsed = JSON.parse(s) as [number, number][][];
      for (const poly of parsed) if (poly.length > 1) out.push(simplifyLine(poly.map(([lon, lat]) => [round5(lon), round5(lat)])));
    } catch {
      /* malformed lineString – skip, stations still render */
    }
  }
  return out;
}

export function adaptRouteSequence(raw: RawRouteSequence): { line: NetworkLine; stations: TubeStation[] } {
  const regular = raw.orderedLineRoutes.filter((r) => r.serviceType === 'Regular');
  const routes = regular.length ? regular : raw.orderedLineRoutes;
  const stops = new Map<string, RawMatchedStop>();
  for (const s of raw.stations) stops.set(stationIdOf(s), s);
  for (const seq of raw.stopPointSequences) for (const s of seq.stopPoint) if (!stops.has(stationIdOf(s))) stops.set(stationIdOf(s), s);

  const branches = routes
    .map((r) => ({ name: tidy(r.name.replace(/&harr;/g, '↔')), stationIds: r.naptanIds.filter((id) => stops.has(id)) }))
    .filter((b) => b.stationIds.length > 1);
  const used = new Set(branches.flatMap((b) => b.stationIds));

  const id = raw.lineId;
  const line: NetworkLine = {
    id,
    name: isTubeLineId(id) ? tubeLineColours[id].name : raw.lineName,
    colour: lineColour(id),
    branches,
    geometry: parseLineStrings(raw.lineStrings),
  };
  const stations: TubeStation[] = [...stops.entries()]
    .filter(([sid]) => used.has(sid))
    .map(([sid, s]) => ({
      id: sid,
      name: cleanStationName(s.name),
      lat: s.lat,
      lon: s.lon,
      lines: [id],
      interchange: false,
      zone: s.zone ?? null,
      hubId: s.topMostParentId && s.topMostParentId.startsWith('HUB') ? s.topMostParentId : null,
    }));
  return { line, stations };
}

/** Merges per-line sequences into one network; interchange = served by 2+ Tube lines. */
export function mergeNetwork(parts: { line: NetworkLine; stations: TubeStation[] }[]): TubeNetwork {
  const stations: Record<string, TubeStation> = {};
  for (const { line, stations: list } of parts) {
    for (const s of list) {
      const existing = stations[s.id];
      if (existing) {
        if (!existing.lines.includes(line.id)) existing.lines.push(line.id);
      } else {
        stations[s.id] = { ...s, lines: [line.id] };
      }
    }
  }
  for (const s of Object.values(stations)) s.interchange = s.lines.length > 1;
  return { lines: parts.map((p) => p.line), stations };
}

export function adaptPredictions(raw: RawPrediction[]): TrainPrediction[] {
  return raw
    .filter((p) => Number.isFinite(p.timeToStation))
    .map((p) => ({
      id: p.id,
      vehicleId: p.vehicleId && p.vehicleId !== '000' ? p.vehicleId : null,
      lineId: p.lineId,
      lineName: isTubeLineId(p.lineId) ? tubeLineColours[p.lineId as TubeLineId].name : p.lineName,
      stationId: p.naptanId,
      stationName: cleanStationName(p.stationName),
      platform: tidy(p.platformName) || null,
      direction: p.direction || null,
      towards: tidy(p.towards) || cleanStationName(p.destinationName ?? '') || 'Sprawdź tablicę na peronie',
      destinationId: p.destinationNaptanId || null,
      timeToStation: Math.max(0, Math.round(p.timeToStation)),
      expectedArrival: p.expectedArrival,
      currentLocation: tidy(p.currentLocation) || null,
      timestamp: p.timestamp,
    }))
    .sort((a, b) => a.timeToStation - b.timeToStation);
}

export function adaptRoute(raw: RawRoute): LineRoute {
  const sections = raw.routeSections.filter((s) => s.serviceType === 'Regular');
  return {
    id: raw.id,
    name: raw.name,
    sections: (sections.length ? sections : raw.routeSections).map((s) => ({
      name: tidy(s.name.replace(/&harr;/g, '↔')),
      direction: s.direction,
      origin: cleanStationName(s.originationName),
      destination: cleanStationName(s.destinationName),
      originId: s.originator,
      destinationId: s.destination,
    })),
  };
}

export function adaptSearch(raw: RawSearchResponse): StationSearchResult[] {
  return raw.matches
    .filter((m) => !m.modes || m.modes.includes('tube'))
    .map((m) => ({ id: m.id, name: cleanStationName(m.name), lat: m.lat, lon: m.lon, hub: m.id.startsWith('HUB'), zone: m.zone ?? null }));
}

const FACILITY_LABEL: Record<string, string> = {
  Lifts: 'Windy',
  WiFi: 'Wi-Fi',
  Toilets: 'Toalety',
  AccessViaLift: 'Dostęp windą',
  LimitedCapacityLift: 'Winda o ograniczonej pojemności',
  Toilet: 'Toaleta dostępna',
  'Ticket Halls': 'Hale biletowe',
  Escalators: 'Schody ruchome',
  Gates: 'Bramki',
  'Car park': 'Parking',
  'Cash Machines': 'Bankomaty',
  'Payphones': 'Telefony',
  'Bridge': 'Kładka',
};

/** TfL answers a station id inside a hub with the whole hub; station-level data sits in `children`. */
function findStopNode(raw: RawStopPoint, id: string): RawStopPoint | null {
  if ((raw.naptanId ?? raw.id) === id) return raw;
  for (const c of raw.children ?? []) {
    const hit = findStopNode(c, id);
    if (hit) return hit;
  }
  return null;
}

export function adaptStopPoint(raw: RawStopPoint, requestedId?: string): StationDetail {
  const node = (requestedId && findStopNode(raw, requestedId)) || raw;
  const props = node.additionalProperties ?? [];
  const lift = props.find((p) => p.key === 'AccessViaLift');
  return {
    id: node.naptanId ?? node.id,
    name: cleanStationName(node.commonName),
    lat: node.lat,
    lon: node.lon,
    lines: [...new Set((node.lines?.length ? node.lines : raw.lines ?? []).map((l) => l.id).filter(isTubeLineId))],
    otherModes: (raw.modes ?? []).filter((m) => m !== 'tube' && m !== 'bus'),
    facilities: props
      .filter((p) => (p.category === 'Facility' || p.category === 'Accessibility') && FACILITY_LABEL[p.key])
      .map((p) => ({ label: FACILITY_LABEL[p.key]!, value: p.value })),
    liftAccess: lift ? /^yes/i.test(lift.value) : null,
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const addMinutes = (h: number, m: number, add: number) => {
  const total = h * 60 + m + add;
  return `${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
};

export function adaptTimetable(raw: RawTimetableResponse, fromId: string, toId: string): Timetable | null {
  const tt = raw.timetable;
  if (!tt?.routes?.length) return null;
  const stops = [...(raw.stops ?? []), ...(raw.stations ?? [])];
  const nameOf = (id: string) => cleanStationName(stops.find((s) => stationIdOf(s) === id || s.id === id)?.name ?? id);
  const schedules = new Map<string, { time: string; arrival: string | null; sort: number }[]>();
  let travel: number | null = null;
  for (const route of tt.routes) {
    const intervals = new Map(route.stationIntervals.map((si) => [Number(si.id), si.intervals]));
    for (const sch of route.schedules) {
      const list = schedules.get(sch.name) ?? [];
      for (const j of sch.knownJourneys) {
        const h = Number(j.hour);
        const m = Number(j.minute);
        const toArr = intervals.get(j.intervalId)?.find((i) => i.stopId === toId)?.timeToArrival;
        if (toArr === undefined) continue;
        travel ??= Math.round(toArr);
        list.push({ time: addMinutes(h, m, 0), arrival: addMinutes(h, m, Math.round(toArr)), sort: h * 60 + m });
      }
      schedules.set(sch.name, list);
    }
  }
  const out = [...schedules.entries()]
    .map(([name, deps]) => ({
      name,
      departures: deps
        .sort((a, b) => a.sort - b.sort)
        .filter((d, i, arr) => i === 0 || d.time !== arr[i - 1]!.time)
        .map(({ time, arrival }) => ({ time, arrival })),
    }))
    .filter((s) => s.departures.length);
  if (!out.length) return null;
  return {
    lineId: raw.lineId,
    fromId,
    fromName: nameOf(tt.departureStopId || fromId),
    toId,
    toName: nameOf(toId),
    direction: raw.direction,
    travelMinutes: travel,
    schedules: out,
  };
}

/** Picks the TfL schedule that applies to a given date ("Monday - Thursday", "Friday", "Saturday (also Good Friday)", "Sunday"). */
export function scheduleForDate<T extends { name: string }>(schedules: T[], date: Date): T | undefined {
  const day = date.getDay();
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = names[day]!;
  const covers = (name: string) => {
    const n = name.toLowerCase().replace(/\(.*?\)/g, '');
    if (n.includes(today)) return true;
    const range = n.match(/(\w+day)\s*-\s*(\w+day)/);
    if (range) {
      const a = names.indexOf(range[1]!);
      const b = names.indexOf(range[2]!);
      if (a >= 0 && b >= 0) return a <= b ? day >= a && day <= b : day >= a || day <= b;
    }
    return false;
  };
  return schedules.find((s) => covers(s.name)) ?? schedules[0];
}
