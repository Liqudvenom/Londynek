import { useId, type KeyboardEvent } from 'react';
import type { RegionId } from '@/types';
import { REGIONS } from '@/data/districts';
import { LONDON_BOROUGHS, LONDON_OUTLINE, LONDON_REGIONS, LONDON_VIEWBOX, THAMES_PATH } from '@/data/london-geo.generated';
import { mapPoint } from '@/lib/mapProjection';

const { width: W, height: H } = LONDON_VIEWBOX;

const REGION_LABEL_POS: Record<RegionId, { x: number; y: number }> = {
  north: mapPoint(51.625, -0.14),
  east: mapPoint(51.575, 0.085),
  south: mapPoint(51.385, -0.06),
  west: mapPoint(51.54, -0.37),
  central: mapPoint(51.522, -0.115),
};

export interface MapMarker {
  id: string;
  /** percent of map width / height – use mapPoint(lat, lon) */
  x: number;
  y: number;
  label?: string;
  tone?: 'red' | 'navy' | 'green' | 'blue' | 'magenta';
}

interface LondonMapProps {
  label: string;
  selectedRegion?: RegionId | null;
  onSelectRegion?: (id: RegionId) => void;
  markers?: MapMarker[];
  activeMarker?: string | null;
  onMarkerEnter?: (id: string | null) => void;
  onMarkerSelect?: (id: string) => void;
  showRegionLabels?: boolean;
  /** markers with labels render as price bubbles */
  bubbles?: boolean;
  className?: string;
}

/** Greater London built from real borough boundaries, grouped into five regions. Keyboard operable. */
export function LondonMap({
  label,
  selectedRegion = null,
  onSelectRegion,
  markers = [],
  activeMarker = null,
  onMarkerEnter,
  onMarkerSelect,
  showRegionLabels = false,
  bubbles = false,
  className = '',
}: LondonMapProps) {
  const clipId = `${useId()}-clip`;
  const onRegionKey = (e: KeyboardEvent, id: RegionId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRegion?.(id);
    }
  };

  return (
    <div className={`lmap ${bubbles ? 'lmap--bubbles' : ''} ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="lmap__svg" role="group" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <path d={LONDON_OUTLINE} />
          </clipPath>
        </defs>
        <path d={LONDON_OUTLINE} className="lmap__outline" />
        {REGIONS.map((r) => {
          const selected = selectedRegion === r.id;
          return (
            <path
              key={r.id}
              d={LONDON_REGIONS[r.id]}
              fillRule="evenodd"
              className={`lmap__region lmap__region--${r.id} ${selected ? 'is-selected' : ''} ${onSelectRegion ? 'is-interactive' : ''}`}
              {...(onSelectRegion
                ? {
                    role: 'button',
                    tabIndex: 0,
                    'aria-pressed': selected,
                    'aria-label': r.name,
                    onClick: () => onSelectRegion(r.id),
                    onKeyDown: (e: KeyboardEvent) => onRegionKey(e, r.id),
                  }
                : {})}
            />
          );
        })}
        <g className="lmap__boroughs" aria-hidden="true">
          {LONDON_BOROUGHS.map((b) => (
            <path key={b.name} d={b.d} />
          ))}
        </g>
        <path d={THAMES_PATH} className="lmap__thames" clipPath={`url(#${clipId})`} />
        {showRegionLabels &&
          REGIONS.map((r) => (
            <text
              key={r.id}
              x={(REGION_LABEL_POS[r.id].x * W) / 100}
              y={(REGION_LABEL_POS[r.id].y * H) / 100}
              className={`lmap__region-label ${r.id === 'central' ? 'lmap__region-label--sm' : ''}`}
              textAnchor="middle"
            >
              {r.name.replace(' London', '')}
            </text>
          ))}
        {!bubbles &&
          markers.map((m) => (
            <g
              key={m.id}
              className={`lmap__marker lmap__marker--${m.tone ?? 'red'} ${activeMarker === m.id ? 'is-active' : ''}`}
              transform={`translate(${(m.x * W) / 100} ${(m.y * H) / 100})`}
              onMouseEnter={() => onMarkerEnter?.(m.id)}
              onMouseLeave={() => onMarkerEnter?.(null)}
              {...(onMarkerSelect
                ? { role: 'button', tabIndex: 0, 'aria-label': m.label ?? m.id, onClick: () => onMarkerSelect(m.id), onFocus: () => onMarkerEnter?.(m.id), onBlur: () => onMarkerEnter?.(null), onKeyDown: (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && onMarkerSelect(m.id) }
                : {})}
            >
              <circle r="2.6" className="lmap__marker-halo" />
              <circle r="1.4" className="lmap__marker-dot" />
            </g>
          ))}
      </svg>
      {bubbles && (
        <ul className="lmap__bubbles">
          {markers.map((m) => (
            <li key={m.id} style={{ left: `${m.x}%`, top: `${m.y}%` }}>
              <button
                type="button"
                className={`lmap__bubble lmap__bubble--${m.tone ?? 'navy'} ${activeMarker === m.id ? 'is-active' : ''}`}
                onMouseEnter={() => onMarkerEnter?.(m.id)}
                onMouseLeave={() => onMarkerEnter?.(null)}
                onFocus={() => onMarkerEnter?.(m.id)}
                onBlur={() => onMarkerEnter?.(null)}
                onClick={() => onMarkerSelect?.(m.id)}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="lmap__credit">Granice: ONS · Tamiza: © OpenStreetMap</p>
    </div>
  );
}
