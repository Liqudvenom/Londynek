import { describe, expect, it } from 'vitest';
import { adaptLineStatuses, adaptPredictions, adaptRouteSequence, adaptStopPoint, adaptTimetable, mergeNetwork, scheduleForDate, severityLevel } from './adapters';
import type { RawLine, RawPrediction, RawRouteSequence, RawStopPoint, RawTimetableResponse } from './raw';

describe('severityLevel', () => {
  it('maps TfL status codes to coarse levels', () => {
    expect(severityLevel(10)).toBe('good');
    expect(severityLevel(9)).toBe('minor');
    expect(severityLevel(6)).toBe('severe');
    expect(severityLevel(2)).toBe('closed');
    expect(severityLevel(20)).toBe('closed');
    expect(severityLevel(Number.NaN)).toBe('unknown');
  });
});

describe('adaptLineStatuses', () => {
  const raw: RawLine[] = [
    { id: 'victoria', name: 'Victoria', modeName: 'tube', lineStatuses: [{ statusSeverity: 10, statusSeverityDescription: 'Good Service' }] },
    {
      id: 'central',
      name: 'Central',
      modeName: 'tube',
      lineStatuses: [
        { statusSeverity: 9, statusSeverityDescription: 'Minor Delays', reason: 'Central Line: Minor delays  due to an earlier faulty train.' },
        { statusSeverity: 2, statusSeverityDescription: 'Suspended', reason: 'Central Line: No service between A and B.' },
      ],
    },
    { id: 'elizabeth', name: 'Elizabeth line', modeName: 'elizabeth-line', lineStatuses: [] },
  ];
  const [victoria, central, elizabeth] = adaptLineStatuses(raw);

  it('reports good service without disruptions', () => {
    expect(victoria).toMatchObject({ level: 'good', severity: 10, statusDescription: 'Good Service', disruptions: [] });
  });

  it('picks the worst status (suspended line) and keeps TfL text verbatim apart from whitespace', () => {
    expect(central?.level).toBe('closed');
    expect(central?.statusDescription).toBe('Suspended');
    expect(central?.disruptions.map((d) => d.description)).toEqual([
      'Central Line: Minor delays due to an earlier faulty train.',
      'Central Line: No service between A and B.',
    ]);
  });

  it('marks lines without any status as unknown', () => {
    expect(elizabeth?.level).toBe('unknown');
  });
});

describe('adaptPredictions', () => {
  const base: RawPrediction = {
    id: '1',
    vehicleId: '201',
    naptanId: '940GZZLUOXC',
    stationName: 'Oxford Circus Underground Station',
    lineId: 'victoria',
    lineName: 'Victoria',
    platformName: 'Northbound - Platform 5',
    direction: 'outbound',
    destinationNaptanId: '940GZZLUWWL',
    destinationName: 'Walthamstow Central Underground Station',
    timestamp: '2026-10-07T12:00:00Z',
    timeToStation: 125.4,
    currentLocation: 'Between Victoria and Green Park',
    towards: 'Walthamstow Central',
    expectedArrival: '2026-10-07T12:02:05Z',
  };

  it('returns an empty list for empty predictions', () => {
    expect(adaptPredictions([])).toEqual([]);
  });

  it('cleans names, sorts soonest first and drops placeholder vehicle ids', () => {
    const out = adaptPredictions([base, { ...base, id: '2', vehicleId: '000', timeToStation: 30, towards: '', destinationName: 'Brixton Underground Station' }]);
    expect(out.map((p) => p.id)).toEqual(['2', '1']);
    expect(out[0]).toMatchObject({ vehicleId: null, towards: 'Brixton', stationName: 'Oxford Circus' });
    expect(out[1]).toMatchObject({ timeToStation: 125, platform: 'Northbound - Platform 5' });
  });
});

describe('adaptRouteSequence + mergeNetwork', () => {
  const stop = (id: string, name: string) => ({ id, name: `${name} Underground Station`, lat: 51.5, lon: -0.1, zone: '2' });
  const northern: RawRouteSequence = {
    lineId: 'northern',
    lineName: 'Northern',
    direction: 'outbound',
    lineStrings: ['[[[-0.1,51.5],[-0.11,51.51]]]'],
    stations: [stop('A', 'Camden Town'), stop('B', 'Euston'), stop('C', 'Kentish Town'), stop('D', 'Chalk Farm')],
    stopPointSequences: [],
    orderedLineRoutes: [
      { name: 'Camden Town &harr; Euston', naptanIds: ['C', 'A', 'B'], serviceType: 'Regular' },
      { name: 'Chalk Farm &harr; Euston', naptanIds: ['D', 'A', 'B'], serviceType: 'Regular' },
      { name: 'Night', naptanIds: ['D', 'B'], serviceType: 'Night' },
    ],
  };
  const victoria: RawRouteSequence = { ...northern, lineId: 'victoria', lineName: 'Victoria', stations: [stop('B', 'Euston'), stop('E', 'Warren Street')], orderedLineRoutes: [{ name: 'x', naptanIds: ['B', 'E'], serviceType: 'Regular' }] };

  it('keeps regular branches only and decodes route names', () => {
    const { line, stations } = adaptRouteSequence(northern);
    expect(line.branches.map((b) => b.name)).toEqual(['Camden Town ↔ Euston', 'Chalk Farm ↔ Euston']);
    expect(stations.map((s) => s.name).sort()).toEqual(['Camden Town', 'Chalk Farm', 'Euston', 'Kentish Town']);
    expect(line.geometry).toHaveLength(1);
  });

  it('marks stations served by several lines as interchanges', () => {
    const net = mergeNetwork([adaptRouteSequence(northern), adaptRouteSequence(victoria)]);
    expect(net.stations.B?.lines).toEqual(['northern', 'victoria']);
    expect(net.stations.B?.interchange).toBe(true);
    expect(net.stations.A?.interchange).toBe(false);
  });
});

describe('adaptStopPoint', () => {
  const hub: RawStopPoint = {
    id: 'HUBKGX',
    commonName: "King's Cross St. Pancras",
    lat: 51.53,
    lon: -0.12,
    modes: ['tube', 'national-rail', 'bus', 'international-rail'],
    lines: [{ id: 'victoria', name: 'Victoria' }, { id: 'thameslink', name: 'Thameslink' }],
    children: [
      {
        id: '940GZZLUKSX',
        naptanId: '940GZZLUKSX',
        commonName: "King's Cross St. Pancras Underground Station",
        lat: 51.53,
        lon: -0.12,
        lines: [{ id: 'victoria', name: 'Victoria' }, { id: 'northern', name: 'Northern' }, { id: 'victoria', name: 'Victoria' }],
        additionalProperties: [
          { category: 'Accessibility', key: 'AccessViaLift', value: 'Yes' },
          { category: 'Facility', key: 'WiFi', value: 'yes' },
          { category: 'Facility', key: 'Unknown thing', value: '1' },
        ],
      },
    ],
  };

  it('finds the requested station inside a hub and reads its lift access', () => {
    const d = adaptStopPoint(hub, '940GZZLUKSX');
    expect(d).toMatchObject({ id: '940GZZLUKSX', name: "King's Cross St. Pancras", liftAccess: true, lines: ['victoria', 'northern'] });
    expect(d.otherModes).toEqual(['national-rail', 'international-rail']);
    expect(d.facilities).toEqual([
      { label: 'Dostęp windą', value: 'Yes' },
      { label: 'Wi-Fi', value: 'yes' },
    ]);
  });

  it('returns null lift access when TfL has no data', () => {
    expect(adaptStopPoint({ id: 'X', commonName: 'X', lat: 0, lon: 0 }).liftAccess).toBeNull();
  });
});

describe('adaptTimetable', () => {
  const raw: RawTimetableResponse = {
    lineId: 'victoria',
    lineName: 'Victoria',
    direction: 'outbound',
    stops: [
      { id: 'A', name: 'Brixton Underground Station', lat: 0, lon: 0 },
      { id: 'B', name: 'Stockwell Underground Station', lat: 0, lon: 0 },
    ],
    timetable: {
      departureStopId: 'A',
      routes: [
        {
          stationIntervals: [{ id: '0', intervals: [{ stopId: 'B', timeToArrival: 2 }] }],
          schedules: [
            {
              name: 'Monday - Thursday',
              knownJourneys: [
                { hour: '24', minute: '10', intervalId: 0 },
                { hour: '5', minute: '36', intervalId: 0 },
                { hour: '5', minute: '36', intervalId: 0 },
              ],
            },
            { name: 'Sunday', knownJourneys: [{ hour: '7', minute: '0', intervalId: 1 }] },
          ],
        },
      ],
    },
  };

  it('builds sorted, de-duplicated departures with arrival times and wraps past midnight', () => {
    const tt = adaptTimetable(raw, 'A', 'B');
    expect(tt).toMatchObject({ fromName: 'Brixton', toName: 'Stockwell', travelMinutes: 2 });
    expect(tt?.schedules).toEqual([
      {
        name: 'Monday - Thursday',
        departures: [
          { time: '05:36', arrival: '05:38' },
          { time: '00:10', arrival: '00:12' },
        ],
      },
    ]);
  });

  it('returns null when TfL has no routes', () => {
    expect(adaptTimetable({ ...raw, timetable: undefined }, 'A', 'B')).toBeNull();
  });
});

describe('scheduleForDate', () => {
  const schedules = [{ name: 'Monday - Thursday' }, { name: 'Friday' }, { name: 'Saturday (also Good Friday)' }, { name: 'Sunday' }];
  const on = (iso: string) => scheduleForDate(schedules, new Date(`${iso}T12:00:00`))?.name;

  it('matches day ranges and single days', () => {
    expect(on('2026-10-05')).toBe('Monday - Thursday');
    expect(on('2026-10-08')).toBe('Monday - Thursday');
    expect(on('2026-10-11')).toBe('Sunday');
  });

  it('does not pick the Saturday schedule on an ordinary Friday', () => {
    expect(on('2026-10-09')).toBe('Friday');
    expect(on('2026-10-10')).toBe('Saturday (also Good Friday)');
  });

  it('falls back to the first schedule', () => {
    expect(scheduleForDate([{ name: 'Special' }], new Date())?.name).toBe('Special');
  });
});
