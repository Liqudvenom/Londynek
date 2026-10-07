import { readFileSync } from 'node:fs';

const j = (n) => JSON.parse(readFileSync(`scripts/tfl-samples/${n}.json`, 'utf8'));
const trim = (o, depth = 0) => {
  if (Array.isArray(o)) return o.length ? [trim(o[0], depth + 1), `…${o.length}`] : [];
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, depth > 4 ? typeof v : trim(v, depth + 1)]));
  return typeof o === 'string' && o.length > 90 ? o.slice(0, 90) + '…' : o;
};
const which = process.argv[2];
const data = j(which);
console.log(JSON.stringify(trim(data), null, 1));
