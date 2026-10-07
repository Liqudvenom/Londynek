import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CalendarRange, LayoutGrid, Map as MapIcon, Megaphone, Plus, Sun } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { EmptyState, FilterChip } from '@/components/ui/primitives';
import { EventCard } from '@/components/cards/LocalCards';
import { LondonMap } from '@/components/london/LondonMap';
import { EVENTS, EVENT_CATEGORIES, DEMO_TODAY } from '@/data/events';
import { formatDayLong, plural } from '@/lib/format';
import { occursOn, occursWithin, weekendOf } from '@/lib/events';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { EventCalendar } from './EventCalendar';
import type { EventCategory, EventItem } from '@/types';
import './events.css';

type View = 'all' | 'today' | 'weekend' | 'calendar' | 'map';
const VIEWS: { id: View; label: string; icon: typeof Sun }[] = [
  { id: 'all', label: 'Wszystkie', icon: LayoutGrid },
  { id: 'today', label: 'Dziś', icon: Sun },
  { id: 'weekend', label: 'Weekend', icon: CalendarRange },
  { id: 'calendar', label: 'Kalendarz', icon: CalendarDays },
  { id: 'map', label: 'Mapa', icon: MapIcon },
];

const WEEKEND = weekendOf(DEMO_TODAY);
const byStart = (a: EventItem, b: EventItem) => a.start.localeCompare(b.start) || a.time.localeCompare(b.time);

function DayGroups({ days, events }: { days: string[]; events: EventItem[] }) {
  return (
    <div className="day-groups">
      {days.map((iso) => {
        const list = events.filter((e) => occursOn(e, iso));
        return (
          <section key={iso} className="day-group" aria-labelledby={`day-${iso}`}>
            <h3 id={`day-${iso}`} className="day-group__title">
              {formatDayLong(iso)}
              <span>
                {list.length} {plural(list.length, 'wydarzenie', 'wydarzenia', 'wydarzeń')}
              </span>
            </h3>
            {list.length === 0 ? (
              <p className="day-group__empty">Brak wydarzeń tego dnia.</p>
            ) : (
              <div className="day-group__list">
                {list.map((e) => (
                  <EventCard key={e.id} event={e} layout="row" />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function EventsPage() {
  useDocumentTitle('Wydarzenia polonijne w Londynie');
  const [view, setView] = useState<View>('all');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [patronage, setPatronage] = useState(false);
  const [day, setDay] = useState(DEMO_TODAY);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const filtered = useMemo(
    () => EVENTS.filter((e) => (!category || e.category === category) && (!freeOnly || e.free) && (!patronage || e.patronage) && (e.end ?? e.start) >= DEMO_TODAY).sort(byStart),
    [category, freeOnly, patronage],
  );
  const shown = view === 'today' ? filtered.filter((e) => occursOn(e, DEMO_TODAY)) : view === 'weekend' ? filtered.filter((e) => occursWithin(e, WEEKEND)) : filtered;
  const nextUp = filtered.filter((e) => e.start > DEMO_TODAY).slice(0, 3);

  return (
    <>
      <PageHero
        className="events-hero"
        title="Co się dzieje w polskim Londynie"
        lead="Koncerty, teatr, spotkania autorskie, wydarzenia dla dzieci i biznesu. Wybierz dzień, dzielnicę albo kategorię."
        image="festival"
        imageAlt="Tłum na festiwalu muzycznym"
        crumbs={[{ label: 'Wydarzenia' }]}
      >
        <div className="cluster">
          <Link to="/dodaj-ogloszenie" className="btn btn--primary">
            <Plus size={18} aria-hidden="true" /> Dodaj wydarzenie
          </Link>
          <Link to="/reklama/wydarzenia" className="btn btn--outline-inverse">
            <Megaphone size={18} aria-hidden="true" /> Promuj wydarzenie
          </Link>
        </div>
      </PageHero>

      <div className="container events-bar">
        <div className="events-views" role="tablist" aria-label="Widok wydarzeń">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" role="tab" id={`tab-${v.id}`} aria-controls="events-panel" aria-selected={view === v.id} tabIndex={view === v.id ? 0 : -1} onClick={() => setView(v.id)} onKeyDown={(e) => {
              const i = VIEWS.findIndex((x) => x.id === view);
              const next = e.key === 'ArrowRight' ? VIEWS[(i + 1) % VIEWS.length] : e.key === 'ArrowLeft' ? VIEWS[(i - 1 + VIEWS.length) % VIEWS.length] : undefined;
              if (next) {
                setView(next.id);
                document.getElementById(`tab-${next.id}`)?.focus();
              }
            }}>
              <v.icon size={18} aria-hidden="true" /> {v.label}
            </button>
          ))}
        </div>
        <div className="cluster events-filters" role="group" aria-label="Kategorie">
          <FilterChip label="Wszystkie" active={category === ''} onClick={() => setCategory('')} />
          {EVENT_CATEGORIES.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(category === c ? '' : c)} count={EVENTS.filter((e) => e.category === c).length} />
          ))}
          <label className="check">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} /> Bezpłatne
          </label>
          <label className="check">
            <input type="checkbox" checked={patronage} onChange={(e) => setPatronage(e.target.checked)} /> Patronat Londynka
          </label>
        </div>
      </div>

      <section id="events-panel" role="tabpanel" aria-labelledby={`tab-${view}`} className="container section--tight events-panel">
        {view === 'all' &&
          (shown.length ? (
            <div className="events-grid">
              {shown.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState title="Brak wydarzeń dla wybranych filtrów" />
          ))}

        {view === 'today' && (
          <>
            <DayGroups days={[DEMO_TODAY]} events={shown} />
            {nextUp.length > 0 && (
              <div className="events-next">
                <h3 className="rule-heading">Najbliższe dni</h3>
                <div className="events-grid">
                  {nextUp.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {view === 'weekend' && <DayGroups days={WEEKEND} events={shown} />}

        {view === 'calendar' && (
          <div className="events-calendar">
            <EventCalendar events={filtered} today={DEMO_TODAY} selected={day} onSelect={setDay} />
            <DayGroups days={[day]} events={filtered} />
          </div>
        )}

        {view === 'map' && (
          <div className="events-map">
            <LondonMap
              label="Mapa wydarzeń"
              showRegionLabels
              markers={filtered.map((e) => ({ id: e.id, ...e.map, label: e.title, tone: 'magenta' as const }))}
              activeMarker={activeMarker}
              onMarkerEnter={setActiveMarker}
              onMarkerSelect={setActiveMarker}
            />
            <ul className="events-map__list">
              {filtered.map((e) => (
                <li key={e.id} className={activeMarker === e.id ? 'is-active' : ''} onMouseEnter={() => setActiveMarker(e.id)} onMouseLeave={() => setActiveMarker(null)}>
                  <EventCard event={e} layout="timeline" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </>
  );
}
