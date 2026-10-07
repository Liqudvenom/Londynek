import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MessageSquare } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import type { Article } from '@/types';
import './cards.css';

const articleUrl = (a: Article) => `/artykul/${a.id}`;

function Comments({ count }: { count: number }) {
  return (
    <span aria-label={`${count} komentarzy`}>
      <MessageSquare size={14} aria-hidden="true" /> {count}
    </span>
  );
}

/** Large lead story – headline over a wide photo with editorial typography. */
export function NewsLead({ article, priority = false }: { article: Article; priority?: boolean }) {
  return (
    <article className="news-lead hover-zoom">
      <div className="media ratio-16x9 news-lead__media">
        <Img name={article.image} alt="" sizes="(max-width: 900px) 100vw, 760px" priority={priority} />
      </div>
      <div className="news-lead__body">
        <span className="kicker accent-news">#{article.section}</span>
        <h3 className="news-lead__title">
          <Link to={articleUrl(article)} className="card-link">
            {article.title}
          </Link>
        </h3>
        <p className="news-lead__excerpt">{article.excerpt}</p>
        <div className="meta">
          <span>{article.author}</span>
          <span>
            <Clock size={14} aria-hidden="true" /> {article.ago}
          </span>
          <Comments count={article.comments} />
        </div>
      </div>
    </article>
  );
}

type NewsCardVariant = 'standard' | 'horizontal' | 'photo';

export function NewsCard({ article, variant = 'standard' }: { article: Article; variant?: NewsCardVariant }) {
  return (
    <article className={`news-card news-card--${variant} hover-zoom`}>
      <div className={`media ${variant === 'photo' ? 'ratio-3x4' : 'ratio-3x2'} news-card__media`}>
        <Img name={article.image} alt="" sizes={variant === 'horizontal' ? '160px' : '(max-width: 640px) 100vw, 360px'} />
      </div>
      <div className="news-card__body">
        <span className="kicker accent-news">{article.section}</span>
        <h3 className="news-card__title">
          <Link to={articleUrl(article)} className="card-link">
            {article.title}
          </Link>
        </h3>
        {variant !== 'horizontal' && <p className="news-card__excerpt">{article.excerpt}</p>}
        <div className="meta">
          <span>{article.ago}</span>
          <Comments count={article.comments} />
        </div>
      </div>
    </article>
  );
}

export function NewsCompactItem({ article, index }: { article: Article; index?: number }) {
  return (
    <article className="news-compact">
      {index !== undefined && (
        <span className="news-compact__index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <div>
        <h3 className="news-compact__title">
          <Link to={articleUrl(article)} className="card-link">
            {article.title}
          </Link>
        </h3>
        <div className="meta">
          <span className="news-compact__section">{article.section}</span>
          <span>{article.ago}</span>
          <Comments count={article.comments} />
        </div>
      </div>
    </article>
  );
}

/** Magazine-style long-form preview */
export function MagazineCard({ article, size = 'md' }: { article: Article; size?: 'lg' | 'md' }) {
  return (
    <article className={`mag-card mag-card--${size} hover-zoom`}>
      <div className={`media ${size === 'lg' ? 'ratio-16x9' : 'ratio-4x3'}`}>
        <Img name={article.image} alt="" sizes={size === 'lg' ? '(max-width: 900px) 100vw, 900px' : '(max-width: 640px) 100vw, 420px'} />
      </div>
      <div className="mag-card__body">
        <span className="kicker accent-events">{article.section}</span>
        <h3 className="mag-card__title">
          <Link to={articleUrl(article)} className="card-link">
            {article.title}
          </Link>
        </h3>
        <p className="mag-card__excerpt">{article.excerpt}</p>
        <div className="meta">
          <span>{article.author}</span>
          <span>{article.readMin} min czytania</span>
        </div>
      </div>
    </article>
  );
}

export function ReadMore({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-link">
      {label} <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
