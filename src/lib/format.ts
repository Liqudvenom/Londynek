const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('pl-PL');

export const formatGBP = (value: number) => gbp.format(value).replace(/,/g, ' ');
export const formatNumber = (value: number) => num.format(value);

const MONTHS_SHORT = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU'];
const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

/** Parses YYYY-MM-DD as a local calendar date (no timezone shift). */
export function parseDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function dateBlock(iso: string) {
  const d = parseDay(iso);
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()] ?? '', weekday: WEEKDAYS[d.getDay()] ?? '' };
}

export function formatDayLong(iso: string) {
  const d = parseDay(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

export function formatRange(start: string, end?: string) {
  const s = parseDay(start);
  if (!end) return `${s.getDate()} ${MONTHS_GEN[s.getMonth()]}`;
  const e = parseDay(end);
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${MONTHS_GEN[s.getMonth()]}`;
  return `${s.getDate()} ${MONTHS_GEN[s.getMonth()]} – ${e.getDate()} ${MONTHS_GEN[e.getMonth()]}`;
}

export const MONTH_NAMES = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

/** Polish plural: 1 ogłoszenie, 2–4 ogłoszenia, 5+ ogłoszeń */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');
