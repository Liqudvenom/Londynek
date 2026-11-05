import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, Clock, Home, MapPin, Newspaper } from 'lucide-react';
import { GeoStrip } from '@/components/location/GeoStrip';
import { MiniMap } from '@/components/location/MiniMap';
import { Img } from '@/components/ui/Img';
import { MAP_KIND_COLOUR } from '@/lib/location/mapItems';
import { Icon } from '@/components/ui/Icon';
import { SaveButton } from '@/components/ui/SaveButton';
import { dateBlock, formatGBP, formatRange } from '@/lib/format';
import type { District, EventItem, GuideArea, GuideTask } from '@/types';
import './cards.css';

export function DateBlock({ iso }: { iso: string }) {
  const d = dateBlock(iso);
  return (
    <span className="date-block" aria-hidden="true">
      <span className="date-block__day">{d.day}</span>
      <span className="date-block__month">{d.month}</span>
    </span>
  );
}

type EventLayout = 'card' | 'row' | 'timeline';

export function EventCard({ event, layout = 'card' }: { event: EventItem; layout?: EventLayout }) {
  return (
    <article className={`event event--${layout} hover-zoom`}>
      {layout !== 'timeline' && (
        <div className="media event__media">
          <Img name={event.image} alt="" sizes={layout === 'row' ? '200px' : '(max-width: 640px) 100vw, 360px'} />
          <div className="event__date">
            <DateBlock iso={event.start} />
          </div>
          <div className="property__save">
            <SaveButton id={event.id} label={event.title} variant="floating" />
          </div>
        </div>
      )}
      {layout === 'timeline' && <DateBlock iso={event.start} />}
      <div className="event__body">
        <div className="cluster">
          <span className="badge badge--soft accent-events">{event.category}</span>
          {event.free && <span className="badge badge--ok">Bezpłatne</span>}
          {event.patronage && <span className="badge badge--outline">Patronat Londynek</span>}
        </div>
        <h3 className="event__title">
          <Link to={`/wydarzenia/${event.id}`} className="card-link">
            {event.title}
          </Link>
        </h3>
        <div className="meta">
          <span>
            <Clock size={14} aria-hidden="true" /> {formatRange(event.start, event.end)}, {event.time}
          </span>
          <span>
            <MapPin size={14} aria-hidden="true" /> {event.venue}, {event.borough}
          </span>
        </div>
        {layout !== 'timeline' && event.geo && (
          <div className={`card-geo ${layout === 'row' ? '' : 'card-geo--stack'}`}>
            <GeoStrip geo={event.geo} name={event.venue} listingId={event.id} variant="event" compact={layout === 'card'} />
            <MiniMap geo={event.geo} listingId={event.id} label={event.venue} colour={MAP_KIND_COLOUR.events} />

          </div>
        )}
        {layout === 'card' && (
          <div className="event__foot">
            <span className="event__price">{event.priceLabel}</span>
            <span className="text-link" aria-hidden="true">
              Szczegóły <ArrowRight size={16} />
            </span>
          </div>
        )}
      </div>
      {layout === 'timeline' && (
        <div className="above-link">
          <SaveButton id={event.id} label={event.title} />
        </div>
      )}
    </article>
  );
}

interface DistrictCardProps {
  district: District;
  active?: boolean;
  onActivate?: (id: string) => void;
  variant?: 'tile' | 'stats';
  to?: string;
}

/** Borough card. `tile` = photo tile for browsing; `stats` = local counters for the homepage. */
export function DistrictCard({ district, active = false, onActivate, variant = 'tile', to }: DistrictCardProps) {
  const href = to ?? `/ogloszenia/nieruchomosci?dzielnica=${district.id}`;
  if (variant === 'stats') {
    return (
      <article className={`district-stats ${active ? 'is-active' : ''}`} onMouseEnter={() => onActivate?.(district.id)}>
        <div className="district-stats__head">
          <h3>
            <Link to={href} className="card-link" onFocus={() => onActivate?.(district.id)}>
              {district.name}
            </Link>
          </h3>
          <span className="postcode">{district.postcode}</span>
        </div>
        <ul className="district-stats__list">
          <li>
            <Briefcase size={15} aria-hidden="true" /> <strong>{district.counts.jobs}</strong> ofert pracy
          </li>
          <li>
            <Home size={15} aria-hidden="true" /> <strong>{district.counts.rooms}</strong> pokoi
          </li>
          <li>
            <CalendarDays size={15} aria-hidden="true" /> <strong>{district.counts.events}</strong> wydarzeń
          </li>
          <li>
            <Newspaper size={15} aria-hidden="true" /> <strong>{district.counts.news}</strong> lokalnych newsów
          </li>
        </ul>
      </article>
    );
  }
  return (
    <article className={`district-tile hover-zoom ${active ? 'is-active' : ''}`} onMouseEnter={() => onActivate?.(district.id)} onMouseLeave={() => onActivate?.('')}>
      <div className="media ratio-3x4">
        <Img name={district.image} alt="" sizes="160px" />
      </div>
      <h3 className="district-tile__name">
        <Link to={href} className="card-link" onFocus={() => onActivate?.(district.id)} onBlur={() => onActivate?.('')}>
          {district.name}
        </Link>
      </h3>
      <p className="district-tile__price">od {formatGBP(district.avgRoom)}</p>
    </article>
  );
}

export function GuideAreaCard({ area, to }: { area: GuideArea; to: string }) {
  return (
    <Link to={to} className={`guide-area accent-${area.accent}`}>
      <span className="guide-area__icon">
        <Icon name={area.icon} size={22} />
      </span>
      <span className="guide-area__text">
        <strong>{area.title}</strong>
        <span>{area.description}</span>
      </span>
      <span className="guide-area__count">{area.count} porad</span>
    </Link>
  );
}

export function GuideCard({ task, areaTitle }: { task: GuideTask; areaTitle?: string }) {
  return (
    <article className="guide-task">
      {areaTitle && <span className="kicker accent-help">{areaTitle}</span>}
      <h3 className="guide-task__q">
        <Link to={`/poradnik/${task.id}`} className="card-link">
          {task.question}
        </Link>
      </h3>
      <p className="guide-task__a">{task.answer}</p>
      <ol className="guide-task__steps" aria-label="Kroki">
        {task.steps.slice(0, 3).map((s, i) => (
          <li key={s}>
            <span aria-hidden="true">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="guide-task__foot">
        <span className="meta">
          <span>{task.steps.length} kroków</span>
          <span>{task.readMin} min</span>
        </span>
        <span className="text-link" aria-hidden="true">
          Przewodnik krok po kroku <ArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}
