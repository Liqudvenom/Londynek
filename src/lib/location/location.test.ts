import { describe, expect, it } from 'vitest';
import { detectInputType, normalisePostcode } from './detect';
import { publicPlaceLabel } from './mapItems';
import { distanceM, nearestStations, walkMinutes } from './nearestStations';
import { parseRouteEnd } from './routeParams';
import type { GeoLocation } from './types';

describe('detectInputType', () => {
  it('recognises full and outcode postcodes', () => {
    expect(detectInputType('SW1A 1AA')).toBe('POSTCODE');
    expect(detectInputType('sw72pg')).toBe('POSTCODE');
    expect(detectInputType('SW7')).toBe('POSTCODE');
  });
  it('recognises street addresses and station names', () => {
    expect(detectInputType('55 Exhibition Rd, London SW7 2PG')).toBe('ADDRESS');
    expect(detectInputType('Oxford Circus Station')).toBe('STATION');
    expect(detectInputType('Polski sklep Wembley')).toBe('PLACE');
  });
});

describe('normalisePostcode', () => {
  it('formats inward and outward codes', () => {
    expect(normalisePostcode('sw72pg')).toBe('SW7 2PG');
    expect(normalisePostcode('SW7')).toBe('SW7');
    expect(normalisePostcode('not a code')).toBeNull();
  });
});

describe('nearestStations', () => {
  const stations = [
    { id: 'a', name: 'South Kensington', lat: 51.4941, lon: -0.1742, lines: ['piccadilly'], zone: '1' },
    { id: 'b', name: 'Gloucester Road', lat: 51.4945, lon: -0.1826, lines: ['piccadilly'], zone: '1' },
    { id: 'c', name: 'Wembley Park', lat: 51.5635, lon: -0.2796, lines: ['jubilee'], zone: '4' },
  ];
  it('returns the closest station within the cap', () => {
    const near = nearestStations(stations, 51.49921, -0.17369, 2, 5000);
    expect(near[0]?.name).toBe('South Kensington');
    expect(near[0]!.walkMin).toBe(walkMinutes(near[0]!.distanceM));
    expect(near[0]!.distanceM).toBeLessThan(800);
  });
  it('uses great-circle metres', () => {
    expect(distanceM(51.5, -0.1, 51.5, -0.1)).toBe(0);
    expect(distanceM(51.5, -0.1, 51.51, -0.1)).toBeGreaterThan(1000);
  });
});

describe('publicPlaceLabel', () => {
  const exact: GeoLocation = {
    address: '55 Exhibition Rd',
    postcode: 'SW7 2PG',
    lat: 51.49921,
    lng: -0.17369,
    district: 'South Kensington',
    borough: 'Westminster',
    precision: 'exact',
  };
  it('shows the street for public exact locations', () => {
    expect(publicPlaceLabel(exact)).toContain('55 Exhibition Rd');
  });
  it('hides the building when the owner opts out', () => {
    expect(publicPlaceLabel({ ...exact, hideExact: true })).toBe('Okolica: South Kensington SW7');
  });
  it('never prints a street for area precision', () => {
    expect(publicPlaceLabel({ ...exact, precision: 'area' })).toBe('Okolica: South Kensington SW7');
  });
});

describe('parseRouteEnd', () => {
  it('reads coordinates from toLat/toLng/toName', () => {
    const p = parseRouteEnd(new URLSearchParams({ toLat: '51.49921', toLng: '-0.17369', toName: 'Ognisko' }), 'to');
    expect(p.place).toMatchObject({ name: 'Ognisko', lat: 51.49921, lng: -0.17369 });
  });
  it('keeps free text for later geocoding', () => {
    const p = parseRouteEnd(new URLSearchParams({ from: 'SW7 2PG' }), 'from');
    expect(p).toEqual({ place: null, text: 'SW7 2PG' });
  });
});
