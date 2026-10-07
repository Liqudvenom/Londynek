// Polish presentation helpers for transport data.
import type { ApiErrorKind, StatusLevel, TrainPrediction } from './types';

export const LEVEL_LABEL: Record<StatusLevel, string> = {
  good: 'Dobra obsługa',
  minor: 'Drobne opóźnienia',
  severe: 'Poważne utrudnienia',
  closed: 'Zawieszona / zamknięta',
  unknown: 'Brak danych',
};

/** TfL statusSeverityDescription → Polish. Unknown values are shown verbatim. */
const SEVERITY_PL: Record<string, string> = {
  'Good Service': 'Dobra obsługa',
  'Minor Delays': 'Drobne opóźnienia',
  'Severe Delays': 'Duże opóźnienia',
  'Reduced Service': 'Ograniczona obsługa',
  'Part Suspended': 'Częściowo zawieszona',
  Suspended: 'Zawieszona',
  'Part Closure': 'Częściowo zamknięta',
  'Planned Closure': 'Planowe zamknięcie',
  Closed: 'Zamknięta',
  'Service Closed': 'Nie kursuje (poza godzinami)',
  'Bus Service': 'Zastępcza komunikacja autobusowa',
  'Special Service': 'Rozkład specjalny',
  'Change of frequency': 'Zmiana częstotliwości',
  Diverted: 'Zmieniona trasa',
  'Not Running': 'Nie kursuje',
  'Issues Reported': 'Zgłoszone problemy',
  'No Issues': 'Bez problemów',
  Information: 'Informacja',
};

export const severityPl = (desc: string) => SEVERITY_PL[desc] ?? desc;

export const ERROR_TEXT: Record<ApiErrorKind, string> = {
  unavailable: 'Nie udało się pobrać aktualnych danych TfL.',
  timeout: 'TfL odpowiada zbyt wolno. Spróbujemy ponownie za chwilę.',
  'rate-limit': 'Chwilowo przekroczono limit zapytań do TfL. Odświeżymy dane automatycznie.',
  'not-found': 'Nie znaleziono takiej stacji lub linii.',
  'bad-request': 'Nieprawidłowe zapytanie.',
  'no-data': 'TfL nie udostępnia tych danych.',
};

/** Countdown for arrival boards: under 60 s shows "1 min"; once the predicted time has passed, "Teraz". */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Teraz';
  if (seconds < 60) return '1 min';
  return `${Math.round(seconds / 60)} min`;
}

export const formatSeconds = (s: number) => (s < 60 ? `~${Math.max(5, Math.round(s / 5) * 5)} sek` : `~${Math.round(s / 60)} min`);

export const formatClock = (d: Date | number | string) =>
  new Date(d).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/London' });

export const formatHm = (d: Date | number | string) => new Date(d).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

/** "Dane sprzed 2 min" – only once data is older than ~90 s. */
export function staleLabel(fetchedAt: string | number, now: number): string | null {
  const age = (now - new Date(fetchedAt).getTime()) / 1000;
  if (age < 90) return null;
  return `Dane sprzed ${Math.max(2, Math.round(age / 60))} min`;
}

const DIRECTION_PL: Record<string, string> = {
  Northbound: 'Kierunek północny',
  Southbound: 'Kierunek południowy',
  Eastbound: 'Kierunek wschodni',
  Westbound: 'Kierunek zachodni',
  'Inner Rail': 'Wewnętrzny tor (Circle)',
  'Outer Rail': 'Zewnętrzny tor (Circle)',
};

/** "Northbound - Platform 1" → { direction: "Northbound", platform: "1" } */
export function splitPlatform(platform: string | null): { direction: string | null; platform: string | null } {
  if (!platform) return { direction: null, platform: null };
  const m = platform.match(/^(.*?)\s*-\s*Platform\s+(\w+)$/i);
  if (m) return { direction: m[1] || null, platform: m[2] ?? null };
  const p = platform.match(/^Platform\s+(\w+)$/i);
  if (p) return { direction: null, platform: p[1] ?? null };
  return { direction: platform, platform: null };
}

export const directionPl = (d: string | null) => (d ? DIRECTION_PL[d] ?? d : 'Pozostałe');

export interface ArrivalGroup {
  key: string;
  label: string;
  lineId: string;
  items: TrainPrediction[];
}

/** Groups predictions by line + platform direction, preserving soonest-first order. */
export function groupArrivals(preds: TrainPrediction[]): ArrivalGroup[] {
  const groups = new Map<string, ArrivalGroup>();
  for (const p of preds) {
    const { direction } = splitPlatform(p.platform);
    const key = `${p.lineId}|${direction ?? p.direction ?? ''}`;
    const g = groups.get(key) ?? { key, label: directionPl(direction), lineId: p.lineId, items: [] };
    g.items.push(p);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => a.lineId.localeCompare(b.lineId) || a.label.localeCompare(b.label, 'pl'));
}

export const lineLabel = (name: string) => `${name} line`;
