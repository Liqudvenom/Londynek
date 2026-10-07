import { useEffect, useId, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { tubeLineColours, TUBE_LINE_IDS, type TubeLineId } from '@/data/tube-colors';
import { scheduleForDate } from '@/lib/tfl/adapters';
import { transportApi, TransportApiError } from '@/lib/tfl/api';
import { lineStationOrder } from '@/lib/tfl/network';
import type { ApiErrorKind, Timetable, TubeNetwork } from '@/lib/tfl/types';
import { Skeleton, TransportError } from './TransportChrome';

const londonToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/London' });
const londonNowHm = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

interface Props {
  network: TubeNetwork | null;
  initialLine?: string | null;
  initialFrom?: string | null;
  /** Bumps when another component asks to preset the form */
  presetKey?: number;
}

export function TubeTimetable({ network, initialLine, initialFrom, presetKey }: Props) {
  const uid = useId();
  const [line, setLine] = useState<TubeLineId>(() => (initialLine && (TUBE_LINE_IDS as readonly string[]).includes(initialLine) ? (initialLine as TubeLineId) : 'victoria'));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(londonToday);
  const [state, setState] = useState<{ loading: boolean; data: Timetable | null; error: ApiErrorKind | null }>({ loading: false, data: null, error: null });

  const stations = useMemo(() => {
    const l = network?.lines.find((x) => x.id === line);
    return l ? lineStationOrder(l).map((id) => network!.stations[id]!).filter(Boolean) : [];
  }, [network, line]);

  useEffect(() => {
    if (!presetKey) return;
    if (initialLine && (TUBE_LINE_IDS as readonly string[]).includes(initialLine)) setLine(initialLine as TubeLineId);
    if (initialFrom) setFrom(initialFrom);
    setState({ loading: false, data: null, error: null });
  }, [presetKey, initialLine, initialFrom]);

  useEffect(() => {
    if (!stations.length) return;
    const ids = stations.map((s) => s.id);
    setFrom((f) => (ids.includes(f) ? f : ids[0]!));
    setTo((t) => (ids.includes(t) ? t : ids[ids.length - 1]!));
  }, [stations]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || from === to) return setState({ loading: false, data: null, error: 'bad-request' });
    setState({ loading: true, data: null, error: null });
    try {
      const env = await transportApi.timetable(line, from, to);
      setState({ loading: false, data: env.data, error: null });
    } catch (err) {
      setState({ loading: false, data: null, error: err instanceof TransportApiError ? err.kind : 'unavailable' });
    }
  };

  const schedule = state.data ? scheduleForDate(state.data.schedules, new Date(`${date}T12:00:00`)) : undefined;
  const isToday = date === londonToday();
  const nowHm = londonNowHm();
  const nextIdx = schedule && isToday ? schedule.departures.findIndex((d) => d.time >= nowHm) : -1;

  return (
    <section className="ttable" aria-labelledby={`${uid}-h`}>
      <div className="ttable__head">
        <h2 id={`${uid}-h`} className="tsec-title">
          <CalendarClock size={20} aria-hidden="true" /> Rozkład jazdy
        </h2>
        <span className="tplanned">Planowy rozkład</span>
      </div>
      <p className="ttable__lead">Godziny z rozkładu TfL – to plan, nie prognoza. Aktualne przyjazdy znajdziesz na tablicy „NA ŻYWO” powyżej.</p>
      <form className="ttable__form" onSubmit={submit}>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-line`}>
            Linia
          </label>
          <select id={`${uid}-line`} className="select" value={line} onChange={(e) => setLine(e.target.value as TubeLineId)}>
            {TUBE_LINE_IDS.map((id) => (
              <option key={id} value={id}>
                {tubeLineColours[id].name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-from`}>
            Od
          </label>
          <select id={`${uid}-from`} className="select" value={from} onChange={(e) => setFrom(e.target.value)} disabled={!stations.length}>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-to`}>
            Do
          </label>
          <select id={`${uid}-to`} className="select" value={to} onChange={(e) => setTo(e.target.value)} disabled={!stations.length}>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${uid}-date`}>
            Data
          </label>
          <input id={`${uid}-date`} type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--primary" disabled={!stations.length || state.loading}>
          Pokaż rozkład
        </button>
      </form>

      {state.loading && <Skeleton lines={4} />}
      {state.error === 'bad-request' && <p className="ttable__msg">Wybierz dwie różne stacje tej samej linii.</p>}
      {state.error === 'no-data' && <p className="ttable__msg">TfL nie udostępnia rozkładu dla tej pary stacji (np. na odgałęzieniu w innym kierunku). Spróbuj zamienić stacje lub wybrać stację końcową.</p>}
      {state.error && state.error !== 'bad-request' && state.error !== 'no-data' && <TransportError kind={state.error} compact />}
      {state.data && schedule && (
        <div className="ttable__result">
          <p className="ttable__summary">
            <strong>
              {state.data.fromName} → {state.data.toName}
            </strong>
            {state.data.travelMinutes !== null && <> · planowy czas przejazdu ok. {state.data.travelMinutes} min</>}
            <> · rozkład: {schedule.name}</>
          </p>
          <ol className="ttable__times" aria-label={`Odjazdy z ${state.data.fromName}`}>
            {schedule.departures.map((d, i) => (
              <li key={d.time} className={i === nextIdx ? 'is-next' : i < nextIdx ? 'is-past' : ''}>
                <span className="ttable__dep">{d.time}</span>
                {d.arrival && <span className="ttable__arr">→ {d.arrival}</span>}
              </li>
            ))}
          </ol>
          <p className="ttable__src">Źródło: TfL Timetable API. W dni świąteczne i podczas prac TfL może zmienić rozkład.</p>
        </div>
      )}
    </section>
  );
}
