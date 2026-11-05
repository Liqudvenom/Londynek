import { TUBE_LINE_IDS, isTubeLineId } from '../src/data/tube-colors';
import {
  adaptLineStatuses,
  adaptPredictions,
  adaptRoute,
  adaptRouteSequence,
  adaptSearch,
  adaptStopPoint,
  adaptTimetable,
  mergeNetwork,
} from '../src/lib/tfl/adapters';
import { adaptJourneys } from '../src/lib/tfl/journey';
import { indexNetwork, type NetworkIndex } from '../src/lib/tfl/network';
import { buildSightings } from '../src/lib/tfl/trains';
import type {
  RawJourneyResponse,
  RawLine,
  RawPrediction,
  RawRoute,
  RawRouteSequence,
  RawSearchResponse,
  RawStopPoint,
  RawTimetableResponse,
} from '../src/lib/tfl/raw';
import type { ApiErrorBody, ApiEnvelope, StationLite, TubeNetwork } from '../src/lib/tfl/types';
import { TtlCache } from './cache';
import { TflError, type TflGet } from './tfl-client';

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;

export const TTL = {
  lines: 24 * HOUR,
  network: 24 * HOUR,
  route: 24 * HOUR,
  station: 24 * HOUR,
  search: HOUR,
  status: 45 * SEC,
  arrivals: 15 * SEC,
  vehicles: 20 * SEC,
  timetable: 10 * MIN,
  journey: MIN,
};

const STATUS_MODES = new Set(['tube', 'elizabeth-line', 'overground', 'dlr', 'national-rail']);
const STATION_ID = /^[A-Z0-9]{4,20}$/i;
const LAT_LNG = /^(-?\d{1,2}(?:\.\d{1,7})?),(-?\d{1,3}(?:\.\d{1,7})?)$/;
const JOURNEY_MODES = 'tube,dlr,overground,elizabeth-line,walking';

/** Journey ends: "lat,lng" inside Greater London's surroundings, or a NaPTAN stop id. */
export function parseJourneyEnd(raw: string | null): string | null {
  const v = (raw ?? '').trim();
  const ll = v.match(LAT_LNG);
  if (ll) {
    const lat = Number(ll[1]);
    const lng = Number(ll[2]);
    if (lat < 51.2 || lat > 51.8 || lng < -0.65 || lng > 0.4) return null;
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
  }
  return STATION_ID.test(v) ? v.toUpperCase() : null;
}

export interface ApiResponse {
  status: number;
  body: ApiEnvelope<unknown> | ApiErrorBody;
}

const fail = (status: number, kind: ApiErrorBody['error']['kind'], message: string): ApiResponse => ({ status, body: { error: { kind, message } } });

export function createTransportApi(tfl: TflGet, cache = new TtlCache(), now: () => number = Date.now) {
  const wrap = <T>(r: { value: T; fetchedAt: number; stale: boolean }): ApiResponse => ({
    status: 200,
    body: { data: r.value, meta: { fetchedAt: new Date(r.fetchedAt).toISOString(), stale: r.stale, source: 'tfl', serverTime: new Date(now()).toISOString() } },
  });

  let indexMemo: { network: TubeNetwork; index: NetworkIndex } | null = null;
  const network = () =>
    cache.get(
      'network',
      TTL.network,
      async () => {
        const parts = await Promise.all(TUBE_LINE_IDS.map((id) => tfl<RawRouteSequence>(`/Line/${id}/Route/Sequence/outbound`)));
        return mergeNetwork(parts.map(adaptRouteSequence));
      },
      7 * 24 * HOUR,
    );
  const networkIndex = async () => {
    const n = await network();
    if (indexMemo?.network !== n.value) indexMemo = { network: n.value, index: indexNetwork(n.value) };
    return indexMemo.index;
  };

  async function route(url: URL): Promise<ApiResponse> {
    const p = url.pathname.replace(/\/+$/, '');
    const q = url.searchParams;
    let m: RegExpMatchArray | null;

    if (p === '/api/transport/status') {
      const modes = (q.get('modes') ?? 'tube').split(',').filter((x) => STATUS_MODES.has(x));
      if (!modes.length) return fail(400, 'bad-request', 'Nieznany rodzaj transportu.');
      const key = modes.sort().join(',');
      return wrap(await cache.get(`status:${key}`, TTL.status, async () => adaptLineStatuses(await tfl<RawLine[]>(`/Line/Mode/${key}/Status`))));
    }

    if (p === '/api/transport/tube/lines') {
      return wrap(
        await cache.get('lines', TTL.lines, async () => (await tfl<RawLine[]>('/Line/Mode/tube')).map((l) => ({ id: l.id, name: l.name }))),
      );
    }

    if (p === '/api/transport/tube/network') return wrap(await network());

    if (p === '/api/transport/tube/stations') {
      const n = await network();
      const stations: StationLite[] = Object.values(n.value.stations).map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, lines: s.lines, zone: s.zone }));
      return wrap({ ...n, value: stations });
    }

    if (p === '/api/transport/journey') {
      const from = parseJourneyEnd(q.get('from'));
      const to = parseJourneyEnd(q.get('to'));
      if (!from || !to) return fail(400, 'bad-request', 'Podaj punkt początkowy i docelowy w Londynie.');
      if (from === to) return fail(400, 'bad-request', 'Punkt początkowy i docelowy muszą się różnić.');
      const params: Record<string, string> = { mode: JOURNEY_MODES, journeyPreference: 'leasttime', alternativeWalking: 'true' };
      const time = q.get('time');
      const date = q.get('date');
      if (time) {
        if (!/^\d{4}$/.test(time)) return fail(400, 'bad-request', 'Nieprawidłowa godzina.');
        params.time = time;
        params.timeIs = q.get('timeIs') === 'arriving' ? 'Arriving' : 'Departing';
      }
      if (date) {
        if (!/^\d{8}$/.test(date)) return fail(400, 'bad-request', 'Nieprawidłowa data.');
        params.date = date;
      }
      const key = `journey:${from}:${to}:${params.date ?? ''}:${params.time ?? 'now'}:${params.timeIs ?? ''}`;
      const res = await cache.get(key, TTL.journey, async () => {
        const journeys = adaptJourneys(await tfl<RawJourneyResponse>(`/Journey/JourneyResults/${encodeURIComponent(from)}/to/${encodeURIComponent(to)}`, params));
        if (!journeys.length) throw new TflError('no-data', 'TfL nie znalazł połączenia dla tej trasy.', 404);
        return journeys;
      });
      return wrap(res);
    }

    if ((m = p.match(/^\/api\/transport\/tube\/lines\/([a-z-]+)\/route$/))) {
      const id = m[1]!;
      if (!isTubeLineId(id)) return fail(404, 'not-found', 'Nie ma takiej linii metra.');
      return wrap(await cache.get(`route:${id}`, TTL.route, async () => adaptRoute(await tfl<RawRoute>(`/Line/${id}/Route`))));
    }

    if (p === '/api/transport/tube/vehicles') {
      const wanted = (q.get('lines') ?? '').split(',').filter(isTubeLineId);
      const lines = wanted.length ? wanted : [...TUBE_LINE_IDS];
      const index = await networkIndex();
      const res = await cache.get('vehicles:all', TTL.vehicles, async () => {
        const raw = await tfl<RawPrediction[]>(`/Line/${TUBE_LINE_IDS.join(',')}/Arrivals`);
        const t = now();
        const preds = adaptPredictions(raw).map((pr) => ({ ...pr, timeToStation: Math.max(0, pr.timeToStation - Math.max(0, (t - Date.parse(pr.timestamp)) / 1000)) }));
        return buildSightings(preds, index, new Date(t).toISOString());
      });
      return wrap({ ...res, value: res.value.filter((v) => lines.includes(v.lineId as (typeof TUBE_LINE_IDS)[number])) });
    }

    if (p === '/api/transport/stations/search') {
      const term = (q.get('q') ?? '').trim();
      if (term.length < 2) return fail(400, 'bad-request', 'Wpisz co najmniej 2 znaki.');
      if (term.length > 60) return fail(400, 'bad-request', 'Zapytanie jest za długie.');
      const key = term.toLowerCase();
      return wrap(
        await cache.get(`search:${key}`, TTL.search, async () =>
          adaptSearch(await tfl<RawSearchResponse>(`/StopPoint/Search/${encodeURIComponent(term)}`, { modes: 'tube', maxResults: '10' })),
        ),
      );
    }

    if ((m = p.match(/^\/api\/transport\/stations\/([^/]+)\/arrivals$/))) {
      const id = m[1]!;
      if (!STATION_ID.test(id)) return fail(400, 'bad-request', 'Nieprawidłowy identyfikator stacji.');
      const line = q.get('line');
      if (line && !isTubeLineId(line)) return fail(400, 'bad-request', 'Nieznana linia.');
      const path = line ? `/Line/${line}/Arrivals/${id}` : `/StopPoint/${id}/Arrivals`;
      return wrap(await cache.get(`arrivals:${id}:${line ?? '*'}`, TTL.arrivals, async () => adaptPredictions((await tfl<RawPrediction[]>(path)).filter((x) => !x.modeName || x.modeName === 'tube')), 2 * MIN));
    }

    if ((m = p.match(/^\/api\/transport\/stations\/([^/]+)$/))) {
      const id = m[1]!;
      if (!STATION_ID.test(id)) return fail(400, 'bad-request', 'Nieprawidłowy identyfikator stacji.');
      return wrap(await cache.get(`station:${id}`, TTL.station, async () => adaptStopPoint(await tfl<RawStopPoint>(`/StopPoint/${id}`), id)));
    }

    if ((m = p.match(/^\/api\/transport\/tube\/lines\/([a-z-]+)\/accessibility$/))) {
      const id = m[1]!;
      if (!isTubeLineId(id)) return fail(404, 'not-found', 'Nie ma takiej linii metra.');
      const index = await networkIndex();
      const ids = Object.values(index.network.stations)
        .filter((s) => s.lines.includes(id))
        .map((s) => s.id);
      return wrap(
        await cache.get(`access:${id}`, TTL.station, async () => {
          const out: Record<string, boolean | null> = {};
          for (let i = 0; i < ids.length; i += 20) {
            const chunk = ids.slice(i, i + 20);
            const raw = await tfl<RawStopPoint | RawStopPoint[]>(`/StopPoint/${chunk.join(',')}`);
            const list = Array.isArray(raw) ? raw : [raw];
            for (const sid of chunk) {
              const hit = list.map((r) => adaptStopPoint(r, sid)).find((d) => d.id === sid);
              out[sid] = hit?.liftAccess ?? null;
            }
          }
          return out;
        }),
      );
    }

    if ((m = p.match(/^\/api\/transport\/tube\/timetable\/([a-z-]+)$/))) {
      const id = m[1]!;
      const from = q.get('from') ?? '';
      const to = q.get('to') ?? '';
      if (!isTubeLineId(id)) return fail(404, 'not-found', 'Nie ma takiej linii metra.');
      if (!STATION_ID.test(from) || !STATION_ID.test(to)) return fail(400, 'bad-request', 'Wybierz stację początkową i końcową.');
      if (from === to) return fail(400, 'bad-request', 'Stacja początkowa i końcowa muszą się różnić.');
      const res = await cache.get(`timetable:${id}:${from}:${to}`, TTL.timetable, async () => {
        const tt = adaptTimetable(await tfl<RawTimetableResponse>(`/Line/${id}/Timetable/${from}/to/${to}`), from, to);
        if (!tt) throw new TflError('no-data', 'TfL nie udostępnia rozkładu dla tej pary stacji.', 404);
        return tt;
      });
      return wrap(res);
    }

    return fail(404, 'not-found', 'Nieznany adres API.');
  }

  return async function handle(url: URL): Promise<ApiResponse> {
    try {
      return await route(url);
    } catch (err) {
      if (err instanceof TflError) return fail(err.status, err.kind, err.message);
      console.error('[transport-api]', err);
      return fail(500, 'unavailable', 'Wewnętrzny błąd serwera transportu.');
    }
  };
}
