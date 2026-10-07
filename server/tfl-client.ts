import type { ApiErrorKind } from '../src/lib/tfl/types';

export const TFL_BASE = 'https://api.tfl.gov.uk';

export class TflError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status = 502,
  ) {
    super(message);
  }
}

export interface TflClientOptions {
  appId?: string;
  appKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

/**
 * Thin TfL Unified API client. Credentials come from server env (TFL_APP_ID / TFL_APP_KEY)
 * and are appended here only – they never reach the browser. Without a key TfL still answers,
 * but with a low anonymous rate limit.
 */
export function createTflClient(opts: TflClientOptions = {}) {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const base = opts.baseUrl ?? TFL_BASE;
  const timeoutMs = opts.timeoutMs ?? 10_000;

  return async function tflGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(base + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    if (opts.appId) url.searchParams.set('app_id', opts.appId);
    if (opts.appKey) url.searchParams.set('app_key', opts.appKey);

    let res: Response;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
    } catch (err) {
      const name = (err as Error).name;
      if (name === 'TimeoutError' || name === 'AbortError') throw new TflError('timeout', 'TfL nie odpowiedział na czas.', 504);
      throw new TflError('unavailable', 'Brak połączenia z TfL.', 502);
    }
    if (res.status === 429) throw new TflError('rate-limit', 'Przekroczono limit zapytań do TfL.', 503);
    if (res.status === 404) throw new TflError('not-found', 'TfL nie zna takiego zasobu.', 404);
    if (res.status === 400) throw new TflError('bad-request', 'Nieprawidłowe zapytanie do TfL.', 400);
    if (!res.ok) throw new TflError('unavailable', `TfL zwrócił błąd ${res.status}.`, 502);
    try {
      return (await res.json()) as T;
    } catch {
      throw new TflError('unavailable', 'TfL zwrócił nieczytelną odpowiedź.', 502);
    }
  };
}

export type TflGet = ReturnType<typeof createTflClient>;
