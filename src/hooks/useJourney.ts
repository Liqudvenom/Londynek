import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveLocation } from '@/lib/location/geocode';
import { journeyParam, parseRouteEnd, type ParsedEnd } from '@/lib/location/routeParams';
import type { JourneyPlace } from '@/lib/location/types';
import { transportApi, TransportApiError } from '@/lib/tfl/api';
import { rankJourneys, type RankedJourney } from '@/lib/tfl/journey';
import type { ApiErrorKind, Journey } from '@/lib/tfl/types';

export interface JourneyQuery {
  from: JourneyPlace | null;
  to: JourneyPlace | null;
  time?: string;
  timeIs?: 'departing' | 'arriving';
  resolving: boolean;
  ready: boolean;
}

async function resolveEnd(end: ParsedEnd, signal: AbortSignal): Promise<JourneyPlace | null> {
  if (end.place) return end.place;
  if (!end.text) return null;
  const r = await resolveLocation(end.text, signal);
  return r ? { name: r.label, lat: r.lat, lng: r.lng, stationId: r.stationId } : null;
}

/** Reads `/transport/tube?from=&to=` (and lat/lng/id variants), geocodes free text, then fetches TfL journeys. */
export function useJourneyPlanner() {
  const [params] = useSearchParams();
  const fromEnd = useMemo(() => parseRouteEnd(params, 'from'), [params]);
  const toEnd = useMemo(() => parseRouteEnd(params, 'to'), [params]);
  const time = params.get('time') ?? undefined;
  const timeIs = params.get('timeIs') === 'arriving' ? 'arriving' : params.get('timeIs') === 'departing' ? 'departing' : undefined;
  const requested = !!(fromEnd.place || fromEnd.text || toEnd.place || toEnd.text);

  const [ends, setEnds] = useState<{ from: JourneyPlace | null; to: JourneyPlace | null; resolving: boolean }>({ from: fromEnd.place, to: toEnd.place, resolving: requested });
  const [ranked, setRanked] = useState<RankedJourney[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<{ kind: ApiErrorKind; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requested) {
      setEnds({ from: null, to: null, resolving: false });
      setRanked(null);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setEnds({ from: fromEnd.place, to: toEnd.place, resolving: true });
    Promise.all([resolveEnd(fromEnd, ctrl.signal), resolveEnd(toEnd, ctrl.signal)]).then(
      ([from, to]) => {
        setEnds({ from, to, resolving: false });
        if (toEnd.text && !to) setError({ kind: 'not-found', message: 'Nie udało się odnaleźć celu podróży. Spróbuj stacji, kodu pocztowego albo adresu.' });
      },
      (e: Error) => {
        if (e.name !== 'AbortError') setEnds({ from: fromEnd.place, to: toEnd.place, resolving: false });
      },
    );
    return () => ctrl.abort();
  }, [requested, fromEnd, toEnd]);

  const fromKey = ends.from ? journeyParam(ends.from) : null;
  const toKey = ends.to ? journeyParam(ends.to) : null;
  const ready = !!(fromKey && toKey && fromKey !== toKey);

  useEffect(() => {
    if (!ready || !fromKey || !toKey) {
      setRanked(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    transportApi.journey({ from: fromKey, to: toKey, time, timeIs }, ctrl.signal).then(
      (env) => {
        const next = rankJourneys(env.data);
        setRanked(next);
        setSelectedId((id) => (id && next.some((r) => r.journey.id === id) ? id : next[0]?.journey.id ?? null));
        setLoading(false);
      },
      (err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        const e = err instanceof TransportApiError ? err : null;
        setRanked(null);
        setError({ kind: e?.kind ?? 'unavailable', message: e?.message ?? 'Nie udało się pobrać trasy z TfL.' });
        setLoading(false);
      },
    );
    return () => ctrl.abort();
  }, [ready, fromKey, toKey, time, timeIs]);

  const selected: Journey | null = ranked?.find((r) => r.journey.id === selectedId)?.journey ?? ranked?.[0]?.journey ?? null;

  return {
    requested,
    from: ends.from,
    to: ends.to,
    resolving: ends.resolving,
    ready,
    loading,
    error,
    ranked,
    selected,
    select: setSelectedId,
  };
}
