import { ALL_ARTICLES, KIND_ROUTE } from '@/data/articles';
import { CLASSIFIEDS, categoryMeta } from '@/data/classifieds';
import { PROPERTIES } from '@/data/properties';
import { JOBS } from '@/data/jobs';
import { SERVICES } from '@/data/services';
import { VEHICLES } from '@/data/vehicles';
import { EVENTS } from '@/data/events';
import { GUIDE_TASKS } from '@/data/guides';
import type { ImageName } from '@/data/images.generated';
import { REGIONS, districtById } from '@/data/districts';
import type { RegionId } from '@/types';
import { formatGBP, formatRange, normalize } from './format';

export type SearchScope = 'all' | 'ogloszenia' | 'praca' | 'nieruchomosci' | 'wiadomosci' | 'poradnik' | 'wydarzenia' | 'uslugi';

export const SEARCH_SCOPES: { id: SearchScope; label: string }[] = [
  { id: 'all', label: 'Wszystkie kategorie' },
  { id: 'ogloszenia', label: 'Ogłoszenia' },
  { id: 'praca', label: 'Praca' },
  { id: 'nieruchomosci', label: 'Nieruchomości' },
  { id: 'uslugi', label: 'Usługi i firmy' },
  { id: 'wiadomosci', label: 'Wiadomości i artykuły' },
  { id: 'poradnik', label: 'Poradnik' },
  { id: 'wydarzenia', label: 'Wydarzenia' },
];

export interface SearchEntry {
  id: string;
  scope: Exclude<SearchScope, 'all'>;
  type: string;
  title: string;
  snippet: string;
  location?: string;
  region?: RegionId;
  to: string;
  image?: ImageName | null;
  haystack: string;
}

function entry(e: Omit<SearchEntry, 'haystack'>): SearchEntry {
  return { ...e, haystack: normalize(`${e.title} ${e.snippet} ${e.type} ${e.location ?? ''}`) };
}

export const SEARCH_INDEX: SearchEntry[] = [
  ...JOBS.map((j) => entry({ id: j.id, scope: 'praca', type: 'Praca', title: j.title, snippet: `${j.company} · ${j.salaryLabel}`, location: j.location, region: j.region, to: `/ogloszenie/${j.id}` })),
  ...PROPERTIES.map((p) => entry({ id: p.id, scope: 'nieruchomosci', type: p.mode === 'rent' ? 'Wynajem' : 'Sprzedaż', title: p.title, snippet: `${formatGBP(p.price)}${p.mode === 'rent' ? '/mies.' : ''} · ${p.postcode}`, location: p.location, region: districtById(p.district)?.region, to: `/ogloszenie/${p.id}`, image: p.image })),
  ...CLASSIFIEDS.map((l) => entry({ id: l.id, scope: 'ogloszenia', type: categoryMeta(l.category).short, title: l.title, snippet: l.priceLabel, location: l.location, region: l.region, to: `/ogloszenie/${l.id}`, image: l.image })),
  ...SERVICES.map((s) => entry({ id: s.id, scope: 'uslugi', type: `Usługi · ${s.category}`, title: s.name, snippet: s.tagline, location: s.location, region: s.region, to: `/ogloszenie/${s.id}`, image: s.image })),
  ...VEHICLES.map((v) => entry({ id: v.id, scope: 'ogloszenia', type: 'Motoryzacja', title: v.title, snippet: `${formatGBP(v.price)} · ${v.year}`, location: v.location, to: `/ogloszenie/${v.id}`, image: v.image })),
  ...ALL_ARTICLES.map((a) => entry({ id: a.id, scope: 'wiadomosci', type: KIND_ROUTE[a.kind].label, title: a.title, snippet: a.excerpt, to: `/artykul/${a.id}`, image: a.image })),
  ...GUIDE_TASKS.map((g) => entry({ id: g.id, scope: 'poradnik', type: 'Poradnik', title: g.question, snippet: g.answer, to: `/poradnik/${g.id}` })),
  ...EVENTS.map((e) => entry({ id: e.id, scope: 'wydarzenia', type: 'Wydarzenie', title: e.title, snippet: `${formatRange(e.start, e.end)} · ${e.venue}`, location: e.borough, region: e.region, to: `/wydarzenia/${e.id}`, image: e.image })),
];

/** Simple token AND search over the demo index. Swap for a server-side search endpoint in production. */
export function search(query: string, scope: SearchScope = 'all', location = '') {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  const region = REGIONS.find((r) => r.name === location)?.id;
  const loc = region ? '' : normalize(location);
  return SEARCH_INDEX.filter((e) => {
    if (scope !== 'all' && e.scope !== scope) return false;
    if (region && e.region !== region) return false;
    if (loc && !normalize(e.location ?? '').includes(loc) && !e.haystack.includes(loc)) return false;
    return tokens.every((t) => e.haystack.includes(t));
  });
}

export function searchUrl(query: string, scope: SearchScope = 'all', location = '') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (scope !== 'all') params.set('kategoria', scope);
  if (location) params.set('lokalizacja', location);
  return `/szukaj?${params.toString()}`;
}

export const POPULAR_CHIPS = [
  { label: 'Praca', to: '/ogloszenia/praca' },
  { label: 'Pokój do wynajęcia', to: '/ogloszenia/nieruchomosci?typ=room' },
  { label: 'NHS', to: '/poradnik?obszar=nhs' },
  { label: 'Prawo najmu', to: '/poradnik?obszar=mieszkanie' },
  { label: 'Metro na żywo', to: '/transport/tube' },
  { label: 'Polskie firmy', to: '/ogloszenia/uslugi' },
  { label: 'Szkoły', to: '/poradnik?obszar=szkoly' },
  { label: 'Wydarzenia', to: '/wydarzenia' },
];
