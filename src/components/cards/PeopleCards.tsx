import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, Globe2, MapPin, Plane, Star } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { CONTRACT_LABEL, ENGLISH_LABEL, SCHEDULE_LABEL } from '@/data/jobs';
import type { Candidate, Job } from '@/types';
import './cards.css';

function CompanyLogo({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('');
  return (
    <span className="company-logo" style={{ '--logo': color } as React.CSSProperties} aria-hidden="true">
      {initials}
    </span>
  );
}

export function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  return (
    <article className={`job ${compact ? 'job--compact' : ''} ${job.promoted ? 'is-promoted' : ''}`}>
      <CompanyLogo name={job.company} color={job.companyColor} />
      <div className="job__main">
        <div className="job__top">
          <h3 className="job__title">
            <Link to={`/ogloszenie/${job.id}`} className="card-link">
              {job.title}
            </Link>
          </h3>
          {job.isNew && <span className="badge badge--red">Nowe</span>}
          {job.promoted && !compact && <span className="badge badge--promoted">Promowane</span>}
        </div>
        <p className="job__company">{job.company}</p>
        <p className="job__salary">{job.salaryLabel}</p>
        {!compact && (
          <ul className="job__tags">
            <li>
              <MapPin size={13} aria-hidden="true" /> {job.location}
            </li>
            <li>{CONTRACT_LABEL[job.contract]}</li>
            <li>{SCHEDULE_LABEL[job.schedule]}</li>
            <li>
              <Globe2 size={13} aria-hidden="true" /> {job.polishSpeaking ? 'Język polski w pracy' : ENGLISH_LABEL[job.english]}
            </li>
            {job.visaSponsor && (
              <li className="job__visa">
                <Plane size={13} aria-hidden="true" /> Sponsoring wizy
              </li>
            )}
          </ul>
        )}
        {compact && (
          <p className="job__mini">
            {job.location} · {SCHEDULE_LABEL[job.schedule]}
          </p>
        )}
      </div>
      <div className="job__aside">
        <SaveButton id={job.id} label={job.title} />
        <span className="job__date">
          <Clock size={13} aria-hidden="true" /> {job.postedAgo}
        </span>
      </div>
    </article>
  );
}

export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <article className="candidate">
      <div className="candidate__head">
        {candidate.avatar ? (
          <span className="candidate__avatar">
            <Img name={candidate.avatar} alt="" sizes="64px" />
          </span>
        ) : (
          <span className="candidate__avatar candidate__avatar--initials" aria-hidden="true">
            {candidate.name.charAt(0)}
          </span>
        )}
        <div>
          <h3 className="candidate__name">
            <Link to={`/ogloszenie/${candidate.id}`} className="card-link">
              {candidate.name}
            </Link>
            {candidate.verified && <BadgeCheck size={16} className="candidate__check" aria-label="Zweryfikowany profil" />}
          </h3>
          <p className="candidate__role">{candidate.profession}</p>
        </div>
        <span className="candidate__match" aria-label={`Dopasowanie ${candidate.match}%`}>
          <Star size={12} aria-hidden="true" /> {candidate.match}%
        </span>
      </div>
      <ul className="candidate__skills" aria-label="Umiejętności">
        {candidate.skills.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <dl className="candidate__facts">
        <div>
          <dt>Lokalizacja</dt>
          <dd>{candidate.location}</dd>
        </div>
        <div>
          <dt>Stawka</dt>
          <dd>{candidate.rate}</dd>
        </div>
        <div>
          <dt>Dostępność</dt>
          <dd>{candidate.availability}</dd>
        </div>
      </dl>
      <div className="candidate__save">
        <SaveButton id={candidate.id} label={candidate.name} />
      </div>
    </article>
  );
}
