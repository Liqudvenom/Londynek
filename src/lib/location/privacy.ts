import type { GeoLocation } from './types';

/**
 * Public-map privacy. Anyone can open the homepage map before logging in, so only public
 * places (firms, event venues) keep their real point. Everything posted by a person – a room,
 * a job at someone's home, a mobile service – is reduced to its postcode district:
 * no street, no full postcode, and a point that is not derived from the real coordinates.
 */
const CELL_DEG = 0.012;
const SPREAD_M = 260;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function isPublicPlace(geo: GeoLocation, publicKind: boolean): boolean {
  return publicKind && geo.precision === 'exact' && !geo.hideExact;
}

export function toPublicGeo(geo: GeoLocation, id: string, publicKind: boolean): GeoLocation {
  if (isPublicPlace(geo, publicKind)) return geo;
  const cellLat = (Math.floor(geo.lat / CELL_DEG) + 0.5) * CELL_DEG;
  const cellLng = (Math.floor(geo.lng / CELL_DEG) + 0.5) * CELL_DEG;
  const h = hash(id);
  const angle = ((h % 360) * Math.PI) / 180;
  const dist = 60 + ((h >>> 9) % SPREAD_M);
  return {
    postcode: geo.postcode.split(' ')[0]!,
    district: geo.district,
    borough: geo.borough,
    lat: +(cellLat + (dist * Math.cos(angle)) / 111320).toFixed(4),
    lng: +(cellLng + (dist * Math.sin(angle)) / (111320 * Math.cos((cellLat * Math.PI) / 180))).toFixed(4),
    precision: 'area',
    serviceRadiusKm: geo.serviceRadiusKm,
  };
}
