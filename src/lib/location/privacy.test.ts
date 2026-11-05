import { describe, expect, it } from 'vitest';
import { allMapItems } from './mapItems';
import { toPublicGeo } from './privacy';
import { distanceM } from './nearestStations';
import type { GeoLocation } from './types';

const HOME: GeoLocation = { address: '12 Acacia Avenue', postcode: 'W5 2NP', lat: 51.51337, lng: -0.30219, district: 'Ealing', borough: 'Ealing', precision: 'exact' };

describe('toPublicGeo', () => {
  it('drops the street and the full postcode of a private listing', () => {
    const geo = toPublicGeo(HOME, 'p-1', false);
    expect(geo.address).toBeUndefined();
    expect(geo.postcode).toBe('W5');
    expect(geo.precision).toBe('area');
  });

  it('gives the same point for two homes in the same grid cell', () => {
    const neighbour = { ...HOME, lat: HOME.lat + 0.0004, lng: HOME.lng - 0.0004 };
    const a = toPublicGeo(HOME, 'same-id', false);
    const b = toPublicGeo(neighbour, 'same-id', false);
    expect([a.lat, a.lng]).toEqual([b.lat, b.lng]);
  });

  it('keeps public places exact', () => {
    expect(toPublicGeo(HOME, 'firm', true)).toBe(HOME);
    expect(toPublicGeo({ ...HOME, hideExact: true }, 'firm', true).address).toBeUndefined();
  });

  it('stays within the neighbourhood', () => {
    const geo = toPublicGeo(HOME, 'x', false);
    expect(distanceM(HOME.lat, HOME.lng, geo.lat, geo.lng)).toBeLessThan(1500);
  });
});

describe('public map items', () => {
  it('only firms and event venues carry a street address', () => {
    for (const item of allMapItems()) {
      if (item.geo.address) expect(['business', 'events']).toContain(item.kind);
    }
  });
});
