import { Link } from 'react-router-dom';
import { Crosshair, Eye, EyeOff } from 'lucide-react';
import { tubeLineColours, TUBE_LINE_IDS } from '@/data/tube-colors';
import { severityPl } from '@/lib/tfl/format';
import type { LineStatus, TubeNetwork } from '@/lib/tfl/types';
import { StationSearch } from './StationSearch';
import { StatusIcon } from './LineStatus';

interface Props {
  network: TubeNetwork | null;
  statuses: LineStatus[] | null;
  visibleLines: ReadonlySet<string>;
  focusLineId: string | null;
  onToggle: (id: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onFocusLine: (id: string | null) => void;
  onStation: (id: string) => void;
}

export function LineFilterPanel({ network, statuses, visibleLines, focusLineId, onToggle, onShowAll, onHideAll, onFocusLine, onStation }: Props) {
  const byId = new Map((statuses ?? []).map((s) => [s.id, s]));
  return (
    <div className="lpanel">
      <h2 className="lpanel__title">Linie metra</h2>
      <StationSearch network={network} onStation={onStation} onLine={(id) => onFocusLine(id)} />
      <div className="lpanel__bulk">
        <button type="button" className="tlink" onClick={onShowAll} disabled={visibleLines.size === TUBE_LINE_IDS.length}>
          <Eye size={14} aria-hidden="true" /> Pokaż wszystkie
        </button>
        <button type="button" className="tlink" onClick={onHideAll} disabled={visibleLines.size === 0}>
          <EyeOff size={14} aria-hidden="true" /> Ukryj wszystkie
        </button>
      </div>
      <ul className="lpanel__list">
        {TUBE_LINE_IDS.map((id) => {
          const c = tubeLineColours[id];
          const st = byId.get(id);
          const on = visibleLines.has(id);
          const focused = focusLineId === id;
          return (
            <li key={id} className={`lpanel__row${focused ? ' is-focused' : ''}${on ? '' : ' is-off'}`}>
              <label className="lpanel__toggle">
                <input type="checkbox" checked={on} onChange={() => onToggle(id)} />
                <span className="lpanel__swatch" style={{ background: c.colour, outlineColor: id === 'northern' ? '#D9E1EC' : 'transparent' }} aria-hidden="true" />
                <span className="lpanel__name">
                  {c.name}
                  <span className="lpanel__meta">
                    {st ? (
                      <>
                        <StatusIcon level={st.level} size={12} /> {severityPl(st.statusDescription)}
                      </>
                    ) : (
                      'Status…'
                    )}
                  </span>
                </span>
              </label>
              <button type="button" className="icon-btn icon-btn--sm" aria-pressed={focused} onClick={() => onFocusLine(focused ? null : id)} aria-label={focused ? `Wyłącz wyróżnienie linii ${c.name}` : `Wyróżnij linię ${c.name} na mapie`} title="Wyróżnij na mapie">
                <Crosshair size={15} aria-hidden="true" />
              </button>
              <Link to={`/transport/tube/${id}`} className="lpanel__more" aria-label={`Strona linii ${c.name}`}>
                ›
              </Link>
            </li>
          );
        })}
      </ul>
      {visibleLines.size === 0 && (
        <p className="lpanel__empty">
          Wszystkie linie są ukryte.{' '}
          <button type="button" className="tlink" onClick={onShowAll}>
            Pokaż wszystkie
          </button>
        </p>
      )}
    </div>
  );
}
