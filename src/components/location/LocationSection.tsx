import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ExternalLink, Footprints, Lock, Map as MapIcon, Navigation } from 'lucide-react';
import { lineColour, tubeLineColours, type TubeLineId } from '@/data/tube-colors';
import { useCommute, useInView, useNearestStations } from '@/hooks/useLocation';
import { countNear, googleMapsUrl, MAP_KIND_COLOUR, MAP_KIND_LABEL, mapItemById, mapUrl, publicPlaceLabel, routeUrl, type MapKind } from '@/lib/location/mapItems';
import { formatDistance } from '@/lib/location/nearestStations';
import type { GeoLocation } from '@/lib/location/types';
import { LazyListingMap } from './MapParts';
import './location-section.css';

export type LocationContext = 'job' | 'housing' | 'service' | 'business' | 'event' | 'generic';

const HEADING: Record<LocationContext, string> = {
  job: 'Jak dojechać do pracy?',
  housing: 'Lokalizacja i dojazd',
  service: 'Jak dojechać?',
  business: 'Jak dojechać?',
  event: 'Trasa na wydarzenie',
  generic: 'Lokalizacja',
};

const COMMUTE_TARGETS = [
  { id: '940GZZLUOXC', name: 'Oxford Circus' },
  { id: '940GZZLUBNK', name: 'Bank' },
  { id: '940GZZLUCYF', name: 'Canary Wharf' },
];

const NEARBY_KINDS: MapKind[] = ['jobs', 'housing', 'services', 'business', 'events'];

function CommuteRow({ geo, target, enabled }: { geo: GeoLocation; target: (typeof COMMUTE_TARGETS)[number]; enabled: boolean }) {
  const c = useCommute(geo, target.id, enabled);
  return (
    <li>
      <span>{target.name}</span>
      <strong>{c.status === 'ok' ? `${c.minutes} min` : c.status === 'loading' || c.status === 'idle' ? '…' : 'brak danych'}</strong>
      {c.status === 'ok' && <span className="locsec__sub">{c.transfers === 0 ? 'bez przesiadek' : `${c.transfers} ${c.transfers === 1 ? 'przesiadka' : 'przesiadki'}`}</span>}
    </li>
  );
}

function LineChip({ id }: { id: string }) {
  const known = (tubeLineColours as Record<string, { name: string; ink: string } | undefined>)[id];
  return (
    <span className="locsec__line" style={{ background: lineColour(id), color: known?.ink ?? '#fff' }}>
      {known?.name ?? id}
    </span>
  );
}

interface Props {
  id: string;
  geo: GeoLocation;
  /** Destination name for the planner */
  name: string;
  context: LocationContext;
  headingId?: string;
}

/** Detail-page "LOKALIZACJA": interactive map, address, nearest Tube, route actions. */
export function LocationSection({ id, geo, name, context, headingId = 'where' }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref);
  const stations = useNearestStations(geo, 3, visible);
  const approximate = geo.precision === 'area' || !!geo.hideExact;
  const item = mapItemById(id);
  const counts = countNear(geo.lat, geo.lng, 1000);

  return (
    <section ref={ref} className="detail__section locsec" aria-labelledby={headingId}>
      <p className="locsec__kicker">Lokalizacja</p>
      <h2 id={headingId}>{HEADING[context]}</h2>
      <div className="locsec__grid">
        <div className="locsec__map">
          {visible && item && (
            <LazyListingMap
              items={[item]}
              selectedId={null}
              cluster={false}
              center={{ lat: geo.lat, lng: geo.lng, zoom: approximate ? 14 : 15 }}
              fitOnChange={false}
              stations={stations ?? undefined}
              ariaLabel={`Mapa: ${approximate ? 'przybliżona okolica' : 'lokalizacja'} – ${name}`}
            />
          )}
        </div>
        <div className="locsec__info">
          <p className="locsec__address">{publicPlaceLabel(geo)}</p>
          <p className="locsec__borough">
            {geo.district}, {geo.borough}
          </p>
          {approximate && (
            <p className="locsec__privacy">
              <Lock size={13} aria-hidden="true" /> Dokładny adres jest ukryty – na mapie pokazujemy przybliżoną okolicę. Ogłoszeniodawca poda go po kontakcie.
            </p>
          )}
          {context === 'service' && geo.serviceRadiusKm && <p className="locsec__borough">Dojazd do klienta do {geo.serviceRadiusKm} km od {geo.district}.</p>}

          <h3 className="locsec__h">Najbliższe metro</h3>
          {stations ? (
            <ul className="locsec__stations">
              {stations.map((s) => (
                <li key={s.id}>
                  <Link to={`/transport/station/${s.id}`} className="locsec__station">
                    {s.name}
                  </Link>
                  <span className="locsec__walk">
                    <Footprints size={13} aria-hidden="true" /> {approximate ? 'ok. ' : ''}
                    {s.walkMin} min · {formatDistance(s.distanceM)}
                  </span>
                  <span className="locsec__lines">
                    {s.lines.map((l) => (
                      <LineChip key={l} id={l as TubeLineId} />
                    ))}
                  </span>
                </li>
              ))}
              {!stations.length && <li className="locsec__sub">Brak stacji metra w promieniu 5 km.</li>}
            </ul>
          ) : (
            <p className="locsec__sub">Ładuję stacje…</p>
          )}
          <p className="locsec__note">Czas dojścia to szacunek w linii prostej z zapasem na ulice, nie wyznaczona trasa piesza.</p>

          {context === 'housing' && (
            <>
              <h3 className="locsec__h">
                <Clock size={14} aria-hidden="true" /> Dojazd (TfL, wyjazd teraz)
              </h3>
              <ul className="locsec__commute">
                {COMMUTE_TARGETS.map((t) => (
                  <CommuteRow key={t.id} geo={geo} target={t} enabled={visible} />
                ))}
              </ul>
            </>
          )}

          <div className="locsec__actions">
            <Link to={routeUrl(geo, name)} className="btn btn--primary">
              <Navigation size={16} aria-hidden="true" /> Wyznacz trasę
            </Link>
            <Link to={mapUrl(geo, id)} viewTransition className="btn">
              <MapIcon size={16} aria-hidden="true" /> Otwórz mapę
            </Link>
            <a href={googleMapsUrl(geo)} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
              Google Maps <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>

          <h3 className="locsec__h">Co jest w pobliżu? (1 km)</h3>
          <ul className="locsec__nearby">
            {NEARBY_KINDS.map((k) => (
              <li key={k}>
                <Link to={`/map?${new URLSearchParams({ lat: geo.lat.toFixed(5), lng: geo.lng.toFixed(5), r: '1000', cat: k, q: geo.district })}`} style={{ ['--pin' as string]: MAP_KIND_COLOUR[k] }}>
                  <span className="locsec__dot" aria-hidden="true" />
                  {MAP_KIND_LABEL[k]} <strong>{Math.max(0, counts[k] - (item?.kind === k ? 1 : 0))}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
