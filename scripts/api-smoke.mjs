// Smoke test for the internal transport API: node scripts/api-smoke.mjs [baseUrl]
const base = process.argv[2] ?? 'http://localhost:5173';
const checks = [
  ['/api/transport/status?modes=tube', (d) => `${d.length} lines; ${d.map((l) => `${l.id}:${l.level}`).join(' ')}`],
  ['/api/transport/status?modes=tube,elizabeth-line,overground,dlr', (d) => `${d.length} lines`],
  ['/api/transport/tube/network', (d) => `${d.lines.length} lines, ${Object.keys(d.stations).length} stations, interchanges ${Object.values(d.stations).filter((s) => s.interchange).length}`],
  ['/api/transport/tube/vehicles', (d) => `${d.length} trains; between ${d.filter((v) => v.fromStationId).length}; at ${d.filter((v) => v.atStation).length}; sample ${JSON.stringify(d[0])}`],
  ['/api/transport/tube/vehicles?lines=victoria', (d) => `${d.length} victoria trains`],
  ['/api/transport/stations/search?q=oxford%20circus', (d) => JSON.stringify(d.slice(0, 2))],
  ['/api/transport/stations/940GZZLUOXC/arrivals', (d) => `${d.length} preds; ${d.slice(0, 3).map((p) => `${p.lineId} ${p.towards} ${p.platform} ${p.timeToStation}s`).join(' | ')}`],
  ['/api/transport/stations/940GZZLUWLO/arrivals?line=jubilee', (d) => `${d.length} jubilee preds at Waterloo`],
  ['/api/transport/stations/940GZZLUKSX', (d) => `${d.name} lines=${d.lines} lift=${d.liftAccess} fac=${d.facilities.length}`],
  ['/api/transport/tube/lines/central/route', (d) => `${d.sections?.length ?? JSON.stringify(d).slice(0, 120)}`],
  ['/api/transport/tube/timetable/victoria?from=940GZZLUBXN&to=940GZZLUVIC', (d) => `${d.fromName}→${d.toName} ${d.travelMinutes}min; ${d.schedules.map((s) => `${s.name}:${s.departures.length}`).join(', ')}`],
  ['/api/transport/tube/lines/nope/route', null],
  ['/api/transport/stations/!!/arrivals', null],
  ['/api/transport/stations/940GZZLUXXX', null],
];
for (const [path, fmt] of checks) {
  const t = Date.now();
  try {
    const res = await fetch(base + path);
    const body = await res.json();
    const ms = Date.now() - t;
    if (body.error) console.log(`${res.status} ${path} (${ms}ms) ERROR ${body.error.kind}: ${body.error.message}`);
    else console.log(`${res.status} ${path} (${ms}ms) stale=${body.meta.stale} → ${fmt ? fmt(body.data).slice(0, 400) : 'ok'}`);
  } catch (e) {
    console.log(`FAIL ${path}: ${e.message}`);
  }
}
