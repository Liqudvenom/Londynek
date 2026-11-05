import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Footprints, Map as MapIcon, MapPin, Navigation, Radius, TrainFront } from 'lucide-react';
import { lineColour } from '@/data/tube-colors';
import { OXFORD_CIRCUS, useCommute, useInView, useNearestStations } from '@/hooks/useLocation';
import { mapUrl, publicPlaceLabel, routeUrl } from '@/lib/location/mapItems';
import type { GeoLocation } from '@/lib/location/types';
import './location.css';

export type GeoStripVariant = 'job' | 'housing' | 'service' | 'event' | 'generic';

interface Props {
  geo: GeoLocation;
  /** Destination name used by the route planner */
  name: string;
  listingId?: string;
  variant?: GeoStripVariant;
  /** Compact = one line of facts, used in dense rows */
  compact?: boolean;
}

/** WHERE / HOW TO GET THERE – nearest Tube with walking estimate plus route & map actions. */
export function GeoStrip({ geo, name, listingId, variant = 'generic', compact = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const nearest = useNearestStations(geo, 1, visible)?.[0];
  const commute = useCommute(geo, OXFORD_CIRCUS.id, visible && variant === 'housing');
  const approximate = geo.precision === 'area' || !!geo.hideExact;

  return (
    <div ref={ref} className={`geo-strip ${compact ? 'geo-strip--compact' : ''}`}>
      <ul className="geo-strip__facts">
        <li>
          <MapPin size={14} aria-hidden="true" />
          {variant === 'job' && approximate ? `${geo.district}, ${geo.postcode}` : publicPlaceLabel(geo)}
        </li>
        {nearest ? (
          <li>
            <span className="geo-strip__dot" style={{ background: lineColour(nearest.lines[0] ?? '') }} aria-hidden="true" />
            <TrainFront size={14} aria-hidden="true" />
            {nearest.name}
            <span className="geo-strip__walk">
              <Footprints size={13} aria-hidden="true" /> {approximate ? '~' : ''}
              {nearest.walkMin} min
            </span>
          </li>
        ) : (
          visible && <li className="geo-strip__muted">Szukam najbliższej stacji…</li>
        )}
        {variant === 'housing' && commute.status === 'ok' && (
          <li>
            <Clock size={14} aria-hidden="true" /> Oxford Circus: {commute.minutes} min
          </li>
        )}
        {variant === 'service' && geo.serviceRadiusKm && (
          <li>
            <Radius size={14} aria-hidden="true" /> Dojazd do klienta do {geo.serviceRadiusKm} km
          </li>
        )}
      </ul>
      {!compact && (
        <div className="geo-strip__actions">
          <Link to={routeUrl(geo, name)} className="geo-strip__action">
            <Navigation size={14} aria-hidden="true" /> Wyznacz trasę
          </Link>
          {variant === 'housing' && (
            <Link to={mapUrl(geo, listingId)} viewTransition className="geo-strip__action geo-strip__action--muted">
              <MapIcon size={14} aria-hidden="true" /> Pokaż na mapie
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
