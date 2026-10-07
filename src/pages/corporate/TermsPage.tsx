import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageIntro } from '@/components/ui/PageHero';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './corporate.css';

const SECTIONS: { id: string; title: string; body: string[] }[] = [
  {
    id: 'postanowienia',
    title: '1. Postanowienia ogólne',
    body: [
      'Regulamin określa zasady korzystania z serwisu Londynek.net, w tym z działu ogłoszeń, komentarzy i kont użytkowników.',
      'Korzystając z serwisu, akceptujesz niniejszy regulamin. Jeśli się z nim nie zgadzasz, nie korzystaj z serwisu.',
    ],
  },
  {
    id: 'konto',
    title: '2. Konto użytkownika',
    body: [
      'Założenie konta jest bezpłatne. Odpowiadasz za poufność hasła i za działania wykonane z Twojego konta.',
      'Możesz w każdej chwili poprosić o usunięcie konta przez formularz kontaktowy (dział „Pomoc techniczna”).',
    ],
  },
  {
    id: 'ogloszenia',
    title: '3. Zasady publikacji ogłoszeń',
    body: [
      'Ogłoszenie musi być zgodne z prawem Wielkiej Brytanii i dotyczyć realnej oferty. Zabronione są treści wprowadzające w błąd, dyskryminujące lub naruszające prawa osób trzecich.',
      'Ogłoszenia o pracy muszą zawierać uczciwe informacje o stawce i warunkach. Nie publikujemy ofert wymagających opłat od kandydatów.',
      'Moderatorzy mogą usunąć ogłoszenie naruszające regulamin bez podania przyczyny.',
    ],
  },
  {
    id: 'platnosci',
    title: '4. Usługi płatne',
    body: ['Opcje wyróżnienia ogłoszeń i usługi reklamowe są płatne zgodnie z aktualnym cennikiem. Szczegóły ustalane są w indywidualnej ofercie.'],
  },
  {
    id: 'odpowiedzialnosc',
    title: '5. Odpowiedzialność',
    body: [
      'Londynek.net nie jest stroną transakcji zawieranych między użytkownikami. Zachęcamy do zachowania ostrożności – nie płać z góry za obejrzenie mieszkania i nie przekazuj dokumentów nieznajomym.',
      'Treści poradnika mają charakter informacyjny i nie stanowią porady prawnej ani finansowej.',
    ],
  },
  {
    id: 'prywatnosc',
    title: '6. Polityka prywatności',
    body: [
      'Dane osobowe przetwarzamy zgodnie z UK GDPR i Data Protection Act 2018, wyłącznie w celu świadczenia usług serwisu.',
      'Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia oraz wniesienia skargi do Information Commissioner’s Office (ICO).',
      'W tej wersji prototypowej żadne dane nie są wysyłane na serwer – zapisane ogłoszenia przechowywane są tylko w Twojej przeglądarce.',
    ],
  },
  {
    id: 'cookies',
    title: '7. Pliki cookies',
    body: ['Serwis może używać plików cookies niezbędnych do działania oraz – za Twoją zgodą – analitycznych i reklamowych. Ustawienia możesz zmienić w przeglądarce.'],
  },
  {
    id: 'zmiany',
    title: '8. Zmiany regulaminu',
    body: ['O istotnych zmianach regulaminu poinformujemy z wyprzedzeniem na stronie głównej serwisu.'],
  },
];

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '');
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const IDS = SECTIONS.map((s) => s.id);

export function TermsPage() {
  useDocumentTitle('Regulamin i prywatność');
  const active = useActiveSection(IDS);

  return (
    <>
      <PageIntro title="Regulamin i polityka prywatności" lead="Zasady korzystania z serwisu, publikacji ogłoszeń i ochrony danych." crumbs={[{ label: 'Regulamin' }]} />

      <div className="container section--tight corp-terms">
        <nav className="corp-toc" aria-label="Spis treści regulaminu">
          <h2>Spis treści</h2>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="corp-legal">
          <div className="notice">
            <p>
              <strong>Szablon dokumentu.</strong> Treść ma charakter poglądowy i musi zostać zweryfikowana przez prawnika przed publikacją. Ostatnia aktualizacja: [data].
            </p>
          </div>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
              <h2 id={`${s.id}-h`}>{s.title}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </section>
          ))}
          <p className="corp-legal__foot">
            Pytania dotyczące regulaminu? <Link to="/kontakt?dzial=techniczny">Napisz do nas</Link> lub sprawdź <Link to="/faq">FAQ</Link>.
          </p>
        </article>
      </div>
    </>
  );
}
