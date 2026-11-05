import { search, type SearchEntry } from '@/lib/search';
import { detectInputType, normalisePostcode } from './detect';
import { fold } from './geocode';
import { itemsNear, MAP_KIND_LABEL, type MapItem, type MapKind } from './mapItems';

/** Offers inside this radius count as “near home” after a postcode or address. */
export const NEAR_M = 4000;

interface Intent {
  id: string;
  label: string;
  words: string[];
  kind: MapKind | null;
}

const INTENTS: Intent[] = [
  { id: 'jobs', label: 'Praca', words: ['praca', 'prace', 'job', 'jobs', 'etat'], kind: 'jobs' },
  { id: 'housing', label: 'Pokoje i mieszkania', words: ['pokoj', 'pokoje', 'mieszkanie', 'mieszkania', 'wynajem', 'flat', 'room', 'nieruchomosci'], kind: 'housing' },
  { id: 'help', label: 'Pomoc', words: ['pomoc', 'poradnik', 'porada', 'porady'], kind: 'services' },
  { id: 'services', label: 'Usługi', words: ['usluga', 'uslugi', 'serwis', 'lekarz'], kind: 'services' },
  { id: 'business', label: 'Firmy', words: ['firma', 'firmy', 'sklep'], kind: 'business' },
  { id: 'events', label: 'Wydarzenia', words: ['wydarzenie', 'wydarzenia', 'koncert', 'impreza'], kind: 'events' },
];

const STOP = new Set(['w', 'we', 'na', 'do', 'i', 'z', 'ze', 'dla', 'od', 'the', 'a']);
const PL_STREET = /\b(ul\.?|ulica|aleja|al\.|osiedle|plac)\b/i;

export interface ParsedMapQuery {
  intent: Intent | null;
  /** Words left after the category and the place are taken out. */
  text: string;
  /** Postcode or street address to geocode. Null for a plain keyword. */
  place: string | null;
}

function matchGap(token: string, word: string): number | null {
  if (token === word) return 0;
  if (token.length >= 3 && word.startsWith(token)) return word.length - token.length;
  if (word.length >= 4 && token.startsWith(word)) return token.length - word.length;
  return null;
}

function bestIntent(token: string): Intent | null {
  let best: { intent: Intent; gap: number } | null = null;
  for (const intent of INTENTS) {
    for (const word of intent.words) {
      const gap = matchGap(token, word);
      if (gap == null || gap > 3) continue;
      if (!best || gap < best.gap) best = { intent, gap };
    }
  }
  return best?.intent ?? null;
}

function asPlace(value: string): string | null {
  const q = value.trim();
  if (!q) return null;
  const type = detectInputType(q);
  if (type === 'POSTCODE') return normalisePostcode(q) ?? q;
  if (type === 'ADDRESS' || PL_STREET.test(q)) return q;
  return null;
}

/** Split “praca SW11 1AA” into a category, leftover words, and a place. */
export function parseMapQuery(raw: string): ParsedMapQuery {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const whole = asPlace(trimmed);
  if (whole && detectInputType(trimmed) !== 'PLACE') return { intent: null, text: '', place: whole };

  const tokens = fold(trimmed).split(' ').filter(Boolean);
  let intent: Intent | null = null;
  const leftover: string[] = [];
  const rawTokens = trimmed.split(' ');
  const consumed = new Set<number>();

  tokens.forEach((token, i) => {
    if (STOP.has(token)) return;
    const hit = bestIntent(token);
    if (hit && !intent) {
      intent = hit;
      consumed.add(i);
    } else if (hit && intent && hit.id === intent.id) {
      consumed.add(i);
    } else {
      leftover.push(token);
    }
  });

  const restRaw = rawTokens.filter((_, i) => !consumed.has(i)).join(' ').trim();
  const place = asPlace(restRaw);
  if (place) return { intent, text: '', place };

  const end = restRaw.match(/^(.*?)(?:\s+)?([A-Za-z]{1,2}\d[A-Za-z\d]?(?:\s*\d[A-Za-z]{2})?)$/);
  if (end?.[2] && normalisePostcode(end[2]) && (end[1] || detectInputType(end[2]) === 'POSTCODE')) {
    const head = (end[1] ?? '').trim();
    return { intent, text: fold(head), place: normalisePostcode(end[2]) };
  }

  return { intent, text: leftover.join(' '), place: null };
}

export function filterMapItems(items: MapItem[], raw: string, origin: { lat: number; lng: number } | null): MapItem[] {
  const parsed = parseMapQuery(raw);
  if (!parsed.intent && !parsed.text && !origin) return items;
  let list = origin ? itemsNear(origin.lat, origin.lng, NEAR_M, items) : items;
  if (parsed.intent?.kind) list = list.filter((item) => item.kind === parsed.intent!.kind);
  if (parsed.text) {
    const tokens = parsed.text.split(' ').filter((t) => t.length >= 2);
    list = list.filter((item) => {
      const hay = fold(`${item.title} ${item.subtitle} ${item.priceLabel ?? ''} ${item.geo.address ?? ''} ${item.geo.district} ${item.geo.borough} ${item.geo.postcode} ${MAP_KIND_LABEL[item.kind]}`);
      return tokens.every((t) => hay.includes(t));
    });
  }
  return list;
}

/** Poradnik and other pages that are not pins, for a keyword such as “pomoc”. */
export function extraHits(raw: string, mapIds: Set<string>, limit = 4): SearchEntry[] {
  const parsed = parseMapQuery(raw);
  if (parsed.intent?.id === 'help') return search('', 'poradnik').filter((e) => !mapIds.has(e.id)).slice(0, 3);
  if (!parsed.text) return [];
  return search(parsed.text).filter((e) => !mapIds.has(e.id)).slice(0, limit);
}
