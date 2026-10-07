import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadNetwork, transportApi, TransportApiError } from '@/lib/tfl/api';
import { indexNetwork, type NetworkIndex } from '@/lib/tfl/network';
import type { ApiEnvelope, ApiErrorKind, ApiMeta, TubeNetwork } from '@/lib/tfl/types';

export interface LiveState<T> {
  data: T | null;
  meta: ApiMeta | null;
  error: { kind: ApiErrorKind; message: string } | null;
  loading: boolean;
  /** Client time of the last successful response */
  receivedAt: number | null;
  refresh: () => void;
}

const toError = (err: unknown) =>
  err instanceof TransportApiError ? { kind: err.kind, message: err.message } : { kind: 'unavailable' as const, message: 'Nie udało się pobrać danych.' };

/**
 * Polls `load` every `intervalMs` while the tab is visible. Keeps the last good data on failure
 * (the UI then shows an error/stale badge instead of an empty panel). `key` restarts polling.
 */
export function useLive<T>(key: string | null, load: (signal: AbortSignal) => Promise<ApiEnvelope<T>>, intervalMs: number): LiveState<T> {
  const [state, setState] = useState<Omit<LiveState<T>, 'refresh'>>({ data: null, meta: null, error: null, loading: !!key, receivedAt: null });
  const loadRef = useRef(load);
  loadRef.current = load;
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setState({ data: null, meta: null, error: null, loading: !!key, receivedAt: null });
  }, [key]);

  useEffect(() => {
    if (!key) return;
    let timer = 0;
    let ctrl: AbortController | null = null;
    let disposed = false;

    const run = async () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      ctrl?.abort();
      ctrl = new AbortController();
      setState((s) => ({ ...s, loading: true }));
      try {
        const env = await loadRef.current(ctrl.signal);
        if (disposed) return;
        setState({ data: env.data, meta: env.meta, error: null, loading: false, receivedAt: Date.now() });
      } catch (err) {
        if (disposed || (err as Error).name === 'AbortError') return;
        setState((s) => ({ ...s, error: toError(err), loading: false }));
      }
      if (!disposed && intervalMs > 0) timer = window.setTimeout(run, intervalMs);
    };
    const onVisible = () => {
      if (!document.hidden) void run();
    };
    void run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disposed = true;
      ctrl?.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [key, intervalMs, tick]);

  return { ...state, refresh };
}

export const STATUS_INTERVAL = 60_000;
export const VEHICLES_INTERVAL = 20_000;
export const ARRIVALS_INTERVAL = 20_000;

export function useLineStatus(modes: string[] = ['tube']) {
  const key = modes.join(',');
  return useLive(`status:${key}`, (s) => transportApi.status(key.split(','), s), STATUS_INTERVAL);
}

export function useVehicles(enabled = true) {
  return useLive(enabled ? 'vehicles' : null, (s) => transportApi.vehicles([], s), VEHICLES_INTERVAL);
}

export function useStationArrivals(stationId: string | null, line?: string) {
  return useLive(stationId ? `arr:${stationId}:${line ?? ''}` : null, (s) => transportApi.arrivals(stationId!, line, s), ARRIVALS_INTERVAL);
}

export function useStationDetail(stationId: string | null) {
  return useLive(stationId ? `st:${stationId}` : null, (s) => transportApi.station(stationId!, s), 0);
}

export interface NetworkState {
  network: TubeNetwork | null;
  index: NetworkIndex | null;
  error: { kind: ApiErrorKind; message: string } | null;
  retry: () => void;
}

export function useTubeNetwork(): NetworkState {
  const [env, setEnv] = useState<ApiEnvelope<TubeNetwork> | null>(null);
  const [error, setError] = useState<NetworkState['error']>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(null);
    loadNetwork().then(
      (e) => alive && setEnv(e),
      (err) => alive && setError(toError(err)),
    );
    return () => {
      alive = false;
    };
  }, [attempt]);
  const index = useMemo(() => (env ? indexNetwork(env.data) : null), [env]);
  return { network: env?.data ?? null, index, error, retry: useCallback(() => setAttempt((a) => a + 1), []) };
}

/** Re-renders every `ms` – for countdowns and "updated N s ago" labels. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}
