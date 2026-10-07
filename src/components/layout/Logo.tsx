import { Link } from 'react-router-dom';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className={`logo ${inverse ? 'logo--inverse' : ''}`} aria-label="Londynek.net – strona główna">
      <svg className="logo__roundel" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="15" fill="none" stroke="var(--brand-red)" strokeWidth="6" />
        <rect x="1" y="16" width="38" height="8" rx="1.5" fill={inverse ? '#fff' : 'var(--navy)'} />
      </svg>
      <span className="logo__text">
        <span className="logo__word">
          londynek<span className="logo__tld">.net</span>
        </span>
        <span className="logo__tag">UK Polish Community Online</span>
      </span>
    </Link>
  );
}
