import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownUp, ArrowRight, Clock } from 'lucide-react';
import { useStations } from '@/hooks/useLocation';
import { stationResult } from '@/lib/location/geocode';
import { placeToParams, QUICK_DESTINATIONS, resultToPlace } from '@/lib/location/routeParams';
import type { JourneyPlace, LocationResult } from '@/lib/location/types';
import { LocationInput } from './LocationInput';
import './route-card.css';

interface End {
  text: string;
  picked: LocationResult | null;
}
const empty: End = { text: '', picked: null };

type TimeMode = 'now' | 'departing' | 'arriving';

export function RouteSearchCard({
  title = 'Jak chcesz dotrzeć?',
  className = '',
  initialFrom,
  initialTo,
}: {
  title?: string;
  className?: string;
  initialFrom?: string;
  initialTo?: string;
}) {
  const navigate = useNavigate();
  const stations = useStations();
  const [from, setFrom] = useState<End>(initialFrom ? { text: initialFrom, picked: null } : empty);
  const [to, setTo] = useState<End>(initialTo ? { text: initialTo, picked: null } : empty);
  useEffect(() => {
    if (initialFrom) setFrom((cur) => (cur.text === initialFrom ? cur : { text: initialFrom, picked: null }));
  }, [initialFrom]);
  useEffect(() => {
    if (initialTo) setTo((cur) => (cur.text === initialTo ? cur : { text: initialTo, picked: null }));
  }, [initialTo]);
  const [mode, setMode] = useState<TimeMode>('now');
  const [time, setTime] = useState(() => {
    const d = new Date(Date.now() + 15 * 60000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0')}`;
  });
  const [error, setError] = useState<string | null>(null);

  const quick = (p: JourneyPlace) => {
    const s = stations?.find((x) => x.id === p.stationId);
    const r: LocationResult = s ? { ...stationResult(s), label: p.name } : { id: `st:${p.stationId}`, kind: 'station', label: p.name, lat: 0, lng: 0, formattedAddress: p.name, postcode: null, district: null, stationId: p.stationId };
    setTo({ text: p.name, picked: r });
    setError(null);
  };

  const endParams = (key: 'from' | 'to', e: End): Record<string, string> => (e.picked ? placeToParams(key, resultToPlace(e.picked)) : e.text.trim() ? { [key]: e.text.trim() } : {});

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!to.text.trim()) {
      setError('Wpisz, dokąd chcesz dojechać.');
      return;
    }
    const q = new URLSearchParams({ ...endParams('from', from), ...endParams('to', to) });
    if (mode !== 'now') {
      q.set('time', time.replace(':', ''));
      q.set('timeIs', mode);
    }
    navigate(`/transport/tube?${q}`);
  };

  return (
    <form className={`rcard ${className}`} onSubmit={submit} aria-labelledby="rcard-title">
      <h2 id="rcard-title" className="rcard__title">
        {title}
      </h2>
      <div className="rcard__ends">
        <LocationInput
          label="Skąd"
          placeholder="Adres, postcode, stacja lub miejsce"
          value={from.text}
          onChange={(t) => setFrom({ text: t, picked: null })}
          onPick={(r) => setFrom({ text: r.label, picked: r })}
          picked={from.picked}
          marker={<span className="rcard__marker rcard__marker--from" aria-hidden="true" />}
          allowMyLocation
        />
        <button
          type="button"
          className="rcard__swap"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Zamień początek i cel"
        >
          <ArrowDownUp size={16} aria-hidden="true" />
        </button>
        <LocationInput
          label="Dokąd"
          placeholder="Np. Heathrow, SW7 2PG, Ognisko"
          value={to.text}
          onChange={(t) => {
            setTo({ text: t, picked: null });
            setError(null);
          }}
          onPick={(r) => setTo({ text: r.label, picked: r })}
          picked={to.picked}
          marker={<span className="rcard__marker rcard__marker--to" aria-hidden="true" />}
        />
      </div>
      <div className="rcard__row">
        <label className="rcard__time">
          <Clock size={15} aria-hidden="true" />
          <span className="visually-hidden">Kiedy</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as TimeMode)}>
            <option value="now">Wyjazd teraz</option>
            <option value="departing">Wyjazd o…</option>
            <option value="arriving">Przyjazd o…</option>
          </select>
        </label>
        {mode !== 'now' && (
          <label className="rcard__clock">
            <span className="visually-hidden">Godzina</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} step={300} />
          </label>
        )}
        <button type="submit" className="btn btn--primary rcard__submit">
          Znajdź trasę <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="rcard__error" role="alert">
          {error}
        </p>
      )}
      <div className="rcard__quick">
        <span>Szybkie wybory:</span>
        <ul>
          {QUICK_DESTINATIONS.map((p) => (
            <li key={p.name}>
              <button type="button" className="rcard__chip" onClick={() => quick(p)} aria-pressed={to.picked?.stationId === p.stationId}>
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
