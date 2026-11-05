import type { JourneyPlace, LocationResult } from './types';

export type RouteEndKey = 'from' | 'to';

/** URL format: from=<name>&fromLat=&fromLng= or from=<name>&fromId=<NaPTAN>; `toName` is accepted as an alias of `to`. */
export function placeToParams(key: RouteEndKey, p: JourneyPlace): Record<string, string> {
  const out: Record<string, string> = { [key]: p.name };
  if (p.stationId) out[`${key}Id`] = p.stationId;
  else if (p.lat != null && p.lng != null) {
    out[`${key}Lat`] = p.lat.toFixed(5);
    out[`${key}Lng`] = p.lng.toFixed(5);
  }
  return out;
}

export function resultToPlace(r: LocationResult): JourneyPlace {
  return r.stationId ? { name: r.label, stationId: r.stationId, lat: r.lat, lng: r.lng } : { name: r.label, lat: r.lat, lng: r.lng };
}

export interface ParsedEnd {
  place: JourneyPlace | null;
  /** Free text that still needs geocoding */
  text: string | null;
}

export function parseRouteEnd(params: URLSearchParams, key: RouteEndKey): ParsedEnd {
  const name = params.get(key) ?? params.get(`${key}Name`) ?? '';
  const id = params.get(`${key}Id`);
  const lat = Number(params.get(`${key}Lat`));
  const lng = Number(params.get(`${key}Lng`));
  if (id && /^[A-Z0-9]{4,20}$/i.test(id)) return { place: { name: name || id, stationId: id }, text: null };
  if (params.has(`${key}Lat`) && Number.isFinite(lat) && Number.isFinite(lng)) return { place: { name: name || 'Wybrany punkt', lat, lng }, text: null };
  return { place: null, text: name.trim() || null };
}

/** Value accepted by /api/transport/journey */
export function journeyParam(p: JourneyPlace): string | null {
  if (p.stationId) return p.stationId;
  if (p.lat != null && p.lng != null) return `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
  return null;
}

export function routeSearchUrl(from: JourneyPlace | null, to: JourneyPlace | null, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({ ...(from ? placeToParams('from', from) : {}), ...(to ? placeToParams('to', to) : {}), ...extra });
  return `/transport/tube?${q}`;
}

/** Popular destinations (TfL hub station ids). */
export const QUICK_DESTINATIONS: JourneyPlace[] = [
  { name: 'Heathrow', stationId: '940GZZLUHRC' },
  { name: 'Victoria', stationId: '940GZZLUVIC' },
  { name: 'Oxford Circus', stationId: '940GZZLUOXC' },
  { name: 'Canary Wharf', stationId: '940GZZLUCYF' },
  { name: 'London Bridge', stationId: '940GZZLULNB' },
];
