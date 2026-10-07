import { describe, expect, it } from 'vitest';
import { IDS, fixtureNetwork, prediction } from './__fixtures__/network';
import { parseCurrentLocation, splitBetween } from './names';
import { indexNetwork, lineSegments, resolveStationName } from './network';
import { buildSightings, estimatedVisualPosition } from './trains';

const index = indexNetwork(fixtureNetwork());
const T = '2026-10-07T12:00:00.000Z';

describe('parseCurrentLocation', () => {
  it.each([
    ['At Oxford Circus Platform 5', 'at', 'Oxford Circus'],
    ['Between Seven Sisters and Tottenham Hale', 'between', 'Seven Sisters and Tottenham Hale'],
    ['Approaching Brixton', 'approaching', 'Brixton'],
    ['Departed Stockwell', 'departed', 'Stockwell'],
    ['Left Euston', 'departed', 'Euston'],
    ['Near Brixton', 'unknown', undefined],
  ])('%s → %s', (text, kind, a) => {
    expect(parseCurrentLocation(text)).toEqual(a === undefined ? { kind } : { kind, a });
  });

  it('handles missing text', () => {
    expect(parseCurrentLocation(null)).toEqual({ kind: 'unknown' });
    expect(parseCurrentLocation('')).toEqual({ kind: 'unknown' });
  });
});

describe('splitBetween', () => {
  it('splits at the "and" where both sides are real stations', () => {
    const resolve = (n: string) => resolveStationName(index, n, 'victoria');
    const pair = splitBetween('Elephant and Castle and Lambeth North', resolve);
    expect(pair?.map((s) => s.id)).toEqual([IDS.elephant, IDS.lambeth]);
  });

  it('returns null when no split resolves', () => {
    expect(splitBetween('Nowhere and Somewhere', () => null)).toBeNull();
  });
});

describe('lineSegments', () => {
  it('lists the trunk once and the extra branch part separately', () => {
    const northern = index.lines.get('northern')!;
    expect(lineSegments(northern)).toEqual([[IDS.morden, IDS.stockwell, IDS.kennington, IDS.battersea]]);
  });
});

describe('buildSightings', () => {
  it('detects a train standing at a station', () => {
    const [s] = buildSightings(
      [
        prediction({ stationId: IDS.elephant, timeToStation: 0, currentLocation: 'At Elephant and Castle' }),
        prediction({ stationId: IDS.lambeth, timeToStation: 120 }),
      ],
      index,
      T,
    );
    expect(s).toMatchObject({ toStationId: IDS.elephant, atStation: true, segmentSeconds: 120 });
  });

  it('places a train between two stations from "Between A and B"', () => {
    const [s] = buildSightings(
      [
        prediction({ stationId: IDS.lambeth, timeToStation: 60, currentLocation: 'Between Elephant and Castle and Lambeth North' }),
        prediction({ stationId: IDS.waterloo, timeToStation: 180 }),
      ],
      index,
      T,
    );
    expect(s).toMatchObject({ fromStationId: IDS.elephant, toStationId: IDS.lambeth, timeToStation: 60, segmentSeconds: 120, atStation: false });
  });

  it('uses the departed station as origin', () => {
    const [s] = buildSightings(
      [prediction({ stationId: IDS.elephant, timeToStation: 90, currentLocation: 'Departed Stockwell' }), prediction({ stationId: IDS.lambeth, timeToStation: 200 })],
      index,
      T,
    );
    expect(s).toMatchObject({ fromStationId: IDS.stockwell, toStationId: IDS.elephant, segmentSeconds: 110 });
  });

  it('caps "approaching" trains close to the station and infers the previous stop', () => {
    const [s] = buildSightings([prediction({ stationId: IDS.waterloo, timeToStation: 90, currentLocation: 'Approaching Waterloo' })], index, T);
    expect(s).toMatchObject({ fromStationId: IDS.lambeth, toStationId: IDS.waterloo, timeToStation: 30 });
  });

  it('infers the origin on a fork from the direction of the next stop', () => {
    const [s] = buildSightings(
      [
        prediction({ lineId: 'northern', stationId: IDS.kennington, timeToStation: 50, destinationId: IDS.battersea }),
        prediction({ lineId: 'northern', stationId: IDS.battersea, timeToStation: 170, destinationId: IDS.battersea }),
      ],
      index,
      T,
    );
    expect(s?.fromStationId).toBe(IDS.stockwell);
  });

  it('clamps segment duration to a plausible range', () => {
    const long = buildSightings([prediction({ stationId: IDS.brixton, timeToStation: 10 }), prediction({ stationId: IDS.waterloo, timeToStation: 2000 })], index, T);
    const short = buildSightings([prediction({ stationId: IDS.brixton, timeToStation: 10 }), prediction({ stationId: IDS.stockwell, timeToStation: 15 })], index, T);
    expect(long[0]?.segmentSeconds).toBe(240);
    expect(short[0]?.segmentSeconds).toBe(45);
  });

  it('skips predictions without a vehicle or for unknown stations, and groups per vehicle', () => {
    const out = buildSightings(
      [
        prediction({ stationId: IDS.lambeth, timeToStation: 60, vehicleId: null }),
        prediction({ stationId: '940GZZNOWHERE', timeToStation: 60, vehicleId: '300' }),
        prediction({ stationId: IDS.lambeth, timeToStation: 60, vehicleId: '301' }),
        prediction({ stationId: IDS.waterloo, timeToStation: 160, vehicleId: '301' }),
        prediction({ stationId: IDS.stockwell, timeToStation: 40, vehicleId: '302' }),
      ],
      index,
      T,
    );
    expect(out.map((s) => s.vehicleId).sort()).toEqual(['301', '302']);
    expect(out.find((s) => s.vehicleId === '301')?.nextStops).toHaveLength(2);
  });

  it('returns nothing for empty predictions', () => {
    expect(buildSightings([], index, T)).toEqual([]);
  });
});

describe('estimatedVisualPosition', () => {
  const [s] = buildSightings(
    [prediction({ stationId: IDS.elephant, timeToStation: 50, currentLocation: 'Departed Stockwell' }), prediction({ stationId: IDS.lambeth, timeToStation: 150 })],
    index,
    T,
  );

  it('interpolates linearly between stations as time passes', () => {
    const t0 = Date.parse(T);
    expect(s?.segmentSeconds).toBe(100);
    expect(estimatedVisualPosition(s!, index, t0)?.lon).toBeCloseTo(-0.09);
    expect(estimatedVisualPosition(s!, index, t0)?.progress).toBeCloseTo(0.5);
    const later = estimatedVisualPosition(s!, index, t0 + 80_000)!;
    expect(later.progress).toBe(1);
    expect(later.secondsToNext).toBe(0);
  });
});
