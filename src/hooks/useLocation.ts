import { useEffect, useRef, useState, type RefObject } from 'react';
import { EMPTY_GROUPS, searchLocations, type GroupedResults } from '@/lib/location/geocode';
import { nearestStations } from '@/lib/location/nearestStations';
import type { GeoLocation, NearbyStation } from '@/lib/location/types';
import { loadStations, transportApi } from '@/lib/tfl/api';
import type { StationLite } from '@/lib/tfl/types';

let stationsCache: StationLite[] | null = null;

/** Tube stations (lazy, once per session). `enabled=false` defers the request. */
export function useStations(enabled = true): StationLite[] | null {
  const [stations, setStations] = useState<StationLite[] | null>(stationsCache);
  useEffect(() => {
    if (!enabled || stations) return;
    let alive = true;
    loadStations().then(
      (s) => {
        stationsCache = s;
        if (alive) setStations(s);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [enabled, stations]);
  return stations;
}

export function useNearestStations(geo: Pick<GeoLocation, 'lat' | 'lng'> | null | undefined, limit = 3, enabled = true): NearbyStation[] | null {
  const stations = useStations(enabled && !!geo);
  if (!geo || !stations) return null;
  return nearestStations(stations, geo.lat, geo.lng, limit);
}

/** True once the element has scrolled near the viewport (stays true). */
export function useInView<T extends Element>(ref: RefObject<T | null>, rootMargin = '200px'): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);
  return seen;
}

/** Debounced MIEJSCA / STACJE / ADRESY / KODY POCZTOWE autocomplete. */
export function useLocationSearch(query: string, debounceMs = 250) {
  const [state, setState] = useState<{ groups: GroupedResults; loading: boolean; forQuery: string }>({ groups: EMPTY_GROUPS, loading: false, forQuery: '' });
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setState({ groups: EMPTY_GROUPS, loading: false, forQuery: q });
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    const t = window.setTimeout(() => {
      searchLocations(q, ctrl.signal).then(
        (groups) => setState({ groups, loading: false, forQuery: q }),
        (e: Error) => {
          if (e.name !== 'AbortError') setState({ groups: { ...EMPTY_GROUPS, remoteError: e.message }, loading: false, forQuery: q });
        },
      );
    }, debounceMs);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query, debounceMs]);
  return state;
}

export const OXFORD_CIRCUS = { id: '940GZZLUOXC', name: 'Oxford Circus' };

type CommuteState = { status: 'idle' | 'loading' | 'error' } | { status: 'ok'; minutes: number; transfers: number };

/** Real TfL journey time (fastest option, departing now) from a point to a station. */
export function useCommute(geo: Pick<GeoLocation, 'lat' | 'lng'> | null | undefined, toStationId: string, enabled = true): CommuteState {
  const [state, setState] = useState<CommuteState>({ status: 'idle' });
  const key = geo ? `${geo.lat.toFixed(4)},${geo.lng.toFixed(4)}` : null;
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !key || last.current === key) return;
    last.current = key;
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    transportApi.journey({ from: key, to: toStationId }, ctrl.signal).then(
      (r) => {
        const best = [...r.data].sort((a, b) => a.durationMin - b.durationMin)[0];
        setState(best ? { status: 'ok', minutes: best.durationMin, transfers: best.transfers } : { status: 'error' });
      },
      (e: Error) => {
        if (e.name !== 'AbortError') setState({ status: 'error' });
        else last.current = null;
      },
    );
    return () => ctrl.abort();
  }, [enabled, key, toStationId]);
  return state;
}
