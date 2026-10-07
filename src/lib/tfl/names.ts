// Station name helpers. TfL uses inconsistent spellings across endpoints
// ("King's Cross St. Pancras" vs "Kings Cross St. Pancras", "&" vs "and").

const SUFFIXES = / (Underground|DLR|Rail|Overground)? ?Station$| \(.*?\)$/i;

export function cleanStationName(name: string): string {
  return name.replace(SUFFIXES, '').replace(SUFFIXES, '').trim();
}

export function normalizeName(name: string): string {
  return cleanStationName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\bst\.?\b/g, 'st')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface ParsedLocation {
  kind: 'at' | 'between' | 'approaching' | 'departed' | 'unknown';
  /** For "between" this is "A and B" unsplit – see splitBetween(). */
  a?: string;
}

/** Splits "Elephant and Castle and Lambeth North" at the " and " where both sides resolve. */
export function splitBetween<T>(text: string, resolve: (name: string) => T | null): [T, T] | null {
  const parts = text.split(/ and /i);
  for (let i = 1; i < parts.length; i++) {
    const a = resolve(parts.slice(0, i).join(' and '));
    const b = resolve(parts.slice(i).join(' and '));
    if (a && b) return [a, b];
  }
  return null;
}

/** Parses TfL free-text `currentLocation`, e.g. "Between Seven Sisters and Tottenham Hale". */
export function parseCurrentLocation(text: string | null | undefined): ParsedLocation {
  if (!text) return { kind: 'unknown' };
  const t = text.replace(/\s+Platform\s+\w+$/i, '').replace(/\s+/g, ' ').trim();
  let m = t.match(/^Between (.+)$/i);
  if (m) return { kind: 'between', a: m[1] };
  m = t.match(/^(?:At|At Platform) (.+)$/i);
  if (m) return { kind: 'at', a: m[1] };
  m = t.match(/^Approaching (.+)$/i);
  if (m) return { kind: 'approaching', a: m[1] };
  m = t.match(/^(?:Departed|Left|Leaving) (.+)$/i);
  if (m) return { kind: 'departed', a: m[1] };
  return { kind: 'unknown' };
}
