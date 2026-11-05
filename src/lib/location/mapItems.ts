import { BUSINESSES, BUSINESS_CATEGORY_LABEL } from '@/data/businesses';
import { CLASSIFIEDS, categoryMeta } from '@/data/classifieds';
import { EVENTS } from '@/data/events';
import type { ImageName } from '@/data/images.generated';
import { JOBS } from '@/data/jobs';
import { PROPERTIES } from '@/data/properties';
import { SERVICES } from '@/data/services';
import { VEHICLES } from '@/data/vehicles';
import { formatGBP } from '@/lib/format';
import { distanceM } from './nearestStations';
import { toPublicGeo } from './privacy';
import type { GeoLocation } from './types';

/** Map category – each has a subtle colour (see --cat-* tokens). */
export type MapKind = 'jobs' | 'housing' | 'services' | 'business' | 'events' | 'market';

export const MAP_KIND_LABEL: Record<MapKind, string> = {
  jobs: 'Praca',
  housing: 'Nieruchomości',
  services: 'Usługi',
  business: 'Firmy',
  events: 'Wydarzenia',
  market: 'Ogłoszenia',
};

export const MAP_KIND_COLOUR: Record<MapKind, string> = {
  jobs: '#2563EB',
  housing: '#E31E36',
  services: '#0E9384',
  business: '#F79009',
  events: '#7A5AF8',
  market: '#475467',
};

export interface MapItem {
  id: string;
  kind: MapKind;
  title: string;
  subtitle: string;
  priceLabel?: string;
  image?: ImageName;
  geo: GeoLocation;
  /** Internal detail URL */
  to: string;
  /** Seed/demo entry about a real place */
  seed?: boolean;
}

const LISTING_KIND: Record<string, MapKind> = { nieruchomosci: 'housing', praca: 'jobs', uslugi: 'services' };

function build(): MapItem[] {
  const out: MapItem[] = [];
  for (const l of CLASSIFIEDS) {
    if (!l.geo) continue;
    out.push({ id: l.id, kind: LISTING_KIND[l.category] ?? 'market', title: l.title, subtitle: categoryMeta(l.category).label, priceLabel: l.priceLabel, image: l.image ?? undefined, geo: l.geo, to: `/ogloszenie/${l.id}` });
  }
  for (const p of PROPERTIES) {
    if (!p.geo) continue;
    out.push({ id: p.id, kind: 'housing', title: p.title, subtitle: p.mode === 'rent' ? 'Wynajem' : 'Sprzedaż', priceLabel: `${formatGBP(p.price)}${p.mode === 'rent' ? '/mies.' : ''}`, image: p.image, geo: p.geo, to: `/ogloszenie/${p.id}` });
  }
  for (const j of JOBS) {
    if (!j.geo) continue;
    out.push({ id: j.id, kind: 'jobs', title: j.title, subtitle: j.company, priceLabel: j.salaryLabel, geo: j.geo, to: `/ogloszenie/${j.id}` });
  }
  for (const s of SERVICES) {
    if (!s.geo) continue;
    out.push({ id: s.id, kind: 'services', title: s.name, subtitle: s.category, priceLabel: s.priceFrom, image: s.image, geo: s.geo, to: `/ogloszenie/${s.id}` });
  }
  for (const v of VEHICLES) {
    if (!v.geo) continue;
    out.push({ id: v.id, kind: 'market', title: v.title, subtitle: 'Motoryzacja', priceLabel: formatGBP(v.price), image: v.image, geo: v.geo, to: `/ogloszenie/${v.id}` });
  }
  for (const e of EVENTS) {
    if (!e.geo) continue;
    out.push({ id: e.id, kind: 'events', title: e.title, subtitle: `${e.venue} · ${e.start.slice(8, 10)}.${e.start.slice(5, 7)}`, priceLabel: e.priceLabel, image: e.image, geo: e.geo, to: `/wydarzenia/${e.id}` });
  }
  for (const b of BUSINESSES) {
    out.push({ id: b.id, kind: 'business', title: b.name, subtitle: BUSINESS_CATEGORY_LABEL[b.category], geo: b.geo, to: `/ogloszenie/${b.id}`, seed: true });
  }
  return out.map((i) => ({ ...i, geo: toPublicGeo(i.geo, i.id, PUBLIC_KINDS.has(i.kind)) }));
}

/** Kinds whose exact point is a public place, not somebody's home. */
const PUBLIC_KINDS: ReadonlySet<MapKind> = new Set(['business', 'events']);

export const isApproximate = (geo: GeoLocation) => geo.precision === 'area' || !!geo.hideExact;

let memo: MapItem[] | null = null;
export const allMapItems = () => (memo ??= build());

export const mapItemById = (id: string) => allMapItems().find((i) => i.id === id);

export function itemsNear(lat: number, lng: number, radiusM: number, items = allMapItems()) {
  return items.filter((i) => distanceM(lat, lng, i.geo.lat, i.geo.lng) <= radiusM);
}

export type NearbyCounts = Record<MapKind, number>;

export function countNear(lat: number, lng: number, radiusM: number): NearbyCounts {
  const counts: NearbyCounts = { jobs: 0, housing: 0, services: 0, business: 0, events: 0, market: 0 };
  for (const i of itemsNear(lat, lng, radiusM)) counts[i.kind]++;
  return counts;
}

/** Text shown for where a listing is – never the street address for approximate locations. */
export function publicPlaceLabel(geo: GeoLocation): string {
  if (geo.precision === 'exact' && !geo.hideExact && geo.address) return `${geo.address}, ${geo.postcode}`;
  return `Okolica: ${geo.district} ${geo.postcode.split(' ')[0]}`;
}

export const mapUrl = (geo: Pick<GeoLocation, 'lat' | 'lng'>, listingId?: string) =>
  `/map?${new URLSearchParams({ lat: geo.lat.toFixed(5), lng: geo.lng.toFixed(5), ...(listingId ? { listingId } : {}) })}`;

export const googleMapsUrl = (geo: Pick<GeoLocation, 'lat' | 'lng'>) => `https://www.google.com/maps/search/?api=1&query=${geo.lat.toFixed(5)},${geo.lng.toFixed(5)}`;

export const routeUrl = (geo: Pick<GeoLocation, 'lat' | 'lng'>, name: string) =>
  `/transport/tube?${new URLSearchParams({ toLat: geo.lat.toFixed(5), toLng: geo.lng.toFixed(5), toName: name })}`;
