import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, HeartHandshake, MapPin, Plus, ShieldCheck, Users } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { FilterChip, SectionHeader } from '@/components/ui/primitives';
import { EventCard } from '@/components/cards/LocalCards';
import { classifiedsIn } from '@/data/classifieds';
import { EVENTS } from '@/data/events';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PROTOTYPE_MESSAGE, useToast } from '@/context/ToastContext';
import type { Listing } from '@/types';
import './social.css';

const GROUPS = classifiedsIn('towarzyskie');
const INTERESTS = Array.from(new Set(GROUPS.map((g) => g.subcategory)));

const RULES = [
  'Spotykamy się w miejscach publicznych i mówimy bliskim, dokąd idziemy.',
  'Nie publikujemy ogłoszeń matrymonialnych ani treści dla dorosłych.',
  'Szanujemy innych – bez mowy nienawiści, spamu i nachalnej sprzedaży.',
  'Nie podajemy w ogłoszeniu adresu domowego ani danych finansowych.',
];

function GroupCard({ group }: { group: Listing }) {
  const notify = useToast();
  return (
    <article className="group-card hover-zoom">
      <div className="media ratio-16x9">{group.image && <Img name={group.image} alt="" sizes="(max-width: 640px) 100vw, 400px" />}</div>
      <div className="group-card__body">
        <span className="badge badge--soft accent-events">{group.subcategory}</span>
        <h3 className="group-card__title">
          <Link to={`/ogloszenie/${group.id}`} className="card-link">
            {group.title}
          </Link>
        </h3>
        <p className="group-card__desc">{group.description}</p>
        <ul className="group-card__meta">
          <li>
            <MapPin size={14} aria-hidden="true" /> {group.location}
          </li>
          {group.attributes.map((a) => (
            <li key={a}>
              <CalendarClock size={14} aria-hidden="true" /> {a}
            </li>
          ))}
        </ul>
        <div className="group-card__foot above-link">
          <button type="button" className="btn btn--sm group-card__join" onClick={() => notify(PROTOTYPE_MESSAGE)}>
            <Users size={16} aria-hidden="true" /> Chcę dołączyć
          </button>
          <SaveButton id={group.id} label={group.title} />
        </div>
      </div>
    </article>
  );
}

export function SocialPage() {
  useDocumentTitle('Towarzyskie – społeczność');
  const [interest, setInterest] = useState('');
  const groups = GROUPS.filter((g) => !interest || g.subcategory === interest);
  const communityEvents = EVENTS.filter((e) => e.category === 'Społeczność' || e.category === 'Sport').slice(0, 3);

  return (
    <>
      <PageHero
        className="social-hero"
        title="Poznaj ludzi, znajdź swoją grupę"
        lead="Wymiana językowa, drużyny sportowe, grupy dla rodziców, wolontariat i wspólne wyjścia. Bezpiecznie i w duchu polskiej społeczności."
        image="friends-sunset"
        imageAlt="Grupa przyjaciół na wzgórzu o zachodzie słońca"
        crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Towarzyskie' }]}
      >
        <div className="cluster">
          <Link to="/dodaj-ogloszenie" className="btn btn--primary btn--lg">
            <Plus size={18} aria-hidden="true" /> Załóż grupę lub spotkanie
          </Link>
          <a href="#zasady" className="btn btn--outline-inverse btn--lg">
            <ShieldCheck size={18} aria-hidden="true" /> Zasady społeczności
          </a>
        </div>
      </PageHero>

      <section className="container section--tight" aria-labelledby="groups-title">
        <SectionHeader id="groups-title" title="Grupy i spotkania" accent="events" description="Ogłoszenia dodane przez członków społeczności Londynka.">
          <div className="cluster" role="group" aria-label="Zainteresowania">
            <FilterChip label="Wszystkie" active={interest === ''} onClick={() => setInterest('')} />
            {INTERESTS.map((i) => (
              <FilterChip key={i} label={i} active={interest === i} onClick={() => setInterest(interest === i ? '' : i)} />
            ))}
          </div>
        </SectionHeader>
        <div className="group-grid">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      </section>

      <section className="container section social-split">
        <div id="zasady" className="social-rules" aria-labelledby="rules-title">
          <HeartHandshake size={32} aria-hidden="true" />
          <h2 id="rules-title">Zasady społeczności</h2>
          <p>Towarzyskie to miejsce na przyjaźnie, hobby i wzajemną pomoc – nie serwis randkowy.</p>
          <ol>
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <Link to="/regulamin" className="text-link">
            Pełny regulamin
          </Link>
        </div>
        <div aria-labelledby="community-events">
          <SectionHeader id="community-events" title="Nadchodzące spotkania" accent="events" action={{ label: 'Kalendarz wydarzeń', to: '/wydarzenia' }} as="h2" />
          <div className="social-events">
            {communityEvents.map((e) => (
              <EventCard key={e.id} event={e} layout="timeline" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
