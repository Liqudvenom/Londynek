// Turns TfL arrival predictions into train "sightings" and estimated visual positions.
// TfL does not publish GPS for Tube trains: positions are interpolations between stations,
// derived from timeToStation and currentLocation. Never present them as GPS.
// Shared with the server – keep imports relative.
import { parseCurrentLocation, splitBetween } from './names';
import { distance, neighbours, resolveStationName, type NetworkIndex } from './network';
import type { TrainPrediction, TrainSighting } from './types';

const DEFAULT_SEGMENT = 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Picks the station a train came from: the neighbour of `to` facing away from where it heads next. */
function previousStation(index: NetworkIndex, lineId: string, toId: string, ahead: string | null): string | null {
  const stations = index.network.stations;
  const options = neighbours(index, lineId, toId).filter((id) => id !== ahead);
  if (options.length <= 1) return options[0] ?? null;
  const target = ahead ? stations[ahead] : null;
  if (!target) return null;
  return options.reduce((best, id) => (distance(stations[id]!, target) > distance(stations[best]!, target) ? id : best));
}

export function buildSightings(predictions: TrainPrediction[], index: NetworkIndex, observedAt: string): TrainSighting[] {
  const groups = new Map<string, TrainPrediction[]>();
  for (const p of predictions) {
    if (!p.vehicleId || !index.network.stations[p.stationId]) continue;
    const key = `${p.lineId}:${p.vehicleId}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }

  const out: TrainSighting[] = [];
  for (const [key, list] of groups) {
    list.sort((a, b) => a.timeToStation - b.timeToStation);
    const primary = list[0]!;
    const lineId = primary.lineId;
    const sameTrip = list.filter((p) => p.destinationId === primary.destinationId);
    const following = sameTrip.find((p) => p.stationId !== primary.stationId) ?? null;

    let to = primary.stationId;
    let from: string | null = null;
    let tts = primary.timeToStation;
    let atStation = false;
    let segment = following ? clamp(following.timeToStation - primary.timeToStation, 45, 240) : DEFAULT_SEGMENT;

    const loc = parseCurrentLocation(primary.currentLocation);
    const resolve = (name: string) => resolveStationName(index, name, lineId);
    if (loc.kind === 'at' && loc.a) {
      const at = resolve(loc.a);
      if (at && at.id === to) atStation = true;
      else if (at) {
        from = at.id;
        segment = Math.max(tts, 30);
      }
    } else if (loc.kind === 'between' && loc.a) {
      const pair = splitBetween(loc.a, resolve);
      if (pair) {
        from = pair[0].id;
        if (pair[1].id !== to) {
          to = pair[1].id;
          tts = Math.min(tts, segment / 2);
        }
      }
    } else if (loc.kind === 'departed' && loc.a) {
      from = resolve(loc.a)?.id ?? null;
      segment = Math.max(segment, tts + 10);
    } else if (loc.kind === 'approaching') {
      tts = Math.min(tts, 30);
    }

    if (!from && !atStation) from = previousStation(index, lineId, to, following?.stationId ?? null);
    if (from === to) from = null;

    out.push({
      key,
      vehicleId: primary.vehicleId!,
      lineId,
      direction: primary.direction,
      towards: primary.towards,
      platform: primary.platform,
      currentLocation: primary.currentLocation,
      fromStationId: from,
      toStationId: to,
      timeToStation: Math.round(tts),
      segmentSeconds: Math.round(segment),
      atStation: atStation || (!from && tts < 20),
      observedAt,
      nextStops: sameTrip.slice(0, 4).map((p) => ({ stationId: p.stationId, name: p.stationName, timeToStation: p.timeToStation })),
    });
  }
  return out;
}

export interface EstimatedVisualPosition {
  lat: number;
  lon: number;
  /** Degrees clockwise from east, for orienting the marker */
  angle: number;
  /** 0 = at fromStation, 1 = at toStation */
  progress: number;
  secondsToNext: number;
}

/**
 * Where to draw a train at time `now` (ms). Linear interpolation between the two stations:
 * this is a visual estimate, not a measured location.
 */
export function estimatedVisualPosition(s: TrainSighting, index: NetworkIndex, now: number): EstimatedVisualPosition | null {
  const to = index.network.stations[s.toStationId];
  if (!to) return null;
  const from = s.fromStationId ? index.network.stations[s.fromStationId] : null;
  const elapsed = (now - Date.parse(s.observedAt)) / 1000;
  const remaining = s.timeToStation - elapsed;
  if (!from || s.atStation) return { lat: to.lat, lon: to.lon, angle: 0, progress: 1, secondsToNext: Math.max(0, remaining) };
  const progress = clamp(1 - remaining / s.segmentSeconds, 0, 1);
  const lat = from.lat + (to.lat - from.lat) * progress;
  const lon = from.lon + (to.lon - from.lon) * progress;
  const angle = (Math.atan2(-(to.lat - from.lat) * 1.6, to.lon - from.lon) * 180) / Math.PI;
  return { lat, lon, angle, progress, secondsToNext: Math.max(0, remaining) };
}
