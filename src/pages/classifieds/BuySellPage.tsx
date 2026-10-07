import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, Eye, Handshake, Plus } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, SortSelect, ViewToggle, type ViewMode } from '@/components/ui/primitives';
import { ListingCard } from '@/components/cards/ListingCards';
import { classifiedsIn } from '@/data/classifieds';
import { normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './marketplace.css';
import './buysell.css';

const ITEMS = classifiedsIn('kupie-sprzedam');

const SUBCATEGORIES = [
  { id: 'Meble', icon: 'Sofa' },
  { id: 'Elektronika', icon: 'Smartphone' },
  { id: 'Dom', icon: 'Home' },
  { id: 'Ogród', icon: 'Sparkles' },
  { id: 'Dzieci', icon: 'Baby' },
  { id: 'Sport', icon: 'Bike' },
  { id: 'Inne', icon: 'Gift' },
];

const SORTS = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'price-asc', label: 'Najtańsze' },
  { value: 'price-desc', label: 'Najdroższe' },
] as const;

const SAFE_TRADE = [
  { icon: Eye, text: 'Obejrzyj przedmiot przed zapłatą – najlepiej w miejscu publicznym.' },
  { icon: Banknote, text: 'Nie wysyłaj zaliczek nieznajomym i nie podawaj danych karty.' },
  { icon: Handshake, text: 'Ustal odbiór osobisty lub zaufaną formę dostawy.' },
];

export function BuySellPage() {
  useDocumentTitle('Kupię / Sprzedam');
  const [sub, setSub] = useState('');
  const [condition, setCondition] = useState<'' | 'new' | 'used'>('');
  const [maxPrice, setMaxPrice] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('newest');
  const [view, setView] = useState<ViewMode>('grid');

  const results = useMemo(() => {
    const q = normalize(query);
    const max = Number(maxPrice) || Infinity;
    return ITEMS.filter((l) => (!sub || l.subcategory === sub) && (!condition || l.condition === condition) && (l.price ?? 0) <= max && (!q || normalize(`${l.title} ${l.description}`).includes(q))).sort((a, b) => {
      if (sort === 'price-asc') return (a.price ?? 0) - (b.price ?? 0);
      if (sort === 'price-desc') return (b.price ?? 0) - (a.price ?? 0);
      return a.postedHours - b.postedHours;
    });
  }, [sub, condition, maxPrice, query, sort]);

  return (
    <>
      <PageIntro
        title="Kupię / Sprzedam"
        lead="Meble po przeprowadzce, elektronika, rzeczy dla dzieci i wszystko, czego już nie potrzebujesz – od sąsiadów z polskiej społeczności."
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Kupię / Sprzedam' }]}
      >
        <div className="bs-intro-actions">
          <label className="visually-hidden" htmlFor="bs-query">
            Szukaj przedmiotów
          </label>
          <input id="bs-query" className="input" type="search" placeholder="Czego szukasz? Np. sofa, iPhone, rower…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Link to="/dodaj-ogloszenie" className="btn btn--primary">
            <Plus size={18} aria-hidden="true" /> Wystaw przedmiot
          </Link>
        </div>
      </PageIntro>

      <nav className="container bs-subcats" aria-label="Podkategorie">
        <button type="button" aria-pressed={sub === ''} onClick={() => setSub('')}>
          <span className="bs-subcats__icon">
            <Icon name="LayoutGrid" size={22} />
          </span>
          Wszystko
        </button>
        {SUBCATEGORIES.map((s) => (
          <button key={s.id} type="button" aria-pressed={sub === s.id} onClick={() => setSub(sub === s.id ? '' : s.id)}>
            <span className="bs-subcats__icon">
              <Icon name={s.icon} size={22} />
            </span>
            {s.id}
          </button>
        ))}
      </nav>

      <section className="container section--tight" aria-label="Przedmioty">
        <div className="bs-toolbar">
          <div className="segmented" role="group" aria-label="Stan">
            <button type="button" aria-pressed={condition === ''} onClick={() => setCondition('')}>
              Wszystkie
            </button>
            <button type="button" aria-pressed={condition === 'new'} onClick={() => setCondition('new')}>
              Nowe
            </button>
            <button type="button" aria-pressed={condition === 'used'} onClick={() => setCondition('used')}>
              Używane
            </button>
          </div>
          <div className="field bs-toolbar__price">
            <label className="field__label" htmlFor="bs-max">
              Cena do (£)
            </label>
            <input id="bs-max" className="input" inputMode="numeric" value={maxPrice} placeholder="Bez limitu" onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))} />
          </div>
          <p className="results-bar__count">
            <strong>{results.length}</strong> {plural(results.length, 'przedmiot', 'przedmioty', 'przedmiotów')}
          </p>
          <div className="results-bar__tools">
            <SortSelect id="bs-sort" value={sort} onChange={setSort} options={SORTS} />
            <ViewToggle value={view} onChange={setView} modes={['grid', 'list']} />
          </div>
        </div>

        {results.length === 0 ? (
          <EmptyState title="Nic tu jeszcze nie ma">
            <p>Zmień filtry albo dodaj własne ogłoszenie – może ktoś właśnie tego szuka.</p>
          </EmptyState>
        ) : (
          <div className={view === 'grid' ? 'bs-grid' : 'results-list'}>
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} layout={view === 'grid' ? 'grid' : 'row'} />
            ))}
          </div>
        )}
      </section>

      <section className="container section" aria-labelledby="safe-trade">
        <div className="bs-safe">
          <h2 id="safe-trade">Bezpieczny handel</h2>
          <ul>
            {SAFE_TRADE.map((s) => (
              <li key={s.text}>
                <s.icon size={22} aria-hidden="true" />
                {s.text}
              </li>
            ))}
          </ul>
          <Link to="/faq" className="text-link">
            Jak zgłosić podejrzane ogłoszenie?
          </Link>
        </div>
      </section>
    </>
  );
}
