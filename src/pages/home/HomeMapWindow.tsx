import { Link } from 'react-router-dom';
import { ArrowRight, Map as MapIcon } from 'lucide-react';
import { LazyListingMap } from '@/components/location/MapParts';
import { allMapItems } from '@/lib/location/mapItems';

const LONDON = { lat: 51.5072, lng: -0.1276 };

/** Side map on the transport page: a real light London map with listing pins. */
export function HomeMapWindow() {
  const items = allMapItems();
  const jobs = items.filter((i) => i.kind === 'jobs').length;
  const events = items.filter((i) => i.kind === 'events').length;
  const firms = items.filter((i) => i.kind === 'business' || i.kind === 'services').length;

  return (
    <aside className="home-mapwin panel" aria-labelledby="home-mapwin-h">
      <h2 id="home-mapwin-h" className="panel__title">
        <MapIcon size={18} aria-hidden="true" /> Mapa Londynu
      </h2>
      <div className="home-mapwin__map">
        <LazyListingMap
          items={items}
          center={{ lat: LONDON.lat, lng: LONDON.lng, zoom: 11 }}
          fitOnChange={false}
          cluster
          ariaLabel="Mapa Londynu z ofertami"
          className="home-mapwin__live"
        />
      </div>
      <p className="home-mapwin__kicker">W okolicy (dane demonstracyjne)</p>
      <ul className="home-mapwin__stats">
        <li>
          <strong>{items.length}</strong> ofert
        </li>
        <li>
          <strong>{events}</strong> wydarzenia
        </li>
        <li>
          <strong>{firms}</strong> polskie firmy
        </li>
        <li>
          <strong>{jobs}</strong> praca
        </li>
      </ul>
      <Link to="/map" className="btn btn--navy btn--block">
        Otwórz pełną mapę <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
