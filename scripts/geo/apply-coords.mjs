// One-off migration: replace hand-placed { x, y } map positions with real lat/lon → mapPoint().
import { readFileSync, writeFileSync } from 'node:fs';

const DISTRICTS = {
  '51, y: 50': [51.5117, -0.124], // Covent Garden
  '65, y: 54': [51.5054, -0.0235], // Canary Wharf
  '27, y: 46': [51.513, -0.302], // Ealing Broadway
  '33, y: 31': [51.556, -0.2796], // Wembley
  '66, y: 40': [51.5416, -0.0033], // Stratford
  '36, y: 55': [51.4927, -0.224], // Hammersmith
  '53, y: 82': [51.3762, -0.0982], // Croydon
  '66, y: 62': [51.4826, -0.0077], // Greenwich
  '48, y: 38': [51.539, -0.1426], // Camden Town
  '27, y: 64': [51.4613, -0.3037], // Richmond
  '15, y: 56': [51.4678, -0.3613], // Hounslow
  '26, y: 82': [51.4123, -0.3007], // Kingston
  '41, y: 49': [51.509, -0.196], // Notting Hill
  '26, y: 21': [51.5806, -0.342], // Harrow
  '59, y: 36': [51.545, -0.0553], // Hackney
};
const EVENTS = {
  '36, y: 55': [51.493, -0.229], // POSK, King Street
  '48, y: 35': [51.5521, -0.1418], // O2 Forum Kentish Town
  '42, y: 53': [51.4985, -0.1745], // Ognisko Polskie
  '39, y: 54': [51.496, -0.21], // Olympia
  '61, y: 64': [51.461, -0.009], // Lewisham
  '47, y: 62': [51.4615, -0.1385], // Clapham
  '27, y: 46': [51.513, -0.302], // Ealing
  '45, y: 50': [51.5073, -0.1657], // Hyde Park
};

function apply(file, table) {
  let src = readFileSync(file, 'utf8');
  for (const [xy, [lat, lon]] of Object.entries(table)) src = src.split(`map: { x: ${xy} }`).join(`map: mapPoint(${lat}, ${lon})`);
  const left = src.match(/map: \{ x: \d+/g);
  if (left) throw new Error(`${file}: unmapped ${left.join(', ')}`);
  src = src.replace(/(import type [^\n]+\n)/, `$1import { mapPoint } from '@/lib/mapProjection';\n`);
  writeFileSync(file, src);
}
apply('src/data/districts.ts', DISTRICTS);
apply('src/data/events.ts', EVENTS);
console.log('ok');
