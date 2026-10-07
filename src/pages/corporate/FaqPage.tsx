import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { FAQAccordion } from '@/components/ui/FAQAccordion';
import { EmptyState, FilterChip } from '@/components/ui/primitives';
import { FAQ } from '@/data/misc';
import { normalize } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './corporate.css';

const CATEGORIES = [...new Set(FAQ.map((f) => f.category))];

export function FaqPage() {
  useDocumentTitle('FAQ – najczęstsze pytania');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    return FAQ.filter((f) => {
      if (category && f.category !== category) return false;
      const hay = normalize(`${f.q} ${f.a}`);
      return tokens.every((t) => hay.includes(t));
    });
  }, [query, category]);

  const grouped = CATEGORIES.map((c) => ({ c, items: results.filter((f) => f.category === c) })).filter((g) => g.items.length);

  return (
    <>
      <PageIntro title="Najczęstsze pytania" lead="Szybkie odpowiedzi o ogłoszeniach, koncie, bezpieczeństwie i reklamie." crumbs={[{ label: 'FAQ' }]}>
        <div className="corp-faq-search" role="search">
          <Search size={20} aria-hidden="true" />
          <label htmlFor="faq-q" className="visually-hidden">
            Szukaj w pytaniach
          </label>
          <input id="faq-q" type="search" className="input" placeholder="Np. hasło, oszustwo, reklama…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </PageIntro>

      <div className="container section--tight corp-faq">
        <div className="cluster corp-faq__chips" role="group" aria-label="Kategorie pytań">
          <FilterChip label="Wszystkie" active={!category} onClick={() => setCategory(null)} count={FAQ.length} />
          {CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(category === c ? null : c)} count={FAQ.filter((f) => f.category === c).length} />
          ))}
        </div>

        <p className="visually-hidden" role="status">
          {results.length} pytań
        </p>

        <div className="corp-faq__list">
          {grouped.length ? (
            grouped.map((g) => (
              <section key={g.c} aria-labelledby={`faq-${g.c}`}>
                <h2 id={`faq-${g.c}`} className="corp-faq__cat">
                  {g.c}
                </h2>
                <FAQAccordion key={`${g.c}-${query}`} items={g.items} defaultOpen={query ? g.items[0]?.id : undefined} />
              </section>
            ))
          ) : (
            <EmptyState title="Brak pasujących pytań">Spróbuj innego słowa albo zadaj pytanie bezpośrednio.</EmptyState>
          )}
        </div>

        <aside className="corp-escalate" aria-labelledby="escalate">
          <MessageCircle size={28} aria-hidden="true" />
          <h2 id="escalate">Nie znalazłeś odpowiedzi?</h2>
          <p>Napisz do nas – wybierz dział, a wiadomość trafi do właściwej osoby.</p>
          <Link to="/kontakt?dzial=ogloszenia" className="btn btn--primary btn--block">
            Problem z ogłoszeniem
          </Link>
          <Link to="/kontakt?dzial=techniczny" className="btn btn--block">
            Konto i pomoc techniczna
          </Link>
          <Link to="/poradnik" className="text-link">
            Sprawy urzędowe? Zobacz Poradnik
          </Link>
        </aside>
      </div>
    </>
  );
}
