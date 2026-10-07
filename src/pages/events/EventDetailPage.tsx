import { Link, useParams } from 'react-router-dom';
import { CalendarPlus, Clock, MapPin, Ticket } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { DateBlock, EventCard } from '@/components/cards/LocalCards';
import { LondonMap } from '@/components/london/LondonMap';
import { AdSlot } from '@/components/ads/AdSlot';
import { EVENTS, eventById } from '@/data/events';
import { formatRange } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PROTOTYPE_MESSAGE, useToast } from '@/context/ToastContext';
import type { EventItem } from '@/types';
import './events.css';
import './event-detail.css';

function downloadIcs(e: EventItem) {
  const day = e.start.replace(/-/g, '');
  const [h = '00', m = '00'] = e.time.split(':');
  const endDay = (e.end ?? e.start).replace(/-/g, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Londynek.net//Wydarzenia//PL',
    'BEGIN:VEVENT',
    `UID:${e.id}@londynek.net`,
    `DTSTART;TZID=Europe/London:${day}T${h}${m}00`,
    `DTEND;TZID=Europe/London:${endDay}T${String(Math.min(23, Number(h) + 2)).padStart(2, '0')}${m}00`,
    `SUMMARY:${e.title}`,
    `LOCATION:${e.venue}, ${e.borough}, London`,
    `DESCRIPTION:${e.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${e.id}.ics` });
  a.click();
  URL.revokeObjectURL(url);
}

export function EventDetailPage() {
  const { id = '' } = useParams();
  const event = eventById(id);
  const notify = useToast();
  useDocumentTitle(event?.title ?? 'Nie znaleziono wydarzenia');

  if (!event) {
    return (
      <div className="container section">
        <EmptyState as="h1" title="To wydarzenie nie istnieje lub już się odbyło">
          <Link to="/wydarzenia" className="btn btn--navy">
            Zobacz kalendarz wydarzeń
          </Link>
        </EmptyState>
      </div>
    );
  }

  const more = EVENTS.filter((e) => e.id !== event.id && (e.category === event.category || e.borough === event.borough)).slice(0, 3);

  return (
    <article className="event-detail">
      <header className="event-detail__hero">
        <div className="event-detail__bg" aria-hidden="true">
          <Img name={event.image} alt="" sizes="100vw" priority />
        </div>
        <div className="container event-detail__head">
          <Breadcrumbs items={[{ label: 'Wydarzenia', to: '/wydarzenia' }, { label: event.category }]} />
          <div className="event-detail__title-row">
            <DateBlock iso={event.start} />
            <div>
              <div className="cluster">
                <span className="badge badge--soft accent-events">{event.category}</span>
                {event.free && <span className="badge badge--ok">Bezpłatne</span>}
                {event.patronage && <span className="badge badge--outline">Patronat Londynek</span>}
              </div>
              <h1 className="event-detail__title">{event.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container event-detail__layout">
        <div className="event-detail__main">
          <dl className="event-detail__facts">
            <div>
              <dt>
                <Clock size={18} aria-hidden="true" /> Kiedy
              </dt>
              <dd>
                {formatRange(event.start, event.end)}, godz. {event.time}
              </dd>
            </div>
            <div>
              <dt>
                <MapPin size={18} aria-hidden="true" /> Gdzie
              </dt>
              <dd>
                {event.venue}, {event.borough}
              </dd>
            </div>
            <div>
              <dt>
                <Ticket size={18} aria-hidden="true" /> Bilety
              </dt>
              <dd>{event.priceLabel}</dd>
            </div>
          </dl>
          <section className="event-detail__desc" aria-labelledby="about">
            <h2 id="about">O wydarzeniu</h2>
            <p>{event.description}</p>
            <p>Szczegółowy program, informacje o dostępności dla osób z niepełnosprawnościami i zasady wejścia podaje organizator. Wydarzenie {event.polish ? 'prowadzone w języku polskim' : 'w języku angielskim'}.</p>
            <p className="demo-label">Opis przykładowy – dane demonstracyjne</p>
          </section>
          <section aria-labelledby="where">
            <h2 id="where" className="event-detail__h2">
              Dojazd
            </h2>
            <div className="event-detail__map">
              <LondonMap label={`Lokalizacja: ${event.venue}`} markers={[{ id: event.id, ...event.map, label: event.venue, tone: 'magenta' }]} activeMarker={event.id} showRegionLabels />
            </div>
          </section>
        </div>

        <aside className="event-detail__aside" aria-label="Bilety i zapis">
          <section className="ticket-card panel">
            <span className="ticket-card__price">{event.priceLabel}</span>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => notify(PROTOTYPE_MESSAGE)}>
              <Ticket size={18} aria-hidden="true" /> {event.free ? 'Zarezerwuj miejsce' : 'Kup bilet'}
            </button>
            <button type="button" className="btn btn--block" onClick={() => downloadIcs(event)}>
              <CalendarPlus size={18} aria-hidden="true" /> Dodaj do kalendarza (.ics)
            </button>
            <div className="ticket-card__save">
              <SaveButton id={event.id} label={event.title} /> Zapisz na później
            </div>
          </section>
          <AdSlot variant="sidebar" />
        </aside>
      </div>

      {more.length > 0 && (
        <section className="container section" aria-labelledby="more-events">
          <h2 id="more-events" className="rule-heading">
            Może Cię też zainteresować
          </h2>
          <div className="events-grid">
            {more.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
