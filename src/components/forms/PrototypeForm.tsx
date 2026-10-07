import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { submitForm, type FormKind } from '@/lib/content/source';
import './forms.css';

interface PrototypeFormProps {
  children: ReactNode;
  submitLabel: string;
  successTitle: string;
  className?: string;
  label: string;
  /** When set, the form is really submitted (POST /api/forms or the Londynek API). Without it nothing leaves the browser. */
  kind?: FormKind;
}

type State = { s: 'idle' } | { s: 'sending' } | { s: 'sent'; id: string | null } | { s: 'error'; message: string };

function formFields(form: HTMLFormElement): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of new FormData(form)) if (typeof value === 'string') out[name] = value;
  return out;
}

/**
 * Form shell with native constraint validation. Forms with a `kind` are sent to the backend;
 * the rest (login, registration) stay prototypes and say so after submit.
 */
export function PrototypeForm({ children, submitLabel, successTitle, className = '', label, kind }: PrototypeFormProps) {
  const [state, setState] = useState<State>({ s: 'idle' });

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!kind) {
      setState({ s: 'sent', id: null });
      form.reset();
      return;
    }
    setState({ s: 'sending' });
    const res = await submitForm(kind, formFields(form));
    if (res.ok) {
      setState({ s: 'sent', id: res.id });
      form.reset();
    } else {
      setState({ s: 'error', message: res.message });
      const first = res.fields?.[0];
      if (first) form.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`)?.focus();
    }
  };

  return (
    <form className={`pform ${className}`} onSubmit={onSubmit} aria-label={label} aria-busy={state.s === 'sending'}>
      {children}
      {kind && (
        <div className="pform__hp" aria-hidden="true">
          <label>
            Nie wypełniaj tego pola
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      )}
      <div className="pform__actions">
        <button type="submit" className="btn btn--primary btn--lg" disabled={state.s === 'sending'}>
          {state.s === 'sending' ? 'Wysyłanie…' : submitLabel}
        </button>
        <p className="pform__privacy">
          Wysyłając formularz akceptujesz <Link to="/regulamin#prywatnosc">politykę prywatności</Link>.
        </p>
      </div>
      <div role="status" aria-live="polite">
        {state.s === 'sent' && (
          <div className="pform__success">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <strong>{successTitle}</strong>
              {state.id ? (
                <p>Formularz został wysłany. Numer zgłoszenia: {state.id.slice(0, 8).toUpperCase()}</p>
              ) : (
                <p>
                  <Info size={14} aria-hidden="true" /> Wersja prototypowa – formularz nie został nigdzie wysłany, a dane nie opuściły Twojej przeglądarki.
                </p>
              )}
            </div>
          </div>
        )}
        {state.s === 'error' && (
          <div className="pform__error" role="alert">
            <AlertTriangle size={20} aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  full?: boolean;
} & (
  | { as?: 'input'; type?: string; autoComplete?: string; placeholder?: string; minLength?: number; inputMode?: 'numeric' | 'decimal' | 'tel' | 'email' }
  | { as: 'textarea'; rows?: number; placeholder?: string }
  | { as: 'select'; options: { value: string; label: string }[]; defaultValue?: string }
);

export function FormField(props: FieldProps) {
  const id = useId();
  const hintId = props.hint ? `${id}-hint` : undefined;
  const common = { id, name: props.name, required: props.required, 'aria-describedby': hintId };
  return (
    <div className={`field ${props.full ? 'pform__full' : ''}`}>
      <label htmlFor={id} className="field__label">
        {props.label}
        {props.required && <span className="pform__req" aria-hidden="true"> *</span>}
      </label>
      {props.as === 'textarea' ? (
        <textarea {...common} className="input pform__textarea" rows={props.rows ?? 5} placeholder={props.placeholder} />
      ) : props.as === 'select' ? (
        <select {...common} className="select" defaultValue={props.defaultValue ?? ''}>
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          className="input"
          type={props.type ?? 'text'}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          minLength={props.minLength}
          inputMode={props.inputMode}
        />
      )}
      {props.hint && (
        <span id={hintId} className="field__hint">
          {props.hint}
        </span>
      )}
    </div>
  );
}
