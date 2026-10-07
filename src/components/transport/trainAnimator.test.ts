import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDS, fixtureNetwork, prediction } from '@/lib/tfl/__fixtures__/network';
import { indexNetwork } from '@/lib/tfl/network';
import { buildSightings } from '@/lib/tfl/trains';
import { TrainAnimator, type Coord } from './trainAnimator';

const net = fixtureNetwork();
const index = indexNetwork(net);
const coordOf = (id: string): Coord | null => {
  const s = net.stations[id];
  return s ? [s.lon, s.lat] : null;
};
const T = Date.parse('2026-10-07T12:00:00.000Z');
const sighting = (extra = {}) =>
  buildSightings(
    [prediction({ stationId: IDS.elephant, timeToStation: 50, currentLocation: 'Departed Stockwell', ...extra }), prediction({ stationId: IDS.lambeth, timeToStation: 150 })],
    index,
    new Date(T).toISOString(),
  );

let clock = T;
let perf = 0;
vi.spyOn(Date, 'now').mockImplementation(() => clock);
vi.spyOn(performance, 'now').mockImplementation(() => perf);

afterEach(() => {
  clock = T;
  perf = 0;
});

describe('TrainAnimator', () => {
  it('moves trains along the segment as time passes', () => {
    const a = new TrainAnimator(coordOf);
    a.update(sighting(), false);
    expect(a.frame()[0]?.pos[0]).toBeCloseTo(-0.09);
    clock = T + 25_000;
    const f = a.frame()[0]!;
    expect(f.pos[0]).toBeCloseTo(-0.085);
    expect(f.secondsToNext).toBeCloseTo(25);
    expect(f.heading[0]).toBeGreaterThan(0);
  });

  it('blends from the drawn position to a new estimate instead of jumping', () => {
    const a = new TrainAnimator(coordOf);
    a.update(sighting(), false);
    a.frame();
    a.update(sighting({ timeToStation: 0, currentLocation: 'At Elephant and Castle' }), false);
    perf = 750;
    const mid = a.frame()[0]!.pos[0];
    expect(mid).toBeGreaterThan(-0.09);
    expect(mid).toBeLessThan(-0.08);
    perf = 2000;
    expect(a.frame()[0]!.pos[0]).toBeCloseTo(-0.08);
  });

  it('freezes positions under reduced motion but keeps the countdown live', () => {
    const a = new TrainAnimator(coordOf);
    a.update(sighting(), true);
    clock = T + 25_000;
    const f = a.frame()[0]!;
    expect(f.pos[0]).toBeCloseTo(-0.09);
    expect(f.secondsToNext).toBeCloseTo(25);
  });

  it('applies line filters', () => {
    const a = new TrainAnimator(coordOf);
    a.update(sighting(), false);
    expect(a.frame((s) => s.lineId === 'northern')).toEqual([]);
  });
});
