import { Link } from 'react-router-dom';
import { HandHeart, Newspaper, ShieldCheck, Users } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { Img } from '@/components/ui/Img';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ImageName } from '@/data/images.generated';
import './corporate.css';

const VALUES = [
  { icon: ShieldCheck, title: 'Rzetelność', text: 'Sprawdzamy informacje i oddzielamy reklamę od treści redakcyjnych.' },
  { icon: HandHeart, title: 'Pomoc', text: 'Tłumaczymy brytyjskie przepisy prostym językiem i wskazujemy, gdzie szukać wsparcia.' },
  { icon: Users, title: 'Społeczność', text: 'Łączymy ludzi – przez ogłoszenia, wydarzenia i lokalne inicjatywy.' },
  { icon: Newspaper, title: 'Niezależność', text: 'Redakcja decyduje o tematach. Partnerzy nie mają wpływu na treść artykułów.' },
];

const TEAM: { role: string; avatar: ImageName }[] = [
  { role: 'Redaktor naczelny', avatar: 'person-3' },
  { role: 'Redakcja wiadomości', avatar: 'person-1' },
  { role: 'Ogłoszenia i moderacja', avatar: 'person-4' },
  { role: 'Dział reklamy', avatar: 'person-5' },
  { role: 'Produkt i technologia', avatar: 'person-2' },
];

const TIMELINE = [
  { year: '2002', text: 'Start serwisu dla Polaków w Londynie.' },
  { year: '20XX', text: 'Uruchomienie działu ogłoszeń drobnych.' },
  { year: '20XX', text: 'Kalendarz wydarzeń polonijnych i patronaty medialne.' },
  { year: '20XX', text: 'Poradnik – praktyczna pomoc w sprawach urzędowych.' },
  { year: '2026', text: 'Nowa odsłona: Londynek jako „system operacyjny” życia w UK.' },
];

export function AboutPage() {
  useDocumentTitle('O nas');
  return (
    <>
      <PageIntro title="O Londynku" lead="Od ponad dwóch dekad pomagamy Polakom odnaleźć się w Londynie i całej Wielkiej Brytanii." crumbs={[{ label: 'O nas' }]} />

      <section className="container corp-story">
        <div className="corp-story__text">
          <h2>Nasza historia</h2>
          <p>Londynek.net powstał z prostej potrzeby: żeby Polacy w Londynie mieli jedno miejsce, w którym znajdą wiadomości, pracę, pokój do wynajęcia i odpowiedź na pytanie „jak to się załatwia w UK?”.</p>
          <p>Z czasem z lokalnego serwisu staliśmy się codziennym punktem odniesienia dla polskiej społeczności – od nowo przybyłych po rodziny, które mieszkają tu od pokoleń.</p>
          <blockquote className="corp-mission">
            <span>Misja</span>
            Ułatwiać życie Polakom w Wielkiej Brytanii – informacją, kontaktem i praktyczną pomocą.
          </blockquote>
        </div>
        <figure className="corp-story__media media">
          <Img name="westminster-bridge" alt="Most Westminsterski i Big Ben" sizes="(max-width: 900px) 100vw, 600px" />
        </figure>
      </section>

      <section className="container section" aria-labelledby="values">
        <h2 id="values" className="corp-h2">
          Wartości
        </h2>
        <ul className="corp-values">
          {VALUES.map((v) => (
            <li key={v.title}>
              <v.icon size={26} aria-hidden="true" />
              <strong>{v.title}</strong>
              <p>{v.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container section corp-split" aria-labelledby="timeline">
        <div>
          <h2 id="timeline" className="corp-h2">
            Oś czasu
          </h2>
          <ol className="corp-timeline">
            {TIMELINE.map((t, i) => (
              <li key={`${t.year}-${i}`}>
                <span className="corp-timeline__year">{t.year}</span>
                <p>{t.text}</p>
              </li>
            ))}
          </ol>
          <p className="demo-label">Daty pośrednie do uzupełnienia</p>
        </div>
        <div>
          <h2 className="corp-h2">Zespół</h2>
          <ul className="corp-team">
            {TEAM.map((m) => (
              <li key={m.role}>
                <span className="corp-team__avatar">
                  <Img name={m.avatar} alt="" sizes="72px" />
                </span>
                <strong>[Imię i nazwisko]</strong>
                <span>{m.role}</span>
              </li>
            ))}
          </ul>
          <p className="demo-label">Zdjęcia i nazwiska zastępcze</p>
        </div>
      </section>

      <div className="container section">
        <section className="corp-cta">
          <h2>Chcesz z nami współpracować?</h2>
          <div className="cluster">
            <Link to="/kontakt" className="btn btn--navy">
              Skontaktuj się
            </Link>
            <Link to="/reklama" className="btn">
              Reklama
            </Link>
            <Link to="/dla-mediow" className="btn">
              Dla mediów
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
