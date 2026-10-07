import { parseDay } from '@/lib/format';
import type { EventItem } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** True when `iso` falls within the event's start–end range (inclusive). */
export function occursOn(e: EventItem, iso: string) {
  return iso >= e.start && iso <= (e.end ?? e.start);
}

/** Friday–Sunday of the week containing `today` (or the coming weekend). */
export function weekendOf(today: string) {
  const d = parseDay(today);
  const toFriday = (5 - d.getDay() + 7) % 7;
  const fri = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (d.getDay() === 0 ? -2 : d.getDay() === 6 ? -1 : toFriday));
  return [0, 1, 2].map((i) => toIso(new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + i)));
}

export const occursWithin = (e: EventItem, days: string[]) => days.some((iso) => occursOn(e, iso));
