import { describe, expect, it } from 'vitest';
import { formatCountdown, groupArrivals, splitPlatform, staleLabel } from './format';
import { IDS, fixtureNetwork, prediction } from './__fixtures__/network';
import { hasTransportKeyword, matchTransport, matchTransportForSiteSearch } from './match';

describe('formatCountdown', () => {
  it.each([
    [-5, 'Teraz'],
    [0, 'Teraz'],
    [1, '1 min'],
    [59, '1 min'],
    [60, '1 min'],
    [149, '2 min'],
    [600, '10 min'],
  ])('%i s → %s', (s, label) => {
    expect(formatCountdown(s)).toBe(label);
  });
});

describe('staleLabel', () => {
  const now = Date.parse('2026-10-07T12:10:00Z');
  it('stays quiet for fresh data and reports age for old data', () => {
    expect(staleLabel('2026-10-07T12:09:00Z', now)).toBeNull();
    expect(staleLabel('2026-10-07T12:05:00Z', now)).toBe('Dane sprzed 5 min');
  });
});

describe('splitPlatform / groupArrivals', () => {
  it('parses TfL platform names', () => {
    expect(splitPlatform('Northbound - Platform 5')).toEqual({ direction: 'Northbound', platform: '5' });
    expect(splitPlatform('Platform 2')).toEqual({ direction: null, platform: '2' });
    expect(splitPlatform(null)).toEqual({ direction: null, platform: null });
  });

  it('groups by line and direction, soonest first inside a group', () => {
    const groups = groupArrivals([
      prediction({ stationId: IDS.stockwell, timeToStation: 30, platform: 'Northbound - Platform 1' }),
      prediction({ stationId: IDS.stockwell, timeToStation: 60, platform: 'Southbound - Platform 2' }),
      prediction({ stationId: IDS.stockwell, timeToStation: 90, platform: 'Northbound - Platform 1' }),
      prediction({ stationId: IDS.stockwell, timeToStation: 40, platform: 'Northbound - Platform 3', lineId: 'northern' }),
    ]);
    expect(groups.map((g) => [g.lineId, g.label, g.items.map((p) => p.timeToStation)])).toEqual([
      ['northern', 'Kierunek północny', [40]],
      ['victoria', 'Kierunek południowy', [60]],
      ['victoria', 'Kierunek północny', [30, 90]],
    ]);
  });
});

describe('transport search matching', () => {
  const net = fixtureNetwork();

  it('understands "X station", "metro X" and "X line"', () => {
    expect(matchTransport(net, 'Waterloo station').stations[0]?.id).toBe(IDS.waterloo);
    expect(matchTransport(net, 'metro Stockwell').stations[0]?.id).toBe(IDS.stockwell);
    expect(matchTransport(net, 'Victoria line').lines.map((l) => l.id)).toEqual(['victoria']);
  });

  it('only returns confident matches for generic site searches', () => {
    expect(hasTransportKeyword('pokój Stockwell')).toBe(false);
    expect(matchTransportForSiteSearch(net, 'praca').stations).toEqual([]);
    expect(matchTransportForSiteSearch(net, 'ton').stations).toEqual([]);
    expect(matchTransportForSiteSearch(net, 'kenn').stations.map((s) => s.id)).toEqual([IDS.kennington]);
    expect(matchTransportForSiteSearch(net, 'stacja ton').stations.map((s) => s.id)).toContain(IDS.kennington);
  });
});
