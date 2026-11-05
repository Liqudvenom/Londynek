import { isFullPostcode, isOutcode, normalisePostcode } from '../src/lib/location/detect';
import type { LocationResult } from '../src/lib/location/types';
import { TtlCache } from './cache';

/**
 * Server-side geocoding. The UI only ever talks to /api/location/* – providers live here:
 *  - postcodes.io (free, no key) for postcodes, outcodes and reverse lookups,
 *  - Nominatim (OpenStreetMap) for street addresses and named places, bounded to London.
 * Nominatim's usage policy requires an identifying User-Agent, ≤1 request/s and caching;
 * set GEOCODER_NOMINATIM_URL to a self-hosted instance (or "off") for production traffic.
 */
export interface GeocodeEnv {
  GEOCODER_NOMINATIM_URL?: string;
  GEOCODER_USER_AGENT?: string;
}

export interface ApiResult {
  status: number;
  body: unknown;
}

const HOUR = 3600_000;
const POSTCODES_IO = 'https://api.postcodes.io';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
/** west, north, east, south – Greater London with a small margin */
const LONDON_VIEWBOX = '-0.56,51.72,0.34,51.26';
const inLondon = (lat: number, lng: number) => lat > 51.26 && lat < 51.72 && lng > -0.56 && lng < 0.34;

interface PostcodeData {
  postcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district?: string | null;
  admin_ward?: string | null;
  parish?: string | null;
}
interface OutcodeData {
  outcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district?: string[];
}
interface NominatimHit {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  addresstype?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
}

const fromPostcode = (d: PostcodeData): LocationResult | null =>
  d.latitude == null || d.longitude == null
    ? null
    : {
        id: `pc:${d.postcode}`,
        kind: 'postcode',
        label: d.postcode,
        detail: [d.admin_ward, d.admin_district].filter(Boolean).join(', '),
        lat: d.latitude,
        lng: d.longitude,
        formattedAddress: [d.postcode, d.admin_district].filter(Boolean).join(', '),
        postcode: d.postcode,
        district: d.admin_ward ?? d.admin_district ?? null,
      };

const fromOutcode = (d: OutcodeData): LocationResult | null =>
  d.latitude == null || d.longitude == null
    ? null
    : {
        id: `oc:${d.outcode}`,
        kind: 'postcode',
        label: d.outcode,
        detail: d.admin_district?.slice(0, 2).join(', ') || 'Okręg pocztowy',
        lat: d.latitude,
        lng: d.longitude,
        formattedAddress: `${d.outcode}, London`,
        postcode: d.outcode,
        district: null,
      };

const ADDRESS_TYPES = new Set(['house', 'building', 'road', 'residential', 'postcode', 'street']);

function fromNominatim(h: NominatimHit): LocationResult | null {
  const lat = Number(h.lat);
  const lng = Number(h.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inLondon(lat, lng)) return null;
  const a = h.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const district = a.suburb ?? a.neighbourhood ?? a.city_district ?? a.quarter ?? null;
  const isAddress = !!a.house_number || ADDRESS_TYPES.has(h.addresstype ?? '');
  const label = isAddress ? street || h.display_name.split(',')[0]! : h.name || h.display_name.split(',')[0]!;
  const detail = [isAddress ? null : street, district, a.postcode].filter(Boolean).join(', ');
  return {
    id: `osm:${h.place_id}`,
    kind: isAddress ? 'address' : 'place',
    label,
    detail: detail || undefined,
    lat,
    lng,
    formattedAddress: [label, street && !isAddress ? street : null, district, a.postcode].filter(Boolean).join(', '),
    postcode: a.postcode ?? null,
    district,
  };
}

export function createGeocoder(env: GeocodeEnv = {}, deps: { fetchImpl?: typeof fetch; now?: () => number; cache?: TtlCache } = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;
  const cache = deps.cache ?? new TtlCache(now, 2000);
  const nominatimBase = env.GEOCODER_NOMINATIM_URL === 'off' ? null : (env.GEOCODER_NOMINATIM_URL || NOMINATIM).replace(/\/+$/, '');
  const userAgent = env.GEOCODER_USER_AGENT || 'Londynek.net prototype (location search)';

  async function getJson<T>(url: string, init: RequestInit = {}): Promise<T | null> {
    const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', ...(init.headers ?? {}) } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`geocoder ${res.status}`);
    return (await res.json()) as T;
  }

  // Nominatim: serialise requests ≥1.1 s apart (public instance policy).
  let queue: Promise<unknown> = Promise.resolve();
  let lastCall = 0;
  const throttled = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(async () => {
      const wait = lastCall + 1100 - now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      lastCall = now();
      return fn();
    });
    queue = run.catch(() => undefined);
    return run;
  };

  async function postcodes(q: string): Promise<LocationResult[]> {
    const norm = normalisePostcode(q);
    if (norm && isFullPostcode(norm)) {
      const r = await getJson<{ result: PostcodeData }>(`${POSTCODES_IO}/postcodes/${encodeURIComponent(norm)}`);
      const hit = r?.result ? fromPostcode(r.result) : null;
      return hit ? [hit] : [];
    }
    if (norm && isOutcode(norm)) {
      const r = await getJson<{ result: OutcodeData }>(`${POSTCODES_IO}/outcodes/${encodeURIComponent(norm)}`);
      const hit = r?.result ? fromOutcode(r.result) : null;
      return hit ? [hit] : [];
    }
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]?$/i.test(q.trim())) {
      const ac = await getJson<{ result: string[] | null }>(`${POSTCODES_IO}/postcodes/${encodeURIComponent(q.trim())}/autocomplete?limit=5`);
      const list = ac?.result ?? [];
      if (!list.length) return [];
      const bulk = await getJson<{ result: { result: PostcodeData | null }[] }>(`${POSTCODES_IO}/postcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: list }),
      });
      return (bulk?.result ?? []).map((x) => (x.result ? fromPostcode(x.result) : null)).filter((x): x is LocationResult => !!x);
    }
    return [];
  }

  async function nominatim(q: string): Promise<LocationResult[]> {
    if (!nominatimBase) return [];
    const url = `${nominatimBase}/search?${new URLSearchParams({
      q,
      format: 'jsonv2',
      countrycodes: 'gb',
      viewbox: LONDON_VIEWBOX,
      bounded: '1',
      addressdetails: '1',
      limit: '6',
      'accept-language': 'en',
    })}`;
    const hits = await throttled(() => getJson<NominatimHit[]>(url, { headers: { 'User-Agent': userAgent } }));
    return (hits ?? []).map(fromNominatim).filter((x): x is LocationResult => !!x);
  }

  async function search(q: string): Promise<ApiResult> {
    const term = q.trim().replace(/\s+/g, ' ');
    if (term.length < 2) return { status: 400, body: { error: { kind: 'bad-request', message: 'Wpisz co najmniej 2 znaki.' } } };
    if (term.length > 100) return { status: 400, body: { error: { kind: 'bad-request', message: 'Zapytanie jest za długie.' } } };
    const key = `geo:${term.toLowerCase()}`;
    try {
      const r = await cache.get(key, 24 * HOUR, async () => {
        const pc = await postcodes(term);
        if (pc.length) return pc;
        return term.length >= 3 ? nominatim(term.includes('London') ? term : `${term}, London`) : [];
      });
      return { status: 200, body: { data: r.value, meta: { fetchedAt: new Date(r.fetchedAt).toISOString(), stale: r.stale } } };
    } catch (err) {
      console.error('[geocode]', (err as Error).message);
      return { status: 502, body: { error: { kind: 'unavailable', message: 'Wyszukiwarka adresów jest chwilowo niedostępna.' } } };
    }
  }

  async function reverse(latRaw: string | null, lngRaw: string | null): Promise<ApiResult> {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng) || !inLondon(lat, lng)) {
      return { status: 400, body: { error: { kind: 'bad-request', message: 'Podaj współrzędne w Londynie.' } } };
    }
    const key = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    try {
      const r = await cache.get(key, 24 * HOUR, async () => {
        const res = await getJson<{ result: PostcodeData[] | null }>(`${POSTCODES_IO}/postcodes?lon=${lng}&lat=${lat}&limit=1&radius=500`);
        const hit = res?.result?.[0];
        return hit ? fromPostcode(hit) : null;
      });
      return { status: 200, body: { data: r.value, meta: { fetchedAt: new Date(r.fetchedAt).toISOString(), stale: r.stale } } };
    } catch (err) {
      console.error('[geocode]', (err as Error).message);
      return { status: 502, body: { error: { kind: 'unavailable', message: 'Nie udało się ustalić adresu.' } } };
    }
  }

  return { search, reverse };
}
