import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, HelpCircle, XCircle } from 'lucide-react';
import { tubeLineColours, isTubeLineId, TUBE_LINE_IDS } from '@/data/tube-colors';
import { LEVEL_LABEL, formatHm, severityPl } from '@/lib/tfl/format';
import type { LineStatus, StatusLevel } from '@/lib/tfl/types';

export const LEVEL_ICON: Record<StatusLevel, typeof CheckCircle2> = {
  good: CheckCircle2,
  minor: AlertTriangle,
  severe: AlertCircle,
  closed: XCircle,
  unknown: HelpCircle,
};

export function LineBadge({ id, name, small }: { id: string; name?: string; small?: boolean }) {
  const c = isTubeLineId(id) ? tubeLineColours[id] : null;
  return (
    <span className={`lbadge${small ? ' lbadge--sm' : ''}`} style={{ background: c?.colour ?? '#667085', color: c?.ink ?? '#fff' }}>
      {name ?? c?.name ?? id}
    </span>
  );
}

export function StatusIcon({ level, size = 16 }: { level: StatusLevel; size?: number }) {
  const I = LEVEL_ICON[level];
  return <I size={size} className={`sicon is-${level}`} aria-hidden="true" />;
}

/** Pills for every Tube line; clicking isolates the line on the map. Status is shown with text + icon, not colour alone. */
export function LineStatusBar({ statuses, focusLineId, onFocusLine }: { statuses: LineStatus[] | null; focusLineId: string | null; onFocusLine: (id: string | null) => void }) {
  const byId = new Map((statuses ?? []).map((s) => [s.id, s]));
  return (
    <div className="lstatus" role="group" aria-label="Status linii metra – kliknij, aby pokazać linię na mapie">
      {TUBE_LINE_IDS.map((id) => {
        const c = tubeLineColours[id];
        const st = byId.get(id);
        const level = st?.level ?? 'unknown';
        const active = focusLineId === id;
        return (
          <button
            key={id}
            type="button"
            className={`lpill is-${level}${active ? ' is-active' : ''}`}
            style={{ '--line': c.colour, '--line-ink': c.ink } as React.CSSProperties}
            aria-pressed={active}
            onClick={() => onFocusLine(active ? null : id)}
            title={st ? `${c.name}: ${severityPl(st.statusDescription)}` : c.name}
          >
            <span className="lpill__swatch" aria-hidden="true" />
            <span className="lpill__name">{c.name}</span>
            {statuses ? <StatusIcon level={level} size={14} /> : <span className="lpill__wait" aria-hidden="true" />}
            <span className="visually-hidden">{st ? severityPl(st.statusDescription) : 'ładowanie statusu'}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Top-right overlay: "Londyn Tube · 11 linii · counts per status · Updated". */
export function StatusOverlay({ statuses, fetchedAt }: { statuses: LineStatus[] | null; fetchedAt: string | null }) {
  const tube = (statuses ?? []).filter((s) => isTubeLineId(s.id));
  const counts = { good: 0, minor: 0, severe: 0, closed: 0, unknown: 0 } as Record<StatusLevel, number>;
  for (const s of tube) counts[s.level]++;
  return (
    <div className="soverlay" aria-label="Podsumowanie statusu metra">
      <p className="soverlay__title">Londyn Tube</p>
      <p className="soverlay__count">{TUBE_LINE_IDS.length} linii</p>
      {statuses ? (
        <ul>
          {(['good', 'minor', 'severe', 'closed'] as const).map(
            (l) =>
              (counts[l] > 0 || l === 'good') && (
                <li key={l}>
                  <StatusIcon level={l} size={13} /> {counts[l]} · {LEVEL_LABEL[l]}
                </li>
              ),
          )}
        </ul>
      ) : (
        <p className="soverlay__muted">Ładowanie statusu…</p>
      )}
      {fetchedAt && <p className="soverlay__muted">Updated {formatHm(fetchedAt)}</p>}
    </div>
  );
}

/** "⚠ Central line · Minor delays · Reason: [verbatim TfL text]" with a details toggle. */
export function DisruptionStrip({ statuses, onFocusLine, linkLines = true }: { statuses: LineStatus[] | null; onFocusLine?: (id: string) => void; linkLines?: boolean }) {
  const disrupted = (statuses ?? []).filter((s) => s.level !== 'good' && s.level !== 'unknown');
  const [open, setOpen] = useState<string | null>(null);
  if (!statuses) return null;
  if (!disrupted.length)
    return (
      <p className="dstrip dstrip--ok">
        <CheckCircle2 size={16} aria-hidden="true" /> Wszystkie linie metra kursują bez zgłoszonych utrudnień (dane TfL).
      </p>
    );
  return (
    <ul className="dstrip" aria-label="Utrudnienia">
      {disrupted.map((s) => {
        const d = s.disruptions[0];
        const isOpen = open === s.id;
        return (
          <li key={s.id} className={`dstrip__item is-${s.level}`}>
            <div className="dstrip__row">
              <StatusIcon level={s.level} />
              <span className="dstrip__line">
                <span className="dstrip__swatch" style={{ background: s.colour }} aria-hidden="true" />
                {linkLines && isTubeLineId(s.id) ? <Link to={`/transport/tube/${s.id}`}>{s.name} line</Link> : `${s.name}`}
              </span>
              <span className="dstrip__sev">· {severityPl(s.statusDescription)}</span>
              {d?.description && <span className="dstrip__reason">· Powód: {d.description}</span>}
              <span className="dstrip__actions">
                {onFocusLine && isTubeLineId(s.id) && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => onFocusLine(s.id)}>
                    Pokaż na mapie
                  </button>
                )}
                {d && (
                  <button type="button" className="btn btn--ghost btn--sm" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                    Szczegóły <ChevronDown size={14} aria-hidden="true" className={isOpen ? 'flip-y' : ''} />
                  </button>
                )}
              </span>
            </div>
            {isOpen && (
              <div className="dstrip__details">
                {s.disruptions.map((x, i) => (
                  <div key={i}>
                    <p>
                      <strong>{x.severityDescription}</strong> {x.category && <span className="dstrip__cat">({x.category})</span>}
                    </p>
                    <p lang="en">{x.description}</p>
                    {x.reason && x.reason !== x.description && <p lang="en">{x.reason}</p>}
                  </div>
                ))}
                <p className="dstrip__src">Treść komunikatu: TfL (oryginał w języku angielskim).</p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
