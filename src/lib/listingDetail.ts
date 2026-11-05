import { CATEGORY_ACCENT, CLASSIFIEDS, categoryMeta, classifiedById } from '@/data/classifieds';
import { PROPERTIES, PROPERTY_TYPE_LABEL, propertyById } from '@/data/properties';
import { CANDIDATES, CONTRACT_LABEL, ENGLISH_LABEL, JOBS, SCHEDULE_LABEL, candidateById, jobById } from '@/data/jobs';
import { SERVICES, serviceById } from '@/data/services';
import { VEHICLES, vehicleById } from '@/data/vehicles';
import { BUSINESSES, BUSINESS_CATEGORY_LABEL, businessById } from '@/data/businesses';
import { districtById } from '@/data/districts';
import { coordsFor } from '@/lib/geo';
import { formatGBP, formatNumber } from '@/lib/format';
import { mapPoint } from '@/lib/mapProjection';
import type { ImageName } from '@/data/images.generated';
import type { Accent, GeoLocation, RegionId } from '@/types';

export interface RelatedItem {
  id: string;
  title: string;
  priceLabel: string;
  image: ImageName | null;
}

export interface ListingDetail {
  id: string;
  kind: 'classified' | 'property' | 'job' | 'candidate' | 'service' | 'vehicle' | 'business';
  /** Classified sub-type, e.g. 'nieruchomosci' – picks the location heading */
  subKind?: string;
  title: string;
  geo?: GeoLocation;
  /** Seed entry about a real place */
  seed?: boolean;
  category: { label: string; to: string };
  accent: Accent;
  image: ImageName | null;
  priceLabel: string;
  location: string;
  postcode?: string;
  map: { x: number; y: number };
  posted?: string;
  facts: [string, string][];
  tags: string[];
  description: string[];
  seller: { name: string; kind: string; verified: boolean };
  promoted: boolean;
  contactLabel: string;
  related: RelatedItem[];
}

const regionFromDistrict = (id: string): RegionId => districtById(id)?.region ?? 'central';

function fromClassified(id: string): ListingDetail | null {
  const l = classifiedById(id);
  if (!l) return null;
  const meta = categoryMeta(l.category);
  return {
    id,
    kind: 'classified',
    subKind: l.category,
    title: l.title,
    geo: l.geo,
    category: { label: meta.label, to: meta.to },
    accent: CATEGORY_ACCENT[l.category],
    image: l.image,
    priceLabel: l.priceLabel,
    location: l.location,
    postcode: l.postcode,
    map: coordsFor(l.location, l.region),
    posted: l.postedAgo,
    facts: [
      ['Kategoria', `${meta.label} › ${l.subcategory}`],
      ...(l.condition ? ([['Stan', l.condition === 'new' ? 'Nowe' : 'Używane']] as [string, string][]) : []),
      ['Ogłoszeniodawca', l.seller === 'private' ? 'Osoba prywatna' : 'Firma'],
      ['Numer ogłoszenia', l.id.toUpperCase()],
    ],
    tags: l.attributes,
    description: [l.description, 'Skontaktuj się przez formularz w serwisie – odpowiadam zwykle tego samego dnia.'],
    seller: { name: l.seller === 'private' ? 'Użytkownik Londynka' : 'Firma zweryfikowana', kind: l.seller === 'private' ? 'Osoba prywatna' : 'Firma', verified: Boolean(l.verified) },
    promoted: Boolean(l.promoted),
    contactLabel: 'Napisz wiadomość',
    related: CLASSIFIEDS.filter((x) => x.category === l.category && x.id !== id)
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.title, priceLabel: x.priceLabel, image: x.image })),
  };
}

function fromProperty(id: string): ListingDetail | null {
  const p = propertyById(id);
  if (!p) return null;
  const district = districtById(p.district);
  const priceLabel = p.mode === 'rent' ? `${formatGBP(p.price)} / miesiąc` : formatGBP(p.price);
  return {
    id,
    kind: 'property',
    title: p.title,
    geo: p.geo,
    category: { label: 'Nieruchomości', to: '/ogloszenia/nieruchomosci' },
    accent: 'housing',
    image: p.image,
    priceLabel,
    location: p.location,
    postcode: p.postcode,
    map: district?.map ?? coordsFor(p.location, regionFromDistrict(p.district)),
    facts: [
      ['Oferta', p.mode === 'rent' ? 'Wynajem' : 'Sprzedaż'],
      ['Typ', PROPERTY_TYPE_LABEL[p.type]],
      ['Sypialnie', p.bedrooms === 0 ? 'Studio' : String(p.bedrooms)],
      ['Łazienki', String(p.bathrooms)],
      ['Zdjęcia', String(p.photos)],
    ],
    tags: [p.verified ? 'Sprawdzony wynajmujący' : 'Niezweryfikowany', ...(p.isNew ? ['Nowe ogłoszenie'] : [])],
    description: [p.description, district ? `${district.name}: ${district.profile.toLowerCase()}. Transport: ${district.transport}.` : ''].filter(Boolean),
    seller: { name: p.agency, kind: p.agencyKind === 'agency' ? 'Agencja nieruchomości' : 'Osoba prywatna', verified: p.verified },
    promoted: Boolean(p.featured),
    contactLabel: 'Umów oglądanie',
    related: PROPERTIES.filter((x) => x.mode === p.mode && x.id !== id)
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.title, priceLabel: x.mode === 'rent' ? `${formatGBP(x.price)}/mies.` : formatGBP(x.price), image: x.image })),
  };
}

function fromJob(id: string): ListingDetail | null {
  const j = jobById(id);
  if (!j) return null;
  return {
    id,
    kind: 'job',
    title: j.title,
    geo: j.geo,
    category: { label: 'Praca', to: '/ogloszenia/praca' },
    accent: 'jobs',
    image: null,
    priceLabel: j.salaryLabel,
    location: j.location,
    map: coordsFor(j.location, j.region),
    posted: j.postedAgo,
    facts: [
      ['Pracodawca', j.company],
      ['Branża', j.industry],
      ['Umowa', CONTRACT_LABEL[j.contract]],
      ['Wymiar', SCHEDULE_LABEL[j.schedule]],
      ['Angielski', ENGLISH_LABEL[j.english]],
      ['Sponsoring wizy', j.visaSponsor ? 'Tak' : 'Nie'],
    ],
    tags: [j.polishSpeaking ? 'Język polski w pracy' : 'Środowisko anglojęzyczne', ...(j.isNew ? ['Nowa oferta'] : [])],
    description: [
      `${j.company} szuka osoby na stanowisko: ${j.title.toLowerCase()}. Praca w lokalizacji ${j.location}.`,
      'Oferujemy terminowe wypłaty, szkolenie na start i możliwość nadgodzin. Wymagane prawo do pracy w UK (settled/pre-settled status lub wiza).',
    ],
    seller: { name: j.company, kind: 'Pracodawca', verified: Boolean(j.promoted) },
    promoted: Boolean(j.promoted),
    contactLabel: 'Aplikuj teraz',
    related: JOBS.filter((x) => x.industry === j.industry && x.id !== id)
      .concat(JOBS.filter((x) => x.industry !== j.industry))
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.title, priceLabel: x.salaryLabel, image: null })),
  };
}

function fromCandidate(id: string): ListingDetail | null {
  const c = candidateById(id);
  if (!c) return null;
  return {
    id,
    kind: 'candidate',
    title: `${c.name} – ${c.profession}`,
    category: { label: 'Kandydaci', to: '/ogloszenia/kandydaci' },
    accent: 'jobs',
    image: c.avatar,
    priceLabel: c.rate,
    location: c.location,
    map: coordsFor(c.location, 'central'),
    facts: [
      ['Zawód', c.profession],
      ['Dostępność', c.availability],
      ['Oczekiwana stawka', c.rate],
      ['Dopasowanie', `${c.match}%`],
    ],
    tags: c.skills,
    description: [`Doświadczony kandydat z umiejętnościami: ${c.skills.join(', ')}. Szuka pracy w okolicy ${c.location}.`, 'Pełne CV udostępniane po kontakcie przez serwis.'],
    seller: { name: c.name, kind: 'Kandydat', verified: Boolean(c.verified) },
    promoted: false,
    contactLabel: 'Zaproś do rozmowy',
    related: CANDIDATES.filter((x) => x.id !== id)
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: `${x.name} – ${x.profession}`, priceLabel: x.rate, image: x.avatar })),
  };
}

function fromService(id: string): ListingDetail | null {
  const s = serviceById(id);
  if (!s) return null;
  return {
    id,
    kind: 'service',
    title: s.name,
    geo: s.geo,
    category: { label: 'Usługi', to: `/ogloszenia/uslugi?kategoria=${encodeURIComponent(s.category)}` },
    accent: 'services',
    image: s.image,
    priceLabel: s.priceFrom,
    location: s.location,
    map: coordsFor(s.location, s.region),
    facts: [
      ['Kategoria', s.category],
      ['Ocena', `${s.rating.toFixed(1)} / 5 (${s.reviews} opinii)`],
      ['Dostępność', s.availability],
      ['Obsługa po polsku', s.polishSpeaking ? 'Tak' : 'Nie'],
    ],
    tags: [s.verified ? 'Zweryfikowana firma' : 'Firma niezweryfikowana', ...(s.sponsored ? ['Sponsorowane'] : [])],
    description: [`${s.tagline}.`, 'Bezpłatna wycena po krótkiej rozmowie. Działamy na terenie Londynu i okolic.'],
    seller: { name: s.name, kind: 'Firma', verified: s.verified },
    promoted: Boolean(s.sponsored),
    contactLabel: 'Poproś o wycenę',
    related: SERVICES.filter((x) => x.category === s.category && x.id !== id)
      .concat(SERVICES.filter((x) => x.category !== s.category))
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.name, priceLabel: x.priceFrom, image: x.image })),
  };
}

function fromVehicle(id: string): ListingDetail | null {
  const v = vehicleById(id);
  if (!v) return null;
  return {
    id,
    kind: 'vehicle',
    title: v.title,
    geo: v.geo,
    category: { label: 'Motoryzacja', to: '/ogloszenia/motoryzacja' },
    accent: 'navy',
    image: v.image,
    priceLabel: formatGBP(v.price),
    location: v.location,
    map: coordsFor(v.location, 'west'),
    posted: v.postedAgo,
    facts: [
      ['Marka / model', `${v.make} ${v.model}`],
      ['Rocznik', String(v.year)],
      ['Przebieg', `${formatNumber(v.mileage)} mil`],
      ['Paliwo', v.fuel],
      ['Skrzynia', v.transmission],
      ['ULEZ', v.ulez ? 'Zgodny' : 'Niezgodny'],
    ],
    tags: [v.sellerType === 'business' ? 'Dealer' : 'Sprzedaż prywatna'],
    description: [`${v.title}, rocznik ${v.year}. Regularnie serwisowany, ważne MOT.`, 'Zachęcam do oględzin i jazdy próbnej. Przed zakupem sprawdź historię pojazdu (HPI check).'],
    seller: { name: v.seller, kind: v.sellerType === 'business' ? 'Dealer' : 'Osoba prywatna', verified: v.sellerType === 'business' },
    promoted: Boolean(v.promoted),
    contactLabel: 'Zapytaj o auto',
    related: VEHICLES.filter((x) => x.id !== id)
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.title, priceLabel: formatGBP(x.price), image: x.image })),
  };
}

function fromBusiness(id: string): ListingDetail | null {
  const b = businessById(id);
  if (!b) return null;
  const category = BUSINESS_CATEGORY_LABEL[b.category];
  return {
    id,
    kind: 'business',
    title: b.name,
    geo: b.geo,
    seed: true,
    category: { label: 'Polskie firmy', to: '/polskie-firmy' },
    accent: 'services',
    image: null,
    priceLabel: category,
    location: `${b.geo.district}, ${b.geo.borough}`,
    postcode: b.geo.postcode,
    map: mapPoint(b.geo.lat, b.geo.lng),
    facts: [
      ['Adres', `${b.geo.address}, London ${b.geo.postcode}`],
      ['Dzielnica', `${b.geo.district} (${b.geo.borough})`],
      ['Kategoria', category],
    ],
    tags: ['Wpis demonstracyjny'],
    description: [
      `${b.name} – publicznie dostępny adres w dzielnicy ${b.geo.district}. Wpis służy wyłącznie do pokazania katalogu firm, mapy i planowania dojazdu.`,
      'Nie jest to reklama ani partner Londynek.net. Godzin otwarcia i opinii nie podajemy, bo nie mamy zweryfikowanych danych.',
    ],
    seller: { name: b.name, kind: 'Firma (dane demonstracyjne)', verified: false },
    promoted: false,
    contactLabel: 'Zapytaj o wpis',
    related: BUSINESSES.filter((x) => x.id !== id && x.category === b.category)
      .slice(0, 4)
      .map((x) => ({ id: x.id, title: x.name, priceLabel: BUSINESS_CATEGORY_LABEL[x.category], image: null })),
  };
}

const RESOLVERS = [fromClassified, fromProperty, fromJob, fromCandidate, fromService, fromVehicle, fromBusiness];

export function resolveListing(id: string): ListingDetail | null {
  for (const resolve of RESOLVERS) {
    const found = resolve(id);
    if (found) return found;
  }
  return null;
}
