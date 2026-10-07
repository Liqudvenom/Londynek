import { Link } from 'react-router-dom';
import { ArrowRight, Bus, Zap } from 'lucide-react';
import { Icon } from '@/components/ui/Icon';
import { LondonMap } from '@/components/london/LondonMap';
import { TransportStatus } from '@/components/london/TransportStatus';
import { DISTRICTS, REGIONS, regionName } from '@/data/districts';
import { CLASSIFIEDS } from '@/data/classifieds';
import { EVENTS } from '@/data/events';
import type { RegionId } from '@/types';

const QUICK_ACCESS = [
  { label: 'Nieruchomości', icon: 'Home', to: '/ogloszenia/nieruchomosci' },
  { label: 'Praca', icon: 'Briefcase', to: '/ogloszenia/praca' },
  { label: 'Metro na żywo', icon: 'TrainFront', to: '/transport/tube' },
  { label: 'Zdrowie', icon: 'HeartPulse', to: '/poradnik?obszar=nhs' },
  { label: 'Edukacja', icon: 'GraduationCap', to: '/poradnik?obszar=szkoly' },
  { label: 'Urzędy', icon: 'Landmark', to: '/poradnik?obszar=dokumenty' },
  { label: 'Prawo', icon: 'Scale', to: '/poradnik?obszar=prawo' },
  { label: 'Biznes', icon: 'Briefcase', to: '/ogloszenia/uslugi' },
];

interface Props {
  region: RegionId;
  onRegionChange: (r: RegionId) => void;
}

export function LondonDashboard({ region, onRegionChange }: Props) {
  const markers = DISTRICTS.filter((d) => d.region === region).map((d) => ({ id: d.id, x: d.map.x, y: d.map.y, label: d.name, tone: 'red' as const }));
  const localListings = CLASSIFIEDS.filter((l) => l.region === region).slice(0, 2);
  const localEvent = EVENTS.find((e) => e.region === region);

  return (
    <section className="container section dashboard" aria-label="Twój londyński pulpit">
      <div className="dashboard__col panel">
        <h2 className="panel__title">
          <Zap size={18} aria-hidden="true" /> Szybki dostęp
        </h2>
        <ul className="quick-grid">
          {QUICK_ACCESS.map((q) => (
            <li key={q.label}>
              <Link to={q.to} className="quick-grid__item">
                <span className="quick-grid__icon">
                  <Icon name={q.icon} size={22} />
                </span>
                {q.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="dashboard__col panel dashboard__map">
        <h2 className="panel__title">Wybierz region Londynu</h2>
        <div className="dashboard__map-grid">
          <LondonMap label="Mapa regionów Londynu" selectedRegion={region} onSelectRegion={onRegionChange} markers={markers} showRegionLabels />
          <div className="dashboard__regions">
            <div className="cluster" role="group" aria-label="Regiony">
              {REGIONS.map((r) => (
                <button key={r.id} type="button" className="chip" aria-pressed={region === r.id} onClick={() => onRegionChange(r.id)}>
                  {r.name.replace(' London', '')}
                </button>
              ))}
            </div>
            <div className="dashboard__local" aria-live="polite">
              <p className="dashboard__local-title">Teraz w: {regionName(region)}</p>
              <ul>
                {localListings.map((l) => (
                  <li key={l.id}>
                    <Link to={`/ogloszenie/${l.id}`}>{l.title}</Link>
                    <span>{l.priceLabel}</span>
                  </li>
                ))}
                {localEvent && (
                  <li>
                    <Link to={`/wydarzenia/${localEvent.id}`}>{localEvent.title}</Link>
                    <span>Wydarzenie</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
        <a href="#lokalnie" className="text-link">
          Zobacz, co dzieje się w okolicy <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>

      <div className="dashboard__col panel">
        <h2 className="panel__title">
          <Bus size={18} aria-hidden="true" /> Komunikacja i utrudnienia
        </h2>
        <TransportStatus />
      </div>
    </section>
  );
}
