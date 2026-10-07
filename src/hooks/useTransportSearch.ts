import { useEffect, useMemo, useState } from 'react';
import { loadNetwork } from '@/lib/tfl/api';
import { matchTransportForSiteSearch } from '@/lib/tfl/match';
import { normalizeName } from '@/lib/tfl/names';
import type { TubeNetwork } from '@/lib/tfl/types';
import { tubeLineColours } from '@/data/tube-colors';

const LINE_WORD = /\b(line|linia|linii)\b/;

export interface TransportHit {
  id: string;
  kind: 'station' | 'line';
  type: string;
  title: string;
  snippet: string;
  to: string;
  colour?: string;
}

/**
 * Transport results for the site-wide search. The Tube network is fetched lazily
 * (once per session) the first time a query of 3+ characters is typed; failures
 * degrade silently to "no transport results".
 */
export function useTransportSearch(query: string, limit = 4): TransportHit[] {
  const [network, setNetwork] = useState<TubeNetwork | null>(null);
  const wanted = normalizeName(query).length >= 3;

  useEffect(() => {
    if (!wanted || network) return;
    let alive = true;
    loadNetwork().then(
      (env) => {
        if (alive) setNetwork(env.data);
      },
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [wanted, network]);

  return useMemo(() => {
    if (!network || !wanted) return [];
    const m = matchTransportForSiteSearch(network, query, limit);
    const lineName = (id: string) => tubeLineColours[id as keyof typeof tubeLineColours]?.name ?? id;
    const lines: TransportHit[] = m.lines.map((l) => ({ id: `line-${l.id}`, kind: 'line', type: 'Linia metra', title: `${l.name} line`, snippet: 'Status, mapa i pociągi na żywo', to: `/transport/tube/${l.id}`, colour: l.colour }));
    const stations: TransportHit[] = m.stations.map((s) => ({
        id: `station-${s.id}`,
        kind: 'station',
        type: 'Stacja metra',
        title: s.name,
        snippet: `${s.lines.map(lineName).join(', ')}${s.zone ? ` · strefa ${s.zone}` : ''} · odjazdy na żywo`,
        to: `/transport/station/${s.id}`,
      }));
    return LINE_WORD.test(normalizeName(query)) ? [...lines, ...stations] : [...stations, ...lines];
  }, [network, wanted, query, limit]);
}
