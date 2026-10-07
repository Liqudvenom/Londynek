import { useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { tubeLineColours } from '@/data/tube-colors';
import { matchTransport } from '@/lib/tfl/match';
import type { TubeNetwork } from '@/lib/tfl/types';

interface Props {
  network: TubeNetwork | null;
  onStation: (id: string) => void;
  onLine: (id: string) => void;
  autoFocus?: boolean;
}

export function StationSearch({ network, onStation, onLine, autoFocus }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const result = useMemo(() => (network && q.trim().length >= 2 ? matchTransport(network, q) : { stations: [], lines: [] }), [network, q]);
  const options = [...result.stations.map((s) => ({ kind: 'station' as const, id: s.id })), ...result.lines.map((l) => ({ kind: 'line' as const, id: l.id }))];
  const show = open && q.trim().length >= 2;

  const choose = (o: (typeof options)[number]) => {
    if (o.kind === 'station') onStation(o.id);
    else onLine(o.id);
    setOpen(false);
    setQ('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && options[active]) {
      e.preventDefault();
      choose(options[active]!);
    } else if (e.key === 'Escape') setOpen(false);
  };

  let i = -1;
  return (
    <div className="tsearch">
      <label className="visually-hidden" htmlFor={`${listId}-input`}>
        Szukaj linii lub stacji
      </label>
      <div className="tsearch__box">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${listId}-input`}
          className="tsearch__input"
          placeholder="Szukaj linii lub stacji..."
          value={q}
          autoComplete="off"
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-activedescendant={show && options[active] ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          disabled={!network}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button type="button" className="tsearch__clear" onClick={() => {
              setQ('');
              inputRef.current?.focus();
            }} aria-label="Wyczyść">
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {show && (
        <div className="tsearch__pop" id={listId} role="listbox" aria-label="Wyniki">
          {!options.length && <p className="tsearch__empty">Brak stacji metra ani linii pasujących do „{q}”.</p>}
          {result.stations.length > 0 && <p className="tsearch__group">STACJE</p>}
          {result.stations.map((s) => {
            const idx = ++i;
            return (
              <div key={s.id} id={`${listId}-${idx}`} role="option" aria-selected={idx === active} className="tsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => choose({ kind: 'station', id: s.id })} onMouseEnter={() => setActive(idx)}>
                <span className="tsearch__name">{s.name}</span>
                <span className="tsearch__lines" aria-label={`Linie: ${s.lines.map((l) => tubeLineColours[l as keyof typeof tubeLineColours]?.name ?? l).join(', ')}`}>
                  {s.lines.map((l) => (
                    <span key={l} className="tsearch__dot" style={{ background: tubeLineColours[l as keyof typeof tubeLineColours]?.colour }} />
                  ))}
                </span>
                {s.zone && <span className="tsearch__zone">Strefa {s.zone}</span>}
              </div>
            );
          })}
          {result.lines.length > 0 && <p className="tsearch__group">LINIE</p>}
          {result.lines.map((l) => {
            const idx = ++i;
            return (
              <div key={l.id} id={`${listId}-${idx}`} role="option" aria-selected={idx === active} className="tsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => choose({ kind: 'line', id: l.id })} onMouseEnter={() => setActive(idx)}>
                <span className="tsearch__bar" style={{ background: l.colour }} aria-hidden="true" />
                <span className="tsearch__name">{l.name} line</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
