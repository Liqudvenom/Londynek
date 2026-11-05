// DEMO DATA – example property listings. Replace with Londynek property feed.
import type { Property, PropertyType } from '@/types';
import { attachGeo } from './geo';

export const PROPERTY_TYPES: { id: PropertyType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Wszystkie', icon: 'LayoutGrid' },
  { id: 'room', label: 'Pokoje', icon: 'Home' },
  { id: 'flat', label: 'Mieszkania', icon: 'Building2' },
  { id: 'house', label: 'Domy', icon: 'Home' },
  { id: 'flatshare', label: 'Współlokatorzy', icon: 'Users' },
];

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = {
  room: 'Pokój',
  flat: 'Mieszkanie',
  house: 'Dom',
  flatshare: 'Współlokatorzy',
  studio: 'Studio',
};

export const PROPERTIES: Property[] = attachGeo<Property>([
  { id: 'p-1', title: 'Nowoczesne mieszkanie 2 sypialnie w Canary Wharf', mode: 'rent', type: 'flat', price: 2200, bedrooms: 2, bathrooms: 2, district: 'canary-wharf', location: 'Canary Wharf', postcode: 'E14', commuteMin: 15, agency: 'Skyline Estates', agencyKind: 'agency', verified: true, featured: true, photos: 12, image: 'flat-living-1', description: 'Jasne, nowoczesne mieszkanie z widokiem na wodę. W pełni umeblowane, siłownia w budynku, concierge 24/7.' },
  { id: 'p-2', title: 'Przestronny dom 3 sypialnie z ogrodem w Ealing', mode: 'rent', type: 'house', price: 2500, bedrooms: 3, bathrooms: 2, district: 'ealing', location: 'Ealing', postcode: 'W5', commuteMin: 25, agency: 'Greenfield Properties', agencyKind: 'agency', verified: true, isNew: true, photos: 10, image: 'house', description: 'Piękny dom w spokojnej dzielnicy, prywatny ogród, blisko stacji i polskich sklepów. Idealny dla rodziny.' },
  { id: 'p-3', title: 'Studio w samym centrum Londynu przy Oxford Street', mode: 'rent', type: 'studio', price: 1650, bedrooms: 0, bathrooms: 1, district: 'central-london', location: 'Marylebone', postcode: 'W1', commuteMin: 5, agency: 'London Living', agencyKind: 'agency', verified: true, photos: 8, image: 'bedroom', description: 'Stylowe studio po remoncie, w pełni wyposażone. Idealne dla jednej osoby lub pary.' },
  { id: 'p-4', title: 'Pokój double w domu z ogrodem – Wembley Park', mode: 'rent', type: 'room', price: 780, bedrooms: 1, bathrooms: 1, district: 'wembley', location: 'Wembley', postcode: 'HA9', commuteMin: 22, agency: 'Marek (właściciel)', agencyKind: 'landlord', verified: true, photos: 6, image: 'living-5', description: 'Pokój w domu dzielonym z 3 polskimi współlokatorami. Rachunki i internet w cenie.' },
  { id: 'p-5', title: 'Mieszkanie 1 sypialnia przy Olympic Park', mode: 'rent', type: 'flat', price: 1750, bedrooms: 1, bathrooms: 1, district: 'stratford', location: 'Stratford', postcode: 'E20', commuteMin: 14, agency: 'East Homes', agencyKind: 'agency', verified: false, isNew: true, photos: 9, image: 'flat-living-2', description: 'Nowy budynek, balkon, 3 minuty do stacji Stratford International.' },
  { id: 'p-6', title: 'Pokój dla jednej osoby w Croydon – rachunki w cenie', mode: 'rent', type: 'room', price: 620, bedrooms: 1, bathrooms: 1, district: 'croydon', location: 'Croydon', postcode: 'CR0', commuteMin: 30, agency: 'Ania (właścicielka)', agencyKind: 'landlord', verified: true, photos: 5, image: 'living-3', description: 'Cichy dom, blisko East Croydon. Szukamy osoby pracującej, niepalącej.' },
  { id: 'p-7', title: 'Szukam współlokatora do mieszkania w Hammersmith', mode: 'rent', type: 'flatshare', price: 950, bedrooms: 1, bathrooms: 1, district: 'hammersmith', location: 'Hammersmith', postcode: 'W6', commuteMin: 18, agency: 'Kasia (najemca)', agencyKind: 'landlord', verified: false, photos: 4, image: 'kitchen', description: 'Duży pokój w mieszkaniu 2-osobowym, 5 min od POSK. Szukam osoby 25–40 lat.' },
  { id: 'p-8', title: 'Wiktoriański dom 4 sypialnie, Richmond', mode: 'sale', type: 'house', price: 1150000, bedrooms: 4, bathrooms: 3, district: 'richmond', location: 'Richmond', postcode: 'TW9', commuteMin: 32, agency: 'PrimeMove London', agencyKind: 'agency', verified: true, featured: true, photos: 18, image: 'house-modern', description: 'Odrestaurowany dom z ogrodem, blisko Richmond Park. Doradztwo po polsku.' },
  { id: 'p-9', title: 'Mieszkanie 2 sypialnie z balkonem – Greenwich', mode: 'sale', type: 'flat', price: 525000, bedrooms: 2, bathrooms: 1, district: 'greenwich', location: 'Greenwich', postcode: 'SE10', commuteMin: 24, agency: 'Riverside Estates', agencyKind: 'agency', verified: true, photos: 11, image: 'living-4', description: 'Widok na Tamizę, parking, 10 minut do DLR Cutty Sark.' },
  { id: 'p-10', title: 'Dom szeregowy 3 sypialnie, Hounslow – dla rodziny', mode: 'sale', type: 'house', price: 465000, bedrooms: 3, bathrooms: 1, district: 'hounslow', location: 'Hounslow', postcode: 'TW3', commuteMin: 38, agency: 'PrimeMove London', agencyKind: 'agency', verified: true, isNew: true, photos: 14, image: 'house', description: 'Odnowiona kuchnia, ogród, blisko szkół i Heathrow.' },
  { id: 'p-11', title: 'Studio z antresolą w Kingston', mode: 'sale', type: 'studio', price: 260000, bedrooms: 0, bathrooms: 1, district: 'kingston', location: 'Kingston', postcode: 'KT1', commuteMin: 35, agency: 'Thames Homes', agencyKind: 'agency', verified: false, photos: 7, image: 'living-5', description: 'Idealne na pierwszą nieruchomość lub inwestycję.' },
  { id: 'p-12', title: 'Pokój z łazienką en-suite w Camden', mode: 'rent', type: 'room', price: 1100, bedrooms: 1, bathrooms: 1, district: 'camden', location: 'Camden', postcode: 'NW1', commuteMin: 12, agency: 'Urban Rooms', agencyKind: 'agency', verified: true, photos: 7, image: 'bedroom', description: 'Prywatna łazienka, sprzątanie części wspólnych w cenie.' },
]);

export const AGENCIES = [
  {
    name: 'PrimeMove London',
    claim: 'Twoje zaufane biuro nieruchomości w Londynie',
    points: ['Mieszkania na wynajem i sprzedaż', 'Profesjonalne doradztwo po polsku', 'Sprawdzeni wynajmujący', 'Pomoc w formalnościach'],
  },
];

export const propertyById = (id: string) => PROPERTIES.find((p) => p.id === id);
