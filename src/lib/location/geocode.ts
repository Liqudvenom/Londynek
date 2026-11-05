// Browser geocoding facade. UI components call these functions only – the provider
// (postcodes.io / Nominatim / anything else) is chosen server-side behind /api/location/*.
import { loadStations } from '@/lib/tfl/api';
import type { StationLite } from '@/lib/tfl/types';
import { allMapItems } from './mapItems';
import type { LocationResult } from './types';

export class GeocodeError extends Error {}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new GeocodeError('Brak połączenia z wyszukiwarką adresów.');
  }
  const body = (await res.json().catch(() => null)) as { data?: T; error?: { message: string } } | null;
  if (!res.ok || !body || body.error) throw new GeocodeError(body?.error?.message ?? 'Wyszukiwarka adresów jest niedostępna.');
  return body.data as T;
}

/** Postcodes, street addresses and named places → coordinates. */
export function geocode(query: string, signal?: AbortSignal): Promise<LocationResult[]> {
  return getJson<LocationResult[]>(`/api/location/search?${new URLSearchParams({ q: query })}`, signal);
}

export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stem = (t: string) => (t.length > 5 ? t.slice(0, 5) : t);

/** Londynek listings & directory entries matching the query (e.g. "Ognisko", "sklep Ealing"). */
export function matchLocalPlaces(query: string, limit = 4): LocationResult[] {
  const tokens = fold(query)
    .split(' ')
    .filter((t) => t.length >= 3)
    .map(stem);
  if (!tokens.length) return [];
  const hits: { r: LocationResult; score: number }[] = [];
  for (const item of allMapItems()) {
    const title = fold(item.title);
    const hay = `${title} ${fold(item.subtitle)} ${fold(item.geo.district)} ${fold(item.geo.borough)}`;
    if (!tokens.every((t) => hay.includes(t))) continue;
    const exactPublic = item.geo.precision === 'exact' && !item.geo.hideExact;
    hits.push({
      score: (title.startsWith(tokens[0]!) ? 2 : 0) + (item.kind === 'business' ? 1 : 0),
      r: {
        id: `local:${item.id}`,
        kind: 'place',
        label: item.title,
        detail: exactPublic ? `${item.geo.address}, ${item.geo.postcode}` : `${item.geo.district} ${item.geo.postcode} (okolica)`,
        lat: item.geo.lat,
        lng: item.geo.lng,
        formattedAddress: exactPublic ? `${item.title}, ${item.geo.address}, ${item.geo.postcode}` : `${item.geo.district} ${item.geo.postcode}`,
        postcode: item.geo.postcode,
        district: item.geo.district,
        to: item.to,
      },
    });
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((h) => h.r);
}

export function stationResult(s: StationLite): LocationResult {
  return {
    id: `st:${s.id}`,
    kind: 'station',
    label: s.name,
    detail: s.zone ? `Strefa ${s.zone}` : undefined,
    lat: s.lat,
    lng: s.lon,
    formattedAddress: `${s.name} (metro)`,
    postcode: null,
    district: null,
    stationId: s.id,
    lines: s.lines,
  };
}

export function matchStations(stations: StationLite[], query: string, limit = 4): LocationResult[] {
  const q = fold(query.replace(/\b(station|stacja|underground|tube|metro)\b/gi, ''));
  if (q.length < 2) return [];
  return stations
    .map((s) => {
      const n = fold(s.name);
      const score = n === q ? 3 : n.startsWith(q) ? 2 : n.includes(` ${q}`) ? 1 : n.includes(q) ? 0.5 : -1;
      return { s, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name, 'en'))
    .slice(0, limit)
    .map((x) => stationResult(x.s));
}

export interface GroupedResults {
  places: LocationResult[];
  stations: LocationResult[];
  addresses: LocationResult[];
  postcodes: LocationResult[];
  /** Remote geocoder failed – local and station results are still returned. */
  remoteError: string | null;
}

export const EMPTY_GROUPS: GroupedResults = { places: [], stations: [], addresses: [], postcodes: [], remoteError: null };

/** Autocomplete: MIEJSCA / STACJE / ADRESY / KODY POCZTOWE. */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GroupedResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY_GROUPS;
  const [stations, remote] = await Promise.all([
    loadStations().catch(() => [] as StationLite[]),
    q.length >= 3 || /\d/.test(q)
      ? geocode(q, signal).then(
          (r) => ({ r, err: null as string | null }),
          (e: Error) => {
            if (e.name === 'AbortError') throw e;
            return { r: [] as LocationResult[], err: e.message };
          },
        )
      : Promise.resolve({ r: [] as LocationResult[], err: null as string | null }),
  ]);
  const local = matchLocalPlaces(q);
  return {
    places: [...local, ...remote.r.filter((r) => r.kind === 'place')].slice(0, 5),
    stations: matchStations(stations, q),
    addresses: remote.r.filter((r) => r.kind === 'address').slice(0, 4),
    postcodes: remote.r.filter((r) => r.kind === 'postcode').slice(0, 4),
    remoteError: remote.err,
  };
}

/** Best single answer for free text (used when a URL carries `from=`/`to=` text only). */
export async function resolveLocation(query: string, signal?: AbortSignal): Promise<LocationResult | null> {
  const g = await searchLocations(query, signal);
  return g.postcodes[0] ?? g.stations[0] ?? g.places[0] ?? g.addresses[0] ?? null;
}
