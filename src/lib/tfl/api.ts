// Browser client for our internal transport API (never calls TfL directly – credentials stay server-side).
import type {
  ApiEnvelope,
  ApiErrorKind,
  ApiMeta,
  Journey,
  LineRoute,
  LineStatus,
  StationDetail,
  StationLite,
  StationSearchResult,
  Timetable,
  TrainPrediction,
  TrainSighting,
  TubeNetwork,
} from './types';

export class TransportApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

/** serverTime − clientTime, ms. Predictions are anchored to server time. */
let clockSkew = 0;
export const serverNow = () => Date.now() + clockSkew;

async function get<T>(path: string, signal?: AbortSignal): Promise<ApiEnvelope<T>> {
  let res: Response;
  try {
    res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new TransportApiError('unavailable', 'Brak połączenia z serwerem.', 0);
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new TransportApiError('unavailable', 'Serwer zwrócił nieczytelną odpowiedź.', res.status);
  }
  if (!res.ok || (body as { error?: unknown }).error) {
    const e = (body as { error?: { kind: ApiErrorKind; message: string } }).error;
    throw new TransportApiError(e?.kind ?? 'unavailable', e?.message ?? `Błąd ${res.status}`, res.status);
  }
  const env = body as ApiEnvelope<T>;
  const st = Date.parse(env.meta.serverTime);
  if (Number.isFinite(st)) clockSkew = st - Date.now();
  return env;
}

const q = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return s ? `?${s}` : '';
};

export const transportApi = {
  status: (modes: string[], signal?: AbortSignal) => get<LineStatus[]>(`/api/transport/status${q({ modes: modes.join(',') })}`, signal),
  network: (signal?: AbortSignal) => get<TubeNetwork>('/api/transport/tube/network', signal),
  accessibility: (lineId: string, signal?: AbortSignal) =>
    get<Record<string, boolean | null>>(`/api/transport/tube/lines/${encodeURIComponent(lineId)}/accessibility`, signal),
  route: (lineId: string, signal?: AbortSignal) => get<LineRoute>(`/api/transport/tube/lines/${encodeURIComponent(lineId)}/route`, signal),
  vehicles: (lines: string[] = [], signal?: AbortSignal) => get<TrainSighting[]>(`/api/transport/tube/vehicles${q({ lines: lines.join(',') || undefined })}`, signal),
  arrivals: (stationId: string, line?: string, signal?: AbortSignal) =>
    get<TrainPrediction[]>(`/api/transport/stations/${encodeURIComponent(stationId)}/arrivals${q({ line })}`, signal),
  station: (stationId: string, signal?: AbortSignal) => get<StationDetail>(`/api/transport/stations/${encodeURIComponent(stationId)}`, signal),
  searchStations: (term: string, signal?: AbortSignal) => get<StationSearchResult[]>(`/api/transport/stations/search${q({ q: term })}`, signal),
  timetable: (lineId: string, from: string, to: string, signal?: AbortSignal) =>
    get<Timetable>(`/api/transport/tube/timetable/${encodeURIComponent(lineId)}${q({ from, to })}`, signal),
  stations: (signal?: AbortSignal) => get<StationLite[]>('/api/transport/tube/stations', signal),
  journey: (p: { from: string; to: string; time?: string; date?: string; timeIs?: 'departing' | 'arriving' }, signal?: AbortSignal) =>
    get<Journey[]>(`/api/transport/journey${q(p)}`, signal),
};

let stationsPromise: Promise<StationLite[]> | null = null;
/** Compact station list (≈270 rows) – shared by every nearest-station lookup in the session. */
export function loadStations() {
  stationsPromise ??= transportApi
    .stations()
    .then((r) => r.data)
    .catch((err) => {
      stationsPromise = null;
      throw err;
    });
  return stationsPromise;
}

export type { ApiMeta };

/** The Tube network changes rarely – fetch once per session and share. */
let networkPromise: Promise<ApiEnvelope<TubeNetwork>> | null = null;
export function loadNetwork() {
  networkPromise ??= transportApi.network().catch((err) => {
    networkPromise = null;
    throw err;
  });
  return networkPromise;
}
