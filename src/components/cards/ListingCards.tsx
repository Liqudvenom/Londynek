import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Bath, BedDouble, Building, Calendar, Clock, Fuel, Gauge, MapPin, Settings2, Star } from 'lucide-react';
import { GeoStrip, type GeoStripVariant } from '@/components/location/GeoStrip';
import { MiniMap } from '@/components/location/MiniMap';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { CATEGORY_ACCENT, categoryMeta } from '@/data/classifieds';
import { PROPERTY_TYPE_LABEL } from '@/data/properties';
import { formatGBP, formatNumber } from '@/lib/format';
import { MAP_KIND_COLOUR } from '@/lib/location/mapItems';
import type { ClassifiedCategory, Listing, Property, Service, Vehicle } from '@/types';
import './cards.css';

const detailUrl = (id: string) => `/ogloszenie/${id}`;

type ListingLayout = 'rail' | 'row' | 'grid';

const STRIP_VARIANT: Partial<Record<ClassifiedCategory, GeoStripVariant>> = { praca: 'job', nieruchomosci: 'housing', uslugi: 'service' };
const PIN_COLOUR: Partial<Record<ClassifiedCategory, string>> = { praca: MAP_KIND_COLOUR.jobs, nieruchomosci: MAP_KIND_COLOUR.housing, uslugi: MAP_KIND_COLOUR.services };

interface ListingCardProps {
  listing: Listing;
  layout?: ListingLayout;
  /** List ↔ map hover sync */
  highlighted?: boolean;
  onHover?: (id: string | null) => void;
  /** Hide the mini map (e.g. when a big map is already next to the list) */
  hideMap?: boolean;
}

/** Generic classified card. `row` = marketplace list, `grid`/`rail` = image-first tiles. */
export function ListingCard({ listing, layout = 'grid', highlighted = false, onHover, hideMap = false }: ListingCardProps) {
  const meta = categoryMeta(listing.category);
  const accent = CATEGORY_ACCENT[listing.category];
  const geo = listing.geo;
  return (
    <article
      className={`listing listing--${layout} hover-zoom ${listing.promoted ? 'is-promoted' : ''} ${highlighted ? 'is-linked' : ''}`}
      onMouseEnter={onHover ? () => onHover(listing.id) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
      onFocus={onHover ? () => onHover(listing.id) : undefined}
      onBlur={onHover ? () => onHover(null) : undefined}
    >
      <div className="media listing__media">
        {listing.image ? (
          <Img name={listing.image} alt="" sizes={layout === 'row' ? '240px' : '(max-width: 640px) 80vw, 280px'} />
        ) : (
          <span className="listing__placeholder" aria-hidden="true" />
        )}
        {listing.promoted && <span className="badge badge--red listing__flag">Wyróżnione</span>}
        {layout !== 'row' && (
          <span className={`badge badge--accent accent-${accent} listing__cat`}>{meta.short}</span>
        )}
      </div>
      <div className="listing__body">
        {layout === 'row' && (
          <div className="cluster listing__tags">
            <span className={`badge badge--soft accent-${accent}`}>{meta.label}</span>
            <span className="badge badge--outline">{listing.subcategory}</span>
            {listing.verified && (
              <span className="badge badge--ok">
                <BadgeCheck size={12} aria-hidden="true" /> Zweryfikowane
              </span>
            )}
          </div>
        )}
        <h3 className="listing__title">
          <Link to={detailUrl(listing.id)} className="card-link">
            {listing.title}
          </Link>
        </h3>
        {!geo && (
          <p className="listing__location">
            <MapPin size={14} aria-hidden="true" /> {listing.location}
            {listing.postcode && <span className="postcode">{listing.postcode}</span>}
          </p>
        )}
        {layout === 'row' && <p className="listing__desc">{listing.description}</p>}
        {layout === 'row' && (
          <ul className="listing__attrs">
            {listing.attributes.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
        <div className="listing__foot">
          <span className="price">{listing.priceLabel}</span>
          <span className="listing__time">
            <Clock size={13} aria-hidden="true" /> {listing.postedAgo}
          </span>
        </div>
        {geo && (
          <div className="card-geo card-geo--stack">
            <GeoStrip geo={geo} name={listing.title} listingId={listing.id} variant={STRIP_VARIANT[listing.category]} compact={layout === 'rail'} />
            {!hideMap && layout === 'grid' && <MiniMap geo={geo} listingId={listing.id} label={listing.title} colour={PIN_COLOUR[listing.category]} />}
          </div>
        )}
      </div>
      {layout === 'row' && (
        <div className="listing__side">
          <div className="listing__side-save">
            <SaveButton id={listing.id} label={listing.title} variant="plain" />
          </div>
          {geo && !hideMap && <MiniMap geo={geo} listingId={listing.id} label={listing.title} colour={PIN_COLOUR[listing.category]} className="listing__sidemap" />}
          <span className="listing__cta" aria-hidden="true">
            Zobacz szczegóły <ArrowRight size={16} />
          </span>
        </div>
      )}
      {layout !== 'row' && (
        <div className="listing__save">
          <SaveButton id={listing.id} label={listing.title} variant="floating" />
        </div>
      )}
    </article>
  );
}

export function PropertyCard({ property, onHover }: { property: Property; onHover?: (district: string | null) => void }) {
  const isRent = property.mode === 'rent';
  return (
    <article
      className="property hover-zoom"
      onMouseEnter={() => onHover?.(property.district)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(property.district)}
      onBlur={() => onHover?.(null)}
    >
      <div className="media ratio-3x2">
        <Img name={property.image} alt={`${PROPERTY_TYPE_LABEL[property.type]} – ${property.location}`} sizes="(max-width: 640px) 100vw, 420px" />
        <div className="property__badges">
          {property.featured && <span className="badge badge--red">Wyróżnione</span>}
          {property.isNew && <span className="badge badge--navy">Nowe</span>}
          {property.verified && (
            <span className="badge badge--ok property__verified">
              <BadgeCheck size={12} aria-hidden="true" /> Sprawdzony wynajmujący
            </span>
          )}
        </div>
        <span className="property__photos">{property.photos} zdjęć</span>
        <div className="property__save">
          <SaveButton id={property.id} label={property.title} variant="floating" />
        </div>
      </div>
      <div className="property__body">
        <h3 className="property__title">
          <Link to={detailUrl(property.id)} className="card-link">
            {property.title}
          </Link>
        </h3>
        <p className="property__price">
          <span className="price">{formatGBP(property.price)}</span>
          {isRent && <span className="property__per"> / miesiąc</span>}
        </p>
        <ul className="property__facts">
          <li>
            <BedDouble size={15} aria-hidden="true" /> {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} ${property.bedrooms === 1 ? 'sypialnia' : 'sypialnie'}`}
          </li>
          <li>
            <Bath size={15} aria-hidden="true" /> {property.bathrooms} {property.bathrooms === 1 ? 'łazienka' : 'łazienki'}
          </li>
          {property.type !== 'studio' && (
            <li>
              <Building size={15} aria-hidden="true" /> {PROPERTY_TYPE_LABEL[property.type]}
            </li>
          )}
        </ul>
        {property.geo ? (
          <div className="card-geo card-geo--stack">
            <GeoStrip geo={property.geo} name={property.title} listingId={property.id} variant="housing" />
            <MiniMap geo={property.geo} listingId={property.id} label={property.title} colour={MAP_KIND_COLOUR.housing} />
          </div>
        ) : (
          <div className="property__loc">
            <span>
              <MapPin size={14} aria-hidden="true" /> {property.location}, <span className="postcode">{property.postcode}</span>
            </span>
          </div>
        )}
        <div className="property__agent">
          <span className="property__avatar" aria-hidden="true">
            {property.agency.charAt(0)}
          </span>
          <span>
            <strong>{property.agency}</strong>
            <span>{property.agencyKind === 'agency' ? 'Agencja nieruchomości' : 'Osoba prywatna'}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className={`service hover-zoom ${service.sponsored ? 'is-sponsored' : ''} ${service.geo ? 'service--geo' : ''}`}>
      <div className="media ratio-1x1 service__media">
        <Img name={service.image} alt="" sizes="120px" />
      </div>
      <div className="service__body">
        <div className="cluster">
          <span className="badge badge--soft accent-services">{service.category}</span>
          {service.verified && (
            <span className="badge badge--ok">
              <BadgeCheck size={12} aria-hidden="true" /> Zweryfikowana firma
            </span>
          )}
          {service.sponsored && <span className="ad__label ad__label--inline">Sponsorowane</span>}
        </div>
        <h3 className="service__name">
          <Link to={detailUrl(service.id)} className="card-link">
            {service.name}
          </Link>
        </h3>
        <p className="service__tagline">{service.tagline}</p>
        <div className="meta">
          <span className="service__rating" aria-label={`Ocena ${service.rating} na 5, ${service.reviews} opinii`}>
            <Star size={14} aria-hidden="true" /> {service.rating.toFixed(1)} <span>({service.reviews} opinii)</span>
          </span>
          {!service.geo && (
            <span>
              <MapPin size={14} aria-hidden="true" /> {service.location}
            </span>
          )}
        </div>
        {service.geo && <GeoStrip geo={service.geo} name={service.name} listingId={service.id} variant="service" />}
      </div>
      <div className="service__aside">
        {service.geo && <MiniMap geo={service.geo} listingId={service.id} label={service.name} colour={MAP_KIND_COLOUR.services} className="service__map" />}
        <span className="service__price">{service.priceFrom}</span>
        <span className="service__avail">
          <Calendar size={14} aria-hidden="true" /> {service.availability}
        </span>
        <SaveButton id={service.id} label={service.name} />
      </div>
    </article>
  );
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="vehicle hover-zoom">
      <div className="media ratio-3x2">
        <Img name={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} sizes="(max-width: 640px) 100vw, 400px" />
        {vehicle.promoted && <span className="badge badge--red listing__flag">Wyróżnione</span>}
        {vehicle.ulez && <span className="badge badge--ok vehicle__ulez">ULEZ ✓</span>}
        <div className="property__save">
          <SaveButton id={vehicle.id} label={vehicle.title} variant="floating" />
        </div>
      </div>
      <div className="vehicle__body">
        <div className="vehicle__head">
          <h3 className="vehicle__title">
            <Link to={detailUrl(vehicle.id)} className="card-link">
              {vehicle.title}
            </Link>
          </h3>
          <span className="price vehicle__price">{formatGBP(vehicle.price)}</span>
        </div>
        <ul className="vehicle__specs">
          <li>
            <Calendar size={14} aria-hidden="true" /> {vehicle.year}
          </li>
          <li>
            <Gauge size={14} aria-hidden="true" /> {formatNumber(vehicle.mileage)} mil
          </li>
          <li>
            <Fuel size={14} aria-hidden="true" /> {vehicle.fuel}
          </li>
          <li>
            <Settings2 size={14} aria-hidden="true" /> {vehicle.transmission}
          </li>
        </ul>
        <div className="meta">
          {!vehicle.geo && (
            <span>
              <MapPin size={14} aria-hidden="true" /> {vehicle.location}
            </span>
          )}
          <span>{vehicle.sellerType === 'business' ? `Dealer: ${vehicle.seller}` : `Prywatnie: ${vehicle.seller}`}</span>
        </div>
        {vehicle.geo && (
          <div className="card-geo card-geo--stack">
            <GeoStrip geo={vehicle.geo} name={vehicle.title} listingId={vehicle.id} />
            <MiniMap geo={vehicle.geo} listingId={vehicle.id} label={vehicle.title} colour={MAP_KIND_COLOUR.market} />
          </div>
        )}
      </div>
    </article>
  );
}
