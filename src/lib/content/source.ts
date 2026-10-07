// Content data source. With VITE_LONDYNEK_API_URL set, content comes from the Londynek.net API
// (contract: docs/API_CONTRACT.md); otherwise – or when the API fails – from the bundled demo data.
// Every result says which source answered, so the UI can label demo content honestly.
import { ALL_ARTICLES } from '@/data/articles';
import { CLASSIFIEDS } from '@/data/classifieds';
import { EVENTS } from '@/data/events';
import { GUIDE_TASKS } from '@/data/guides';
import { JOBS } from '@/data/jobs';
import { PROPERTIES } from '@/data/properties';
import { SERVICES } from '@/data/services';
import { VEHICLES } from '@/data/vehicles';
import type { Article, EventItem, GuideTask, Job, Listing, Property, Service, Vehicle } from '@/types';
import { search as demoSearch, type SearchEntry, type SearchScope } from '@/lib/search';

export type SourceKind = 'api' | 'demo';

export interface SourceResult<T> {
  data: T;
  source: SourceKind;
  /** Set when the API was configured but failed and demo data was used instead. */
  fallbackReason?: string;
}

export interface Collections {
  jobs: Job;
  properties: Property;
  classifieds: Listing;
  services: Service;
  vehicles: Vehicle;
  articles: Article;
  events: EventItem;
  guides: GuideTask;
}
export type CollectionName = keyof Collections;

export type SearchHit = Omit<SearchEntry, 'haystack'> & { imageUrl?: string | null };

const DEMO: { [K in CollectionName]: Collections[K][] } = {
  jobs: JOBS,
  properties: PROPERTIES,
  classifieds: CLASSIFIEDS,
  services: SERVICES,
  vehicles: VEHICLES,
  articles: ALL_ARTICLES,
  events: EVENTS,
  guides: GUIDE_TASKS,
};

export const API_URL = (import.meta.env.VITE_LONDYNEK_API_URL ?? '').replace(/\/+$/, '');
export const hasContentApi = () => API_URL !== '';

const TIMEOUT_MS = 8000;

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const isAbort = (err: unknown) => (err as Error)?.name === 'AbortError';

function fallback<T>(data: T, err: unknown): SourceResult<T> {
  const reason = err instanceof Error ? err.message : 'błąd API';
  console.warn('[content] API Londynek.net niedostępne, używam danych demonstracyjnych:', reason);
  return { data, source: 'demo', fallbackReason: reason };
}

function stripHaystack(entry: SearchEntry): SearchHit {
  const hit: SearchHit & { haystack?: string } = { ...entry };
  delete hit.haystack;
  return hit;
}

export function demoSearchHits(q: string, scope: SearchScope = 'all', location = ''): SearchHit[] {
  return demoSearch(q, scope, location).map(stripHaystack);
}

export async function listCollection<K extends CollectionName>(name: K, signal?: AbortSignal): Promise<SourceResult<Collections[K][]>> {
  if (!hasContentApi()) return { data: DEMO[name], source: 'demo' };
  try {
    const body = await getJson<{ data: Collections[K][] }>(`/v1/${name}`, signal);
    if (!Array.isArray(body?.data)) throw new Error('Nieprawidłowa odpowiedź API');
    return { data: body.data, source: 'api' };
  } catch (err) {
    if (isAbort(err) && signal?.aborted) throw err;
    return fallback(DEMO[name], err);
  }
}

export async function searchContent(q: string, scope: SearchScope = 'all', location = '', signal?: AbortSignal): Promise<SourceResult<SearchHit[]>> {
  if (!hasContentApi()) return { data: demoSearchHits(q, scope, location), source: 'demo' };
  const params = new URLSearchParams({ q });
  if (scope !== 'all') params.set('scope', scope);
  if (location) params.set('location', location);
  try {
    const body = await getJson<{ data: SearchHit[] }>(`/v1/search?${params}`, signal);
    if (!Array.isArray(body?.data)) throw new Error('Nieprawidłowa odpowiedź API');
    return { data: body.data, source: 'api' };
  } catch (err) {
    if (isAbort(err) && signal?.aborted) throw err;
    return fallback(demoSearchHits(q, scope, location), err);
  }
}

export type FormKind = 'contact' | 'advertising' | 'listing';

export type FormResult = { ok: true; id: string } | { ok: false; message: string; fields?: string[] };

/** Sends a form to the Londynek API when configured, otherwise to this site's /api/forms endpoint. */
export async function submitForm(kind: FormKind, fields: Record<string, string>, page = window.location.pathname): Promise<FormResult> {
  const url = hasContentApi() ? `${API_URL}/v1/forms` : '/api/forms';
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ kind, fields, page }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, message: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.' };
  }
  const body = (await res.json().catch(() => null)) as { data?: { id: string }; error?: { message: string; fields?: string[] } } | null;
  if (res.ok && body?.data?.id) return { ok: true, id: body.data.id };
  return { ok: false, message: body?.error?.message ?? `Nie udało się wysłać formularza (błąd ${res.status}).`, fields: body?.error?.fields };
}
