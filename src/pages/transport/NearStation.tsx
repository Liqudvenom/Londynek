import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ALL_ARTICLES } from '@/data/articles';
import { countNear, itemsNear, MAP_KIND_LABEL, type MapKind } from '@/lib/location/mapItems';

const NEAR_RADIUS = 1500;
const COUNT_KINDS: MapKind[] = ['jobs', 'housing', 'services', 'business', 'events'];

function around(lat: number, lon: number, stationName: string, cat?: MapKind) {
  const q = new URLSearchParams({ lat: lat.toFixed(5), lng: lon.toFixed(5), r: String(NEAR_RADIUS), q: stationName });
  if (cat) q.set('cat', cat);
  return `/map?${q}`;
}

/** "Co jest w pobliżu?" – listings within walking distance of a Tube station (demo data). */
export function NearStation({ lat, lon, stationName, className = '' }: { lat: number; lon: number; stationName: string; className?: string }) {
  const nearby = itemsNear(lat, lon, NEAR_RADIUS);
  const counts = countNear(lat, lon, NEAR_RADIUS);
  const firms = nearby.filter((i) => i.kind === 'business' || i.kind === 'services');
  const news = ALL_ARTICLES.slice(0, 3);

  const cols = [
    { title: MAP_KIND_LABEL.housing, kind: 'housing' as const, items: nearby.filter((i) => i.kind === 'housing').slice(0, 3) },
    { title: MAP_KIND_LABEL.jobs, kind: 'jobs' as const, items: nearby.filter((i) => i.kind === 'jobs').slice(0, 3) },
    { title: MAP_KIND_LABEL.events, kind: 'events' as const, items: nearby.filter((i) => i.kind === 'events').slice(0, 3) },
    { title: 'Polskie firmy', kind: 'business' as const, items: firms.slice(0, 3) },
  ];

  const pills = COUNT_KINDS.filter((k) => counts[k] > 0);

  return (
    <section className={`tsec near ${className}`} aria-labelledby="near-h">
      <div className="tsec__head">
        <h2 id="near-h" className="tsec-title">
          Co jest w pobliżu?
        </h2>
        <span className="demo-label">Dane demonstracyjne</span>
      </div>
      <p className="tsec__lead">
        Ogłoszenia i miejsca w promieniu ok. 1,5 km od {stationName}. Przykładowe wpisy z wersji demonstracyjnej – nie są klientami Londynka.
      </p>
      {pills.length > 0 && (
        <ul className="near__counts">
          {pills.map((k) => (
            <li key={k}>
              <Link to={around(lat, lon, stationName, k)}>
                {MAP_KIND_LABEL[k]} <strong>{counts[k]}</strong>
              </Link>
            </li>
          ))}
          <li>
            <Link to={around(lat, lon, stationName)}>
              Wszystko na mapie <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </li>
        </ul>
      )}
      <div className="near__grid">
        {cols.map((c) => (
          <div key={c.title} className="near__col">
            <h3>{c.title}</h3>
            {c.items.length ? (
              <ul>
                {c.items.map((i) => (
                  <li key={i.id}>
                    <Link to={i.to}>{i.title}</Link>
                    <span>{i.priceLabel ?? i.subtitle}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="near__empty">Brak wpisów w tej okolicy.</p>
            )}
            <Link to={around(lat, lon, stationName, c.kind)} className="near__more">
              Więcej <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ))}
        <div className="near__col">
          <h3>Wiadomości</h3>
          <ul>
            {news.map((a) => (
              <li key={a.id}>
                <Link to={`/artykul/${a.id}`}>{a.title}</Link>
                <span>{a.ago}</span>
              </li>
            ))}
          </ul>
          <Link to="/wiadomosci" className="near__more">
            Więcej <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
