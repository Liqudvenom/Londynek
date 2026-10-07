// Dev helper: download raw TfL responses to inspect shapes (scripts/tfl-samples/*.json).
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://api.tfl.gov.uk';
const paths = {
  lines: '/Line/Mode/tube',
  status: '/Line/Mode/tube/Status',
  statusModes: '/Line/Mode/tube,elizabeth-line,overground,dlr/Status',
  route: '/Line/victoria/Route',
  sequence: '/Line/victoria/Route/Sequence/outbound',
  sequenceNorthern: '/Line/northern/Route/Sequence/outbound',
  stopArrivals: '/StopPoint/940GZZLUOXC/Arrivals',
  lineArrivals: '/Line/victoria/Arrivals',
  timetable: '/Line/victoria/Timetable/940GZZLUBXN/to/940GZZLUWWL',
  search: '/StopPoint/Search/kings%20cross?modes=tube',
  stopPoint: '/StopPoint/940GZZLUOXC',
};
mkdirSync('scripts/tfl-samples', { recursive: true });
for (const [name, p] of Object.entries(paths)) {
  const res = await fetch(BASE + p);
  const text = await res.text();
  writeFileSync(`scripts/tfl-samples/${name}.json`, text);
  console.log(name, res.status, text.length);
}
