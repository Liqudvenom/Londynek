import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, Clock, Flag, MapPin, MessageSquare, Phone, Share2 } from 'lucide-react';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { SafetyNotice } from '@/components/ui/RailWidgets';
import { LondonMap } from '@/components/london/LondonMap';
import { AdSlot } from '@/components/ads/AdSlot';
import { resolveListing } from '@/lib/listingDetail';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PROTOTYPE_MESSAGE, useToast } from '@/context/ToastContext';
import './detail.css';

export function ListingDetailPage() {
  const { id = '' } = useParams();
  const item = resolveListing(id);
  const notify = useToast();
  useDocumentTitle(item?.title ?? 'Nie znaleziono ogłoszenia');

  if (!item) {
    return (
      <div className="container section">
        <EmptyState as="h1" title="To ogłoszenie nie istnieje lub zostało usunięte">
          <Link to="/ogloszenia" className="btn btn--navy">
            Przeglądaj ogłoszenia
          </Link>
        </EmptyState>
      </div>
    );
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Link do ogłoszenia skopiowany do schowka.');
    } catch {
      notify('Nie udało się skopiować linku – skopiuj adres z paska przeglądarki.');
    }
  };

  return (
    <article className={`container detail accent-${item.accent}`}>
      <Breadcrumbs items={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: item.category.label, to: item.category.to }, { label: item.title }]} />

      <div className="detail__layout">
        <div className="detail__main">
          <header className="detail__head">
            <div className="cluster">
              <span className="badge badge--accent">{item.category.label}</span>
              {item.promoted && <span className="badge badge--promoted">{item.kind === 'service' ? 'Sponsorowane' : 'Wyróżnione'}</span>}
              {item.tags.map((t) => (
                <span key={t} className="badge badge--outline">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="detail__title">{item.title}</h1>
            <p className="detail__price">{item.priceLabel}</p>
            <p className="meta">
              <span>
                <MapPin size={14} aria-hidden="true" /> {item.location}
                {item.postcode && <span className="postcode">{item.postcode}</span>}
              </span>
              {item.posted && (
                <span>
                  <Clock size={14} aria-hidden="true" /> Dodano: {item.posted}
                </span>
              )}
            </p>
          </header>

          {item.image && (
            <figure className={`detail__media media ${item.kind === 'candidate' ? 'detail__media--portrait' : ''}`}>
              <Img name={item.image} alt={item.title} sizes="(max-width: 1023px) 100vw, 820px" priority />
            </figure>
          )}

          <section className="detail__section" aria-labelledby="facts">
            <h2 id="facts">Szczegóły</h2>
            <dl className="detail__facts">
              {item.facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="detail__section" aria-labelledby="desc">
            <h2 id="desc">Opis</h2>
            {item.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="demo-label">Treść przykładowa (dane demonstracyjne)</p>
          </section>

          <section className="detail__section" aria-labelledby="where">
            <h2 id="where">Lokalizacja</h2>
            <div className="detail__map">
              <LondonMap label={`Przybliżona lokalizacja: ${item.location}`} markers={[{ id: item.id, ...item.map, label: item.location }]} activeMarker={item.id} showRegionLabels />
              <p className="meta">Pokazujemy przybliżoną okolicę – dokładny adres przekazuje ogłoszeniodawca.</p>
            </div>
          </section>
        </div>

        <aside className="detail__aside" aria-label="Kontakt z ogłoszeniodawcą">
          <section className="contact-card panel">
            <div className="contact-card__seller">
              <span className="contact-card__avatar" aria-hidden="true">
                {item.seller.name.charAt(0)}
              </span>
              <span>
                <strong>
                  {item.seller.name}
                  {item.seller.verified && <BadgeCheck size={16} className="contact-card__check" aria-label="Zweryfikowany" />}
                </strong>
                <span>{item.seller.kind}</span>
              </span>
            </div>
            <button type="button" className="btn btn--primary btn--block" onClick={() => notify(PROTOTYPE_MESSAGE)}>
              <MessageSquare size={18} aria-hidden="true" /> {item.contactLabel}
            </button>
            <button type="button" className="btn btn--block" onClick={() => notify(PROTOTYPE_MESSAGE)}>
              <Phone size={18} aria-hidden="true" /> Pokaż numer telefonu
            </button>
            <div className="contact-card__tools">
              <SaveButton id={item.id} label={item.title} />
              <button type="button" className="icon-btn" onClick={share} aria-label="Udostępnij – kopiuj link">
                <Share2 size={18} aria-hidden="true" />
              </button>
              <button type="button" className="text-link contact-card__report" onClick={() => notify('Dziękujemy. Zgłoszenie trafi do moderacji po podłączeniu backendu.')}>
                <Flag size={14} aria-hidden="true" /> Zgłoś ogłoszenie
              </button>
            </div>
          </section>
          <SafetyNotice />
          <AdSlot variant="sidebar" />
        </aside>
      </div>

      {item.related.length > 0 && (
        <section className="detail__related section" aria-labelledby="related">
          <h2 id="related">Podobne ogłoszenia</h2>
          <ul>
            {item.related.map((r) => (
              <li key={r.id} className="related-item hover-zoom">
                <div className="media ratio-4x3">{r.image ? <Img name={r.image} alt="" sizes="280px" /> : <span className="listing__placeholder" aria-hidden="true" />}</div>
                <Link to={`/ogloszenie/${r.id}`} className="card-link">
                  {r.title}
                </Link>
                <span className="price">{r.priceLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
