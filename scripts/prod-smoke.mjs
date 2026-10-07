// Smoke test for the production server: node scripts/prod-smoke.mjs [baseUrl]
const base = process.argv[2] ?? 'http://localhost:4173';

const checks = [
  ['GET', '/', 200, (t) => t.includes('<div id="root">')],
  ['GET', '/transport/tube/victoria', 200, (t) => t.includes('<div id="root">')],
  ['GET', '/api/transport/status?modes=tube', 200, (t) => JSON.parse(t).data.length === 11],
  ['GET', '/api/transport/stations/940GZZLUWLO/arrivals', 200, (t) => Array.isArray(JSON.parse(t).data)],
  ['GET', '/api/transport/stations/bad!/arrivals', 400],
  ['GET', '/api/nope', 404],
  ['POST', '/api/transport/status', 405],
  ['GET', '/api/forms', 405],
  ['POST', '/api/forms', 202, null, { kind: 'contact', page: '/smoke', fields: { name: 'Smoke', email: 'smoke@example.com', subject: 'Test', message: 'Test', website: '' } }],
  ['POST', '/api/forms', 400, null, { kind: 'contact', fields: { name: 'x' } }],
  ['GET', '/../../package.json', 200, (t) => t.includes('<div id="root">')],
];

let failed = 0;
for (const [method, path, status, test, body] of checks) {
  const res = await fetch(base + path, body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { method });
  const text = await res.text();
  const ok = res.status === status && (!test || test(text));
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${method} ${path} → ${res.status}${ok ? '' : ` ${text.slice(0, 120)}`}`);
}
process.exit(failed ? 1 : 0);
