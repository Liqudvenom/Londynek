import { LONDON_PROJECTION as P, LONDON_VIEWBOX as V } from '@/data/london-geo.generated';

/** Real coordinates → position on the London region map, in percent of width/height. */
export function mapPoint(lat: number, lon: number) {
  const x = (lon - P.minLon) * P.cos * P.k + P.pad;
  const y = (P.maxLat - lat) * P.k + P.pad;
  return { x: Math.round((x / V.width) * 1000) / 10, y: Math.round((y / V.height) * 1000) / 10 };
}
