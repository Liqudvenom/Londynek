import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, GraduationCap, Plus, TrainFront, TrendingUp, Users } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { HeroSearch } from '@/components/search/HeroSearch';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';
import { HorizontalRail } from '@/components/ui/HorizontalRail';
import { EmptyState, SectionHeader, SortSelect } from '@/components/ui/primitives';
import { FilterSidebar, MobileFilters, type FilterField } from '@/components/filters/FilterSidebar';
import { arr, str, useFilters } from '@/hooks/useFilters';
import { DistrictCard } from '@/components/cards/LocalCards';
import { PropertyCard } from '@/components/cards/ListingCards';
import { LondonMap } from '@/components/london/LondonMap';
import { AGENCIES, PROPERTIES, PROPERTY_TYPES } from '@/data/properties';
import { BROWSE_DISTRICT_IDS, DISTRICTS, districtById, districtsByIds } from '@/data/districts';
import { GUIDE_TASKS } from '@/data/guides';
import { formatGBP, normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Property, PropertyMode, PropertyType } from '@/types';
import '@/components/filters/filters.css';
import './marketplace.css';
import './realestate.css';

const DEFAULT_DISTRICT = 'notting-hill';

const FIELDS: FilterField[] = [
  { type: 'location', id: 'location', label: 'Lokalizacja lub kod pocztowy' },
  { type: 'select', id: 'radius', label: 'Promień', options: [{ value: '', label: 'Tylko ta okolica' }, { value: '1', label: '+1 mila' }, { value: '3', label: '+3 mile' }, { value: '5', label: '+5 mil' }] },
  { type: 'range', id: 'price', label: 'Cena', unit: '(£)' },
  { type: 'chips', id: 'bedrooms', label: 'Sypialnie', options: [{ value: '', label: 'Dowolnie' }, { value: '0', label: 'Studio' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3+' }] },
  { type: 'select', id: 'commute', label: 'Dojazd do centrum', options: [{ value: '', label: 'Dowolny' }, { value: '15', label: 'do 15 min' }, { value: '25', label: 'do 25 min' }, { value: '35', label: 'do 35 min' }] },
  { type: 'select', id: 'advertiser', label: 'Ogłoszeniodawca', options: [{ value: '', label: 'Wszyscy' }, { value: 'agency', label: 'Agencje' }, { value: 'landlord', label: 'Osoby prywatne' }] },
  {
    type: 'checks',
    id: 'only',
    label: 'Pokaż tylko',
    options: [
      { value: 'verified', label: 'Sprawdzony wynajmujący' },
      { value: 'photos', label: 'Min. 8 zdjęć' },
      { value: 'new', label: 'Nowe ogłoszenia' },
    ],
  },
];

const INITIAL = { location: '', radius: '', priceMin: '', priceMax: '', bedrooms: '', commute: '', advertiser: '', only: [] as string[] };

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'commute';
const SORTS = [
  { value: 'featured', label: 'Polecane' },
  { value: 'price-asc', label: 'Cena: od najniższej' },
  { value: 'price-desc', label: 'Cena: od najwyższej' },
  { value: 'commute', label: 'Najkrótszy dojazd' },
] as const;

const TYPE_IDS = PROPERTY_TYPES.map((t) => t.id);
const isTypeId = (v: string | null): v is PropertyType | 'all' => v !== null && (TYPE_IDS as string[]).includes(v);

function matches(p: Property, values: Record<string, string | string[]>, mode: PropertyMode, type: PropertyType | 'all', district: string | null, query: string) {
  if (p.mode !== mode) return false;
  if (type !== 'all' && p.type !== type && !(type === 'flat' && p.type === 'studio')) return false;
  if (district && p.district !== district) return false;
  const loc = normalize(str(values.location)).replace(/ london$/, '');
  if (loc && !normalize(`${p.location} ${p.postcode} ${districtById(p.district)?.region ?? ''}`).includes(loc)) return false;
  const min = Number(str(values.priceMin)) || 0;
  const max = Number(str(values.priceMax)) || Infinity;
  if (p.price < min || p.price > max) return false;
  const beds = str(values.bedrooms);
  if (beds && (beds === '3' ? p.bedrooms < 3 : p.bedrooms !== Number(beds))) return false;
  const commute = Number(str(values.commute));
  if (commute && p.commuteMin > commute) return false;
  if (str(values.advertiser) && p.agencyKind !== values.advertiser) return false;
  const only = arr(values.only);
  if (only.includes('verified') && !p.verified) return false;
  if (only.includes('photos') && p.photos < 8) return false;
  if (only.includes('new') && !p.isNew) return false;
  const q = normalize(query);
  if (q && !normalize(`${p.title} ${p.description} ${p.location}`).includes(q)) return false;
  return true;
}

export function RealEstatePage() {
  useDocumentTitle('Nieruchomości');
  const [params, setParams] = useSearchParams();
  const district = params.get('dzielnica');
  const typeParam = params.get('typ');
  const type: PropertyType | 'all' = isTypeId(typeParam) ? typeParam : 'all';
  const mode: PropertyMode = params.get('tryb') === 'sprzedaz' ? 'sale' : 'rent';

  const filters = useFilters(INITIAL);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [hovered, setHovered] = useState<string | null>(null);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const results = useMemo(() => {
    const list = PROPERTIES.filter((p) => matches(p, filters.values, mode, type, district, query));
    return list.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'commute') return a.commuteMin - b.commuteMin;
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [filters.values, mode, type, district, query, sort]);

  const panelDistrict = districtById(hovered ?? district ?? DEFAULT_DISTRICT) ?? districtById(DEFAULT_DISTRICT);

  const bubbles = useMemo(() => {
    const inMode = PROPERTIES.filter((p) => p.mode === mode);
    return DISTRICTS.flatMap((d) => {
      const prices = inMode.filter((p) => p.district === d.id).map((p) => p.price);
      if (prices.length === 0) return [];
      const min = Math.min(...prices);
      const label = mode === 'rent' ? formatGBP(min) : `£${Math.round(min / 1000)}k`;
      return [{ id: d.id, x: d.map.x, y: d.map.y, label, tone: d.id === district ? ('red' as const) : ('navy' as const) }];
    });
  }, [mode, district]);

  const sidebarProps = { fields: FIELDS, values: filters.values, onChange: filters.set, onReset: filters.reset, resultCount: results.length, activeCount: filters.activeCount };
  const housingGuides = GUIDE_TASKS.filter((t) => t.area === 'mieszkanie').slice(0, 3);
  const agency = AGENCIES[0];

  return (
    <>
      <PageHero
        className="estate-hero"
        title="Znajdź swój dom w Londynie"
        lead="Pokoje, mieszkania i domy od sprawdzonych wynajmujących i agencji – z cenami dzielnic, czasem dojazdu i poradami po polsku."
        image="london-thames"
        imageAlt="Panorama Londynu nad Tamizą"
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Nieruchomości' }]}
      >
        <div className="segmented estate-hero__modes" role="group" aria-label="Rodzaj oferty">
          <button type="button" aria-pressed={mode === 'rent'} onClick={() => setParam('tryb', null)}>
            Wynajem
          </button>
          <button type="button" aria-pressed={mode === 'sale'} onClick={() => setParam('tryb', 'sprzedaz')}>
            Na sprzedaż
          </button>
        </div>
        <HeroSearch
          showCategory={false}
          label="Szukaj nieruchomości"
          placeholder="Np. pokój z łazienką, 2 sypialnie, ogród…"
          submitLabel="Szukaj"
          onSearch={(q, loc) => {
            setQuery(q);
            filters.set('location', loc);
          }}
        />
      </PageHero>

      <nav className="container boxed estate-types" aria-label="Typ nieruchomości">
        {PROPERTY_TYPES.map((t) => (
          <button key={t.id} type="button" className="estate-types__item" aria-pressed={type === t.id} onClick={() => setParam('typ', t.id === 'all' ? null : t.id)}>
            <Icon name={t.icon} size={22} />
            {t.label}
          </button>
        ))}
        <Link to="/dodaj-ogloszenie" className="estate-types__item estate-types__add">
          <Plus size={22} aria-hidden="true" />
          Dodaj ogłoszenie
        </Link>
      </nav>

      <section className="container section--tight" aria-labelledby="browse-districts">
        <SectionHeader id="browse-districts" title="Przeglądaj po dzielnicach Londynu" accent="housing" description="Kliknij dzielnicę, aby zawęzić oferty i zobaczyć jej profil.">
          {district && (
            <button type="button" className="btn btn--sm" onClick={() => setParam('dzielnica', null)}>
              Wszystkie dzielnice
            </button>
          )}
        </SectionHeader>
        <HorizontalRail label="Dzielnice Londynu" itemWidth="168px">
          {districtsByIds(BROWSE_DISTRICT_IDS).map((d) => (
            <DistrictCard key={d.id} district={d} active={d.id === district} to={`/ogloszenia/nieruchomosci?dzielnica=${d.id}${mode === 'sale' ? '&tryb=sprzedaz' : ''}`} />
          ))}
        </HorizontalRail>
      </section>

      <div className="container estate-layout section--tight">
        <aside className="estate-layout__filters">
          <FilterSidebar {...sidebarProps} />
        </aside>

        <section className="estate-layout__results" aria-label="Oferty nieruchomości">
          <div className="results-bar">
            <p className="results-bar__count">
              <strong>{results.length}</strong> {plural(results.length, 'oferta', 'oferty', 'ofert')} {mode === 'rent' ? 'na wynajem' : 'na sprzedaż'}
              {district && <> w {districtById(district)?.name}</>}
            </p>
            <div className="results-bar__tools">
              <MobileFilters {...sidebarProps} />
              <SortSelect id="estate-sort" value={sort} onChange={setSort} options={SORTS} />
            </div>
          </div>
          {results.length === 0 ? (
            <EmptyState title="Brak ofert dla wybranych kryteriów">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  filters.reset();
                  setQuery('');
                  setParams({}, { replace: true });
                }}
              >
                Pokaż wszystkie oferty
              </button>
            </EmptyState>
          ) : (
            <div className="estate-grid">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} onHover={setHovered} />
              ))}
            </div>
          )}
        </section>

        <aside className="estate-layout__aside" aria-label="Mapa i informacje o dzielnicy">
          <div className="estate-map panel">
            <div className="estate-map__head">
              <h2>Mapa cen</h2>
              <span className="meta">{mode === 'rent' ? 'najtańsza oferta / mies.' : 'najtańsza oferta'}</span>
            </div>
            <LondonMap
              label="Mapa cen nieruchomości w Londynie"
              markers={bubbles}
              bubbles
              showRegionLabels
              activeMarker={hovered ?? district}
              onMarkerEnter={setHovered}
              onMarkerSelect={(id) => setParam('dzielnica', id === district ? null : id)}
            />
          </div>

          {panelDistrict && (
            <section className="district-panel panel" aria-live="polite" aria-labelledby="district-panel-title">
              <div className="media ratio-16x9">
                <Img name={panelDistrict.image} alt="" sizes="360px" />
              </div>
              <div className="district-panel__body">
                <span className="kicker accent-housing">{district === panelDistrict.id ? 'Wybrana dzielnica' : 'Profil dzielnicy'}</span>
                <h2 id="district-panel-title" className="district-panel__title">
                  {panelDistrict.name} <span className="postcode">{panelDistrict.postcode}</span>
                </h2>
                <dl className="district-panel__stats">
                  <div>
                    <dt>Śr. czynsz (mieszkanie)</dt>
                    <dd>{formatGBP(panelDistrict.avgRent)}</dd>
                  </div>
                  <div>
                    <dt>Śr. pokój</dt>
                    <dd>{formatGBP(panelDistrict.avgRoom)}</dd>
                  </div>
                  <div>
                    <dt>Śr. cena zakupu</dt>
                    <dd>{formatGBP(panelDistrict.avgSale)}</dd>
                  </div>
                  <div>
                    <dt>Trend czynszów r/r</dt>
                    <dd className="district-panel__trend">
                      <TrendingUp size={14} aria-hidden="true" /> +{panelDistrict.rentTrend}%
                    </dd>
                  </div>
                </dl>
                <ul className="district-panel__facts">
                  <li>
                    <TrainFront size={16} aria-hidden="true" />
                    <span>
                      <strong>Dojazd do centrum:</strong> {panelDistrict.commuteMin[0]}–{panelDistrict.commuteMin[1]} min · {panelDistrict.transport}
                    </span>
                  </li>
                  <li>
                    <Users size={16} aria-hidden="true" />
                    <span>
                      <strong>Popularna wśród:</strong> {panelDistrict.profile}
                    </span>
                  </li>
                  <li>
                    <GraduationCap size={16} aria-hidden="true" />
                    <span>
                      <strong>Szkoły:</strong> {panelDistrict.schools}
                    </span>
                  </li>
                </ul>
                <p className="demo-label">Dane przykładowe – do zastąpienia danymi rynkowymi</p>
                <button type="button" className="btn btn--navy btn--block" onClick={() => setParam('dzielnica', panelDistrict.id)}>
                  Oferty w {panelDistrict.name} <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="container section estate-extras" aria-label="Agencje i porady">
        {agency && (
          <aside className="agency-ad" aria-label={`Reklama: ${agency.name}`}>
            <span className="ad__label">Reklama</span>
            <div className="agency-ad__media media">
              <Img name="house-modern" alt="" sizes="(max-width: 900px) 100vw, 360px" />
            </div>
            <div className="agency-ad__body">
              <strong className="agency-ad__name">{agency.name}</strong>
              <h2 className="agency-ad__claim">{agency.claim}</h2>
              <ul>
                {agency.points.map((p) => (
                  <li key={p}>
                    <BadgeCheck size={16} aria-hidden="true" /> {p}
                  </li>
                ))}
              </ul>
              <Link to="/reklama/banery" className="btn btn--primary">
                Poznaj ofertę agencji
              </Link>
            </div>
          </aside>
        )}
        <div className="estate-guides">
          <SectionHeader title="Zanim wynajmiesz" kicker="Poradnik" accent="help" action={{ label: 'Wszystkie porady', to: '/poradnik?obszar=mieszkanie' }} />
          <ul>
            {housingGuides.map((g) => (
              <li key={g.id}>
                <Link to={`/poradnik/${g.id}`}>
                  <strong>{g.question}</strong>
                  <span>{g.readMin} min czytania</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/poradnik?obszar=mieszkanie">
                <strong>Deposit, umowa, referencje – lista kontrolna najemcy</strong>
                <span>Poradnik mieszkaniowy</span>
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
