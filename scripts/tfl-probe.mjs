// Ad-hoc probe: node scripts/tfl-probe.mjs <path>
const path = process.argv[2];
const res = await fetch(`https://api.tfl.gov.uk${path}`);
const body = await res.json();
const list = Array.isArray(body) ? body : [body];
console.log(res.status, list.length);
const show = (sp, depth) => {
  const props = (sp.additionalProperties ?? []).filter((p) => p.category === 'Accessibility' || p.key === 'Lifts');
  console.log(' '.repeat(depth * 2) + (sp.naptanId ?? sp.id), sp.stopType, sp.commonName, JSON.stringify(props.map((p) => `${p.key}=${p.value}`)));
  if (depth < 1) for (const c of sp.children ?? []) if (/^940G|^910G/.test(c.naptanId ?? c.id)) show(c, depth + 1);
};
for (const sp of list.slice(0, 4)) show(sp, 0);
