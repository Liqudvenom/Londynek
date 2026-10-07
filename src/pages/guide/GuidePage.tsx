import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, LifeBuoy, Search } from 'lucide-react';
import { Breadcrumbs, EmptyState, SectionHeader } from '@/components/ui/primitives';
import { GuideAreaCard, GuideCard } from '@/components/cards/LocalCards';
import { FAQAccordion } from '@/components/ui/FAQAccordion';
import { GUIDE_AREAS, GUIDE_FAQ, GUIDE_TASKS, guideAreaById } from '@/data/guides';
import { normalize, plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './guide.css';

const HELP_ORGS = [
  { name: 'Citizens Advice', text: 'Bezpłatne porady: praca, długi, mieszkanie, świadczenia.', href: 'https://www.citizensadvice.org.uk/' },
  { name: 'Shelter', text: 'Pomoc w sprawach najmu i bezdomności.', href: 'https://england.shelter.org.uk/' },
  { name: 'ACAS', text: 'Prawa pracownika i spory z pracodawcą.', href: 'https://www.acas.org.uk/' },
  { name: 'NHS 111', text: 'Pilne, ale nie zagrażające życiu sprawy zdrowotne.', href: 'https://111.nhs.uk/' },
];

const QUICK = ['rejestracja-gp', 'ni-number', 'depozyt', 'self-assessment'];

export function GuidePage() {
  useDocumentTitle('Poradnik – pomoc w UK');
  const [params, setParams] = useSearchParams();
  const area = params.get('obszar') ?? '';
  const [query, setQuery] = useState('');
  const currentArea = guideAreaById(area);

  const tasks = useMemo(() => {
    const q = normalize(query);
    return GUIDE_TASKS.filter((t) => (!area || t.area === area) && (!q || normalize(`${t.question} ${t.answer} ${t.steps.join(' ')}`).includes(q)));
  }, [area, query]);

  const selectArea = (id: string) => {
    setParams(id ? { obszar: id } : {}, { preventScrollReset: true });
    document.getElementById('sprawy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <section className="help-hero">
        <div className="container help-hero__inner">
          <Breadcrumbs items={[{ label: 'Poradnik' }]} />
          <span className="help-hero__badge">
            <LifeBuoy size={16} aria-hidden="true" /> Pomoc w UK
          </span>
          <h1 className="help-hero__title">W czym możemy pomóc?</h1>
          <p className="help-hero__lead">Praktyczne instrukcje krok po kroku: NHS, praca, podatki, mieszkanie, dokumenty i status. Po polsku, z odnośnikami do oficjalnych źródeł.</p>
          <form
            className="help-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('sprawy')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Search size={20} aria-hidden="true" />
            <label htmlFor="help-q" className="visually-hidden">
              Opisz swoją sprawę
            </label>
            <input id="help-q" type="search" placeholder="Opisz sprawę, np. „depozyt”, „NI number”, „GP”" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" className="btn btn--primary">
              Szukaj porady
            </button>
          </form>
          <ul className="help-quick" aria-label="Najczęstsze sprawy">
            {QUICK.map((id) => {
              const t = GUIDE_TASKS.find((x) => x.id === id);
              return t ? (
                <li key={id}>
                  <Link to={`/poradnik/${id}`}>{t.question}</Link>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </section>

      <section className="container section--tight" aria-labelledby="areas-title">
        <SectionHeader id="areas-title" title="Wybierz obszar" accent="help" description="Każdy obszar to zestaw zadań, które Polacy w UK załatwiają najczęściej." />
        <div className="help-areas">
          {GUIDE_AREAS.map((a) => (
            <div key={a.id} className={a.id === area ? 'is-current' : undefined}>
              <GuideAreaCard area={a} to={`/poradnik?obszar=${a.id}`} />
            </div>
          ))}
        </div>
      </section>

      <section id="sprawy" className="container section help-tasks" aria-labelledby="tasks-title">
        <SectionHeader id="tasks-title" title={currentArea ? `Sprawy: ${currentArea.title}` : 'Najczęściej załatwiane sprawy'} accent="help">
          {area && (
            <button type="button" className="btn btn--sm" onClick={() => selectArea('')}>
              Wszystkie obszary
            </button>
          )}
        </SectionHeader>
        <p className="help-tasks__count" aria-live="polite">
          {tasks.length} {plural(tasks.length, 'poradnik', 'poradniki', 'poradników')}
          {query && <> dla „{query}”</>}
        </p>
        {tasks.length === 0 ? (
          <EmptyState title="Nie mamy jeszcze poradnika na ten temat">
            <p>Zadaj pytanie redakcji – odpowiadamy na najczęstsze sprawy w nowych poradnikach.</p>
            <Link to="/kontakt?dzial=redakcja" className="btn btn--navy">
              Zadaj pytanie
            </Link>
          </EmptyState>
        ) : (
          <div className="help-task-grid">
            {tasks.map((t) => (
              <GuideCard key={t.id} task={t} areaTitle={guideAreaById(t.area)?.title} />
            ))}
          </div>
        )}
      </section>

      <section className="container section help-bottom">
        <div aria-labelledby="guide-faq">
          <SectionHeader id="guide-faq" title="Pytania o Poradnik" accent="help" />
          <FAQAccordion items={GUIDE_FAQ} />
        </div>
        <aside className="help-orgs" aria-labelledby="orgs-title">
          <h2 id="orgs-title">Nie znalazłeś odpowiedzi?</h2>
          <p>Te organizacje udzielają bezpłatnej pomocy w Wielkiej Brytanii:</p>
          <ul>
            {HELP_ORGS.map((o) => (
              <li key={o.name}>
                <a href={o.href} target="_blank" rel="noopener noreferrer">
                  <strong>
                    {o.name} <ExternalLink size={14} aria-hidden="true" />
                    <span className="visually-hidden">(otwiera nową kartę)</span>
                  </strong>
                  <span>{o.text}</span>
                </a>
              </li>
            ))}
          </ul>
          <Link to="/kontakt?dzial=redakcja" className="btn btn--inverse btn--block">
            Zapytaj redakcję Londynka
          </Link>
        </aside>
      </section>
    </>
  );
}
