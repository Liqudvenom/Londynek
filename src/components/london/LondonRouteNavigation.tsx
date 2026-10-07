import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import type { Accent } from '@/types';

export interface RouteStop {
  label: string;
  description: string;
  to: string;
  icon: string;
  accent: Accent;
}

/**
 * Primary user journeys rendered as stations on an Underground line.
 * Hovering/focusing a station animates the coloured route up to that stop.
 */
export function LondonRouteNavigation({ stops, label }: { stops: RouteStop[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const progress = active === null ? 0 : (active + 0.5) / stops.length;
  const activeAccent = active === null ? 'housing' : stops[active]?.accent ?? 'housing';

  return (
    <nav className="route-nav" aria-label={label} onMouseLeave={() => setActive(null)}>
      <div className="route-nav__track" aria-hidden="true">
        {stops.map((s) => (
          <span key={s.to} className={`route-nav__segment accent-${s.accent}`} />
        ))}
        <span className={`route-nav__fill accent-${activeAccent}`} style={{ '--progress': progress } as React.CSSProperties} />
      </div>
      <ol className="route-nav__stops">
        {stops.map((stop, i) => (
          <li key={stop.to} className={`route-nav__stop accent-${stop.accent} ${active === i ? 'is-active' : ''}`}>
            <Link to={stop.to} className="route-nav__link" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
              <span className="route-nav__station">
                <Icon name={stop.icon} size={24} />
              </span>
              <span className="route-nav__label">{stop.label}</span>
              <span className="route-nav__desc">{stop.description}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
