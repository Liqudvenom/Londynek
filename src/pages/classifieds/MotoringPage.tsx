import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Plus, RotateCcw } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, SectionHeader, SortSelect } from '@/components/ui/primitives';
import { VehicleCard } from '@/components/cards/ListingCards';
import { VEHICLES, VEHICLE_MAKES, MOTORING_SERVICES } from '@/data/vehicles';
import { formatGBP, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Vehicle } from '@/types';
import './marketplace.css';
import './motoring.css';

const FUELS: Vehicle['fuel'][] = ['Benzyna', 'Diesel', 'Hybryda', 'Elektryczny'];
const PRICE_STEPS = [5000, 10000, 20000, 30000, 50000];
const YEAR_STEPS = [2015, 2017, 2019, 2021];
const SORTS = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'price-asc', label: 'Cena: od najniższej' },
  { value: 'price-desc', label: 'Cena: od najwyższej' },
  { value: 'mileage', label: 'Najniższy przebieg' },
] as const;

interface Criteria {
  make: string;
  maxPrice: string;
  minYear: string;
  fuel: string;
  transmission: string;
  seller: string;
  ulez: boolean;
}
const EMPTY: Criteria = { make: '', maxPrice: '', minYear: '', fuel: '', transmission: '', seller: '', ulez: false };

export function MotoringPage() {
  useDocumentTitle('Motoryzacja');
  const uid = useId();
  const [c, setC] = useState<Criteria>(EMPTY);
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('newest');
  const set = <K extends keyof Criteria>(k: K, v: Criteria[K]) => setC((prev) => ({ ...prev, [k]: v }));
  const dirty = JSON.stringify(c) !== JSON.stringify(EMPTY);

  const results = useMemo(() => {
    const list = VEHICLES.filter(
      (v) =>
        (!c.make || v.make === c.make) &&
        (!c.maxPrice || v.price <= Number(c.maxPrice)) &&
        (!c.minYear || v.year >= Number(c.minYear)) &&
        (!c.fuel || v.fuel === c.fuel) &&
        (!c.transmission || v.transmission === c.transmission) &&
        (!c.seller || v.sellerType === c.seller) &&
        (!c.ulez || v.ulez),
    );
    return list.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'mileage') return a.mileage - b.mileage;
      return Number(Boolean(b.promoted)) - Number(Boolean(a.promoted));
    });
  }, [c, sort]);

  const select = (key: keyof Criteria, label: string, options: { value: string; label: string }[]) => (
    <div className="field">
      <label className="field__label" htmlFor={`${uid}-${key}`}>
        {label}
      </label>
      <select id={`${uid}-${key}`} className="select" value={String(c[key])} onChange={(e) => set(key, e.target.value as never)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHero
        className="moto-hero"
        title="Samochody, vany i wszystko dla kierowców"
        lead="Auta od Polaków i sprawdzonych dealerów w Londynie. Od razu widzisz, czy pojazd spełnia normy ULEZ."
        image="london-night"
        imageAlt="Nocne ulice Londynu ze światłami samochodów"
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Motoryzacja' }]}
      />

      <section className="container boxed moto-search" aria-label="Wyszukiwarka pojazdów">
        <div className="moto-search__grid">
          {select('make', 'Marka', [{ value: '', label: 'Wszystkie marki' }, ...VEHICLE_MAKES.map((m) => ({ value: m, label: m }))])}
          {select('maxPrice', 'Cena do', [{ value: '', label: 'Bez limitu' }, ...PRICE_STEPS.map((p) => ({ value: String(p), label: formatGBP(p) }))])}
          {select('minYear', 'Rocznik od', [{ value: '', label: 'Dowolny' }, ...YEAR_STEPS.map((y) => ({ value: String(y), label: String(y) }))])}
          {select('transmission', 'Skrzynia', [{ value: '', label: 'Dowolna' }, { value: 'Manualna', label: 'Manualna' }, { value: 'Automatyczna', label: 'Automatyczna' }])}
          {select('seller', 'Sprzedający', [{ value: '', label: 'Wszyscy' }, { value: 'private', label: 'Prywatni' }, { value: 'business', label: 'Dealerzy' }])}
        </div>
        <div className="moto-search__row">
          <div className="cluster" role="group" aria-label="Paliwo">
            {FUELS.map((f) => (
              <button key={f} type="button" className="chip" aria-pressed={c.fuel === f} onClick={() => set('fuel', c.fuel === f ? '' : f)}>
                {f}
              </button>
            ))}
          </div>
          <label className="check moto-search__ulez">
            <input type="checkbox" checked={c.ulez} onChange={(e) => set('ulez', e.target.checked)} />
            <Leaf size={16} aria-hidden="true" /> Tylko zgodne z ULEZ
          </label>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setC(EMPTY)} disabled={!dirty}>
            <RotateCcw size={16} aria-hidden="true" /> Wyczyść
          </button>
        </div>
      </section>

      <section className="container section--tight" aria-labelledby="moto-results">
        <div className="results-bar">
          <h2 id="moto-results" className="results-bar__count">
            <strong>{results.length}</strong> {plural(results.length, 'pojazd', 'pojazdy', 'pojazdów')}
          </h2>
          <div className="results-bar__tools">
            <SortSelect id="moto-sort" value={sort} onChange={setSort} options={SORTS} />
            <Link to="/dodaj-ogloszenie" className="btn btn--primary btn--sm">
              <Plus size={16} aria-hidden="true" /> Sprzedaj auto
            </Link>
          </div>
        </div>
        {results.length === 0 ? (
          <EmptyState title="Brak pojazdów dla wybranych kryteriów">
            <button type="button" className="btn" onClick={() => setC(EMPTY)}>
              Wyczyść filtry
            </button>
          </EmptyState>
        ) : (
          <div className="moto-grid">
            {results.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </section>

      <section className="section section--navy" aria-labelledby="moto-services">
        <div className="container">
          <SectionHeader id="moto-services" title="Wszystko wokół auta" kicker="Usługi motoryzacyjne" accent="navy" />
          <ul className="moto-services">
            {MOTORING_SERVICES.map((s) => (
              <li key={s.title}>
                <Link to={s.to} className="moto-services__item">
                  <Icon name={s.icon} size={26} />
                  <strong>{s.title}</strong>
                  <span>{s.description}</span>
                  <ArrowRight size={18} className="moto-services__arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <aside className="moto-ulez" aria-labelledby="ulez-title">
            <Leaf size={32} aria-hidden="true" />
            <div>
              <h3 id="ulez-title">ULEZ obejmuje cały Londyn</h3>
              <p>Pojazdy niespełniające norm (zwykle diesle sprzed 09.2015 i benzyny sprzed 2006) płacą dzienną opłatę. Sprawdź numer rejestracyjny w oficjalnym narzędziu TfL przed zakupem.</p>
            </div>
            <Link to="/poradnik?obszar=transport" className="btn btn--inverse">
              Poradnik ULEZ i MOT
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
