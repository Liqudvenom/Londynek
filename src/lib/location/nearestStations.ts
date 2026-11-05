import type { NearbyStation } from './types';

export interface StationPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lines: string[];
  zone: string | null;
}

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Streets are not straight lines: 1.3 detour factor at 80 m/min (≈4.8 km/h). An estimate, not a routed time. */
export const WALK_DETOUR = 1.3;
export const WALK_M_PER_MIN = 80;
export const walkMinutes = (metres: number) => Math.max(1, Math.round((metres * WALK_DETOUR) / WALK_M_PER_MIN));

export function nearestStations(stations: Iterable<StationPoint>, lat: number, lng: number, limit = 3, maxM = 5000): NearbyStation[] {
  const out: NearbyStation[] = [];
  for (const s of stations) {
    const d = distanceM(lat, lng, s.lat, s.lon);
    if (d > maxM) continue;
    out.push({ id: s.id, name: s.name, lat: s.lat, lng: s.lon, lines: s.lines, zone: s.zone, distanceM: Math.round(d), walkMin: walkMinutes(d) });
  }
  return out.sort((a, b) => a.distanceM - b.distanceM).slice(0, limit);
}

export const formatDistance = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);
