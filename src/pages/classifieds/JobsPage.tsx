import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, FileUser, Plus } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { HeroSearch } from '@/components/search/HeroSearch';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, Pagination, SortSelect } from '@/components/ui/primitives';
import { FilterSidebar, MobileFilters, type FilterField } from '@/components/filters/FilterSidebar';
import { arr, str, useFilters } from '@/hooks/useFilters';
import { CandidateCard, JobCard } from '@/components/cards/PeopleCards';
import { SafetyNotice } from '@/components/ui/RailWidgets';
import { CANDIDATES, EMPLOYERS, INDUSTRIES, JOBS } from '@/data/jobs';
import { REGIONS } from '@/data/districts';
import { GUIDE_TASKS } from '@/data/guides';
import { normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast, PROTOTYPE_MESSAGE } from '@/context/ToastContext';
import type { Candidate, Job } from '@/types';
import '@/components/filters/filters.css';
import './marketplace.css';
import './jobs.css';

type Mode = 'jobs' | 'candidates';

const INDUSTRY_ICON: Record<(typeof INDUSTRIES)[number], string> = {
  Budownictwo: 'HardHat',
  Logistyka: 'Warehouse',
  Gastronomia: 'ChefHat',
  Opieka: 'HeartHandshake',
  Sprzątanie: 'Sparkles',
  Transport: 'Truck',
  IT: 'Laptop',
  Biuro: 'Briefcase',
  Handel: 'ShoppingBag',
};

const JOB_FIELDS: FilterField[] = [
  { type: 'location', id: 'location', label: 'Lokalizacja' },
  { type: 'select', id: 'industry', label: 'Branża', options: [{ value: '', label: 'Wszystkie branże' }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))] },
  { type: 'select', id: 'contract', label: 'Rodzaj umowy', options: [{ value: '', label: 'Dowolna' }, { value: 'permanent', label: 'Stała umowa' }, { value: 'contract', label: 'Kontrakt' }, { value: 'temporary', label: 'Tymczasowa' }] },
  { type: 'chips', id: 'schedule', label: 'Wymiar pracy', options: [{ value: '', label: 'Dowolny' }, { value: 'full-time', label: 'Pełny etat' }, { value: 'part-time', label: 'Część etatu' }, { value: 'shifts', label: 'Zmiany' }] },
  { type: 'select', id: 'english', label: 'Wymagany angielski', options: [{ value: '', label: 'Dowolny poziom' }, { value: 'basic', label: 'Wystarczy podstawowy' }, { value: 'communicative', label: 'Do komunikatywnego' }] },
  {
    type: 'checks',
    id: 'only',
    label: 'Pokaż tylko',
    options: [
      { value: 'polish', label: 'Język polski w pracy' },
      { value: 'visa', label: 'Sponsoring wizy' },
      { value: 'hourly', label: 'Stawka godzinowa' },
      { value: 'new24', label: 'Dodane w ostatnich 24h' },
    ],
  },
];
const JOB_INITIAL = { location: '', industry: '', contract: '', schedule: '', english: '', only: [] as string[] };

const CANDIDATE_FIELDS: FilterField[] = [
  { type: 'location', id: 'location', label: 'Lokalizacja' },
  { type: 'chips', id: 'availability', label: 'Dostępność', options: [{ value: '', label: 'Dowolna' }, { value: 'now', label: 'Od zaraz' }, { value: 'later', label: 'Z wypowiedzeniem' }] },
  { type: 'checks', id: 'only', label: 'Pokaż tylko', options: [{ value: 'verified', label: 'Zweryfikowane profile' }, { value: 'photo', label: 'Ze zdjęciem' }] },
];
const CANDIDATE_INITIAL = { location: '', availability: '', only: [] as string[] };

const JOB_SORTS = [
  { value: 'newest', label: 'Najnowsze' },
  { value: 'salary', label: 'Najwyższa stawka' },
] as const;
const PAGE_SIZE = 8;

const ENGLISH_RANK = { basic: 0, communicative: 1, fluent: 2 } as const;
const HOURLY_EQUIV = { hour: 1, day: 1 / 8, week: 1 / 40, year: 1 / 1950 } as const;

function regionMatch(location: string, regionId: string) {
  const region = REGIONS.find((r) => r.name === location);
  return region ? region.id === regionId : null;
}

function filterJobs(values: Record<string, string | string[]>, query: string, industry: string) {
  const only = arr(values.only);
  const loc = str(values.location);
  const q = normalize(query);
  return JOBS.filter((j) => {
    const byRegion = loc ? regionMatch(loc, j.region) : true;
    if (byRegion === false || (byRegion === null && !normalize(j.location).includes(normalize(loc)))) return false;
    const ind = industry || str(values.industry);
    if (ind && j.industry !== ind) return false;
    if (str(values.contract) && j.contract !== values.contract) return false;
    if (str(values.schedule) && j.schedule !== values.schedule) return false;
    const eng = str(values.english) as keyof typeof ENGLISH_RANK | '';
    if (eng && ENGLISH_RANK[j.english] > ENGLISH_RANK[eng]) return false;
    if (only.includes('polish') && !j.polishSpeaking) return false;
    if (only.includes('visa') && !j.visaSponsor) return false;
    if (only.includes('hourly') && j.period !== 'hour') return false;
    if (only.includes('new24') && j.postedHours > 24) return false;
    if (q && !normalize(`${j.title} ${j.company} ${j.industry}`).includes(q)) return false;
    return true;
  });
}

function filterCandidates(values: Record<string, string | string[]>, query: string): Candidate[] {
  const only = arr(values.only);
  const loc = normalize(str(values.location).replace(/ London$/, ''));
  const q = normalize(query);
  return CANDIDATES.filter((c) => {
    if (loc && !normalize(c.location).includes(loc) && !REGIONS.some((r) => normalize(r.name).startsWith(loc))) return false;
    const now = c.availability === 'Od zaraz';
    if (values.availability === 'now' && !now) return false;
    if (values.availability === 'later' && now) return false;
    if (only.includes('verified') && !c.verified) return false;
    if (only.includes('photo') && !c.avatar) return false;
    if (q && !normalize(`${c.profession} ${c.skills.join(' ')}`).includes(q)) return false;
    return true;
  });
}

function JobsBoard({ mode }: { mode: Mode }) {
  useDocumentTitle(mode === 'jobs' ? 'Praca w Londynie' : 'Kandydaci do pracy');
  const notify = useToast();
  const jobFilters = useFilters(JOB_INITIAL);
  const candidateFilters = useFilters(CANDIDATE_INITIAL);
  const filters = mode === 'jobs' ? jobFilters : candidateFilters;
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [sort, setSort] = useState<'newest' | 'salary'>('newest');
  const [page, setPage] = useState(1);

  const jobs = useMemo(() => {
    const list = filterJobs(jobFilters.values, query, industry);
    return list.sort((a: Job, b: Job) =>
      sort === 'salary' ? b.salaryMin * HOURLY_EQUIV[b.period] - a.salaryMin * HOURLY_EQUIV[a.period] : Number(Boolean(b.promoted)) - Number(Boolean(a.promoted)) || a.postedHours - b.postedHours,
    );
  }, [jobFilters.values, query, industry, sort]);
  const candidates = useMemo(() => filterCandidates(candidateFilters.values, query).sort((a, b) => b.match - a.match), [candidateFilters.values, query]);

  const count = mode === 'jobs' ? jobs.length : candidates.length;
  const pages = Math.max(1, Math.ceil(jobs.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const change = (id: string, v: string | string[]) => {
    filters.set(id, v);
    setPage(1);
  };
  const sidebarProps = {
    fields: mode === 'jobs' ? JOB_FIELDS : CANDIDATE_FIELDS,
    values: filters.values,
    onChange: change,
    onReset: filters.reset,
    resultCount: count,
    activeCount: filters.activeCount,
    title: mode === 'jobs' ? 'Filtry ofert' : 'Filtry kandydatów',
  };
  const workGuides = GUIDE_TASKS.filter((t) => ['ni-number', 'self-assessment', 'evisa'].includes(t.id));

  return (
    <>
      <PageHero
        className="jobs-hero"
        title={mode === 'jobs' ? 'Praca w Londynie i UK' : 'Znajdź pracownika z polskiej społeczności'}
        lead={
          mode === 'jobs'
            ? 'Oferty od pracodawców, którzy szukają Polaków – z jasną stawką, wymaganym poziomem angielskiego i informacją o sponsoringu wizy.'
            : 'Profile kandydatów z doświadczeniem, uprawnieniami i dostępnością. Skontaktuj się bezpośrednio przez Londynek.'
        }
        image="office"
        imageAlt="Ludzie pracujący w nowoczesnym biurze"
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: mode === 'jobs' ? 'Praca' : 'Kandydaci' }]}
      >
        <nav className="segmented jobs-hero__modes" aria-label="Tryb">
          <Link to="/ogloszenia/praca" aria-current={mode === 'jobs' ? 'page' : undefined}>
            <Building2 size={16} aria-hidden="true" /> Szukam pracy
          </Link>
          <Link to="/ogloszenia/kandydaci" aria-current={mode === 'candidates' ? 'page' : undefined}>
            <FileUser size={16} aria-hidden="true" /> Szukam pracownika
          </Link>
        </nav>
        <HeroSearch
          showCategory={false}
          label={mode === 'jobs' ? 'Szukaj ofert pracy' : 'Szukaj kandydatów'}
          placeholder={mode === 'jobs' ? 'Stanowisko, firma lub branża…' : 'Zawód lub umiejętność, np. elektryk, Xero…'}
          submitLabel={mode === 'jobs' ? 'Szukaj ofert' : 'Szukaj kandydatów'}
          onSearch={(q, loc) => {
            setQuery(q);
            change('location', loc);
          }}
        />
      </PageHero>

      {mode === 'jobs' && (
        <nav className="container industry-strip" aria-label="Branże">
          <button type="button" className="industry-strip__item" aria-pressed={industry === ''} onClick={() => setIndustry('')}>
            <Icon name="LayoutGrid" size={20} /> Wszystkie
            <span>{JOBS.length}</span>
          </button>
          {INDUSTRIES.map((i) => (
            <button key={i} type="button" className="industry-strip__item" aria-pressed={industry === i} onClick={() => { setIndustry(industry === i ? '' : i); setPage(1); }}>
              <Icon name={INDUSTRY_ICON[i]} size={20} /> {i}
              <span>{JOBS.filter((j) => j.industry === i).length}</span>
            </button>
          ))}
        </nav>
      )}

      {mode === 'jobs' && (
        <section className="container employer-strip" aria-label="Pracodawcy rekrutujący teraz">
          <p className="employer-strip__label">Rekrutują teraz</p>
          <ul>
            {EMPLOYERS.map((e) => (
              <li key={e}>
                <button type="button" onClick={() => setQuery(e)} aria-label={`Pokaż oferty: ${e}`}>
                  {e}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="container market-layout section--tight">
        <aside className="market-layout__filters">
          <FilterSidebar {...sidebarProps} />
        </aside>

        <section className="market-results" aria-label={mode === 'jobs' ? 'Oferty pracy' : 'Kandydaci'}>
          <div className="results-bar">
            <p className="results-bar__count">
              <strong>{count}</strong> {mode === 'jobs' ? plural(count, 'oferta pracy', 'oferty pracy', 'ofert pracy') : plural(count, 'kandydat', 'kandydatów', 'kandydatów')}
              {industry && <> · {industry}</>}
              {query && <> dla „{query}”</>}
            </p>
            <div className="results-bar__tools">
              <MobileFilters {...sidebarProps} />
              {mode === 'jobs' && <SortSelect id="jobs-sort" value={sort} onChange={setSort} options={JOB_SORTS} />}
            </div>
          </div>
          {count === 0 && (
            <EmptyState title="Brak wyników dla wybranych kryteriów">
              <button type="button" className="btn" onClick={() => { filters.reset(); setQuery(''); setIndustry(''); }}>
                Wyczyść filtry
              </button>
            </EmptyState>
          )}
          {mode === 'jobs' ? (
            <>
              <div className="jobs-list">
                {jobs.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE).map((j) => (
                  <JobCard key={j.id} job={j} />
                ))}
              </div>
              <Pagination page={current} pages={pages} onChange={setPage} />
            </>
          ) : (
            <div className="candidates-grid">
              {candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} />
              ))}
            </div>
          )}
        </section>

        <aside className="market-layout__rail" aria-label="Dla pracodawców i kandydatów">
          <section className="rail-widget jobs-cta">
            <h2>{mode === 'jobs' ? 'Szukasz pracowników?' : 'Szukasz pracy?'}</h2>
            <p>{mode === 'jobs' ? 'Dodaj ofertę i dotrzyj do polskojęzycznych kandydatów w całym UK.' : 'Dodaj swój profil – pracodawcy sami się do Ciebie odezwą.'}</p>
            <Link to="/dodaj-ogloszenie" className="btn btn--inverse">
              <Plus size={16} aria-hidden="true" /> {mode === 'jobs' ? 'Dodaj ofertę pracy' : 'Dodaj profil kandydata'}
            </Link>
            {mode === 'jobs' && (
              <button type="button" className="btn btn--outline-inverse" onClick={() => notify(PROTOTYPE_MESSAGE)}>
                Pakiety dla agencji rekrutacyjnych
              </button>
            )}
          </section>

          <section className="rail-widget" aria-labelledby="pay-insight">
            <div className="rail-widget__head">
              <h2 id="pay-insight">Stawki w Londynie</h2>
              <span className="demo-label">Przykład</span>
            </div>
            <ul className="pay-insight">
              {[
                { label: 'National Living Wage', value: '£12,21/h', bar: 45 },
                { label: 'Magazyn / logistyka', value: '£12,50–£14/h', bar: 55 },
                { label: 'Budowa (CSCS)', value: '£140–£180/dzień', bar: 72 },
                { label: 'Elektryk / hydraulik', value: '£18–£30/h', bar: 90 },
              ].map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <strong>{r.value}</strong>
                  <span className="pay-insight__bar" style={{ '--w': `${r.bar}%` } as React.CSSProperties} aria-hidden="true" />
                </li>
              ))}
            </ul>
            <p>Wartości orientacyjne – zweryfikuj aktualne stawki na gov.uk.</p>
          </section>

          <section className="rail-widget" aria-labelledby="work-guides">
            <div className="rail-widget__head">
              <h2 id="work-guides">Poradnik pracownika</h2>
            </div>
            <ul className="promoted-list">
              {workGuides.map((g) => (
                <li key={g.id}>
                  <Link to={`/poradnik/${g.id}`}>
                    <strong>{g.question}</strong>
                    <span className="meta">{g.readMin} min czytania</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/poradnik?obszar=praca" className="text-link">
              Prawa pracownika w UK <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
          <SafetyNotice />
        </aside>
      </div>
    </>
  );
}

export function JobsPage() {
  return <JobsBoard mode="jobs" />;
}

export function CandidatesPage() {
  return <JobsBoard mode="candidates" />;
}
