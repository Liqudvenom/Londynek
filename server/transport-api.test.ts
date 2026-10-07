import { describe, expect, it, vi } from 'vitest';
import type { RawLine, RawPrediction, RawRouteSequence, RawStopPoint } from '../src/lib/tfl/raw';
import type { ApiEnvelope, ApiErrorBody, LineStatus, TrainPrediction, TrainSighting } from '../src/lib/tfl/types';
import { TUBE_LINE_IDS } from '../src/data/tube-colors';
import { TtlCache } from './cache';
import { TflError, type TflGet } from './tfl-client';
import { createTransportApi } from './transport-api';

type Routes = Record<string, unknown | (() => unknown)>;

function fakeTfl(routes: Routes) {
  const calls: string[] = [];
  const tfl = (async (path: string) => {
    calls.push(path);
    if (!(path in routes)) throw new TflError('not-found', 'TfL nie zna takiego zasobu.', 404);
    const r = routes[path];
    return typeof r === 'function' ? (r as () => unknown)() : structuredClone(r);
  }) as TflGet;
  return { tfl, calls };
}

const stop = (id: string, name: string, lon: number) => ({ id, name: `${name} Underground Station`, lat: 51.5, lon, zone: '1' });
const sequence = (lineId: string, ids: [string, string, number][]): RawRouteSequence => ({
  lineId,
  lineName: lineId,
  direction: 'outbound',
  lineStrings: [],
  stations: ids.map(([id, n, lon]) => stop(id, n, lon)),
  stopPointSequences: [],
  orderedLineRoutes: [{ name: 'r', naptanIds: ids.map(([id]) => id), serviceType: 'Regular' }],
});

const NOW = Date.parse('2026-10-07T12:00:00Z');
const networkRoutes = (): Routes => {
  const out: Routes = {};
  for (const id of TUBE_LINE_IDS) out[`/Line/${id}/Route/Sequence/outbound`] = sequence(id, []);
  out['/Line/victoria/Route/Sequence/outbound'] = sequence('victoria', [
    ['940GZZLUVIC', 'Victoria', -0.14],
    ['940GZZLUGPK', 'Green Park', -0.142],
    ['940GZZLUOXC', 'Oxford Circus', -0.141],
  ]);
  out['/Line/central/Route/Sequence/outbound'] = sequence('central', [
    ['940GZZLUBND', 'Bond Street', -0.149],
    ['940GZZLUOXC', 'Oxford Circus', -0.141],
  ]);
  return out;
};

const raw = (p: Partial<RawPrediction>): RawPrediction => ({
  id: 'p',
  naptanId: '940GZZLUOXC',
  stationName: 'Oxford Circus Underground Station',
  lineId: 'victoria',
  lineName: 'Victoria',
  platformName: 'Northbound - Platform 5',
  timestamp: new Date(NOW).toISOString(),
  timeToStation: 60,
  expectedArrival: new Date(NOW + 60_000).toISOString(),
  ...p,
});

const api = (routes: Routes, now = () => NOW) => {
  const f = fakeTfl(routes);
  return { handle: createTransportApi(f.tfl, new TtlCache(now), now), calls: f.calls };
};
const get = async <T>(handle: ReturnType<typeof api>['handle'], path: string) => {
  const r = await handle(new URL(path, 'http://localhost'));
  return { status: r.status, body: r.body as ApiEnvelope<T> & ApiErrorBody };
};

describe('transport API: status', () => {
  const lines: RawLine[] = [
    { id: 'victoria', name: 'Victoria', modeName: 'tube', lineStatuses: [{ statusSeverity: 10, statusSeverityDescription: 'Good Service' }] },
    { id: 'central', name: 'Central', modeName: 'tube', lineStatuses: [{ statusSeverity: 2, statusSeverityDescription: 'Suspended', reason: 'Central Line: Suspended due to a signal failure.' }] },
  ];

  it('returns adapted statuses with TfL meta and keeps disruption text verbatim', async () => {
    const { handle } = api({ '/Line/Mode/tube/Status': lines });
    const { status, body } = await get<LineStatus[]>(handle, '/api/transport/status?modes=tube');
    expect(status).toBe(200);
    expect(body.meta).toMatchObject({ source: 'tfl', stale: false, serverTime: new Date(NOW).toISOString() });
    expect(body.data.find((l) => l.id === 'central')).toMatchObject({ level: 'closed', disruptions: [{ description: 'Central Line: Suspended due to a signal failure.' }] });
  });

  it('rejects unknown modes', async () => {
    const { handle, calls } = api({});
    expect((await get(handle, '/api/transport/status?modes=spaceship')).status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('serves the last good status as stale when TfL fails', async () => {
    let t = NOW;
    let up = true;
    const { handle } = api(
      {
        '/Line/Mode/tube/Status': () => {
          if (!up) throw new TflError('rate-limit', 'Przekroczono limit zapytań do TfL.', 503);
          return lines;
        },
      },
      () => t,
    );
    await get(handle, '/api/transport/status');
    up = false;
    t += 5 * 60_000;
    const { status, body } = await get<LineStatus[]>(handle, '/api/transport/status');
    expect(status).toBe(200);
    expect(body.meta.stale).toBe(true);
  });

  it('surfaces upstream errors in Polish when nothing is cached', async () => {
    const { handle } = api({
      '/Line/Mode/tube/Status': () => {
        throw new TflError('timeout', 'TfL nie odpowiedział na czas.', 504);
      },
    });
    const { status, body } = await get(handle, '/api/transport/status');
    expect(status).toBe(504);
    expect(body.error).toEqual({ kind: 'timeout', message: 'TfL nie odpowiedział na czas.' });
  });
});

describe('transport API: stations and arrivals', () => {
  it('validates station ids before calling TfL', async () => {
    const { handle, calls } = api({});
    expect((await get(handle, '/api/transport/stations/..%2F..%2Fetc/arrivals')).status).toBe(400);
    expect((await get(handle, '/api/transport/stations/x')).status).toBe(400);
    expect((await get(handle, '/api/transport/stations/940GZZLUOXC/arrivals?line=hogwarts')).status).toBe(400);
    expect(calls).toEqual([]);
  });

  it('returns an empty list when TfL has no predictions', async () => {
    const { handle } = api({ '/StopPoint/940GZZLUOXC/Arrivals': [] });
    const { status, body } = await get<TrainPrediction[]>(handle, '/api/transport/stations/940GZZLUOXC/arrivals');
    expect(status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('keeps several lines at a multi-line station and drops other modes', async () => {
    const { handle } = api({
      '/StopPoint/940GZZLUOXC/Arrivals': [
        raw({ id: 'a', lineId: 'central', lineName: 'Central', timeToStation: 120 }),
        raw({ id: 'b', lineId: 'victoria', timeToStation: 30 }),
        raw({ id: 'c', lineId: '88', lineName: '88', modeName: 'bus' }),
      ],
    });
    const { body } = await get<TrainPrediction[]>(handle, '/api/transport/stations/940GZZLUOXC/arrivals');
    expect(body.data.map((p) => p.lineId)).toEqual(['victoria', 'central']);
  });

  it('returns 404 for an unknown station', async () => {
    const { handle } = api({});
    const { status, body } = await get(handle, '/api/transport/stations/940GZZLUXXXX');
    expect(status).toBe(404);
    expect(body.error.kind).toBe('not-found');
  });

  it('adapts a hub station using the requested child', async () => {
    const hub: RawStopPoint = {
      id: 'HUBOXC',
      commonName: 'Oxford Circus',
      lat: 51.5,
      lon: -0.14,
      children: [{ id: '940GZZLUOXC', naptanId: '940GZZLUOXC', commonName: 'Oxford Circus Underground Station', lat: 51.5, lon: -0.14, lines: [{ id: 'central', name: 'Central' }, { id: 'victoria', name: 'Victoria' }] }],
    };
    const { handle } = api({ '/StopPoint/940GZZLUOXC': hub });
    const { body } = await get<{ id: string; lines: string[] }>(handle, '/api/transport/stations/940GZZLUOXC');
    expect(body.data).toMatchObject({ id: '940GZZLUOXC', lines: ['central', 'victoria'] });
  });
});

describe('transport API: network and vehicles', () => {
  it('builds the network with interchanges from per-line sequences', async () => {
    const { handle } = api(networkRoutes());
    const { body } = await get<{ stations: Record<string, { interchange: boolean; lines: string[] }> }>(handle, '/api/transport/tube/network');
    expect(body.data.stations['940GZZLUOXC']).toMatchObject({ interchange: true, lines: ['central', 'victoria'] });
  });

  it('turns arrivals into estimated sightings filtered by line, ageing old predictions', async () => {
    const routes = networkRoutes();
    routes[`/Line/${TUBE_LINE_IDS.join(',')}/Arrivals`] = [
      raw({ id: '1', vehicleId: '201', naptanId: '940GZZLUOXC', timeToStation: 90, timestamp: new Date(NOW - 30_000).toISOString(), currentLocation: 'Between Green Park and Oxford Circus' }),
      raw({ id: '1b', vehicleId: '201', naptanId: '940GZZLUVIC', timeToStation: 400, timestamp: new Date(NOW - 30_000).toISOString() }),
      raw({ id: '2', vehicleId: '500', lineId: 'central', lineName: 'Central', naptanId: '940GZZLUOXC', timeToStation: 40 }),
      raw({ id: '3', vehicleId: undefined, naptanId: '940GZZLUGPK' }),
    ];
    const { handle } = api(routes);
    const { body } = await get<TrainSighting[]>(handle, '/api/transport/tube/vehicles?lines=victoria');
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ vehicleId: '201', fromStationId: '940GZZLUGPK', toStationId: '940GZZLUOXC', timeToStation: 60 });
  });

  it('rejects unknown lines for route and timetable', async () => {
    const { handle } = api({});
    expect((await get(handle, '/api/transport/tube/lines/hogwarts/route')).status).toBe(404);
    expect((await get(handle, '/api/transport/tube/timetable/hogwarts?from=940GZZLUVIC&to=940GZZLUOXC')).status).toBe(404);
    expect((await get(handle, '/api/transport/tube/timetable/victoria?from=940GZZLUVIC&to=940GZZLUVIC')).status).toBe(400);
  });

  it('reports no-data when TfL has no timetable for a stop pair', async () => {
    const { handle } = api({ '/Line/victoria/Timetable/940GZZLUVIC/to/940GZZLUOXC': { lineId: 'victoria', lineName: 'Victoria', direction: 'outbound', statusErrorMessage: 'no timetable' } });
    const { status, body } = await get(handle, '/api/transport/tube/timetable/victoria?from=940GZZLUVIC&to=940GZZLUOXC');
    expect(status).toBe(404);
    expect(body.error.kind).toBe('no-data');
  });

  it('answers unknown API paths with 404', async () => {
    const { handle } = api({});
    expect((await get(handle, '/api/transport/nope')).status).toBe(404);
  });

  it('never leaks credentials into responses', async () => {
    const spy = vi.fn();
    const { handle } = api({ '/Line/Mode/tube/Status': [] });
    const r = await handle(new URL('http://localhost/api/transport/status'));
    spy(JSON.stringify(r.body));
    expect(String(spy.mock.calls[0]?.[0])).not.toMatch(/app_key|app_id/);
  });
});
