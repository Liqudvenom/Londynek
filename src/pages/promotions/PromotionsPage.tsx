import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Info, Tag } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { Breadcrumbs, FilterChip } from '@/components/ui/primitives';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_CREATIVES, PROMOTIONS, PROMO_CATEGORIES } from '@/data/misc';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PROTOTYPE_MESSAGE, useToast } from '@/context/ToastContext';
import type { Promotion } from '@/types';
import './promotions.css';

function DealCard({ deal }: { deal: Promotion }) {
  const notify = useToast();
  return (
    <article className={`deal ${deal.sponsored ? 'is-sponsored' : ''}`}>
      <div className="media ratio-16x9 deal__media">
        <Img name={deal.image} alt="" sizes="(max-width: 640px) 100vw, 380px" />
        <span className="deal__sticker">{deal.badge}</span>
        <div className="deal__save">
          <SaveButton id={deal.id} label={deal.title} variant="floating" />
        </div>
      </div>
      <div className="deal__body">
        <div className="deal__top">
          <span className="deal__brand">{deal.brand}</span>
          {deal.sponsored ? <span className="ad__label ad__label--inline">Sponsorowane</span> : <span className="badge badge--outline">Wybór redakcji</span>}
        </div>
        <h3 className="deal__title">{deal.title}</h3>
        <p className="deal__desc">{deal.description}</p>
        <div className="deal__foot">
          <span className="meta">
            <CalendarClock size={14} aria-hidden="true" /> Ważne do {deal.validUntil}
          </span>
          <button type="button" className="btn btn--sm btn--navy" onClick={() => notify(PROTOTYPE_MESSAGE)}>
            Skorzystaj <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function PromotionsPage() {
  useDocumentTitle('Promocje i okazje');
  const [category, setCategory] = useState('');
  const [sponsoredOnly, setSponsoredOnly] = useState<'all' | 'editorial'>('all');
  const deals = PROMOTIONS.filter((p) => (!category || p.category === category) && (sponsoredOnly === 'all' || !p.sponsored));
  const [featured] = PROMOTIONS;

  return (
    <>
      <section className="deals-hero">
        <div className="container deals-hero__inner">
          <div>
            <Breadcrumbs items={[{ label: 'Promocje' }]} />
            <h1 className="deals-hero__title">Promocje i okazje dla Polaków w UK</h1>
            <p className="deals-hero__lead">Zniżki w polskich sklepach, tańsze loty, przekazy pieniężne i usługi. Wszystkie oferty płatne są oznaczone jako „Sponsorowane”.</p>
          </div>
          {featured && (
            <aside className="deals-hero__feature" aria-label={`Promocja sponsorowana: ${featured.brand}`}>
              <span className="ad__label">Sponsorowane · {featured.brand}</span>
              <strong>{featured.title}</strong>
              <span className="deals-hero__badge">{featured.badge}</span>
              <span className="meta">Ważne do {featured.validUntil}</span>
            </aside>
          )}
        </div>
      </section>

      <div className="container deals-filters">
        <div className="cluster" role="group" aria-label="Kategorie promocji">
          <FilterChip label="Wszystkie" active={category === ''} onClick={() => setCategory('')} />
          {PROMO_CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)} />
          ))}
        </div>
        <div className="segmented" role="group" aria-label="Typ ofert">
          <button type="button" aria-pressed={sponsoredOnly === 'all'} onClick={() => setSponsoredOnly('all')}>
            Wszystkie
          </button>
          <button type="button" aria-pressed={sponsoredOnly === 'editorial'} onClick={() => setSponsoredOnly('editorial')}>
            Tylko wybór redakcji
          </button>
        </div>
      </div>

      <section className="container section--tight" aria-label="Lista promocji">
        {deals.length === 0 ? (
          <p className="empty">Brak promocji w tej kategorii – zajrzyj wkrótce.</p>
        ) : (
          <div className="deals-grid">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        )}
        <p className="notice deals-note">
          <Info size={18} aria-hidden="true" />
          <span>Londynek.net nie jest stroną umowy między Tobą a partnerem. Szczegółowe warunki promocji podaje partner. Oferty oznaczone „Sponsorowane” są płatną formą reklamy.</span>
        </p>
      </section>

      <section className="container section">
        <AdSlot variant="billboard" creative={AD_CREATIVES.billboard} />
      </section>

      <section className="container boxed section deals-b2b">
        <Tag size={32} aria-hidden="true" />
        <div>
          <h2>Masz ofertę dla polskiej społeczności?</h2>
          <p>Opublikuj promocję w tym katalogu, w newsletterze i w social media Londynka.</p>
        </div>
        <Link to="/reklama/promocje" className="btn btn--primary">
          Dodaj promocję firmy
        </Link>
      </section>
    </>
  );
}
