import { KIND_ROUTE, articleById } from '@/data/articles';
import { eventById } from '@/data/events';
import { PROMOTIONS } from '@/data/misc';
import type { ImageName } from '@/data/images.generated';
import { formatRange } from './format';
import { resolveListing } from './listingDetail';

export type SavedGroup = 'Ogłoszenia' | 'Artykuły' | 'Wydarzenia' | 'Promocje';

export interface SavedEntry {
  id: string;
  group: SavedGroup;
  type: string;
  title: string;
  meta: string;
  to: string;
  image: ImageName | null;
}

/** Maps a saved id (stored in localStorage) back to its demo record. */
export function resolveSaved(id: string): SavedEntry | null {
  const listing = resolveListing(id);
  if (listing) {
    return { id, group: 'Ogłoszenia', type: listing.category.label, title: listing.title, meta: `${listing.priceLabel} · ${listing.location}`, to: `/ogloszenie/${id}`, image: listing.image };
  }
  const article = articleById(id);
  if (article) {
    return { id, group: 'Artykuły', type: KIND_ROUTE[article.kind].label, title: article.title, meta: `${article.readMin} min czytania`, to: `/artykul/${id}`, image: article.image };
  }
  const event = eventById(id);
  if (event) {
    return { id, group: 'Wydarzenia', type: event.category, title: event.title, meta: `${formatRange(event.start, event.end)} · ${event.venue}`, to: `/wydarzenia/${id}`, image: event.image };
  }
  const promo = PROMOTIONS.find((p) => p.id === id);
  if (promo) {
    return { id, group: 'Promocje', type: promo.brand, title: promo.title, meta: promo.badge, to: '/promocje', image: promo.image };
  }
  return null;
}

export const SAVED_GROUPS: SavedGroup[] = ['Ogłoszenia', 'Artykuły', 'Wydarzenia', 'Promocje'];
