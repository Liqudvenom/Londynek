import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, TrainFront } from 'lucide-react';
import { useTransportSearch } from '@/hooks/useTransportSearch';
import { useSiteSearch } from '@/hooks/useContent';
import { HeroSearch } from '@/components/search/HeroSearch';
import { Img } from '@/components/ui/Img';
import { Breadcrumbs, EmptyState, FilterChip } from '@/components/ui/primitives';
import { POPULAR_CHIPS, SEARCH_SCOPES, type SearchScope } from '@/lib/search';
import { plural } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './misc.css';

const isScope = (v: string | null): v is SearchScope => !!v && SEARCH_SCOPES.some((s) => s.id === v);

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const location = params.get('lokalizacja') ?? '';
  const rawScope = params.get('kategoria');
  const scope: SearchScope = isScope(rawScope) ? rawScope : 'all';
  useDocumentTitle(q ? `„${q}” – wyniki wyszukiwania` : 'Szukaj');

  const { data: all, source, loading } = useSiteSearch(q, 'all', location);
  const transport = useTransportSearch(location ? '' : q, 6);
  const results = scope === 'all' ? all : all.filter((r) => r.scope === scope);
  const hasQuery = !!(q || location);

  const setScope = (s: SearchScope) => {
    const next = new URLSearchParams(params);
    if (s === 'all') next.delete('kategoria');
    else next.set('kategoria', s);
    setParams(next);
  };

  return (
    <>
      <header className="search-head">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Szukaj' }]} />
          <h1 className="search-head__title">{q ? <>Wyniki dla „{q}”</> : 'Szukaj w Londynek.net'}</h1>
          <HeroSearch key={`${q}|${location}`} defaultQuery={q} defaultLocation={location} defaultScope={scope} showCategory={false} />
        </div>
      </header>

      <div className="container section--tight search-page">
        {hasQuery ? (
          <>
            <div className="search-page__bar">
              <p role="status" aria-busy={loading}>
                {loading ? (
                  'Szukam…'
                ) : (
                  <>
                    <strong>{results.length}</strong> {plural(results.length, 'wynik', 'wyniki', 'wyników')}
                  </>
                )}
                {location && (
                  <>
                    {' '}
                    w lokalizacji <strong>{location}</strong>
                  </>
                )}
              </p>
              <div className="cluster" role="group" aria-label="Zawęź do kategorii">
                {SEARCH_SCOPES.map((s) => {
                  const n = s.id === 'all' ? all.length : all.filter((r) => r.scope === s.id).length;
                  if (s.id !== 'all' && !n) return null;
                  return <FilterChip key={s.id} label={s.id === 'all' ? 'Wszystko' : s.label} active={scope === s.id} onClick={() => setScope(s.id)} count={n} />;
                })}
              </div>
            </div>

            {transport.length > 0 && (scope === 'all' || !results.length) && (
              <section className="search-transport" aria-labelledby="search-transport-h">
                <h2 id="search-transport-h" className="search-transport__title">
                  <TrainFront size={18} aria-hidden="true" /> Transport – metro na żywo
                </h2>
                <ul className="search-transport__list">
                  {transport.map((t) => (
                    <li key={t.id}>
                      <Link to={t.to} className="search-transport__item">
                        <span className="search-transport__bar" style={{ background: t.colour ?? 'var(--ink)' }} aria-hidden="true" />
                        <span>
                          <span className="search-result__type">{t.type}</span>
                          <strong>{t.title}</strong>
                          <span className="search-result__snippet">{t.snippet}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/transport/tube" className="search-transport__more">
                  Mapa metra i odjazdy na żywo →
                </Link>
              </section>
            )}

            {results.length ? (
              <ol className="search-results">
                {results.slice(0, 60).map((r) => (
                  <li key={`${r.scope}-${r.id}`} className="search-result">
                    {r.image ? (
                      <span className="search-result__media">
                        <Img name={r.image} alt="" sizes="112px" />
                      </span>
                    ) : (
                      r.imageUrl && (
                        <span className="search-result__media">
                          <img src={r.imageUrl} alt="" loading="lazy" decoding="async" />
                        </span>
                      )
                    )}
                    <div>
                      <span className="search-result__type">{r.type}</span>
                      <Link to={r.to} className="search-result__title card-link">
                        {r.title}
                      </Link>
                      <p className="search-result__snippet">{r.snippet}</p>
                      {r.location && (
                        <span className="search-result__loc">
                          <MapPin size={14} aria-hidden="true" /> {r.location}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : transport.length || loading ? null : (
              <EmptyState title="Brak wyników">
                <p>Spróbuj krótszego hasła, usuń lokalizację lub przejrzyj popularne kategorie poniżej.</p>
              </EmptyState>
            )}
          </>
        ) : (
          <p className="search-page__hint">Wpisz, czego szukasz – przeszukamy ogłoszenia, pracę, nieruchomości, usługi, artykuły, poradnik i wydarzenia.</p>
        )}

        <section aria-labelledby="popular" className="search-popular">
          <h2 id="popular">Popularne</h2>
          <ul className="cluster">
            {POPULAR_CHIPS.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="chip">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        {source === 'demo' && <p className="demo-label">Wyszukiwanie działa lokalnie na danych demonstracyjnych</p>}
      </div>
    </>
  );
}
