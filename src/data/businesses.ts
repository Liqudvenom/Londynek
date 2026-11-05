// SEED / DEMO DATA – real, publicly listed places used to demonstrate the business directory and maps.
// They are NOT Londynek.net customers or partners. No ratings, opening hours or offers are shown for them
// because we don't have verified data – replace with the directory API (docs/API_CONTRACT.md).
import type { GeoLocation } from '@/lib/location/types';
import { SEED_PLACES } from './geo';

export type BusinessCategory = 'restauracja' | 'delikatesy' | 'inne';

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  restauracja: 'Restauracja',
  delikatesy: 'Delikatesy / sklep',
  inne: 'Inne',
};

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  geo: GeoLocation;
  /** Always true here – rendered with a "dane demonstracyjne" label. */
  seed: true;
}

export const BUSINESSES: Business[] = [
  { id: 'b-ognisko', name: 'Ognisko', category: 'restauracja', geo: SEED_PLACES.ognisko, seed: true },
  { id: 'b-kollos', name: 'KOLLOS', category: 'delikatesy', geo: SEED_PLACES.kollos, seed: true },
  { id: 'b-miod-malina', name: 'Miód Malina', category: 'delikatesy', geo: SEED_PLACES.miodMalina, seed: true },
  { id: 'b-mamuska', name: 'Mamuśka!', category: 'restauracja', geo: SEED_PLACES.mamuska, seed: true },
  { id: 'b-daquise', name: 'Daquise', category: 'restauracja', geo: SEED_PLACES.daquise, seed: true },
  { id: 'b-klos-deli', name: 'Klos Deli', category: 'delikatesy', geo: SEED_PLACES.klosDeli, seed: true },
  { id: 'b-pisoria', name: 'Pisoria', category: 'inne', geo: SEED_PLACES.pisoria, seed: true },
  { id: 'b-right-room', name: 'Right Room', category: 'inne', geo: SEED_PLACES.rightRoom, seed: true },
  { id: 'b-euro-london', name: 'Euro London', category: 'inne', geo: SEED_PLACES.euroLondon, seed: true },
];

export const businessById = (id: string) => BUSINESSES.find((b) => b.id === id);
