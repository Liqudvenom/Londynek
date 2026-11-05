import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Bookmark, CheckCircle2, ListPlus, ShieldCheck } from 'lucide-react';
import { FormField, PrototypeForm } from '@/components/forms/PrototypeForm';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './misc.css';

const BENEFITS = [
  { icon: ListPlus, text: 'Dodawaj i edytuj ogłoszenia' },
  { icon: Bookmark, text: 'Zapisuj oferty na każdym urządzeniu' },
  { icon: Bell, text: 'Powiadomienia o nowych ofertach pracy i mieszkaniach' },
  { icon: ShieldCheck, text: 'Twój adres zamieszkania nie jest publiczny – na mapie widać tylko okolicę' },
];

function RolePicker() {
  return (
    <fieldset className="auth__type pform__full">
      <legend className="field__label">Jestem</legend>
      <label className="check">
        <input type="radio" name="role" value="client" defaultChecked /> Zleceniodawcą – szukam wykonawcy lub pracownika
      </label>
      <label className="check">
        <input type="radio" name="role" value="contractor" /> Zleceniobiorcą – szukam pracy lub zleceń
      </label>
    </fieldset>
  );
}

function AuthShell({ title, lead, children, footer }: { title: string; lead: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="container auth">
      <section className="auth__card panel" aria-labelledby="auth-title">
        <h1 id="auth-title">{title}</h1>
        <p className="auth__lead">{lead}</p>
        <p className="notice auth__notice">Wersja prototypowa – logowanie i rejestracja nie są jeszcze podłączone. Żadne dane nie są wysyłane.</p>
        {children}
        <p className="auth__footer">{footer}</p>
      </section>
      <aside className="auth__aside" aria-label="Korzyści z konta">
        <h2>Konto Londynek</h2>
        <ul>
          {BENEFITS.map((b) => (
            <li key={b.text}>
              <b.icon size={22} aria-hidden="true" /> {b.text}
            </li>
          ))}
        </ul>
        <p>
          <CheckCircle2 size={16} aria-hidden="true" /> Darmowe, bez zobowiązań
        </p>
      </aside>
    </div>
  );
}

export function LoginPage() {
  useDocumentTitle('Zaloguj się');
  const toast = useToast();
  return (
    <AuthShell
      title="Zaloguj się"
      lead="Witaj ponownie! Zaloguj się, aby zarządzać ogłoszeniami."
      footer={
        <>
          Nie masz konta? <Link to="/rejestracja">Zarejestruj się</Link>
        </>
      }
    >
      <PrototypeForm submitLabel="Zaloguj się" successTitle="Formularz poprawny" label="Logowanie" className="auth__form">
        <RolePicker />
        <FormField label="E-mail" name="email" type="email" required autoComplete="email" full />
        <FormField label="Hasło" name="password" type="password" required autoComplete="current-password" full />
        <button type="button" className="auth__forgot" onClick={() => toast('Wersja prototypowa – reset hasła wymaga backendu.')}>
          Nie pamiętam hasła
        </button>
      </PrototypeForm>
    </AuthShell>
  );
}

export function RegisterPage() {
  useDocumentTitle('Załóż konto');
  return (
    <AuthShell
      title="Załóż konto"
      lead="Kilka sekund i możesz dodawać ogłoszenia oraz zapisywać oferty."
      footer={
        <>
          Masz już konto? <Link to="/zaloguj">Zaloguj się</Link>
        </>
      }
    >
      <PrototypeForm submitLabel="Utwórz konto" successTitle="Formularz poprawny" label="Rejestracja" className="auth__form">
        <fieldset className="auth__type pform__full">
          <legend className="field__label">Typ konta</legend>
          <label className="check">
            <input type="radio" name="type" value="private" defaultChecked /> Prywatne
          </label>
          <label className="check">
            <input type="radio" name="type" value="business" /> Firma
          </label>
        </fieldset>
        <RolePicker />
        <FormField label="Imię" name="name" required autoComplete="given-name" full />
        <FormField label="E-mail" name="email" type="email" required autoComplete="email" full />
        <FormField label="Hasło" name="password" type="password" required autoComplete="new-password" minLength={8} hint="Minimum 8 znaków" full />
        <label className="check pform__full">
          <input type="checkbox" name="terms" required /> Akceptuję <Link to="/regulamin">regulamin</Link>
        </label>
      </PrototypeForm>
    </AuthShell>
  );
}
