import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Headphones, Mail, Megaphone, MapPin, Newspaper, Presentation, ListChecks } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { FormField, PrototypeForm } from '@/components/forms/PrototypeForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './corporate.css';

interface Department {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  response: string;
  link?: { label: string; to: string };
}

const DEPARTMENTS: Department[] = [
  { id: 'redakcja', label: 'Redakcja', icon: Newspaper, description: 'Tematy do artykułów, sprostowania, informacje dla dziennikarzy.', response: 'Odpowiadamy w dni robocze' },
  { id: 'ogloszenia', label: 'Ogłoszenia', icon: ListChecks, description: 'Problemy z ogłoszeniem, moderacja, zgłoszenia nadużyć.', response: 'Zwykle w ciągu 24 godzin', link: { label: 'Najczęstsze pytania', to: '/faq' } },
  { id: 'reklama', label: 'Reklama', icon: Megaphone, description: 'Kampanie, artykuły sponsorowane, patronaty i cennik.', response: 'Oferta w ciągu 1–2 dni roboczych', link: { label: 'Oferta reklamowa', to: '/reklama' } },
  { id: 'techniczny', label: 'Pomoc techniczna', icon: Headphones, description: 'Logowanie, konto, błędy na stronie, usunięcie danych.', response: 'Zwykle w ciągu 24 godzin' },
  { id: 'media', label: 'Media i partnerzy', icon: Presentation, description: 'Współpraca medialna, wywiady, materiały prasowe.', response: 'Odpowiadamy w dni robocze', link: { label: 'Strona dla mediów', to: '/dla-mediow' } },
];

export function ContactPage() {
  useDocumentTitle('Kontakt');
  const [params, setParams] = useSearchParams();
  const active = DEPARTMENTS.find((d) => d.id === params.get('dzial')) ?? DEPARTMENTS[0]!;

  const choose = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('dzial', id);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageIntro title="Kontakt" lead="Wybierz dział – Twoja wiadomość trafi od razu do właściwych osób." crumbs={[{ label: 'Kontakt' }]} />

      <div className="container section--tight corp-contact">
        <fieldset className="corp-depts">
          <legend className="field__label">Z kim chcesz się skontaktować?</legend>
          {DEPARTMENTS.map((d) => (
            <label key={d.id} className="corp-dept">
              <input type="radio" name="dzial" value={d.id} checked={d.id === active.id} onChange={() => choose(d.id)} />
              <d.icon size={22} aria-hidden="true" />
              <span>
                <strong>{d.label}</strong>
                <span>{d.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <section className="panel corp-contact__form" aria-labelledby="form-title">
          <h2 id="form-title">Wiadomość: {active.label}</h2>
          <p className="corp-contact__meta">
            <Clock size={16} aria-hidden="true" /> {active.response}
            {active.link && (
              <>
                {' · '}
                <Link to={active.link.to} className="text-link">
                  {active.link.label}
                </Link>
              </>
            )}
          </p>
          <PrototypeForm kind="contact" key={active.id} submitLabel="Wyślij wiadomość" successTitle="Dziękujemy za wiadomość" label={`Formularz kontaktowy – ${active.label}`}>
            <input type="hidden" name="department" value={active.id} />
            <FormField label="Imię i nazwisko" name="name" required autoComplete="name" />
            <FormField label="E-mail" name="email" type="email" required autoComplete="email" />
            <FormField label="Temat" name="subject" required full />
            {active.id === 'ogloszenia' && <FormField label="Numer lub link ogłoszenia" name="listing" hint="Opcjonalnie" full />}
            <FormField as="textarea" label="Treść wiadomości" name="message" required full rows={6} />
          </PrototypeForm>
        </section>

        <aside className="corp-contact__aside" aria-label="Dane kontaktowe">
          <h2>Biuro</h2>
          <ul>
            <li>
              <MapPin size={18} aria-hidden="true" /> [Adres biura], London
            </li>
            <li>
              <Mail size={18} aria-hidden="true" /> [e-mail działu: {active.label.toLowerCase()}]
            </li>
            <li>
              <Clock size={18} aria-hidden="true" /> Pon–pt, 9:00–17:00
            </li>
          </ul>
          <p className="demo-label">Dane kontaktowe zastępcze</p>
          <div className="notice">
            <p>
              <strong>Pilna sprawa?</strong> W sytuacji zagrożenia dzwoń pod 999. Porady medyczne: NHS 111.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
