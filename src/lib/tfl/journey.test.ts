import { describe, expect, it } from 'vitest';
import { rankJourneys } from './journey';
import type { Journey } from './types';

const j = (id: string, durationMin: number, walkMin: number, transfers: number): Journey => ({
  id,
  departure: '2026-10-07T18:23:00Z',
  arrival: '2026-10-07T18:51:00Z',
  durationMin,
  walkMin,
  transfers,
  legs: [],
  farePence: null,
});

describe('rankJourneys', () => {
  it('labels fastest, fewest changes and least walking, collapsing duplicates', () => {
    const ranked = rankJourneys([j('a', 28, 3, 0), j('b', 32, 9, 1), j('c', 34, 2, 1)]);
    expect(ranked).toHaveLength(3);
    expect(ranked[0]).toMatchObject({ journey: { id: 'a' }, ranks: ['fastest', 'fewest-changes'] });
    expect(ranked.find((r) => r.journey.id === 'c')?.ranks).toEqual(['least-walking']);
    expect(ranked.find((r) => r.journey.id === 'b')?.ranks).toEqual([]);
  });
  it('returns an empty list when TfL found nothing', () => {
    expect(rankJourneys([])).toEqual([]);
  });
});
