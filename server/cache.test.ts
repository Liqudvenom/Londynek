import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache';

const setup = () => {
  let t = 1_000_000;
  const cache = new TtlCache(() => t, 3);
  return { cache, advance: (ms: number) => (t += ms), now: () => t };
};

describe('TtlCache', () => {
  it('serves fresh entries without reloading', async () => {
    const { cache, advance } = setup();
    const load = vi.fn().mockResolvedValue('a');
    await cache.get('k', 1000, load);
    advance(500);
    const r = await cache.get('k', 1000, load);
    expect(r).toMatchObject({ value: 'a', stale: false });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL', async () => {
    const { cache, advance } = setup();
    const load = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');
    await cache.get('k', 1000, load);
    advance(1001);
    expect((await cache.get('k', 1000, load)).value).toBe('b');
  });

  it('falls back to the last good value (marked stale) when the upstream fails', async () => {
    const { cache, advance } = setup();
    await cache.get('k', 1000, async () => 'good');
    advance(5000);
    const r = await cache.get('k', 1000, async () => {
      throw new Error('down');
    });
    expect(r).toMatchObject({ value: 'good', stale: true });
  });

  it('rethrows when the stale window has passed or nothing was cached', async () => {
    const { cache, advance } = setup();
    const fail = async () => {
      throw new Error('down');
    };
    await expect(cache.get('none', 1000, fail)).rejects.toThrow('down');
    await cache.get('k', 1000, async () => 'good', 2000);
    advance(4000);
    await expect(cache.get('k', 1000, fail, 2000)).rejects.toThrow('down');
  });

  it('de-duplicates concurrent loads', async () => {
    const { cache } = setup();
    let resolve!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));
    const a = cache.get('k', 1000, load);
    const b = cache.get('k', 1000, load);
    resolve('x');
    expect((await a).value).toBe('x');
    expect((await b).value).toBe('x');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest entry beyond the size limit', async () => {
    const { cache } = setup();
    for (const k of ['a', 'b', 'c', 'd']) await cache.get(k, 1000, async () => k);
    const load = vi.fn().mockResolvedValue('A2');
    expect((await cache.get('a', 1000, load)).value).toBe('A2');
    expect(load).toHaveBeenCalledTimes(1);
  });
});
