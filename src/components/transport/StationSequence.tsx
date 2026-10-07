import { useEffect, useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { tubeLineColours, isTubeLineId } from '@/data/tube-colors';
import { transportApi } from '@/lib/tfl/api';
import { lineSegments } from '@/lib/tfl/network';
import type { TubeNetwork } from '@/lib/tfl/types';
import { LineBadge } from './LineStatus';

interface Props {
  network: TubeNetwork;
  lineId: string;
  hoveredStationId: string | null;
  selectedStationId: string | null;
  onHoverStation: (id: string | null) => void;
  onSelectStation: (id: string) => void;
  maxHeight?: number;
}

const branchName = (network: TubeNetwork, ids: string[]) => {
  const a = network.stations[ids[0]!]?.name;
  const b = network.stations[ids[ids.length - 1]!]?.name;
  return a && b ? `${a} – ${b}` : '';
};

/** "Przebieg linii": real station order per branch with interchanges and lift access, synced with the map on hover. */
export function StationSequence({ network, lineId, hoveredStationId, selectedStationId, onHoverStation, onSelectStation, maxHeight = 520 }: Props) {
  const line = network.lines.find((l) => l.id === lineId);
  const [access, setAccess] = useState<Record<string, boolean | null> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setAccess(null);
    transportApi.accessibility(lineId).then(
      (e) => alive && setAccess(e.data),
      () => alive && setAccess({}),
    );
    return () => {
      alive = false;
    };
  }, [lineId]);

  useEffect(() => {
    if (!hoveredStationId || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-station="${hoveredStationId}"]`);
    if (!row) return;
    const box = listRef.current.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    if (r.top < box.top || r.bottom > box.bottom) listRef.current.scrollTo({ top: row.offsetTop - box.height / 2, behavior: 'smooth' });
  }, [hoveredStationId]);

  if (!line) return null;
  const segments = lineSegments(line);
  const colour = isTubeLineId(lineId) ? tubeLineColours[lineId].colour : '#888';

  return (
    <div className="seq" style={{ '--line': colour } as React.CSSProperties}>
      <div className="seq__scroll" ref={listRef} style={{ maxHeight }} onMouseLeave={() => onHoverStation(null)}>
        {segments.map((seg, si) => (
          <div key={si} className="seq__segment">
            <p className="seq__branch">{si === 0 ? 'Główny przebieg' : 'Odgałęzienie'}: {branchName(network, seg)}</p>
            <ol>
              {seg.map((id) => {
                const s = network.stations[id];
                if (!s) return null;
                const others = s.lines.filter((l) => l !== lineId);
                const lift = access?.[id];
                return (
                  <li key={id} data-station={id} className={`seq__stop${s.interchange ? ' is-interchange' : ''}${id === hoveredStationId ? ' is-hover' : ''}${id === selectedStationId ? ' is-selected' : ''}`}>
                    <button type="button" className="seq__btn" onMouseEnter={() => onHoverStation(id)} onFocus={() => onHoverStation(id)} onClick={() => onSelectStation(id)}>
                      <span className="seq__node" aria-hidden="true" />
                      <span className="seq__name">{s.name}</span>
                      {s.zone && <span className="seq__zone">Strefa {s.zone}</span>}
                      {lift === true && (
                        <span className="seq__lift" title="TfL: dostęp windą">
                          <Accessibility size={13} aria-hidden="true" />
                          <span className="visually-hidden">dostęp windą</span>
                        </span>
                      )}
                    </button>
                    {others.length > 0 && (
                      <span className="seq__changes" aria-label="Przesiadki">
                        {others.map((l) => (
                          <LineBadge key={l} id={l} small />
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
      <p className="seq__legend">
        <Accessibility size={13} aria-hidden="true" /> = TfL podaje dostęp windą (nie zawsze oznacza pełny dostęp bez stopni do pociągu).{' '}
        {access === null ? 'Ładowanie danych o dostępności…' : Object.keys(access).length === 0 ? 'Dane o dostępności chwilowo niedostępne.' : ''}
      </p>
    </div>
  );
}
