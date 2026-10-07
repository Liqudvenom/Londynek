import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, ChevronRight, Home, LifeBuoy } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { JobCard } from '@/components/cards/PeopleCards';
import { EventCard } from '@/components/cards/LocalCards';
import { JOBS } from '@/data/jobs';
import { PROPERTIES } from '@/data/properties';
import { EVENTS } from '@/data/events';
import { GUIDE_TASKS, guideAreaById } from '@/data/guides';
import { formatGBP } from '@/lib/format';
import type { ReactNode } from 'react';

function Module({ title, icon, to, accent, children }: { title: string; icon: ReactNode; to: string; accent: string; children: ReactNode }) {
  return (
    <section className={`module panel accent-${accent}`} aria-label={title}>
      <div className="module__head">
        <h2 className="module__title">
          <span className="module__icon">{icon}</span>
          {title}
        </h2>
        <Link to={to} className="text-link">
          Więcej <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {children}
    </section>
  );
}

/** Four deliberately different compact modules: list / image+price / timeline / knowledge list. */
export function HomeModules() {
  const jobs = JOBS.slice(0, 4);
  const rooms = PROPERTIES.filter((p) => p.mode === 'rent').slice(0, 4);
  const events = [...EVENTS].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4);
  const guides = GUIDE_TASKS.slice(0, 5);

  return (
    <div className="container section home-modules">
      <Module title="Oferty pracy w UK" icon={<Briefcase size={18} />} to="/ogloszenia/praca" accent="jobs">
        <div className="module__list">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} compact />
          ))}
        </div>
      </Module>

      <Module title="Nieruchomości" icon={<Home size={18} />} to="/ogloszenia/nieruchomosci" accent="housing">
        <ul className="mini-props">
          {rooms.map((p) => (
            <li key={p.id} className="mini-prop hover-zoom">
              <span className="media ratio-4x3 mini-prop__media">
                <Img name={p.image} alt="" sizes="88px" />
              </span>
              <span className="mini-prop__body">
                <Link to={`/ogloszenie/${p.id}`} className="card-link mini-prop__title">
                  {p.title}
                </Link>
                <span className="mini-prop__loc">
                  {p.location}, {p.postcode}
                </span>
                <span className="price">{formatGBP(p.price)}/mies.</span>
              </span>
              <SaveButton id={p.id} label={p.title} />
            </li>
          ))}
        </ul>
      </Module>

      <Module title="Wydarzenia w Londynie" icon={<CalendarDays size={18} />} to="/wydarzenia" accent="events">
        <div className="module__timeline">
          {events.map((e) => (
            <EventCard key={e.id} event={e} layout="timeline" />
          ))}
        </div>
      </Module>

      <Module title="Poradnik dla Polaków w UK" icon={<LifeBuoy size={18} />} to="/poradnik" accent="help">
        <ul className="mini-guides">
          {guides.map((g) => (
            <li key={g.id}>
              <Link to={`/poradnik/${g.id}`} className="mini-guide">
                <span>
                  <strong>{g.question}</strong>
                  <span>{guideAreaById(g.area)?.title}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Module>
    </div>
  );
}
