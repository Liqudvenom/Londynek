import type { LocationInputType } from './types';

const FULL_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$/;
const OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const PARTIAL_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s+\d[A-Z]?$/;
const STREET =
  /\b(road|rd|street|st|lane|ln|avenue|ave|grove|way|close|crescent|terrace|drive|gardens|gdns|square|sq|hill|parade|row|mews|court|ct|high st|broadway|walk)\b\.?/i;
const STATION_WORDS = /\b(station|stacja|stacji|underground|tube|metro)\b/i;

/** Normalises "sw72pg" / "sw7 2pg" → "SW7 2PG". Returns null when it isn't a postcode. */
export function normalisePostcode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, ' ');
  const full = s.replace(/\s/g, '').match(FULL_POSTCODE);
  if (full) return `${full[1]} ${full[2]}`;
  if (OUTCODE.test(s)) return s;
  return null;
}

export const isFullPostcode = (input: string) => FULL_POSTCODE.test(input.trim().toUpperCase().replace(/\s/g, ''));
export const isOutcode = (input: string) => OUTCODE.test(input.trim().toUpperCase());

/**
 * Guesses what the user typed so we can label the suggestion (POSTCODE / STATION / ADDRESS / PLACE).
 * `isStationName` lets callers plug in the live Tube network without coupling this module to it.
 */
export function detectInputType(input: string, isStationName?: (q: string) => boolean): LocationInputType {
  const q = input.trim();
  if (!q) return 'PLACE';
  const upper = q.toUpperCase();
  if (FULL_POSTCODE.test(upper.replace(/\s/g, '')) || OUTCODE.test(upper) || PARTIAL_POSTCODE.test(upper)) return 'POSTCODE';
  if (STATION_WORDS.test(q) || isStationName?.(q)) return 'STATION';
  if (/^\d+[a-z]?(-\d+)?\s+\S/i.test(q) || STREET.test(q)) return 'ADDRESS';
  return 'PLACE';
}

export const INPUT_TYPE_LABEL: Record<LocationInputType, string> = {
  POSTCODE: 'Kod pocztowy',
  STATION: 'Stacja',
  ADDRESS: 'Adres',
  PLACE: 'Miejsce',
};
