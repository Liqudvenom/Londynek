import { DISTRICTS } from '@/data/districts';
import type { RegionId } from '@/types';
import { mapPoint } from './mapProjection';

const REGION_CENTER: Record<RegionId, { x: number; y: number }> = {
  central: mapPoint(51.512, -0.13),
  north: mapPoint(51.6, -0.13),
  east: mapPoint(51.56, 0.05),
  south: mapPoint(51.4, -0.08),
  west: mapPoint(51.52, -0.33),
};

/** Approximate map position for a location string (matches district names, falls back to region centre). */
export function coordsFor(location: string, region: RegionId) {
  const d = DISTRICTS.find((x) => location.toLowerCase().includes(x.name.toLowerCase()));
  if (d) return d.map;
  return REGION_CENTER[region];
}
