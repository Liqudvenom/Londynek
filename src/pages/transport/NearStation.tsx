import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ALL_ARTICLES } from '@/data/articles';
import { DISTRICTS, districtById } from '@/data/districts';
import { EVENTS } from '@/data/events';
import { JOBS } from '@/data/jobs';
import { PROPERTIES } from '@/data/properties';
import { SERVICES } from '@/data/services';
import { formatGBP, formatRange } from '@/lib/format';
import { mapPoint } from '@/lib/mapProjection';

/** Nearest Londynek district to a coordinate (district positions use the same map projection). */
export function nearestDistrict(lat: number, lon: number) {
  const p = mapPoint(lat, lon);
  let best = DISTRICTS[0]!;
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(d.map.x - p.x, d.map.y - p.y);
    if (dist < bestD) {
      best = d;
      bestD = dist;
    }
  }
  return best;
}

/** "W okolicy stacji" – Londynek content near the station. Uses the site's demo data until the real API is connected. */
export function NearStation({ lat, lon, stationName }: { lat: number; lon: number; stationName: string }) {
  const district = nearestDistrict(lat, lon);
  const region = district.region;
  const rooms = PROPERTIES.filter((p) => p.mode === 'rent' && districtById(p.district)?.region === region).slice(0, 3);
  const jobs = JOBS.filter((j) => j.region === region).slice(0, 3);
  const events = EVENTS.filter((e) => e.region === region).slice(0, 3);
  const firms = SERVICES.filter((s) => s.region === region).slice(0, 3);
  const news = ALL_ARTICLES.filter((a) => a.region === region).slice(0, 3);

  const cols = [
    { title: 'Pokoje', to: '/ogloszenia/nieruchomosci', items: rooms.map((p) => ({ id: p.id, to: `/ogloszenie/${p.id}`, label: p.title, meta: `${formatGBP(p.price)}/mies. · ${p.location}` })) },
    { title: 'Praca', to: '/ogloszenia/praca', items: jobs.map((j) => ({ id: j.id, to: `/ogloszenie/${j.id}`, label: j.title, meta: `${j.company} · ${j.location}` })) },
    { title: 'Wydarzenia', to: '/wydarzenia', items: events.map((e) => ({ id: e.id, to: `/wydarzenia/${e.id}`, label: e.title, meta: formatRange(e.start, e.end) })) },
    { title: 'Polskie firmy', to: '/ogloszenia/uslugi', items: firms.map((s) => ({ id: s.id, to: `/ogloszenie/${s.id}`, label: s.name, meta: `${s.category} · ${s.location}` })) },
    { title: 'Wiadomości', to: '/wiadomosci', items: news.map((a) => ({ id: a.id, to: `/artykul/${a.id}`, label: a.title, meta: a.ago })) },
  ];

  return (
    <section className="tsec near" aria-labelledby="near-h">
      <div className="tsec__head">
        <h2 id="near-h" className="tsec-title">
          W okolicy stacji
        </h2>
        <span className="demo-label">Dane demonstracyjne</span>
      </div>
      <p className="tsec__lead">
        Ogłoszenia i treści Londynka z okolicy: {district.name} ({stationName}). Przykładowe wpisy z wersji demonstracyjnej – po podłączeniu API Londynka pojawią się tu prawdziwe ogłoszenia.
      </p>
      <div className="near__grid">
        {cols.map((c) => (
          <div key={c.title} className="near__col">
            <h3>{c.title}</h3>
            {c.items.length ? (
              <ul>
                {c.items.map((i) => (
                  <li key={i.id}>
                    <Link to={i.to}>{i.label}</Link>
                    <span>{i.meta}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="near__empty">Brak wpisów w tej okolicy.</p>
            )}
            <Link to={c.to} className="near__more">
              Więcej <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
