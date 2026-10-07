import { describe, expect, it, vi } from 'vitest';
import { createFormsHandler, validateForm } from './forms';

const contact = { kind: 'contact', page: '/kontakt', fields: { name: ' Anna ', email: 'anna@example.com', subject: 'Pytanie', message: 'Dzień dobry', website: '' } };

describe('validateForm', () => {
  it('accepts a valid contact form and trims values', () => {
    const v = validateForm(contact);
    expect(v.ok && v.fields).toEqual({ name: 'Anna', email: 'anna@example.com', subject: 'Pytanie', message: 'Dzień dobry' });
  });

  it('rejects unknown kinds, missing fields and bad e-mails', () => {
    expect(validateForm({ ...contact, kind: 'admin' }).ok).toBe(false);
    const missing = validateForm({ ...contact, fields: { name: 'A' } });
    expect(!missing.ok && missing.res.body).toMatchObject({ error: { fields: ['email', 'subject', 'message'] } });
    expect(validateForm({ ...contact, fields: { ...contact.fields, email: 'nope' } }).ok).toBe(false);
  });

  it('refuses passwords, non-string values and oversized input', () => {
    expect(validateForm({ ...contact, fields: { ...contact.fields, password: 'x' } }).ok).toBe(false);
    expect(validateForm({ ...contact, fields: { ...contact.fields, message: { $gt: '' } } }).ok).toBe(false);
    expect(validateForm({ ...contact, fields: { ...contact.fields, message: 'x'.repeat(5001) } }).ok).toBe(false);
  });

  it('flags the honeypot as spam', () => {
    const v = validateForm({ ...contact, fields: { ...contact.fields, website: 'http://spam' } });
    expect(v.ok && v.spam).toBe(true);
  });
});

describe('createFormsHandler', () => {
  it('appends to the JSONL store without a webhook', async () => {
    const append = vi.fn(async () => undefined);
    const handle = createFormsHandler({ FORMS_STORE_FILE: 'tmp/forms.jsonl' }, { append });
    const res = await handle(contact, '1.2.3.4');
    expect(res.status).toBe(202);
    expect(res.body).toMatchObject({ data: { delivered: 'stored' } });
    const [file, line] = append.mock.calls[0] as unknown as [string, string];
    expect(file).toBe('tmp/forms.jsonl');
    expect(JSON.parse(line)).toMatchObject({ kind: 'contact', page: '/kontakt', fields: { name: 'Anna' } });
  });

  it('posts to the webhook when configured and reports webhook failures', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
    const ok = createFormsHandler({ FORMS_WEBHOOK_URL: 'https://hooks.test/forms' }, { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect((await ok(contact, 'a')).body).toMatchObject({ data: { delivered: 'webhook' } });

    const down = createFormsHandler({ FORMS_WEBHOOK_URL: 'https://hooks.test/forms' }, { fetchImpl: (async () => new Response(null, { status: 500 })) as unknown as typeof fetch });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await down(contact, 'b')).status).toBe(502);
  });

  it('does not deliver honeypot submissions', async () => {
    const append = vi.fn(async () => undefined);
    const handle = createFormsHandler({}, { append });
    const res = await handle({ ...contact, fields: { ...contact.fields, website: 'x' } }, 'c');
    expect(res.status).toBe(202);
    expect(append).not.toHaveBeenCalled();
  });

  it('rate-limits a client after 5 submissions per minute', async () => {
    let t = 0;
    const handle = createFormsHandler({}, { append: async () => undefined, now: () => t });
    for (let i = 0; i < 5; i++) expect((await handle(contact, 'same')).status).toBe(202);
    expect((await handle(contact, 'same')).status).toBe(429);
    t += 61_000;
    expect((await handle(contact, 'same')).status).toBe(202);
  });
});
