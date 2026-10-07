import { Link } from 'react-router-dom';
import { HeroSearch } from '@/components/search/HeroSearch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './misc.css';

const SHORTCUTS = [
  { label: 'Ogłoszenia', to: '/ogloszenia' },
  { label: 'Praca', to: '/ogloszenia/praca' },
  { label: 'Mieszkania', to: '/ogloszenia/nieruchomosci' },
  { label: 'Wiadomości', to: '/wiadomosci' },
  { label: 'Poradnik', to: '/poradnik' },
  { label: 'Wydarzenia', to: '/wydarzenia' },
];

export function NotFoundPage() {
  useDocumentTitle('Nie znaleziono strony');
  return (
    <section className="container not-found" aria-labelledby="nf-title">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1 id="nf-title">Ta strona zgubiła się gdzieś między Zone 1 a Zone 6</h1>
      <p className="not-found__lead">Adres mógł się zmienić albo ogłoszenie zostało usunięte. Spróbuj wyszukać lub wybierz jeden ze skrótów.</p>
      <HeroSearch showCategory={false} />
      <ul className="cluster not-found__links">
        {SHORTCUTS.map((s) => (
          <li key={s.to}>
            <Link to={s.to} className="chip">
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/" className="btn btn--navy">
        Wróć na stronę główną
      </Link>
    </section>
  );
}
