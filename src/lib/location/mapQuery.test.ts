import { describe, expect, it } from 'vitest';
import { filterMapItems, parseMapQuery } from './mapQuery';
import type { MapItem } from './mapItems';
import type { GeoLocation } from './types';

function pin(partial: Partial<MapItem> & Pick<MapItem, 'id' | 'kind' | 'title'>): MapItem {
  const geo: GeoLocation = {
    postcode: 'SW11 1AA',
    lat: 51.46,
    lng: -0.17,
    district: 'Battersea',
    borough: 'Wandsworth',
    precision: 'area',
    ...partial.geo,
  };
  return { subtitle: '', geo, to: '/', ...partial };
}

const ITEMS = [
  pin({ id: 'job', kind: 'jobs', title: 'Kucharz', subtitle: 'Restauracja' }),
  pin({ id: 'room', kind: 'housing', title: 'Pokój w Ealing', subtitle: 'Wynajem', geo: { postcode: 'W5 2NP', lat: 51.51, lng: -0.3, district: 'Ealing', borough: 'Ealing', precision: 'area' } }),
  pin({ id: 'help', kind: 'services', title: 'Tłumacz przysięgły', subtitle: 'Dokumenty' }),
];

describe('parseMapQuery', () => {
  it('reads category words, including without Polish diacritics', () => {
    expect(parseMapQuery('praca').intent?.id).toBe('jobs');
    expect(parseMapQuery('pokój').intent?.id).toBe('housing');
    expect(parseMapQuery('pokoj').intent?.id).toBe('housing');
    expect(parseMapQuery('pomoc').intent?.id).toBe('help');
  });

  it('keeps a category when a postcode is pasted after it', () => {
    const parsed = parseMapQuery('praca SW11 1AA');
    expect(parsed.intent?.id).toBe('jobs');
    expect(parsed.place).toBe('SW11 1AA');
  });

  it('treats a pasted postcode or street as a place', () => {
    expect(parseMapQuery('sw111aa').place).toBe('SW11 1AA');
    expect(parseMapQuery('10 King Street').place).toBe('10 King Street');
    expect(parseMapQuery('ul. Polska 5').place).toBe('ul. Polska 5');
  });
});

describe('filterMapItems', () => {
  it('returns the kind the person asked for', () => {
    expect(filterMapItems(ITEMS, 'praca', null).map((i) => i.id)).toEqual(['job']);
    expect(filterMapItems(ITEMS, 'pokoj', null).map((i) => i.id)).toEqual(['room']);
    expect(filterMapItems(ITEMS, 'pomoc', null).map((i) => i.id)).toEqual(['help']);
  });

  it('matches a free-text word in the title or district', () => {
    expect(filterMapItems(ITEMS, 'ealing', null).map((i) => i.id)).toEqual(['room']);
  });
});
