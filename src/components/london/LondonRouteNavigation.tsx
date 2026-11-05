import { useEffect, useRef, useState } from 'react';
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

const LINE: Record<Accent, string> = {
  jobs: 'var(--line-jobs)',
  housing: 'var(--line-housing)',
  help: 'var(--line-help)',
  news: 'var(--line-news)',
  events: 'var(--line-events)',
  services: 'var(--line-services)',
  navy: 'var(--navy)',
};

/** Blend neighbouring stop colours so the rail does not flip hue in one hard band. */
function routeGradient(stops: RouteStop[]): string {
  const last = Math.max(stops.length - 1, 1);
  const parts: string[] = [];
  stops.forEach((stop, i) => {
    const color = LINE[stop.accent];
    const here = (i / last) * 100;
    if (i === 0) {
      parts.push(`${color} 0%`);
      return;
    }
    const prev = LINE[stops[i - 1]!.accent];
    const span = 100 / last;
    parts.push(`color-mix(in oklab, ${prev} 78%, ${color}) ${here - span * 0.38}%`);
    parts.push(`color-mix(in oklab, ${prev} 42%, ${color}) ${here - span * 0.18}%`);
    parts.push(`${color} ${here}%`);
  });
  return `linear-gradient(90deg in oklab, ${parts.join(', ')})`;
}

function easeInOutSine(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function fillDuration(from: number, to: number) {
  return 0.42 + Math.abs(to - from) * 0.9;
}

/**
 * Stations on one Underground line. Hovering a stop fills the rail
 * with that route's colours, left to right.
 */
export function LondonRouteNavigation({ stops, label }: { stops: RouteStop[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const last = Math.max(stops.length - 1, 1);
  const gradient = routeGradient(stops);
  const railRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<(HTMLLIElement | null)[]>([]);
  const anim = useRef({ x: 0, from: 0, to: 0, t0: 0, dur: 0, raf: 0 });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const ro = new ResizeObserver(([e]) => rail.style.setProperty('--rail-w', `${e!.contentRect.width}px`));
    ro.observe(rail);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const target = active === null ? 0 : active / last;
    const a = anim.current;
    const paint = () => {
      rail.style.setProperty('--progress', a.x.toFixed(4));
      rail.style.setProperty('--head', Math.min(1, a.x * 18).toFixed(3));
      const reached = a.x * last;
      stopRefs.current.forEach((li, i) => li?.classList.toggle('is-reached', a.x > 0.002 && reached >= i - 0.18));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      a.x = target;
      a.to = target;
      paint();
      return;
    }
    cancelAnimationFrame(a.raf);
    a.from = a.x;
    a.to = target;
    a.t0 = performance.now();
    a.dur = fillDuration(a.x, target);
    const step = (now: number) => {
      const u = Math.min(1, (now - a.t0) / (a.dur * 1000));
      a.x = a.from + (a.to - a.from) * easeInOutSine(u);
      paint();
      if (u < 1) a.raf = requestAnimationFrame(step);
      else a.x = a.to;
    };
    a.raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(a.raf);
  }, [active, last]);

  return (
    <nav className="route-nav" aria-label={label} onMouseLeave={() => setActive(null)}>
      <div ref={railRef} className={`route-nav__rail ${active !== null ? 'is-live' : ''}`} aria-hidden="true" style={{ '--route-gradient': gradient } as React.CSSProperties}>
        <div className="route-nav__track">
          <span className="route-nav__fill" />
        </div>
        <span className="route-nav__head" />
      </div>
      <ol className="route-nav__stops">
        {stops.map((stop, i) => (
          <li
            key={`${stop.to}-${i}`}
            ref={(el) => {
              stopRefs.current[i] = el;
            }}
            className={`route-nav__stop accent-${stop.accent} ${active === i ? 'is-active' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
          >
            <Link to={stop.to} className="route-nav__link" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
              <span className="route-nav__station">
                <Icon name={stop.icon} size={26} strokeWidth={2.25} />
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
