import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Navigation, ShieldCheck, X } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { googleMapsUrl, isApproximate, MAP_KIND_COLOUR, MAP_KIND_LABEL, publicPlaceLabel, routeUrl, type MapItem } from '@/lib/location/mapItems';
import type { ListingMapProps } from './ListingMap';
import './listing-map.css';

const ListingMapImpl = lazy(() => import('./ListingMap'));

/** MapLibre is ~800 KB – only fetched when a page actually shows an interactive map. */
export function LazyListingMap(props: ListingMapProps) {
  return (
    <Suspense
      fallback={
        <div className={`lmap lmap--loading ${props.className ?? ''}`} role="status">
          <span className="visually-hidden">Ładuję mapę…</span>
        </div>
      }
    >
      <ListingMapImpl {...props} />
    </Suspense>
  );
}

export function MapItemCard({ item, onClose }: { item: MapItem; onClose?: () => void }) {
  const approximate = isApproximate(item.geo);
  return (
    <article className={`mcard ${item.image ? '' : 'mcard--noimg'}`} style={{ ['--pin' as string]: MAP_KIND_COLOUR[item.kind] }}>
      {item.image && (
        <div className="mcard__media">
          <Img name={item.image} alt="" sizes="84px" />
        </div>
      )}
      <div className="mcard__body">
        <span className="mcard__kind">
          <span className="mcard__dot" aria-hidden="true" /> {MAP_KIND_LABEL[item.kind]}
          {item.seed && ' · dane demo'}
        </span>
        <h3 className="mcard__title">
          <Link to={item.to}>{item.title}</Link>
        </h3>
        <span className="mcard__meta">
          {item.subtitle} · {publicPlaceLabel(item.geo)}
        </span>
        {item.priceLabel && <span className="mcard__price">{item.priceLabel}</span>}
        {approximate && (
          <span className="mcard__private">
            <ShieldCheck size={12} aria-hidden="true" /> Przybliżona okolica – adres zna tylko autor
          </span>
        )}
        <div className="mcard__actions">
          <Link to={routeUrl(item.geo, item.title)}>
            <Navigation size={12} aria-hidden="true" /> {approximate ? 'Trasa w okolicę' : 'Wyznacz trasę'}
          </Link>
          {!approximate && (
            <a href={googleMapsUrl(item.geo)} target="_blank" rel="noopener noreferrer">
              Google Maps <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      {onClose && (
        <button type="button" className="mcard__close" onClick={onClose} aria-label="Zamknij podgląd">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}
