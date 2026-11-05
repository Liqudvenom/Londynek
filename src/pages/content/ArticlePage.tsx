import { Fragment } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, MessageSquare, Share2 } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { NewsCompactItem } from '@/components/cards/EditorialCards';
import { Reactions } from '@/components/social/Reactions';
import { AdSlot } from '@/components/ads/AdSlot';
import { ALL_ARTICLES, KIND_ROUTE, articleById } from '@/data/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useToast } from '@/context/ToastContext';
import type { Accent, ContentKind } from '@/types';
import './content.css';

const KIND_ACCENT: Record<ContentKind, Accent> = { news: 'news', magazine: 'events', curiosity: 'help', guide: 'help' };

function formatPublished(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ArticlePage() {
  const { id = '' } = useParams();
  const article = articleById(id);
  const notify = useToast();
  useDocumentTitle(article?.title ?? 'Nie znaleziono artykułu');

  if (!article) {
    return (
      <div className="container section">
        <EmptyState as="h1" title="Nie znaleźliśmy tego artykułu">
          <Link to="/wiadomosci" className="btn btn--navy">
            Przejdź do wiadomości
          </Link>
        </EmptyState>
      </div>
    );
  }

  const route = KIND_ROUTE[article.kind];
  const related = ALL_ARTICLES.filter((a) => a.kind === article.kind && a.id !== article.id).slice(0, 5);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Link do artykułu skopiowany.');
    } catch {
      notify('Skopiuj adres z paska przeglądarki, aby udostępnić artykuł.');
    }
  };

  return (
    <article className={`container article article--${article.kind} accent-${KIND_ACCENT[article.kind]}`}>
      <header className="article__head">
        <Breadcrumbs items={[{ label: route.label, to: route.to }, { label: article.section }]} />
        <span className="kicker">{article.section}</span>
        <h1 className="article__title">{article.title}</h1>
        <p className="article__lead">{article.excerpt}</p>
        <div className="article__byline">
          <span className="article__author">
            <span className="article__avatar" aria-hidden="true">
              {article.author.charAt(0)}
            </span>
            <span>
              <strong>{article.author}</strong>
              <time dateTime={article.publishedAt}>{formatPublished(article.publishedAt)}</time>
            </span>
          </span>
          <span className="meta">
            <span>
              <Clock size={14} aria-hidden="true" /> {article.readMin} min czytania
            </span>
            <span>
              <MessageSquare size={14} aria-hidden="true" /> {article.comments} komentarzy
            </span>
          </span>
          <span className="article__tools">
            <SaveButton id={article.id} label={article.title} />
            <button type="button" className="icon-btn" onClick={share} aria-label="Udostępnij – kopiuj link">
              <Share2 size={18} aria-hidden="true" />
            </button>
          </span>
        </div>
        <Reactions id={article.id} labelled />
      </header>

      <figure className="article__figure media">
        <Img name={article.image} alt="" sizes="(max-width: 1100px) 100vw, 1100px" priority />
      </figure>

      <div className="article__layout">
        <div className="article__body">
          {article.body.map((p, i) => (
            <Fragment key={p}>
              <p className={i === article.body.length - 1 ? 'article__note' : undefined}>{p}</p>
              {i === 1 && <AdSlot variant="inline" />}
            </Fragment>
          ))}
          <section className="article__comments" aria-label="Komentarze">
            <MessageSquare size={20} aria-hidden="true" />
            <p>
              <strong>{article.comments} komentarzy</strong> – komentowanie będzie dostępne po zalogowaniu.
            </p>
            <Link to="/zaloguj" className="btn btn--sm">
              Zaloguj się
            </Link>
          </section>
        </div>
        <aside className="article__aside" aria-label={`Więcej: ${route.label}`}>
          <h2 className="rule-title">Więcej – {route.label}</h2>
          {related.map((a, i) => (
            <NewsCompactItem key={a.id} article={a} index={i} />
          ))}
          <AdSlot variant="sidebar" />
        </aside>
      </div>
    </article>
  );
}
