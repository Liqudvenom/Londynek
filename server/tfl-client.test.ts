import { describe, expect, it, vi } from 'vitest';
import { TflError, createTflClient } from './tfl-client';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('createTflClient', () => {
  it('calls TfL with query params and appends credentials server-side', async () => {
    const fetchImpl = vi.fn(async () => json([{ id: 'victoria' }]));
    const tfl = createTflClient({ appId: 'id-123', appKey: 'key-456', fetchImpl: fetchImpl as unknown as typeof fetch, baseUrl: 'https://tfl.test' });
    const out = await tfl<{ id: string }[]>('/Line/Mode/tube/Status', { detail: 'true' });
    expect(out).toEqual([{ id: 'victoria' }]);
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown as [URL])[0]));
    expect(url.origin + url.pathname).toBe('https://tfl.test/Line/Mode/tube/Status');
    expect(url.searchParams.get('detail')).toBe('true');
    expect(url.searchParams.get('app_id')).toBe('id-123');
    expect(url.searchParams.get('app_key')).toBe('key-456');
  });

  it('omits credentials when none are configured', async () => {
    const fetchImpl = vi.fn(async () => json({}));
    await createTflClient({ fetchImpl: fetchImpl as unknown as typeof fetch })('/Line/Mode/tube');
    const url = new URL(String((fetchImpl.mock.calls[0] as unknown as [URL])[0]));
    expect(url.searchParams.has('app_key')).toBe(false);
  });

  const failWith = async (fetchImpl: () => Promise<Response>) => {
    try {
      await createTflClient({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 50 })('/x');
    } catch (err) {
      return err as TflError;
    }
    throw new Error('expected failure');
  };

  it('maps a timeout to 504', async () => {
    const err = await failWith(async () => {
      throw Object.assign(new Error('t'), { name: 'TimeoutError' });
    });
    expect(err).toBeInstanceOf(TflError);
    expect([err.kind, err.status]).toEqual(['timeout', 504]);
  });

  it('maps rate limiting, missing resources and upstream errors', async () => {
    expect((await failWith(async () => json({}, 429))).kind).toBe('rate-limit');
    expect((await failWith(async () => json({}, 404))).status).toBe(404);
    expect((await failWith(async () => json({}, 500))).status).toBe(502);
    expect((await failWith(async () => new Response('<html>', { status: 200 }))).kind).toBe('unavailable');
    expect((await failWith(async () => Promise.reject(new TypeError('fetch failed')))).kind).toBe('unavailable');
  });
});
