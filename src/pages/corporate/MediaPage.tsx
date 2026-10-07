import { Link } from 'react-router-dom';
import { Download, FileText, Mail } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { Logo } from '@/components/layout/Logo';
import { useToast, PROTOTYPE_MESSAGE } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './corporate.css';

const BRAND_COLOURS = [
  { name: 'Londynek Red', hex: '#E51B35', ink: '#fff' },
  { name: 'Navy', hex: '#102A4C', ink: '#fff' },
  { name: 'Ink', hex: '#111827', ink: '#fff' },
  { name: 'Paper', hex: '#F8F7F2', ink: '#111827' },
];

const RELEASES = [
  { date: '2026-10-01', title: 'Londynek prezentuje nową odsłonę serwisu' },
  { date: '2026-06-12', title: 'Patronat medialny nad Polskim Festiwalem w Londynie' },
  { date: '2026-03-04', title: 'Nowy poradnik: sprawy urzędowe krok po kroku' },
];

const BOILERPLATE =
  'Londynek.net to serwis informacyjno-ogłoszeniowy dla Polaków w Londynie i Wielkiej Brytanii. Łączy wiadomości, ogłoszenia, poradnik i kalendarz wydarzeń polonijnych.';

export function MediaPage() {
  useDocumentTitle('Dla mediów');
  const toast = useToast();

  const copyBoilerplate = async () => {
    try {
      await navigator.clipboard.writeText(BOILERPLATE);
      toast('Skopiowano notę o firmie');
    } catch {
      toast('Nie udało się skopiować – zaznacz tekst ręcznie');
    }
  };

  return (
    <>
      <PageIntro title="Dla mediów" lead="Materiały prasowe, logotypy i kontakt dla dziennikarzy." crumbs={[{ label: 'Dla mediów' }]} />

      <div className="container section--tight corp-media">
        <section className="panel" aria-labelledby="about-short">
          <h2 id="about-short">Nota o firmie</h2>
          <p className="corp-boilerplate">{BOILERPLATE}</p>
          <button type="button" className="btn btn--sm" onClick={copyBoilerplate}>
            Kopiuj tekst
          </button>
        </section>

        <section className="panel" aria-labelledby="logos">
          <h2 id="logos">Logotypy</h2>
          <div className="corp-logos">
            <div className="corp-logos__tile">
              <Logo />
            </div>
            <div className="corp-logos__tile corp-logos__tile--dark">
              <Logo inverse />
            </div>
          </div>
          <a href="/favicon.svg" download="londynek-sygnet.svg" className="btn btn--sm">
            <Download size={16} aria-hidden="true" /> Pobierz sygnet (SVG)
          </a>
        </section>

        <section className="panel" aria-labelledby="colours">
          <h2 id="colours">Kolory marki</h2>
          <ul className="corp-swatches">
            {BRAND_COLOURS.map((c) => (
              <li key={c.hex} style={{ background: c.hex, color: c.ink }}>
                <strong>{c.name}</strong>
                <span>{c.hex}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel" aria-labelledby="kit">
          <h2 id="kit">Media kit</h2>
          <p>Zasięgi, profil odbiorców i formaty reklamowe przygotowujemy indywidualnie – z aktualnymi danymi analitycznymi.</p>
          <div className="cluster">
            <button type="button" className="btn btn--navy" onClick={() => toast(PROTOTYPE_MESSAGE)}>
              <FileText size={16} aria-hidden="true" /> Media kit (PDF)
            </button>
            <Link to="/reklama#kontakt" className="btn">
              Poproś o ofertę
            </Link>
          </div>
        </section>

        <section className="panel corp-media__wide" aria-labelledby="releases">
          <h2 id="releases">Komunikaty prasowe</h2>
          <ul className="corp-releases">
            {RELEASES.map((r) => (
              <li key={r.title}>
                <time dateTime={r.date}>{new Date(r.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                <span>{r.title}</span>
              </li>
            ))}
          </ul>
          <p className="demo-label">Komunikaty przykładowe</p>
        </section>

        <section className="panel corp-media__contact" aria-labelledby="press">
          <h2 id="press">Kontakt prasowy</h2>
          <p>
            <strong>[Imię i nazwisko]</strong>, rzecznik prasowy
          </p>
          <p>
            <Mail size={16} aria-hidden="true" /> [e-mail prasowy]
          </p>
          <Link to="/kontakt?dzial=media" className="btn btn--primary">
            Napisz do nas
          </Link>
        </section>
      </div>
    </>
  );
}
