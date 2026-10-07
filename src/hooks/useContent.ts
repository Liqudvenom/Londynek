import { useEffect, useMemo, useState } from 'react';
import { demoSearchHits, hasContentApi, listCollection, searchContent, type CollectionName, type Collections, type SearchHit, type SourceKind } from '@/lib/content/source';
import type { SearchScope } from '@/lib/search';

interface AsyncState<T> {
  data: T;
  source: SourceKind;
  loading: boolean;
  fallbackReason?: string;
}

/**
 * Site search. Without a content API the demo index answers synchronously (no flicker);
 * with an API the query is debounced and fetched, falling back to demo data on failure.
 */
export function useSiteSearch(q: string, scope: SearchScope = 'all', location = '', debounceMs = 0): AsyncState<SearchHit[]> {
  const api = hasContentApi();
  const local = useMemo(() => (api ? [] : demoSearchHits(q, scope, location)), [api, q, scope, location]);
  const [state, setState] = useState<AsyncState<SearchHit[]>>({ data: [], source: 'api', loading: api });

  useEffect(() => {
    if (!api) return;
    if (!q.trim() && !location) {
      setState({ data: [], source: 'api', loading: false });
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    const timer = window.setTimeout(() => {
      searchContent(q, scope, location, ctrl.signal).then(
        (r) => setState({ data: r.data, source: r.source, loading: false, fallbackReason: r.fallbackReason }),
        () => undefined,
      );
    }, debounceMs);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [api, q, scope, location, debounceMs]);

  return api ? state : { data: local, source: 'demo', loading: false };
}

/** A content collection (jobs, events…) from the API, or the demo data. */
export function useCollection<K extends CollectionName>(name: K): AsyncState<Collections[K][] | null> {
  const [state, setState] = useState<AsyncState<Collections[K][] | null>>({ data: null, source: hasContentApi() ? 'api' : 'demo', loading: true });
  useEffect(() => {
    const ctrl = new AbortController();
    listCollection(name, ctrl.signal).then(
      (r) => setState({ data: r.data, source: r.source, loading: false, fallbackReason: r.fallbackReason }),
      () => undefined,
    );
    return () => ctrl.abort();
  }, [name]);
  return state;
}
