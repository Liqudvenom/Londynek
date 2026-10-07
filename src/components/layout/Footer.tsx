import { Link } from 'react-router-dom';
import { FOOTER_COLUMNS } from '@/data/navigation';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons';
import { useToast } from '@/context/ToastContext';
import { Logo } from './Logo';
import { EnglishVersionButton } from './AppHeader';
import './footer.css';

const LINE_CLASSES = ['line-news', 'line-housing', 'line-help', 'line-navy'];

const SOCIAL = [
  { label: 'Facebook', href: 'https://www.facebook.com/', icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: InstagramIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/', icon: YoutubeIcon },
];

export function Footer() {
  const notify = useToast();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__lines" aria-hidden="true">
        <span className="line-housing" />
        <span className="line-jobs" />
        <span className="line-help" />
        <span className="line-news" />
        <span className="line-events" />
      </div>
      <div className="container footer__top">
        <div className="footer__brand">
          <Logo inverse />
          <p>Londyn to więcej niż miasto. Od 2002 roku łączymy Polaków w Wielkiej Brytanii – informacją, ogłoszeniami i praktyczną pomocą.</p>
          <Link to="/dodaj-ogloszenie" className="btn btn--primary">
            Dodaj ogłoszenie
          </Link>
        </div>
        {FOOTER_COLUMNS.map((col, i) => (
          <nav key={col.id} className={`footer__col ${LINE_CLASSES[i] ?? ''}`} aria-labelledby={`${col.id}-title`}>
            <h2 id={`${col.id}-title`} className="footer__title">
              {col.title}
            </h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© 2002–{year} Londynek.net · UK Polish Community Online</p>
          <ul className="footer__legal">
            <li>
              <Link to="/regulamin#prywatnosc">Polityka prywatności</Link>
            </li>
            <li>
              <button type="button" onClick={() => notify('Ustawienia cookies – panel zgód (CMP) zostanie podłączony w wersji produkcyjnej.')}>
                Ustawienia cookies
              </button>
            </li>
            <li>
              <EnglishVersionButton />
            </li>
          </ul>
          <ul className="footer__social">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={`${s.label} (otwiera nową kartę)`}>
                  <s.icon size={20} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
