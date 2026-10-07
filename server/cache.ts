/**
 * In-memory TTL cache with stale fallback and in-flight de-duplication.
 * Entries are kept for `staleFor` after expiry so an upstream outage can still serve
 * the last good response (marked stale). Prototype-grade: per-process, not shared.
 */
export interface CacheResult<T> {
  value: T;
  fetchedAt: number;
  stale: boolean;
}

interface Entry<T> {
  value: T;
  fetchedAt: number;
  expiresAt: number;
}

export class TtlCache {
  private entries = new Map<string, Entry<unknown>>();
  private inflight = new Map<string, Promise<CacheResult<unknown>>>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = 500,
  ) {}

  async get<T>(key: string, ttlMs: number, load: () => Promise<T>, staleForMs = 30 * 60_000): Promise<CacheResult<T>> {
    const hit = this.entries.get(key) as Entry<T> | undefined;
    const t = this.now();
    if (hit && hit.expiresAt > t) return { value: hit.value, fetchedAt: hit.fetchedAt, stale: false };

    const pending = this.inflight.get(key) as Promise<CacheResult<T>> | undefined;
    if (pending) return pending;

    const p = (async () => {
      try {
        const value = await load();
        this.set(key, value, ttlMs);
        return { value, fetchedAt: this.now(), stale: false };
      } catch (err) {
        if (hit && t - hit.expiresAt < staleForMs) return { value: hit.value, fetchedAt: hit.fetchedAt, stale: true };
        throw err;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }

  set<T>(key: string, value: T, ttlMs: number) {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    const t = this.now();
    this.entries.delete(key);
    this.entries.set(key, { value, fetchedAt: t, expiresAt: t + ttlMs });
  }

  clear() {
    this.entries.clear();
  }
}
