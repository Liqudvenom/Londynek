import type { GeoLocation } from '@/lib/location/types';

/**
 * Location fixtures for the demo data.
 * - Outcode centroids come from postcodes.io (fetched 2026-10-07).
 * - Fictional listings only get an approximate `area` point – never an invented street address.
 *   Points in the same postcode district are spread up to ~350 m apart (deterministic per id)
 *   so pins don't stack; they are always labelled as approximate in the UI.
 * - Public venues and the seed businesses use real addresses (postcode centroids).
 */
const AREAS = {
  E14: { lat: 51.50616, lng: -0.01813, district: 'Canary Wharf', borough: 'Tower Hamlets' },
  E15: { lat: 51.54027, lng: 0.00321, district: 'Stratford', borough: 'Newham' },
  E20: { lat: 51.54632, lng: -0.01065, district: 'Stratford (Olympic Park)', borough: 'Newham' },
  E8: { lat: 51.54379, lng: -0.06611, district: 'Hackney', borough: 'Hackney' },
  EC2A: { lat: 51.52369, lng: -0.08548, district: 'Shoreditch', borough: 'Hackney' },
  UB2: { lat: 51.49968, lng: -0.37888, district: 'Southall', borough: 'Ealing' },
  W6: { lat: 51.49256, lng: -0.22843, district: 'Hammersmith', borough: 'Hammersmith and Fulham' },
  W1D: { lat: 51.51333, lng: -0.1327, district: 'Soho', borough: 'Westminster' },
  W1U: { lat: 51.5187, lng: -0.15348, district: 'Marylebone', borough: 'Westminster' },
  WC2N: { lat: 51.50913, lng: -0.12492, district: 'Charing Cross', borough: 'Westminster' },
  W5: { lat: 51.51337, lng: -0.30219, district: 'Ealing', borough: 'Ealing' },
  W3: { lat: 51.51107, lng: -0.26753, district: 'Acton', borough: 'Ealing' },
  HA9: { lat: 51.56064, lng: -0.28507, district: 'Wembley', borough: 'Brent' },
  NW1: { lat: 51.5334, lng: -0.14385, district: 'Camden Town', borough: 'Camden' },
  /** Park Royal station (TfL) – NW10's centroid sits in Harlesden, ~2 km away. */
  NW10: { lat: 51.52712, lng: -0.28434, district: 'Park Royal', borough: 'Brent' },
  CR0: { lat: 51.37326, lng: -0.07797, district: 'Croydon', borough: 'Croydon' },
  SE10: { lat: 51.48492, lng: 0.00076, district: 'Greenwich', borough: 'Greenwich' },
  SE13: { lat: 51.45964, lng: -0.00966, district: 'Lewisham', borough: 'Lewisham' },
  TW9: { lat: 51.46962, lng: -0.29235, district: 'Richmond', borough: 'Richmond upon Thames' },
  TW3: { lat: 51.4683, lng: -0.36396, district: 'Hounslow', borough: 'Hounslow' },
  TW6: { lat: 51.47076, lng: -0.44872, district: 'Heathrow', borough: 'Hillingdon' },
  KT1: { lat: 51.40761, lng: -0.29828, district: 'Kingston', borough: 'Kingston upon Thames' },
} as const;

export type AreaCode = keyof typeof AREAS;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Approximate point inside a postcode district. */
export function area(code: AreaCode, seed: string, extra: Partial<GeoLocation> = {}): GeoLocation {
  const a = AREAS[code];
  const h = hash(seed);
  const angle = ((h % 360) * Math.PI) / 180;
  /* Stay inside the real postcode district so street-zoom maps match London, not a schematic. */
  const dist = 25 + ((h >>> 9) % 90);
  const lat = a.lat + (dist * Math.cos(angle)) / 111320;
  const lng = a.lng + (dist * Math.sin(angle)) / (111320 * Math.cos((a.lat * Math.PI) / 180));
  const outcode = code === 'NW10' ? 'NW10' : code;
  return { postcode: outcode, lat: +lat.toFixed(5), lng: +lng.toFixed(5), district: a.district, borough: a.borough, precision: 'area', ...extra };
}

export const areaCentre = (code: AreaCode) => AREAS[code];

const exact = (address: string, postcode: string, lat: number, lng: number, district: string, borough: string): GeoLocation => ({
  address,
  postcode,
  lat,
  lng,
  district,
  borough,
  precision: 'exact',
});

/** Public venues (events) – real addresses. */
export const VENUES = {
  posk: exact('238–246 King St', 'W6 0RF', 51.49345, -0.23715, 'Hammersmith', 'Hammersmith and Fulham'),
  o2forum: exact('9–17 Highgate Rd', 'NW5 1JY', 51.5518, -0.14202, 'Kentish Town', 'Camden'),
  ognisko: exact('55 Exhibition Rd', 'SW7 2PG', 51.49921, -0.17369, 'South Kensington', 'Westminster'),
  olympia: exact('Hammersmith Rd', 'W14 8UX', 51.4962, -0.2101, 'Olympia', 'Hammersmith and Fulham'),
  grandClapham: exact("21–25 St John's Hill", 'SW11 1TT', 51.46291, -0.17003, 'Clapham Junction', 'Wandsworth'),
  hydePark: exact('Hyde Park', 'W2 2UH', 51.5073, -0.1657, 'Hyde Park', 'Westminster'),
} satisfies Record<string, GeoLocation>;

/** Real places used as seed/demo directory entries (not Londynek customers). */
export const SEED_PLACES = {
  ognisko: VENUES.ognisko,
  kollos: exact('Stoke Newington High St', 'N16 7HU', 51.5629, -0.07318, 'Stoke Newington', 'Hackney'),
  miodMalina: exact('315 Horn Ln', 'W3 0BU', 51.51902, -0.26581, 'Acton', 'Ealing'),
  mamuska: exact('9 Addington St', 'SE1 7RY', 51.5012, -0.11535, 'Waterloo', 'Lambeth'),
  daquise: exact('20 Thurloe St', 'SW7 2LT', 51.4943, -0.17379, 'South Kensington', 'Kensington and Chelsea'),
  klosDeli: exact('33–35 Lewis Grove', 'SE13 6BG', 51.4618, -0.00949, 'Lewisham', 'Lewisham'),
  pisoria: exact('101 Roman Rd', 'E2 0QN', 51.52864, -0.04945, 'Bethnal Green', 'Tower Hamlets'),
  rightRoom: exact('3 Hastings St', 'WC1H 9PZ', 51.52785, -0.12608, "King's Cross", 'Camden'),
  euroLondon: exact('33 Cannon St', 'EC4M 5SB', 51.51275, -0.09498, 'City of London', 'City of London'),
} satisfies Record<string, GeoLocation>;

const A = (code: AreaCode, extra?: Partial<GeoLocation>) => (id: string) => area(code, id, extra);

/** id → location builder. Listings missing here cover "all of London" and have no point. */
const PLAN: Record<string, (id: string) => GeoLocation> = {
  // Classifieds
  'l-1': A('E15'),
  'l-2': A('UB2'),
  'l-4': A('W6'),
  'l-6': A('W1D'),
  'l-7': A('HA9'),
  'l-9': A('CR0'),
  'l-10': A('W5', { serviceRadiusKm: 8 }),
  'l-11': A('E15'),
  'l-12': A('NW1'),
  'l-13': A('W5'),
  'l-14': A('SE10'),
  'l-15': A('TW9'),
  'l-16': A('HA9'),
  'l-17': A('E8'),
  'l-18': A('CR0'),
  'l-19': A('W6'),
  'l-20': A('E8'),
  'l-21': A('W5'),
  'l-22': A('KT1'),
  'l-23': A('W6'),
  'l-24': A('W6'),
  'l-25': A('HA9'),
  'l-26': A('TW6'),
  // Property
  'p-1': A('E14'),
  'p-2': A('W5'),
  'p-3': A('W1U'),
  'p-4': A('HA9'),
  'p-5': A('E20'),
  'p-6': A('CR0'),
  'p-7': A('W6'),
  'p-8': A('TW9'),
  'p-9': A('SE10'),
  'p-10': A('TW3'),
  'p-11': A('KT1'),
  'p-12': A('NW1'),
  // Jobs
  'j-1': A('TW6'),
  'j-3': A('NW10'),
  'j-5': A('W1D'),
  'j-6': A('E15'),
  'j-7': A('EC2A'),
  'j-8': A('E14'),
  'j-9': A('W5'),
  'j-10': A('W6'),
  'j-11': A('CR0'),
  // Services
  's-1': A('W5', { serviceRadiusKm: 15 }),
  's-3': A('E15', { serviceRadiusKm: 20 }),
  's-4': A('W6', { serviceRadiusKm: 10 }),
  's-5': A('WC2N'),
  's-6': A('W5'),
  's-7': A('W6'),
  's-8': A('HA9'),
  's-9': A('W5'),
  's-10': A('CR0'),
  's-11': A('NW1'),
  's-12': A('E15', { serviceRadiusKm: 12 }),
  's-13': A('W6'),
  's-14': A('W5'),
  // Vehicles
  'v-1': A('TW6'),
  'v-2': A('CR0'),
  'v-3': A('TW9'),
  'v-4': A('HA9'),
  'v-5': A('UB2'),
  'v-6': A('W5'),
};

const EVENT_VENUE: Record<string, GeoLocation | ((id: string) => GeoLocation)> = {
  'POSK, Jazz Café': VENUES.posk,
  'Teatr POSK': VENUES.posk,
  'Biblioteka Polska POSK': VENUES.posk,
  POSK: VENUES.posk,
  'O2 Forum Kentish Town': VENUES.o2forum,
  'Ognisko Polskie': VENUES.ognisko,
  'Olympia London': VENUES.olympia,
  'The Grand, Clapham': VENUES.grandClapham,
  'Hyde Park': VENUES.hydePark,
  'Lewisham Polish Centre': A('SE13'),
  'Polish Saturday School Ealing': A('W5'),
};

export function geoFor(id: string): GeoLocation | undefined {
  return PLAN[id]?.(id);
}

export function attachGeo<T extends { id: string }>(items: T[]): (T & { geo?: GeoLocation })[] {
  return items.map((item) => {
    const geo = geoFor(item.id);
    return geo ? { ...item, geo } : item;
  });
}

export function venueGeo(id: string, venue: string): GeoLocation | undefined {
  const v = EVENT_VENUE[venue];
  return typeof v === 'function' ? v(id) : v;
}
