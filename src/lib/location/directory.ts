import { BUSINESSES, BUSINESS_CATEGORY_LABEL } from '@/data/businesses';
import type { ImageName } from '@/data/images.generated';
import { SERVICES } from '@/data/services';
import type { GeoLocation } from './types';

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday */
  days: number[];
  open: string;
  close: string;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  category: string;
  tagline?: string;
  geo: GeoLocation;
  rating: number | null;
  reviews: number | null;
  /** null = unknown (never guessed for real places) */
  hours: OpeningHours | null;
  image?: ImageName;
  to: string;
  /** Real place used as seed data */
  seed: boolean;
  polishSpeaking: boolean;
}

/** Example hours for the fictional demo services only. */
const DEMO_HOURS: OpeningHours = { days: [1, 2, 3, 4, 5, 6], open: '09:00', close: '18:00' };

export function directoryEntries(): DirectoryEntry[] {
  const seeds: DirectoryEntry[] = BUSINESSES.map((b) => ({
    id: b.id,
    name: b.name,
    category: BUSINESS_CATEGORY_LABEL[b.category],
    geo: b.geo,
    rating: null,
    reviews: null,
    hours: null,
    to: `/ogloszenie/${b.id}`,
    seed: true,
    polishSpeaking: true,
  }));
  const services: DirectoryEntry[] = SERVICES.filter((s) => s.geo).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    tagline: s.tagline,
    geo: s.geo!,
    rating: s.rating,
    reviews: s.reviews,
    hours: DEMO_HOURS,
    image: s.image,
    to: `/ogloszenie/${s.id}`,
    seed: false,
    polishSpeaking: s.polishSpeaking,
  }));
  return [...seeds, ...services];
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Evaluated in London time regardless of the visitor's timezone. */
export function isOpenNow(hours: OpeningHours | null, now = new Date()): boolean | null {
  if (!hours) return null;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const mins = Number(get('hour')) * 60 + Number(get('minute'));
  return hours.days.includes(day) && mins >= toMin(hours.open) && mins < toMin(hours.close);
}
