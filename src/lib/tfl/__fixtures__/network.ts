// Small hand-built Tube network for unit tests (shapes mirror real TfL data, values are synthetic).
import type { TrainPrediction, TubeNetwork, TubeStation } from '../types';

const st = (id: string, name: string, lon: number, lines: string[]): TubeStation => ({
  id,
  name,
  lat: 51.5,
  lon,
  lines,
  interchange: lines.length > 1,
  zone: '1',
  hubId: null,
});

export const IDS = {
  brixton: '940GZZLUBXN',
  stockwell: '940GZZLUSKW',
  elephant: '940GZZLUEAC',
  lambeth: '940GZZLULBN',
  waterloo: '940GZZLUWLO',
  kennington: '940GZZLUKNG',
  morden: '940GZZLUMDN',
  battersea: '940GZZBPSUST',
} as const;

/**
 * victoria:  Brixton – Stockwell – Elephant & Castle – Lambeth North – Waterloo (a straight line along lon)
 * northern:  Morden – Stockwell – Kennington, and a branch Kennington – Battersea (fork)
 */
export function fixtureNetwork(): TubeNetwork {
  return {
    lines: [
      {
        id: 'victoria',
        name: 'Victoria',
        colour: '#0098D4',
        branches: [{ name: 'Brixton ↔ Waterloo', stationIds: [IDS.brixton, IDS.stockwell, IDS.elephant, IDS.lambeth, IDS.waterloo] }],
        geometry: [],
      },
      {
        id: 'northern',
        name: 'Northern',
        colour: '#000000',
        branches: [
          { name: 'Morden ↔ Kennington', stationIds: [IDS.morden, IDS.stockwell, IDS.kennington] },
          { name: 'Morden ↔ Battersea', stationIds: [IDS.morden, IDS.stockwell, IDS.kennington, IDS.battersea] },
        ],
        geometry: [],
      },
    ],
    stations: {
      [IDS.brixton]: st(IDS.brixton, 'Brixton', -0.12, ['victoria']),
      [IDS.stockwell]: st(IDS.stockwell, 'Stockwell', -0.1, ['victoria', 'northern']),
      [IDS.elephant]: st(IDS.elephant, 'Elephant & Castle', -0.08, ['victoria']),
      [IDS.lambeth]: st(IDS.lambeth, 'Lambeth North', -0.06, ['victoria']),
      [IDS.waterloo]: st(IDS.waterloo, 'Waterloo', -0.04, ['victoria']),
      [IDS.morden]: st(IDS.morden, 'Morden', -0.14, ['northern']),
      [IDS.kennington]: st(IDS.kennington, 'Kennington', -0.09, ['northern']),
      [IDS.battersea]: st(IDS.battersea, 'Battersea Power Station', -0.07, ['northern']),
    },
  };
}

export function prediction(p: Partial<TrainPrediction> & Pick<TrainPrediction, 'stationId' | 'timeToStation'>): TrainPrediction {
  return {
    id: `${p.vehicleId ?? 'v'}-${p.stationId}`,
    vehicleId: '201',
    lineId: 'victoria',
    lineName: 'Victoria',
    stationName: 'Station',
    platform: 'Northbound - Platform 1',
    direction: 'outbound',
    towards: 'Waterloo',
    destinationId: IDS.waterloo,
    expectedArrival: '2026-10-07T12:00:00Z',
    currentLocation: null,
    timestamp: '2026-10-07T12:00:00Z',
    ...p,
  };
}
