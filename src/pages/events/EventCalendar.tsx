import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES, parseDay } from '@/lib/format';
import { occursOn, toIso } from '@/lib/events';
import type { EventItem } from '@/types';

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

const isoOf = (y: number, m: number, d: number) => toIso(new Date(y, m, d));

interface EventCalendarProps {
  events: EventItem[];
  today: string;
  selected: string;
  onSelect: (iso: string) => void;
}

/** Month grid with a roving focus (arrow keys move by day / week). */
export function EventCalendar({ events, today, selected, onSelect }: EventCalendarProps) {
  const start = parseDay(selected);
  const [view, setView] = useState({ y: start.getFullYear(), m: start.getMonth() });

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => isoOf(view.y, view.m, i + 1))];
  }, [view]);

  const focusable = cells.includes(selected) ? selected : isoOf(view.y, view.m, 1);

  const shiftMonth = (delta: number) => setView((v) => {
    const d = new Date(v.y, v.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, iso: string) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const d = parseDay(iso);
    d.setDate(d.getDate() + step);
    const next = isoOf(d.getFullYear(), d.getMonth(), d.getDate());
    if (d.getMonth() !== view.m) setView({ y: d.getFullYear(), m: d.getMonth() });
    onSelect(next);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-day="${next}"]`)?.focus());
  };

  return (
    <div className="ecal">
      <div className="ecal__head">
        <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Poprzedni miesiąc">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h3 className="ecal__month" aria-live="polite">
          {MONTH_NAMES[view.m]} {view.y}
        </h3>
        <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Następny miesiąc">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="ecal__grid" role="group" aria-label={`Kalendarz wydarzeń – ${MONTH_NAMES[view.m]} ${view.y}`}>
        {WEEKDAYS.map((w) => (
          <span key={w} className="ecal__weekday" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`empty-${i}`} aria-hidden="true" />;
          const dayEvents = events.filter((e) => occursOn(e, iso));
          const day = Number(iso.slice(8));
          return (
            <button
              key={iso}
              type="button"
              data-day={iso}
              className={`ecal__day ${iso === today ? 'is-today' : ''} ${dayEvents.length ? 'has-events' : ''}`}
              aria-pressed={iso === selected}
              aria-label={`${day} ${MONTH_NAMES[view.m]}${dayEvents.length ? `, ${dayEvents.length} wydarzeń` : ', brak wydarzeń'}`}
              tabIndex={iso === focusable ? 0 : -1}
              onClick={() => onSelect(iso)}
              onKeyDown={(e) => onKey(e, iso)}
            >
              <span className="ecal__num">{day}</span>
              {dayEvents.length > 0 && (
                <span className="ecal__dots" aria-hidden="true">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span key={e.id} />
                  ))}
                </span>
              )}
              {dayEvents[0] && <span className="ecal__first">{dayEvents[0].title}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
