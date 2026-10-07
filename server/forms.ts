// POST /api/forms – receives PrototypeForm submissions (contact, advertising, new listing).
// Delivery: FORMS_WEBHOOK_URL (JSON POST) if set, otherwise appended to FORMS_STORE_FILE (JSONL).
// Passwords are never accepted here – login/registration need a real auth backend.
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export const FORM_KINDS = {
  contact: { required: ['name', 'email', 'subject', 'message'], email: 'email' },
  advertising: { required: ['name', 'company', 'email', 'message'], email: 'email' },
  listing: { required: ['category', 'title', 'location', 'description', 'contact', 'reach'], email: null },
} as const;

export type FormKind = keyof typeof FORM_KINDS;

export interface FormsEnv {
  FORMS_WEBHOOK_URL?: string;
  FORMS_STORE_FILE?: string;
}

export interface FormSubmission {
  id: string;
  kind: FormKind;
  receivedAt: string;
  page: string | null;
  fields: Record<string, string>;
}

export interface FormResponse {
  status: number;
  body: { data: { id: string; delivered: 'webhook' | 'stored' } } | { error: { kind: string; message: string; fields?: string[] } };
}

const MAX_FIELDS = 40;
const MAX_VALUE = 5000;
const FIELD_NAME = /^[a-z][a-zA-Z0-9_-]{0,39}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FORBIDDEN = /pass|haslo|hasło|card|cvv|pesel/i;
export const HONEYPOT = 'website';

const bad = (message: string, fields?: string[]): FormResponse => ({ status: 400, body: { error: { kind: 'bad-request', message, ...(fields ? { fields } : {}) } } });

/** Pure validation – returns cleaned fields or a Polish error. */
export function validateForm(input: unknown): { ok: true; kind: FormKind; page: string | null; fields: Record<string, string>; spam: boolean } | { ok: false; res: FormResponse } {
  if (!input || typeof input !== 'object') return { ok: false, res: bad('Nieprawidłowe dane formularza.') };
  const { kind, fields, page } = input as { kind?: unknown; fields?: unknown; page?: unknown };
  if (typeof kind !== 'string' || !(kind in FORM_KINDS)) return { ok: false, res: bad('Nieznany rodzaj formularza.') };
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return { ok: false, res: bad('Brak pól formularza.') };
  const entries = Object.entries(fields as Record<string, unknown>);
  if (entries.length > MAX_FIELDS) return { ok: false, res: bad('Za dużo pól formularza.') };

  const clean: Record<string, string> = {};
  let spam = false;
  for (const [name, value] of entries) {
    if (name === HONEYPOT) {
      spam = typeof value === 'string' && value.trim() !== '';
      continue;
    }
    if (!FIELD_NAME.test(name)) return { ok: false, res: bad('Nieprawidłowa nazwa pola.', [name]) };
    if (FORBIDDEN.test(name)) return { ok: false, res: bad('Ten formularz nie przyjmuje haseł ani danych płatniczych.', [name]) };
    if (typeof value !== 'string') return { ok: false, res: bad('Nieprawidłowa wartość pola.', [name]) };
    if (value.length > MAX_VALUE) return { ok: false, res: bad('Treść pola jest za długa.', [name]) };
    const v = value.trim();
    if (v) clean[name] = v;
  }

  const spec = FORM_KINDS[kind as FormKind];
  const missing = spec.required.filter((f) => !clean[f]);
  if (missing.length) return { ok: false, res: bad('Uzupełnij wymagane pola.', missing) };
  if (spec.email && !EMAIL.test(clean[spec.email] ?? '')) return { ok: false, res: bad('Podaj poprawny adres e-mail.', [spec.email]) };

  return { ok: true, kind: kind as FormKind, page: typeof page === 'string' ? page.slice(0, 200) : null, fields: clean, spam };
}

/** Fixed-window per-IP limiter (prototype-grade, per process). */
export function createRateLimiter(limit = 5, windowMs = 60_000, now: () => number = Date.now) {
  const hits = new Map<string, { start: number; count: number }>();
  return (key: string) => {
    const t = now();
    const h = hits.get(key);
    if (!h || t - h.start > windowMs) {
      if (hits.size > 5000) hits.clear();
      hits.set(key, { start: t, count: 1 });
      return true;
    }
    h.count += 1;
    return h.count <= limit;
  };
}

export function createFormsHandler(env: FormsEnv, deps: { fetchImpl?: typeof fetch; now?: () => number; append?: (file: string, line: string) => Promise<void> } = {}) {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;
  const store = env.FORMS_STORE_FILE || 'data/form-submissions.jsonl';
  const append =
    deps.append ??
    (async (file: string, line: string) => {
      await mkdir(dirname(file), { recursive: true });
      await appendFile(file, line, 'utf8');
    });
  const allow = createRateLimiter(5, 60_000, now);

  return async function handleForm(input: unknown, clientKey: string): Promise<FormResponse> {
    if (!allow(clientKey)) return { status: 429, body: { error: { kind: 'rate-limit', message: 'Za dużo wysłanych formularzy. Spróbuj ponownie za minutę.' } } };
    const v = validateForm(input);
    if (!v.ok) return v.res;
    const submission: FormSubmission = { id: randomUUID(), kind: v.kind, receivedAt: new Date(now()).toISOString(), page: v.page, fields: v.fields };
    // Bots filling the honeypot get a normal-looking answer but nothing is delivered.
    if (v.spam) return { status: 202, body: { data: { id: submission.id, delivered: 'stored' } } };

    try {
      if (env.FORMS_WEBHOOK_URL) {
        const res = await fetchImpl(env.FORMS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`webhook ${res.status}`);
        return { status: 202, body: { data: { id: submission.id, delivered: 'webhook' } } };
      }
      await append(store, `${JSON.stringify(submission)}\n`);
      return { status: 202, body: { data: { id: submission.id, delivered: 'stored' } } };
    } catch (err) {
      console.error('[forms]', err);
      return { status: 502, body: { error: { kind: 'unavailable', message: 'Nie udało się wysłać formularza. Spróbuj ponownie później.' } } };
    }
  };
}
