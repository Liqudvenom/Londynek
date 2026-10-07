import { serverNow } from '@/lib/tfl/api';
import type { TrainSighting } from '@/lib/tfl/types';

export type Coord = [number, number];

export interface AnimatedTrain {
  sighting: TrainSighting;
  /** Position in the map's stable coordinate space ([lon, lat] for geo, layout units for LED) */
  pos: Coord;
  /** Direction of travel in the same space */
  heading: Coord;
  secondsToNext: number;
}

const BLEND_MS = 1500;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * Estimated visual positions for trains (NOT GPS). Each frame interpolates every train between
 * its from/to stations using timeToStation; when fresh predictions arrive the marker blends from
 * where it was drawn to the new estimate instead of jumping. No network work happens here.
 */
export class TrainAnimator {
  private trains = new Map<string, { s: TrainSighting; blendFrom: Coord | null; blendStart: number; last: Coord | null }>();
  private frozenAt: number | null = null;

  constructor(
    private coordOf: (stationId: string) => Coord | null,
    /** Optional path-following interpolation (LED board draws bent segments). */
    private along?: (s: TrainSighting, fromId: string, p: number) => { pos: Coord; heading: Coord } | null,
  ) {}

  update(sightings: TrainSighting[], reducedMotion: boolean) {
    const now = performance.now();
    const next = new Map<string, { s: TrainSighting; blendFrom: Coord | null; blendStart: number; last: Coord | null }>();
    for (const s of sightings) {
      const prev = this.trains.get(s.key);
      next.set(s.key, { s, blendFrom: reducedMotion ? null : prev?.last ?? null, blendStart: now, last: prev?.last ?? null });
    }
    this.trains = next;
    this.frozenAt = reducedMotion ? serverNow() : null;
  }

  private target(s: TrainSighting, at: number): { pos: Coord; heading: Coord; secondsToNext: number } | null {
    const to = this.coordOf(s.toStationId);
    if (!to) return null;
    const from = s.fromStationId ? this.coordOf(s.fromStationId) : null;
    const remaining = s.timeToStation - (at - Date.parse(s.observedAt)) / 1000;
    if (!from || s.atStation) return { pos: to, heading: [0, 0], secondsToNext: Math.max(0, remaining) };
    const p = clamp01(1 - remaining / s.segmentSeconds);
    const path = this.along?.(s, s.fromStationId!, p);
    if (path) return { ...path, secondsToNext: Math.max(0, remaining) };
    return {
      pos: [from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p],
      heading: [to[0] - from[0], to[1] - from[1]],
      secondsToNext: Math.max(0, remaining),
    };
  }

  /** Positions at the current moment. With reduced motion, trains stay put between refreshes. */
  frame(filter?: (s: TrainSighting) => boolean): AnimatedTrain[] {
    const live = serverNow();
    const at = this.frozenAt ?? live;
    const now = performance.now();
    const out: AnimatedTrain[] = [];
    for (const t of this.trains.values()) {
      if (filter && !filter(t.s)) continue;
      const tg = this.target(t.s, at);
      if (!tg) continue;
      if (at !== live) tg.secondsToNext = Math.max(0, t.s.timeToStation - (live - Date.parse(t.s.observedAt)) / 1000);
      let pos = tg.pos;
      if (t.blendFrom) {
        const k = ease(clamp01((now - t.blendStart) / BLEND_MS));
        pos = [t.blendFrom[0] + (pos[0] - t.blendFrom[0]) * k, t.blendFrom[1] + (pos[1] - t.blendFrom[1]) * k];
        if (k >= 1) t.blendFrom = null;
      }
      t.last = pos;
      out.push({ sighting: t.s, pos, heading: tg.heading, secondsToNext: tg.secondsToNext });
    }
    return out;
  }

  get size() {
    return this.trains.size;
  }
}
