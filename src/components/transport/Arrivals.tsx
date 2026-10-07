import { Link } from 'react-router-dom';
import { Accessibility, CalendarClock, ExternalLink, Route, Train, X } from 'lucide-react';
import { tubeLineColours, isTubeLineId } from '@/data/tube-colors';
import { serverNow } from '@/lib/tfl/api';
import { formatCountdown, formatHm, groupArrivals, severityPl, splitPlatform } from '@/lib/tfl/format';
import type { LineStatus, TrainPrediction, TubeStation } from '@/lib/tfl/types';
import { useNow, type LiveState } from '@/hooks/useTransport';
import { LineBadge, StatusIcon } from './LineStatus';
import { LiveDataIndicator, Skeleton, TransportError } from './TransportChrome';

const remainingSec = (p: TrainPrediction) => (Date.parse(p.expectedArrival) - serverNow()) / 1000;

function upcoming(preds: TrainPrediction[]) {
  return preds.map((p) => ({ p, left: remainingSec(p) })).filter((x) => x.left > -30);
}

function NoArrivals({ lines, statuses }: { lines: string[]; statuses: LineStatus[] | null }) {
  const closed = (statuses ?? []).filter((s) => lines.includes(s.id) && s.level === 'closed');
  return (
    <div className="tempty">
      <p className="tempty__title">Brak przewidywanych przyjazdów</p>
      {closed.length ? (
        <p>
          {closed.map((s) => `${s.name}: ${severityPl(s.statusDescription)}`).join(' · ')}. Sprawdź komunikat o utrudnieniach powyżej.
        </p>
      ) : (
        <p>TfL nie publikuje teraz prognoz dla tej stacji – metro mogło zakończyć kursowanie na dziś albo stacja jest chwilowo zamknięta.</p>
      )}
    </div>
  );
}

export function ArrivalRow({ p, left, status }: { p: TrainPrediction; left: number; status?: LineStatus }) {
  const { platform } = splitPlatform(p.platform);
  const level = status?.level;
  return (
    <tr>
      <td>
        <LineBadge id={p.lineId} name={p.lineName} small />
      </td>
      <td className="aboard__dest">{p.towards}</td>
      <td className="aboard__plat">{platform ?? '—'}</td>
      <td className="aboard__eta">
        <strong>{formatCountdown(left)}</strong>
        <span className="aboard__time">{formatHm(p.expectedArrival)}</span>
      </td>
      <td className="aboard__status">
        {level && level !== 'good' ? (
          <span className={`is-${level}`}>
            <StatusIcon level={level} size={13} /> {severityPl(status!.statusDescription)}
          </span>
        ) : (
          <span>Przewidywany przyjazd</span>
        )}
      </td>
    </tr>
  );
}

interface BoardProps {
  title?: string;
  station: TubeStation | null;
  arrivals: LiveState<TrainPrediction[]>;
  statuses: LineStatus[] | null;
  perGroup?: number;
  lineFilter?: string | null;
}

/** "NAJBLIŻSZE POCIĄGI" – grouped by line + direction, countdown from TfL predictions. */
export function StationArrivalBoard({ title = 'NAJBLIŻSZE POCIĄGI', station, arrivals, statuses, perGroup = 4, lineFilter }: BoardProps) {
  useNow(1000);
  const statusById = new Map((statuses ?? []).map((s) => [s.id, s]));
  const preds = (arrivals.data ?? []).filter((p) => isTubeLineId(p.lineId) && (!lineFilter || p.lineId === lineFilter));
  const groups = groupArrivals(preds);

  return (
    <section className="aboard" aria-label={`${title}${station ? ` – ${station.name}` : ''}`}>
      <header className="aboard__head">
        <h3 className="aboard__title">
          {title}
          {station && <span className="aboard__station">{station.name}</span>}
        </h3>
        <LiveDataIndicator meta={arrivals.meta} error={arrivals.error} loading={arrivals.loading} onRetry={arrivals.refresh} />
      </header>
      {!arrivals.data && arrivals.loading && <Skeleton lines={5} className="aboard__skel" />}
      {!arrivals.data && arrivals.error && <TransportError kind={arrivals.error.kind} onRetry={arrivals.refresh} />}
      {arrivals.data && !groups.length && <NoArrivals lines={station?.lines ?? []} statuses={statuses} />}
      {groups.map((g) => {
        const items = upcoming(g.items).slice(0, perGroup);
        if (!items.length) return null;
        const c = isTubeLineId(g.lineId) ? tubeLineColours[g.lineId] : null;
        return (
          <div key={g.key} className="aboard__group" style={{ '--line': c?.colour } as React.CSSProperties}>
            <p className="aboard__dir">
              <span className="aboard__dir-bar" aria-hidden="true" />
              {c?.name ?? g.lineId} · {g.label}
            </p>
            <table className="aboard__table">
              <thead>
                <tr>
                  <th scope="col">Linia</th>
                  <th scope="col">Kierunek</th>
                  <th scope="col">Peron</th>
                  <th scope="col">Przyjazd</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ p, left }) => (
                  <ArrivalRow key={p.id} p={p} left={left} status={statusById.get(p.lineId)} />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {arrivals.data && groups.length > 0 && <p className="aboard__note">Czasy to prognozy TfL („przewidywany przyjazd”), nie gwarantowane godziny odjazdu.</p>}
    </section>
  );
}

interface PanelProps {
  station: TubeStation;
  arrivals: LiveState<TrainPrediction[]>;
  statuses: LineStatus[] | null;
  onClose?: () => void;
  onTimetable?: (stationId: string) => void;
  onBoard?: () => void;
  onFocusLine?: (id: string) => void;
}

export function StationPanel({ station, arrivals, statuses, onClose, onTimetable, onBoard, onFocusLine }: PanelProps) {
  useNow(1000);
  const groups = groupArrivals((arrivals.data ?? []).filter((p) => isTubeLineId(p.lineId)));
  const planner = `https://tfl.gov.uk/plan-a-journey/?to=${encodeURIComponent(station.name)}`;
  return (
    <div className="spanel">
      <div className="spanel__head">
        <div>
          <p className="spanel__kicker">Stacja metra{station.zone ? ` · strefa ${station.zone}` : ''}</p>
          <h2 className="spanel__name">{station.name}</h2>
        </div>
        {onClose && (
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Zamknij panel stacji">
            <X size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="spanel__lines" aria-label="Linie na stacji">
        {station.lines.map((l) => (
          <button key={l} type="button" className="spanel__line" onClick={() => onFocusLine?.(l)} title="Pokaż linię na mapie">
            <LineBadge id={l} small />
          </button>
        ))}
        {station.interchange && <span className="spanel__tag">Przesiadka</span>}
      </div>
      <div className="spanel__actions">
        <button type="button" className="btn btn--sm tbtn" onClick={onBoard}>
          <Train size={15} aria-hidden="true" /> Odjazdy / przyjazdy
        </button>
        <button type="button" className="btn btn--sm tbtn" onClick={() => onTimetable?.(station.id)}>
          <CalendarClock size={15} aria-hidden="true" /> Rozkład
        </button>
        <a className="btn btn--sm tbtn" href={planner} target="_blank" rel="noreferrer">
          <Route size={15} aria-hidden="true" /> Zaplanuj trasę <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      <div className="spanel__arrivals" aria-live="polite">
        <p className="spanel__sub">
          Przewidywany przyjazd <span className="spanel__live">NA ŻYWO</span>
        </p>
        {!arrivals.data && arrivals.loading && <Skeleton lines={4} />}
        {!arrivals.data && arrivals.error && <TransportError kind={arrivals.error.kind} onRetry={arrivals.refresh} compact />}
        {arrivals.data && !groups.length && <NoArrivals lines={station.lines} statuses={statuses} />}
        {groups.map((g) => {
          const items = upcoming(g.items).slice(0, 3);
          if (!items.length) return null;
          return (
            <div key={g.key} className="spanel__group">
              <p className="spanel__dir">
                <span className="spanel__bar" style={{ background: isTubeLineId(g.lineId) ? tubeLineColours[g.lineId].colour : undefined }} aria-hidden="true" />
                {isTubeLineId(g.lineId) ? tubeLineColours[g.lineId].name : g.lineId} · {g.label}
              </p>
              <ul>
                {items.map(({ p, left }) => (
                  <li key={p.id}>
                    <span className="spanel__dest">{p.towards}</span>
                    <span className="spanel__eta">{formatCountdown(left)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {arrivals.error && arrivals.data && <p className="spanel__warn">Nie udało się odświeżyć – pokazujemy ostatnie dane.</p>}
      </div>
      <Link to={`/transport/station/${station.id}`} className="spanel__more">
        <Accessibility size={14} aria-hidden="true" /> Strona stacji: perony, udogodnienia, okolica →
      </Link>
    </div>
  );
}
