// DEMO DATA – illustrative figures, not official statistics. Replace with Londynek / ONS data.
import type { District, Region, RegionId } from '@/types';
import { mapPoint } from '@/lib/mapProjection';

export const REGIONS: Region[] = [
  { id: 'central', name: 'Central London' },
  { id: 'north', name: 'North London' },
  { id: 'east', name: 'East London' },
  { id: 'south', name: 'South London' },
  { id: 'west', name: 'West London' },
];

export const regionName = (id: RegionId) => REGIONS.find((r) => r.id === id)?.name ?? id;

export const DISTRICTS: District[] = [
  {
    id: 'central-london', name: 'Central London', region: 'central', postcode: 'WC2', image: 'westminster-bridge',
    avgRent: 2650, avgRoom: 1150, avgSale: 1250000, rentTrend: 5, commuteMin: [5, 15],
    profile: 'Studenci, młodzi profesjonaliści, branża hotelarska', transport: 'Wszystkie główne linie metra', schools: 'Szkoły prywatne i akademie',
    counts: { jobs: 412, rooms: 96, events: 38, news: 21 }, map: mapPoint(51.5117, -0.124),
  },
  {
    id: 'canary-wharf', name: 'Canary Wharf', region: 'east', postcode: 'E14', image: 'city-towers',
    avgRent: 2350, avgRoom: 1050, avgSale: 610000, rentTrend: 4, commuteMin: [12, 20],
    profile: 'Finanse, IT, młode pary', transport: 'Elizabeth line, Jubilee, DLR', schools: 'Nowe akademie, dobre szkoły podstawowe',
    counts: { jobs: 188, rooms: 74, events: 9, news: 6 }, map: mapPoint(51.5054, -0.0235),
  },
  {
    id: 'ealing', name: 'Ealing', region: 'west', postcode: 'W5', image: 'house',
    avgRent: 1950, avgRoom: 820, avgSale: 640000, rentTrend: 3, commuteMin: [20, 30],
    profile: 'Duża społeczność polska, rodziny, POSK w pobliżu', transport: 'Elizabeth line, Central, District', schools: 'Polska szkoła sobotnia, dobre szkoły "Outstanding"',
    counts: { jobs: 146, rooms: 128, events: 24, news: 11 }, map: mapPoint(51.513, -0.302),
  },
  {
    id: 'wembley', name: 'Wembley', region: 'north', postcode: 'HA9', image: 'living-4',
    avgRent: 1750, avgRoom: 760, avgSale: 455000, rentTrend: 4, commuteMin: [18, 28],
    profile: 'Rodziny, pracownicy logistyki i handlu', transport: 'Jubilee, Metropolitan, Bakerloo', schools: 'Duży wybór szkół publicznych',
    counts: { jobs: 131, rooms: 112, events: 12, news: 7 }, map: mapPoint(51.556, -0.2796),
  },
  {
    id: 'stratford', name: 'Stratford', region: 'east', postcode: 'E15', image: 'flat-living-2',
    avgRent: 1850, avgRoom: 800, avgSale: 470000, rentTrend: 6, commuteMin: [12, 18],
    profile: 'Nowe inwestycje, młodzi profesjonaliści', transport: 'Elizabeth line, Central, Jubilee, DLR, Overground', schools: 'Nowe akademie w Olympic Park',
    counts: { jobs: 164, rooms: 139, events: 17, news: 9 }, map: mapPoint(51.5416, -0.0033),
  },
  {
    id: 'hammersmith', name: 'Hammersmith', region: 'west', postcode: 'W6', image: 'living-3',
    avgRent: 2250, avgRoom: 950, avgSale: 780000, rentTrend: 3, commuteMin: [15, 22],
    profile: 'Polski Ośrodek POSK, profesjonaliści, rodziny', transport: 'Piccadilly, District, Hammersmith & City', schools: 'Szkoły katolickie, polska szkoła sobotnia',
    counts: { jobs: 118, rooms: 81, events: 46, news: 8 }, map: mapPoint(51.4927, -0.224),
  },
  {
    id: 'croydon', name: 'Croydon', region: 'south', postcode: 'CR0', image: 'house-modern',
    avgRent: 1550, avgRoom: 700, avgSale: 395000, rentTrend: 2, commuteMin: [25, 35],
    profile: 'Przystępne ceny, rodziny, handel', transport: 'National Rail, Tramlink, Overground', schools: 'Wiele szkół podstawowych, grammar schools w okolicy',
    counts: { jobs: 122, rooms: 117, events: 8, news: 6 }, map: mapPoint(51.3762, -0.0982),
  },
  {
    id: 'greenwich', name: 'Greenwich', region: 'south', postcode: 'SE10', image: 'tower-bridge',
    avgRent: 1950, avgRoom: 840, avgSale: 520000, rentTrend: 3, commuteMin: [20, 28],
    profile: 'Historia, parki, rodziny i studenci', transport: 'DLR, National Rail, Thames Clippers', schools: 'Dobre szkoły, University of Greenwich',
    counts: { jobs: 74, rooms: 63, events: 14, news: 5 }, map: mapPoint(51.4826, -0.0077),
  },
  {
    id: 'camden', name: 'Camden', region: 'north', postcode: 'NW1', image: 'london-street',
    avgRent: 2400, avgRoom: 1000, avgSale: 820000, rentTrend: 4, commuteMin: [10, 18],
    profile: 'Kultura, muzyka, gastronomia, studenci', transport: 'Northern line, Overground', schools: 'Szkoły artystyczne, UCL w pobliżu',
    counts: { jobs: 139, rooms: 58, events: 31, news: 7 }, map: mapPoint(51.539, -0.1426),
  },
  {
    id: 'richmond', name: 'Richmond', region: 'west', postcode: 'TW9', image: 'garden',
    avgRent: 2300, avgRoom: 950, avgSale: 890000, rentTrend: 2, commuteMin: [25, 35],
    profile: 'Zieleń, spokój, rodziny', transport: 'District, Overground, South Western Railway', schools: 'Jedne z najlepszych szkół w Londynie',
    counts: { jobs: 66, rooms: 41, events: 10, news: 4 }, map: mapPoint(51.4613, -0.3037),
  },
  {
    id: 'hounslow', name: 'Hounslow', region: 'west', postcode: 'TW3', image: 'living-5',
    avgRent: 1650, avgRoom: 720, avgSale: 430000, rentTrend: 3, commuteMin: [30, 40],
    profile: 'Lotnisko Heathrow, logistyka, rodziny', transport: 'Piccadilly, South Western Railway', schools: 'Szkoły publiczne, college zawodowe',
    counts: { jobs: 157, rooms: 98, events: 5, news: 4 }, map: mapPoint(51.4678, -0.3613),
  },
  {
    id: 'kingston', name: 'Kingston', region: 'south', postcode: 'KT1', image: 'kitchen',
    avgRent: 1800, avgRoom: 760, avgSale: 560000, rentTrend: 2, commuteMin: [30, 40],
    profile: 'Studenci, rodziny, handel', transport: 'South Western Railway', schools: 'Grammar schools, Kingston University',
    counts: { jobs: 71, rooms: 52, events: 6, news: 3 }, map: mapPoint(51.4123, -0.3007),
  },
  {
    id: 'notting-hill', name: 'Notting Hill', region: 'west', postcode: 'W11', image: 'house',
    avgRent: 2300, avgRoom: 1100, avgSale: 1050000, rentTrend: 6, commuteMin: [20, 30],
    profile: 'Polaków, rodzin, młodych profesjonalistów', transport: 'Central, Circle, District', schools: 'Szkoły prywatne i państwowe "Outstanding"',
    counts: { jobs: 58, rooms: 33, events: 11, news: 4 }, map: mapPoint(51.509, -0.196),
  },
  {
    id: 'harrow', name: 'Harrow', region: 'north', postcode: 'HA1', image: 'house-modern',
    avgRent: 1700, avgRoom: 740, avgSale: 520000, rentTrend: 3, commuteMin: [25, 35],
    profile: 'Rodziny, spokojne przedmieścia', transport: 'Metropolitan, Bakerloo, Overground', schools: 'Bardzo dobre szkoły publiczne',
    counts: { jobs: 64, rooms: 59, events: 4, news: 3 }, map: mapPoint(51.5806, -0.342),
  },
  {
    id: 'hackney', name: 'Hackney', region: 'east', postcode: 'E8', image: 'living-4',
    avgRent: 2150, avgRoom: 920, avgSale: 640000, rentTrend: 4, commuteMin: [15, 25],
    profile: 'Kreatywni, młodzi, kawiarnie i rynki', transport: 'Overground, autobusy', schools: 'Szkoły publiczne, dużo nowych akademii',
    counts: { jobs: 92, rooms: 77, events: 19, news: 5 }, map: mapPoint(51.545, -0.0553),
  },
];

export const BROWSE_DISTRICT_IDS = ['central-london', 'canary-wharf', 'ealing', 'wembley', 'croydon', 'richmond', 'hounslow', 'kingston'];
export const LOCAL_DISTRICT_IDS = ['ealing', 'wembley', 'stratford', 'hammersmith', 'croydon', 'greenwich', 'camden', 'richmond'];

export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id);
export const districtsByIds = (ids: string[]) => ids.map((id) => districtById(id)).filter((d): d is District => Boolean(d));
