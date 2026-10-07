import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { HeroSearch } from '@/components/search/HeroSearch';
import { Icon } from '@/components/ui/Icon';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState, Pagination, SortSelect, ViewToggle, type ViewMode } from '@/components/ui/primitives';
import { FilterSidebar, MobileFilters, type FilterField } from '@/components/filters/FilterSidebar';
import { arr, str, useFilters } from '@/hooks/useFilters';
import { ListingCard } from '@/components/cards/ListingCards';
import { LondonMap } from '@/components/london/LondonMap';
import { AddListingCta, MapPreview, SafetyNotice } from '@/components/ui/RailWidgets';
import { CLASSIFIEDS, CLASSIFIED_CATEGORIES } from '@/data/classifieds';
import { REGIONS } from '@/data/districts';
import { coordsFor } from '@/lib/geo';
import { normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Listing } from '@/types';
import '@/components/filters/filters.css';
import './marketplace.css';

const PAGE_SIZE = 6;

const FIELDS: FilterField[] = [
  { type: 'select', id: 'category', label: 'Kategoria', options: [{ value: '', label: 'Wszystkie kategorie' }, ...CLASSIFIED_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))] },
  { type: 'location', id: 'location', label: 'Lokalizacja' },
  { type: 'select', id: 'radius', label: 'Promień', options: [{ value: '', label: 'Wszystkie odległości' }, { value: '1', label: '+1 mila' }, { value: '5', label: '+5 mil' }, { value: '10', label: '+10 mil' }] },
  { type: 'range', id: 'price', label: 'Cena', unit: '(£)' },
  { type: 'select', id: 'condition', label: 'Stan', options: [{ value: '', label: 'Wszystkie' }, { value: 'new', label: 'Nowe' }, { value: 'used', label: 'Używane' }] },
  {
    type: 'checks',
    id: 'only',
    label: 'Pokaż tylko',
    options: [
      { value: 'photos', label: 'Tylko ze zdjęciami' },
      { value: 'promoted', label: 'Tylko ogłoszenia promowane' },
      { value: 'verified', label: 'Tylko od zweryfikowanych' },
      { value: 'new24', label: 'Tylko nowe (ostatnie 24h)' },
    ],
  },
];

const INITIAL = { category: '', location: '', radius: '', priceMin: '', priceMax: '', condition: '', only: [] as string[] };

type SellerTab = 'all' | 'private' | 'business';
type Sort = 'newest' | 'price-asc' | 'price-desc';
const SORTS = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'price-asc', label: 'Cena: od najniższej' },
  { value: 'price-desc', label: 'Cena: od najwyższej' },
] as const;

function applyFilters(items: Listing[], values: Record<string, string | string[]>, query: string, seller: SellerTab) {
  const only = arr(values.only);
  const region = REGIONS.find((r) => r.name === str(values.location))?.id;
  const loc = region ? '' : normalize(str(values.location));
  const min = Number(str(values.priceMin)) || 0;
  const max = Number(str(values.priceMax)) || Infinity;
  const q = normalize(query);
  return items.filter((l) => {
    if (seller !== 'all' && l.seller !== seller) return false;
    if (str(values.category) && l.category !== values.category) return false;
    if (region && l.region !== region) return false;
    if (loc && !normalize(l.location).includes(loc)) return false;
    if (str(values.condition) && l.condition !== values.condition) return false;
    if ((min || max !== Infinity) && (l.price === null || l.price < min || l.price > max)) return false;
    if (only.includes('photos') && !l.image) return false;
    if (only.includes('promoted') && !l.promoted) return false;
    if (only.includes('verified') && !l.verified) return false;
    if (only.includes('new24') && l.postedHours > 24) return false;
    if (q && !normalize(`${l.title} ${l.description}`).includes(q)) return false;
    return true;
  });
}

export function ClassifiedsPage() {
  useDocumentTitle('Ogłoszenia');
  const filters = useFilters(INITIAL);
  const [query, setQuery] = useState('');
  const [seller, setSeller] = useState<SellerTab>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);

  const results = useMemo(() => {
    const list = applyFilters(CLASSIFIEDS, filters.values, query, seller);
    const sorted = [...list].sort((a, b) => {
      if (sort === 'price-asc') return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === 'price-desc') return (b.price ?? -1) - (a.price ?? -1);
      return Number(Boolean(b.promoted)) - Number(Boolean(a.promoted)) || a.postedHours - b.postedHours;
    });
    return sorted;
  }, [filters.values, query, seller, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = view === 'map' ? results : results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const markers = results.map((l) => ({ id: l.id, ...coordsFor(l.location, l.region), label: l.title, tone: 'red' as const }));
  const counts = { all: CLASSIFIEDS.length, private: CLASSIFIEDS.filter((l) => l.seller === 'private').length, business: CLASSIFIEDS.filter((l) => l.seller === 'business').length };

  const changeFilter = (id: string, v: string | string[]) => {
    filters.set(id, v);
    setPage(1);
  };
  const sidebarProps = { fields: FIELDS, values: filters.values, onChange: changeFilter, onReset: filters.reset, resultCount: results.length, activeCount: filters.activeCount };

  return (
    <>
      <PageHero
        title="Ogłoszenia Polaków w Londynie i UK"
        lead="Praca, mieszkania, usługi, motoryzacja i więcej – wszystko w jednym miejscu. Szukaj, ogłaszaj, znajdź to, czego potrzebujesz."
        image="westminster-bus"
        imageAlt="Czerwony autobus przed Big Benem"
        crumbs={[{ label: 'Ogłoszenia' }]}
      >
        <HeroSearch
          showCategory={false}
          submitLabel="Szukaj ogłoszeń"
          placeholder="Czego szukasz? Np. pokój, praca, sprzedam…"
          label="Szukaj ogłoszeń"
          onSearch={(q, loc) => {
            setQuery(q);
            filters.set('location', loc);
            setPage(1);
          }}
        />
      </PageHero>

      <nav className="container cat-strip" aria-label="Kategorie ogłoszeń">
        <ul>
          <li>
            <Link to="/ogloszenia" className="cat-strip__item is-current" aria-current="page">
              <Icon name="LayoutGrid" size={26} />
              <strong>Ogłoszenia</strong>
              <span>Wszystkie ({CLASSIFIEDS.length})</span>
            </Link>
          </li>
          {CLASSIFIED_CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={c.to} className="cat-strip__item">
                <Icon name={c.icon} size={26} />
                <strong>{c.label}</strong>
                <span>
                  {c.description} ({c.total})
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="container market-layout section--tight">
        <aside className="market-layout__filters">
          <FilterSidebar {...sidebarProps} />
        </aside>

        <section aria-label="Wyniki wyszukiwania" className="market-results">
          <Tabs
            items={[
              { id: 'all', label: 'Wszystkie ogłoszenia', count: counts.all },
              { id: 'private', label: 'Prywatne', count: counts.private },
              { id: 'business', label: 'Firmy', count: counts.business },
            ]}
            value={seller}
            onChange={(s) => {
              setSeller(s);
              setPage(1);
            }}
            label="Typ ogłoszeniodawcy"
            controls="classified-results"
          />
          <div className="results-bar">
            <p className="results-bar__count">
              <strong>{results.length}</strong> {plural(results.length, 'ogłoszenie', 'ogłoszenia', 'ogłoszeń')}
              {query && <> dla „{query}”</>}
            </p>
            <div className="results-bar__tools">
              <MobileFilters {...sidebarProps} />
              <SortSelect id="classified-sort" value={sort} onChange={setSort} options={SORTS} />
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>

          <div id="classified-results" role="tabpanel">
            {results.length === 0 && (
              <EmptyState title="Brak ogłoszeń spełniających kryteria">
                <button type="button" className="btn" onClick={filters.reset}>
                  Wyczyść filtry
                </button>
              </EmptyState>
            )}
            {view === 'map' && results.length > 0 && (
              <div className="map-view">
                <LondonMap label="Mapa ogłoszeń" markers={markers} activeMarker={hovered} onMarkerEnter={setHovered} onMarkerSelect={setHovered} />
                <ul className="map-view__list">
                  {visible.map((l) => (
                    <li key={l.id} onMouseEnter={() => setHovered(l.id)} className={hovered === l.id ? 'is-active' : ''}>
                      <Link to={`/ogloszenie/${l.id}`}>{l.title}</Link>
                      <span className="price">{l.priceLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {view !== 'map' && (
              <div className={view === 'grid' ? 'results-grid' : 'results-list'}>
                {visible.map((l) => (
                  <ListingCard key={l.id} listing={l} layout={view === 'grid' ? 'grid' : 'row'} />
                ))}
              </div>
            )}
            {view !== 'map' && <Pagination page={current} pages={pages} onChange={setPage} />}
          </div>
        </section>

        <aside className="market-layout__rail" aria-label="Dodatkowe informacje">
          <MapPreview markers={markers.slice(0, 12)} onOpen={() => setView('map')} />
          <AddListingCta />
          <section className="rail-widget" aria-labelledby="promoted-title">
            <div className="rail-widget__head">
              <h2 id="promoted-title">Ogłoszenia promowane</h2>
              <Link to="/reklama/promocje" className="text-link">
                Więcej <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <ul className="promoted-list">
              {CLASSIFIEDS.filter((l) => l.promoted).map((l) => (
                <li key={l.id}>
                  <Link to={`/ogloszenie/${l.id}`}>
                    <span className="badge badge--promoted">Promowane</span>
                    <strong>{l.title}</strong>
                    <span className="price">{l.priceLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <SafetyNotice />
        </aside>
      </div>
    </>
  );
}
