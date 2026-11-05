// DEMO DATA – events based on the type of community events promoted by Londynek.net.
// Dates are illustrative. Replace with the events API.
import type { EventCategory, EventItem } from '@/types';
import { mapPoint } from '@/lib/mapProjection';
import { venueGeo } from './geo';

export const EVENT_CATEGORIES: EventCategory[] = ['Koncerty', 'Kultura', 'Teatr', 'Rodzina', 'Biznes', 'Społeczność', 'Sport'];

const EVENTS_RAW: EventItem[] = [
  { id: 'e-1', title: 'Jazz Café POSK: The Chris Dean Quartet', start: '2026-10-09', time: '20:00', venue: 'POSK, Jazz Café', borough: 'Hammersmith', region: 'west', category: 'Koncerty', image: 'concert-2', free: false, priceLabel: '£15', polish: true, patronage: true, description: 'Wieczór jazzowy w legendarnej piwnicy POSK-u.', map: mapPoint(51.493, -0.229) },
  { id: 'e-2', title: 'Kamil Bednarek w Londynie', start: '2026-10-09', end: '2026-10-11', time: '19:30', venue: 'O2 Forum Kentish Town', borough: 'Camden', region: 'north', category: 'Koncerty', image: 'crowd-concert', free: false, priceLabel: 'od £35', polish: true, patronage: true, description: 'Koncerty w Londynie i Southampton.', map: mapPoint(51.5521, -0.1418) },
  { id: 'e-3', title: '„Jesteśmy na wczasach” – piosenki Wojciecha Młynarskiego', start: '2026-10-09', end: '2026-10-11', time: '19:00', venue: 'Teatr POSK', borough: 'Hammersmith', region: 'west', category: 'Teatr', image: 'theatre', free: false, priceLabel: '£22', polish: true, description: 'Spektakl muzyczny z kultowymi piosenkami.', map: mapPoint(51.493, -0.229) },
  { id: 'e-4', title: 'Jazz Café POSK: Lily Dior Band', start: '2026-10-10', time: '20:00', venue: 'POSK, Jazz Café', borough: 'Hammersmith', region: 'west', category: 'Koncerty', image: 'concert', free: false, priceLabel: '£12', polish: true, description: 'Soul, funk i jazz na żywo.', map: mapPoint(51.493, -0.229) },
  { id: 'e-5', title: '„Anglicy i Szkoci w dawnej Rzeczypospolitej” – spotkanie', start: '2026-10-13', time: '18:30', venue: 'Biblioteka Polska POSK', borough: 'Hammersmith', region: 'west', category: 'Kultura', image: 'books', free: true, priceLabel: 'Wstęp wolny', polish: true, description: 'Spotkanie z dr Jolantą Rzegocką.', map: mapPoint(51.493, -0.229) },
  { id: 'e-6', title: 'Scena Polska: „Tango” Sławomira Mrożka', start: '2026-10-16', end: '2026-10-18', time: '19:30', venue: 'Teatr POSK', borough: 'Hammersmith', region: 'west', category: 'Teatr', image: 'audience', free: false, priceLabel: '£18', polish: true, patronage: true, description: 'Klasyka polskiego dramatu w nowej inscenizacji.', map: mapPoint(51.493, -0.229) },
  { id: 'e-7', title: 'Spotkanie z Mariuszem Szczygłem', start: '2026-10-16', time: '19:00', venue: 'Ognisko Polskie', borough: 'Kensington', region: 'west', category: 'Kultura', image: 'books', free: false, priceLabel: '£10', polish: true, description: '„Wybuchający Stalin i inne prawdziwe opowieści z serca Europy”.', map: mapPoint(51.4985, -0.1745) },
  { id: 'e-8', title: 'Warsztaty: Sztuka wystąpień publicznych', start: '2026-10-18', time: '10:00', venue: 'POSK', borough: 'Hammersmith', region: 'west', category: 'Biznes', image: 'conference', free: false, priceLabel: '£45', polish: true, description: 'V edycja praktycznych warsztatów.', map: mapPoint(51.493, -0.229) },
  { id: 'e-9', title: 'Polskie Targi Pracy w Londynie', start: '2026-10-26', time: '11:00', venue: 'Olympia London', borough: 'Kensington', region: 'west', category: 'Biznes', image: 'team', free: true, priceLabel: 'Wstęp wolny', polish: true, description: 'Pracodawcy, agencje i doradcy zawodowi w jednym miejscu.', map: mapPoint(51.496, -0.21) },
  { id: 'e-10', title: 'Dziady cz. II – spektakl muzyczny', start: '2026-10-24', end: '2026-10-25', time: '19:00', venue: 'Teatr POSK', borough: 'Hammersmith', region: 'west', category: 'Teatr', image: 'theatre', free: false, priceLabel: '£20', polish: true, patronage: true, description: 'Spektakl inspirowany dramatem Adama Mickiewicza.', map: mapPoint(51.493, -0.229) },
  { id: 'e-11', title: 'Chess Café – szachy i planszówki', start: '2026-10-07', time: '18:00', venue: 'Lewisham Polish Centre', borough: 'Lewisham', region: 'south', category: 'Społeczność', image: 'friends', free: true, priceLabel: 'Wstęp wolny', polish: true, description: 'Co środę, wszystkie poziomy.', map: mapPoint(51.461, -0.009) },
  { id: 'e-12', title: 'Halloween Party – Polonia Londyn', start: '2026-10-31', time: '20:00', venue: 'The Grand, Clapham', borough: 'Wandsworth', region: 'south', category: 'Społeczność', image: 'party', free: false, priceLabel: '£15', polish: true, description: 'Kostiumy obowiązkowe, DJ do 2:00.', map: mapPoint(51.4615, -0.1385) },
  { id: 'e-13', title: 'Festiwal Kultury Polskiej w Londynie', start: '2026-11-01', time: '12:00', venue: 'POSK', borough: 'Hammersmith', region: 'west', category: 'Rodzina', image: 'festival', free: true, priceLabel: 'Wstęp wolny', polish: true, description: 'Muzyka, jedzenie i atrakcje dla dzieci.', map: mapPoint(51.493, -0.229) },
  { id: 'e-14', title: 'Polska Sobota dla dzieci – warsztaty plastyczne', start: '2026-10-10', time: '11:00', venue: 'Polish Saturday School Ealing', borough: 'Ealing', region: 'west', category: 'Rodzina', image: 'kids', free: true, priceLabel: 'Wstęp wolny', polish: true, description: 'Zajęcia dla dzieci 4–9 lat.', map: mapPoint(51.513, -0.302) },
  { id: 'e-15', title: 'Bieg „Run Brave” – Hyde Park 5K', start: '2026-10-11', time: '09:00', venue: 'Hyde Park', borough: 'Westminster', region: 'central', category: 'Sport', image: 'sport-run', free: false, priceLabel: '£12', polish: true, description: 'Charytatywny bieg dla całych rodzin.', map: mapPoint(51.5073, -0.1657) },
  { id: 'e-16', title: 'Kreacja JEST Kobietą – VI edycja', start: '2026-11-15', time: '17:00', venue: 'POSK', borough: 'Hammersmith', region: 'west', category: 'Kultura', image: 'art', free: false, priceLabel: '£25', polish: true, description: 'Wystawa, panel i networking kobiet kreatywnych.', map: mapPoint(51.493, -0.229) },
];

export const EVENTS: EventItem[] = EVENTS_RAW.map((e) => {
  const geo = venueGeo(e.id, e.venue);
  return geo ? { ...e, geo, map: mapPoint(geo.lat, geo.lng) } : e;
});

/** Demo "today" so that relative views (Today / Weekend) stay meaningful. */
export const DEMO_TODAY = '2026-10-07';

export const eventById = (id: string) => EVENTS.find((e) => e.id === id);
