import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { isTubeLineId, modeColours } from '@/data/tube-colors';
import { useLineStatus } from '@/hooks/useTransport';
import { formatHm, severityPl } from '@/lib/tfl/format';
import type { LineStatus, StatusLevel } from '@/lib/tfl/types';
import { StatusIcon } from '@/components/transport/LineStatus';

const RANK: Record<StatusLevel, number> = { closed: 4, severe: 3, minor: 2, unknown: 1, good: 0 };
const worst = (lines: LineStatus[]) => lines.reduce<LineStatus | null>((w, l) => (!w || RANK[l.level] > RANK[w.level] ? l : w), null);

interface Row {
  id: string;
  name: string;
  colour: string;
  level: StatusLevel;
  label: string;
  note?: string;
  to: string;
}

function buildRows(data: LineStatus[]): Row[] {
  const tube = data.filter((l) => l.mode === 'tube');
  const issues = tube.filter((l) => l.level !== 'good');
  const rows: Row[] = [];
  if (tube.length) {
    const w = worst(tube)!;
    rows.push({
      id: 'tube',
      name: 'Metro (Tube)',
      colour: '#DC241F',
      level: w.level,
      label: issues.length ? `${issues.length} z ${tube.length} linii z utrudnieniami` : 'Dobra obsługa na wszystkich liniach',
      note: issues.length ? issues.map((l) => l.name).join(', ') : undefined,
      to: '/transport/tube',
    });
    for (const l of issues.slice(0, 3))
      rows.push({ id: l.id, name: `↳ ${l.name}`, colour: l.colour, level: l.level, label: severityPl(l.statusDescription), to: isTubeLineId(l.id) ? `/transport/tube/${l.id}` : '/transport/tube' });
  }
  const group = (mode: string, name: string) => {
    const lines = data.filter((l) => l.mode === mode);
    if (!lines.length) return;
    const w = worst(lines)!;
    const bad = lines.filter((l) => l.level !== 'good');
    rows.push({
      id: mode,
      name,
      colour: modeColours[mode] ?? '#667085',
      level: w.level,
      label: lines.length > 1 && bad.length ? `${bad.length} z ${lines.length} linii z utrudnieniami` : severityPl(w.statusDescription),
      note: lines.length > 1 && bad.length ? bad.map((l) => `${l.name}: ${severityPl(l.statusDescription)}`).join(' · ') : undefined,
      to: `/transport?tryb=${mode}`,
    });
  };
  group('elizabeth-line', 'Elizabeth line');
  group('overground', 'Overground');
  group('dlr', 'DLR');
  return rows;
}

/** Homepage "Komunikacja i utrudnienia" – live TfL status for Tube, Elizabeth line, Overground and DLR. */
export function TransportStatus() {
  const status = useLineStatus(['tube', 'elizabeth-line', 'overground', 'dlr']);
  const rows = status.data ? buildRows(status.data) : [];

  return (
    <div className="transport">
      {!status.data && !status.error && (
        <ul className="transport__list" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="transport__line transport__line--skel" aria-hidden="true" />
          ))}
        </ul>
      )}
      {!status.data && status.error && <p className="transport__error">Nie udało się pobrać aktualnych danych TfL. Spróbujemy ponownie za minutę.</p>}
      {status.data && (
        <ul className="transport__list" aria-live="polite">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to={r.to} className={`transport__line is-${r.level}`}>
                <span className="transport__swatch" style={{ background: r.colour }} aria-hidden="true" />
                <span className="transport__name">
                  {r.name}
                  {r.note && <span className="transport__note">{r.note}</span>}
                </span>
                <span className="transport__state">
                  {r.label}
                  <StatusIcon level={r.level} size={18} />
                </span>
                <ChevronRight size={16} className="transport__chev" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="transport__meta">
        {status.meta ? <>Dane TfL na żywo · {formatHm(status.meta.fetchedAt)}</> : 'Dane TfL na żywo'}
        {status.meta?.stale && ' · z pamięci podręcznej'}
      </p>
      <div className="transport__links">
        <Link to="/transport" className="text-link">
          Zobacz wszystkie linie <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/transport/tube" className="text-link">
          Mapa i odjazdy na żywo →
        </Link>
      </div>
    </div>
  );
}
