import { Link, useSearchParams } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { NewsCard, NewsCompactItem, NewsLead } from '@/components/cards/EditorialCards';
import { ShortsRail } from '@/components/social/ShortsRail';
import { AdSlot } from '@/components/ads/AdSlot';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { LIVE_UPDATES, NEWS, NEWS_SECTIONS } from '@/data/articles';
import { DEMO_TODAY } from '@/data/events';
import { formatDayLong, parseDay } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './content.css';

const MOST_READ = [...NEWS].sort((a, b) => b.comments - a.comments).slice(0, 5);

function LiveTimeline() {
  return (
    <section className="live" aria-labelledby="live-title">
      <h2 id="live-title" className="live__title">
        <span className="live__dot" aria-hidden="true" /> Na żywo
        <span className="demo-label">Demo</span>
      </h2>
      <ol className="live__list">
        {LIVE_UPDATES.map((u) => (
          <li key={u.time}>
            <time>{u.time}</time>
            <p>{u.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function NewsPage() {
  const [params, setParams] = useSearchParams();
  const section = params.get('dzial') ?? '';
  useDocumentTitle(section ? `Wiadomości: ${section}` : 'Wiadomości');
  const list = section ? NEWS.filter((a) => a.section === section) : NEWS;
  const [lead, ...rest] = list;
  const year = parseDay(DEMO_TODAY).getFullYear();

  const selectSection = (s: string) => setParams(s ? { dzial: s } : {}, { preventScrollReset: true });

  return (
    <div className="newsroom">
      <header className="container masthead">
        <Breadcrumbs items={[{ label: 'Wiadomości' }]} />
        <div className="masthead__row">
          <h1 className="masthead__title">Wiadomości</h1>
          <p className="masthead__date">
            {formatDayLong(DEMO_TODAY)} {year} · Londyn
          </p>
        </div>
        <nav className="masthead__sections" aria-label="Działy">
          <button type="button" aria-pressed={section === ''} onClick={() => selectSection('')}>
            Wszystkie
          </button>
          {NEWS_SECTIONS.map((s) => (
            <button key={s} type="button" aria-pressed={section === s} onClick={() => selectSection(s)}>
              {s}
            </button>
          ))}
        </nav>
      </header>

      <div className="container section--tight">
        <ShortsRail />
      </div>

      {!lead ? (
        <div className="container section--tight">
          <EmptyState title={`Brak artykułów w dziale ${section}`}>
            <button type="button" className="btn" onClick={() => selectSection('')}>
              Wszystkie wiadomości
            </button>
          </EmptyState>
        </div>
      ) : (
        <section className="container front" aria-label="Najważniejsze">
          <div className="front__lead">
            <NewsLead article={lead} priority />
          </div>
          <div className="front__stack">
            {rest.slice(0, 4).map((a) => (
              <NewsCard key={a.id} article={a} variant="horizontal" />
            ))}
          </div>
          <aside className="front__aside" aria-label="Na żywo i najczęściej czytane">
            <LiveTimeline />
            <section aria-labelledby="most-read">
              <h2 id="most-read" className="rule-title">
                Najczęściej czytane
              </h2>
              {MOST_READ.map((a, i) => (
                <NewsCompactItem key={a.id} article={a} index={i} />
              ))}
            </section>
          </aside>
        </section>
      )}

      <div className="container section--tight">
        <AdSlot variant="leaderboard" />
      </div>

      {section === '' ? (
        <section className="container section columns" aria-labelledby="by-section">
          <h2 id="by-section" className="rule-title rule-title--wide">
            Z działów
          </h2>
          <div className="columns__grid">
            {NEWS_SECTIONS.map((s) => {
              const items = NEWS.filter((a) => a.section === s).slice(0, 2);
              if (items.length === 0) return null;
              return (
                <section key={s} className="columns__col" aria-labelledby={`col-${s}`}>
                  <h3 id={`col-${s}`} className="columns__head">
                    <Link to={`/wiadomosci?dzial=${encodeURIComponent(s)}`}>{s}</Link>
                  </h3>
                  {items.map((a) => (
                    <NewsCompactItem key={a.id} article={a} />
                  ))}
                </section>
              );
            })}
          </div>
        </section>
      ) : (
        rest.length > 4 && (
          <section className="container section" aria-label={`Więcej z działu ${section}`}>
            <div className="news-grid">
              {rest.slice(4).map((a) => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )
      )}

      <section className="container boxed section news-tip">
        <Radio size={28} aria-hidden="true" />
        <div>
          <h2>Masz temat dla redakcji?</h2>
          <p>Coś dzieje się w Twojej okolicy? Napisz do nas – sprawdzimy każdą informację.</p>
        </div>
        <Link to="/kontakt?dzial=redakcja" className="btn btn--navy">
          Napisz do redakcji
        </Link>
      </section>
    </div>
  );
}
