// Production server: serves the built SPA from dist/ and the internal API.
// Build: npm run build && npm run build:server   Run: npm start
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { createApiMiddleware } from './middleware';

try {
  process.loadEnvFile?.('.env');
} catch {
  /* no .env file – rely on real environment variables */
}

const DIST = resolve(process.env.DIST_DIR ?? 'dist');
const PORT = Number(process.env.PORT ?? 4173);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

const api = createApiMiddleware({
  TFL_APP_ID: process.env.TFL_APP_ID,
  TFL_APP_KEY: process.env.TFL_APP_KEY,
  FORMS_WEBHOOK_URL: process.env.FORMS_WEBHOOK_URL,
  FORMS_STORE_FILE: process.env.FORMS_STORE_FILE,
});

createServer((req, res) => {
  void api(req, res, () => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    if (path.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { kind: 'not-found', message: 'Nieznany adres API.' } }));
      return;
    }
    const file = join(DIST, normalize(path).replace(/^([/\\])+/, ''));
    const safe = file.startsWith(DIST) && existsSync(file) && statSync(file).isFile();
    const target = safe ? file : join(DIST, 'index.html');
    const immutable = safe && path.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    createReadStream(target).pipe(res);
  });
}).listen(PORT, () => console.log(`Londynek: http://localhost:${PORT}`));
