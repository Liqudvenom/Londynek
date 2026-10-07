import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, MessageSquareQuote } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { HeroSearch } from '@/components/search/HeroSearch';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, FilterChip, SectionHeader, SortSelect } from '@/components/ui/primitives';
import { ServiceCard } from '@/components/cards/ListingCards';
import { AdSlot } from '@/components/ads/AdSlot';
import { SERVICES, SERVICE_CATEGORIES } from '@/data/services';
import { REGIONS } from '@/data/districts';
import { normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { RegionId } from '@/types';
import './marketplace.css';
import './services.css';

const SORTS = [
  { value: 'recommended', label: 'Polecane' },
  { value: 'rating', label: 'Najwyżej oceniane' },
  { value: 'reviews', label: 'Najwięcej opinii' },
] as const;

const TRUST_POINTS = [
  { icon: BadgeCheck, title: 'Weryfikacja firm', text: 'Oznaczamy firmy, które potwierdziły dane rejestrowe i ubezpieczenie.' },
  { icon: MessageSquareQuote, title: 'Opinie klientów', text: 'Oceny wystawiają osoby, które skorzystały z usługi.' },
  { icon: CalendarCheck, title: 'Dostępność', text: 'Firmy same aktualizują wolne terminy – zawsze sprawdź je przy kontakcie.' },
];

export function ServicesPage() {
  useDocumentTitle('Usługi i polskie firmy');
  const [params, setParams] = useSearchParams();
  const category = params.get('kategoria') ?? '';
  const [region, setRegion] = useState<RegionId | ''>('');
  const [query, setQuery] = useState('');
  const [verified, setVerified] = useState(false);
  const [today, setToday] = useState(false);
  const [sort, setSort] = useState<'recommended' | 'rating' | 'reviews'>('recommended');

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c && c !== category) next.set('kategoria', c);
    else next.delete('kategoria');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const results = useMemo(() => {
    const q = normalize(query);
    return SERVICES.filter((s) => {
      if (category && s.category !== category) return false;
      if (region && s.region !== region) return false;
      if (verified && !s.verified) return false;
      if (today && !/dziś/i.test(s.availability)) return false;
      if (q && !normalize(`${s.name} ${s.tagline} ${s.category} ${s.location}`).includes(q)) return false;
      return true;
    }).sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'reviews') return b.reviews - a.reviews;
      return Number(Boolean(b.sponsored)) - Number(Boolean(a.sponsored)) || b.rating * Math.log(b.reviews) - a.rating * Math.log(a.reviews);
    });
  }, [category, region, verified, today, query, sort]);

  return (
    <>
      <PageIntro
        title="Polskie firmy i usługi w UK"
        lead="Sprawdzeni fachowcy, kancelarie, lekarze i sklepy, z którymi porozumiesz się po polsku. Porównaj oceny, ceny i wolne terminy."
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Usługi' }]}
      >
        <div className="services-search">
          <HeroSearch
            showCategory={false}
            label="Szukaj firm i usług"
            placeholder="Np. hydraulik, księgowy, dentysta…"
            submitLabel="Znajdź fachowca"
            onSearch={(q, loc) => {
              setQuery(q);
              setRegion(REGIONS.find((r) => r.name === loc)?.id ?? '');
            }}
          />
        </div>
      </PageIntro>

      <section className="container section--tight" aria-labelledby="service-cats">
        <h2 id="service-cats" className="visually-hidden">
          Kategorie usług
        </h2>
        <ul className="service-cats">
          {SERVICE_CATEGORIES.map((c) => {
            const count = SERVICES.filter((s) => s.category === c.id).length;
            return (
              <li key={c.id}>
                <button type="button" className="service-cats__item" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
                  <span className="service-cats__icon">
                    <Icon name={c.icon} size={24} />
                  </span>
                  <strong>{c.id}</strong>
                  <span>
                    {count} {plural(count, 'firma', 'firmy', 'firm')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="container services-layout section--tight">
        <section aria-label="Katalog firm">
          <div className="services-toolbar">
            <div className="cluster" role="group" aria-label="Region">
              <FilterChip label="Cały Londyn" active={region === ''} onClick={() => setRegion('')} />
              {REGIONS.map((r) => (
                <FilterChip key={r.id} label={r.name.replace(' London', '')} active={region === r.id} onClick={() => setRegion(region === r.id ? '' : r.id)} />
              ))}
            </div>
            <div className="cluster">
              <label className="check">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Zweryfikowane
              </label>
              <label className="check">
                <input type="checkbox" checked={today} onChange={(e) => setToday(e.target.checked)} /> Dostępne dziś
              </label>
              <SortSelect id="services-sort" value={sort} onChange={setSort} options={SORTS} />
            </div>
          </div>
          <p className="results-bar__count services-count" aria-live="polite">
            <strong>{results.length}</strong> {plural(results.length, 'firma', 'firmy', 'firm')}
            {category && <> w kategorii „{category}”</>}
            {category && (
              <button type="button" className="text-link" onClick={() => setCategory('')}>
                Pokaż wszystkie
              </button>
            )}
          </p>
          {results.length === 0 ? (
            <EmptyState title="Nie znaleźliśmy firm dla tych kryteriów">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCategory('');
                  setRegion('');
                  setVerified(false);
                  setToday(false);
                  setQuery('');
                }}
              >
                Wyczyść filtry
              </button>
            </EmptyState>
          ) : (
            <div className="services-list">
              {results.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </section>

        <aside className="services-rail" aria-label="Dla firm">
          <section className="rail-widget services-b2b">
            <Building2 size={28} aria-hidden="true" />
            <h2>Prowadzisz firmę?</h2>
            <p>Dodaj wizytówkę i docieraj do Polaków szukających usług w Twojej okolicy.</p>
            <Link to="/dodaj-ogloszenie" className="btn btn--inverse btn--block">
              Dodaj firmę do katalogu
            </Link>
            <Link to="/reklama/linki-sponsorowane" className="text-link services-b2b__link">
              Wyróżnij firmę – linki sponsorowane <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
          <section className="rail-widget" aria-labelledby="trust-title">
            <div className="rail-widget__head">
              <h2 id="trust-title">Jak dbamy o jakość</h2>
            </div>
            <ul className="trust-list">
              {TRUST_POINTS.map((t) => (
                <li key={t.title}>
                  <t.icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{t.title}</strong>
                    {t.text}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <AdSlot variant="sidebar" />
        </aside>
      </div>

      <section className="container section" aria-labelledby="services-help">
        <SectionHeader id="services-help" title="Zanim zlecisz usługę" kicker="Poradnik" accent="services" action={{ label: 'Prawa konsumenta w UK', to: '/poradnik?obszar=prawo' }} />
        <ol className="services-steps">
          <li>
            <strong>Poproś o pisemną wycenę</strong> – z zakresem prac, terminem i warunkami płatności.
          </li>
          <li>
            <strong>Sprawdź uprawnienia</strong> – np. Gas Safe dla instalacji gazowych, NICEIC dla elektryków.
          </li>
          <li>
            <strong>Nie płać całości z góry</strong> – zaliczka do 25% to dobra praktyka przy remontach.
          </li>
          <li>
            <strong>Zostaw opinię</strong> – pomagasz innym Polakom wybrać sprawdzoną firmę.
          </li>
        </ol>
      </section>
    </>
  );
}
