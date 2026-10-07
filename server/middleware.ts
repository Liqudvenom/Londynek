import type { IncomingMessage, ServerResponse } from 'node:http';
import { createFormsHandler, type FormsEnv } from './forms';
import { createTflClient } from './tfl-client';
import { createTransportApi } from './transport-api';

export interface ServerEnv extends FormsEnv {
  TFL_APP_ID?: string;
  TFL_APP_KEY?: string;
}

type Next = (err?: unknown) => void;

const MAX_BODY = 32 * 1024;
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };

function send(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  res.writeHead(status, { ...HEADERS, ...extra });
  res.end(JSON.stringify(body));
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too-large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid-json'));
      }
    });
    req.on('error', reject);
  });
}

/** Connect-style middleware serving /api/transport/* and /api/forms – used by Vite (dev/preview) and server/index.ts. */
export function createApiMiddleware(env: ServerEnv) {
  const tfl = createTflClient({ appId: env.TFL_APP_ID || undefined, appKey: env.TFL_APP_KEY || undefined });
  const transport = createTransportApi(tfl);
  const forms = createFormsHandler(env);

  return async function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: Next) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return next();

    if (url.pathname === '/api/forms') {
      if (req.method !== 'POST') return send(res, 405, { error: { kind: 'bad-request', message: 'Metoda niedozwolona.' } }, { Allow: 'POST' });
      if (!(req.headers['content-type'] ?? '').includes('application/json')) return send(res, 415, { error: { kind: 'bad-request', message: 'Oczekiwano danych JSON.' } });
      let body: unknown;
      try {
        body = await readJson(req);
      } catch (err) {
        const tooLarge = (err as Error).message === 'too-large';
        return send(res, tooLarge ? 413 : 400, { error: { kind: 'bad-request', message: tooLarge ? 'Formularz jest za duży.' : 'Nieprawidłowe dane JSON.' } });
      }
      const out = await forms(body, req.socket.remoteAddress ?? 'unknown');
      return send(res, out.status, out.body);
    }

    if (req.method !== 'GET') return send(res, 405, { error: { kind: 'bad-request', message: 'Metoda niedozwolona.' } }, { Allow: 'GET' });
    if (!url.pathname.startsWith('/api/transport/')) return send(res, 404, { error: { kind: 'not-found', message: 'Nieznany adres API.' } });
    const out = await transport(url);
    send(res, out.status, out.body);
  };
}
