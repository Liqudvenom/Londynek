import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import type { ImageName } from '@/data/images.generated';
import type { AdCreative } from '@/types';
import './ads.css';

export type AdVariant = 'billboard' | 'leaderboard' | 'sidebar' | 'inline' | 'mobile';

interface AdSlotProps {
  variant: AdVariant;
  creative?: AdCreative;
  className?: string;
}

const SIZE: Record<AdVariant, string> = {
  billboard: '970×250',
  leaderboard: '728×90',
  sidebar: '300×250',
  inline: 'native',
  mobile: '320×100',
};

/**
 * Advertising placement. Always labelled "REKLAMA" and visually separated from editorial
 * (dashed frame, warm neutral background, sans-serif only). Without a creative it renders
 * an empty inventory placeholder that links to the advertising offer.
 */
export function AdSlot({ variant, creative, className = '' }: AdSlotProps) {
  return (
    <aside className={`ad ad--${variant} ${className}`} aria-label="Reklama">
      <span className="ad__label">Reklama</span>
      {creative ? (
        <Link to={creative.to} className="ad__creative">
          {creative.image && (
            <span className="ad__media">
              <Img name={creative.image} alt="" sizes="(max-width: 640px) 100vw, 480px" />
            </span>
          )}
          <span className="ad__copy">
            <span className="ad__advertiser">{creative.advertiser}</span>
            <strong className="ad__headline">{creative.headline}</strong>
            {creative.text && <span className="ad__text">{creative.text}</span>}
            <span className="ad__cta">
              {creative.cta} <ArrowRight size={16} aria-hidden="true" />
            </span>
          </span>
        </Link>
      ) : (
        <Link to="/reklama/banery" className="ad__empty">
          <span className="ad__size">{SIZE[variant]}</span>
          <span>Tu może być Twoja reklama</span>
        </Link>
      )}
    </aside>
  );
}

interface SponsoredCardProps {
  advertiser: string;
  title: string;
  text: string;
  image: ImageName;
  to: string;
}

/** Native sponsored card – sits inside content feeds but is explicitly labelled "SPONSOROWANE". */
export function SponsoredCard({ advertiser, title, text, image, to }: SponsoredCardProps) {
  return (
    <article className="sponsored-card hover-zoom">
      <div className="media ratio-3x2">
        <Img name={image} alt="" />
      </div>
      <div className="sponsored-card__body">
        <span className="ad__label ad__label--inline">Sponsorowane · {advertiser}</span>
        <h3 className="sponsored-card__title">
          <Link to={to} className="card-link">
            {title}
          </Link>
        </h3>
        <p className="sponsored-card__text">{text}</p>
      </div>
    </article>
  );
}
