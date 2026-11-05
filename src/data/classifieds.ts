// DEMO DATA – example classifieds. Replace with Londynek classifieds API.
import type { Accent, ClassifiedCategory, Listing } from '@/types';
import { attachGeo } from './geo';

export interface CategoryMeta {
  id: ClassifiedCategory;
  label: string;
  short: string;
  description: string;
  icon: string;
  to: string;
  /** Demo total shown in navigation */
  total: number;
}

export const CLASSIFIED_CATEGORIES: CategoryMeta[] = [
  { id: 'nieruchomosci', label: 'Nieruchomości', short: 'Pokoje', description: 'Pokoje, mieszkania, domy', icon: 'Home', to: '/ogloszenia/nieruchomosci', total: 256 },
  { id: 'praca', label: 'Pracę oferują', short: 'Praca', description: 'Oferty pracy w UK', icon: 'Briefcase', to: '/ogloszenia/praca', total: 239 },
  { id: 'kandydaci', label: 'Profile kandydatów', short: 'Kandydaci', description: 'Szukasz pracownika?', icon: 'UserSearch', to: '/ogloszenia/kandydaci', total: 304 },
  { id: 'uslugi', label: 'Usługi', short: 'Usługi', description: 'Budowa, transport, inne', icon: 'Wrench', to: '/ogloszenia/uslugi', total: 200 },
  { id: 'motoryzacja', label: 'Motoryzacja', short: 'Motoryzacja', description: 'Auta, części', icon: 'Car', to: '/ogloszenia/motoryzacja', total: 15 },
  { id: 'kupie-sprzedam', label: 'Kupię & Sprzedam', short: 'Sprzedaż', description: 'Rzeczy z drugiej ręki', icon: 'ShoppingBag', to: '/ogloszenia/kupie-sprzedam', total: 49 },
  { id: 'towarzyskie', label: 'Towarzyskie', short: 'Towarzyskie', description: 'Grupy, hobby, spotkania', icon: 'Users', to: '/ogloszenia/towarzyskie', total: 60 },
];

export const CATEGORY_ACCENT: Record<ClassifiedCategory, Accent> = {
  nieruchomosci: 'housing',
  praca: 'jobs',
  kandydaci: 'jobs',
  uslugi: 'services',
  motoryzacja: 'navy',
  'kupie-sprzedam': 'help',
  towarzyskie: 'events',
};

export const categoryMeta = (id: ClassifiedCategory) => CLASSIFIED_CATEGORIES.find((c) => c.id === id)!;

const CLASSIFIEDS_RAW: Listing[] = [
  { id: 'l-1', category: 'nieruchomosci', subcategory: 'Do wynajęcia', title: 'Piękny pokój double w Stratford – blisko metra', description: 'Przestronny, jasny pokój w nowoczesnym mieszkaniu. Blisko stacji, sklepy w pobliżu. Dostępny od zaraz.', image: 'bedroom', location: 'Stratford, Londyn', postcode: 'E15', region: 'east', priceLabel: '£750/mies.', price: 750, postedAgo: 'Dzisiaj, 10:24', postedHours: 5, promoted: true, verified: true, seller: 'private', attributes: ['Pokój double', 'Dla 1 osoby', 'Internet w cenie'] },
  { id: 'l-2', category: 'motoryzacja', subcategory: 'Sprzedam', title: 'Ford Transit Custom 2.0 TDCi, 2020 rok', description: 'Świetny stan, niski przebieg, regularnie serwisowany. Gotowy do pracy. Faktura VAT.', image: 'car-garage', location: 'Southall, Londyn', postcode: 'UB2', region: 'west', priceLabel: '£12 500', price: 12500, postedAgo: 'Wczoraj, 18:02', postedHours: 21, seller: 'business', condition: 'used', attributes: ['125 000 mil', 'Diesel', 'Manualna'] },
  { id: 'l-3', category: 'praca', subcategory: 'Pełny etat', title: 'Hydraulik – stała praca w Londynie', description: 'Firma instalacyjna poszukuje doświadczonego hydraulika. Atrakcyjne wynagrodzenie, szkolenia, stała współpraca.', image: 'electrician', location: 'Londyn i okolice', region: 'central', priceLabel: '£18–£25/h', price: 18, postedAgo: 'Wczoraj, 14:30', postedHours: 25, verified: true, seller: 'business', attributes: ['Pełny etat', 'Od zaraz', 'CSCS'] },
  { id: 'l-4', category: 'kupie-sprzedam', subcategory: 'Meble', title: 'Narożnik IKEA w bardzo dobrym stanie', description: 'Wygodny narożnik z funkcją spania, kolor szary. Możliwy transport.', image: 'sofa', location: 'Hammersmith, Londyn', postcode: 'W6', region: 'west', priceLabel: '£250', price: 250, postedAgo: '3 dni temu', postedHours: 72, seller: 'private', condition: 'used', attributes: ['Używane', 'Możliwy transport'] },
  { id: 'l-5', category: 'uslugi', subcategory: 'Sprzątanie', title: 'Profesjonalne sprzątanie domów i biur', description: 'Solidnie, rzetelnie, konkurencyjne ceny. Sprzątanie regularne i jednorazowe. Wolne terminy od zaraz.', image: 'cleaning', location: 'Londyn i okolice', region: 'central', priceLabel: 'Do ustalenia', price: null, postedAgo: '3 dni temu', postedHours: 74, verified: true, seller: 'business', attributes: ['Firma', 'Dojazd do klienta'] },
  { id: 'l-6', category: 'praca', subcategory: 'Gastronomia', title: 'Kucharz do restauracji w centrum Londynu', description: 'Restauracja w Soho zatrudni kucharza z doświadczeniem. Praca zmianowa, posiłki, napiwki.', image: 'restaurant', location: 'Soho, Londyn', postcode: 'W1', region: 'central', priceLabel: '£15–£17/h', price: 15, postedAgo: '2 godz. temu', postedHours: 2, seller: 'business', attributes: ['Zmiany', 'Od zaraz'] },
  { id: 'l-7', category: 'nieruchomosci', subcategory: 'Do wynajęcia', title: 'Pokój jednoosobowy w Wembley', description: 'Pokój single w spokojnym domu, 5 minut od Wembley Park. Rachunki w cenie.', image: 'living-5', location: 'Wembley, Londyn', postcode: 'HA9', region: 'north', priceLabel: '£650/mies.', price: 650, postedAgo: '4 godz. temu', postedHours: 4, seller: 'private', attributes: ['Pokój single', 'Rachunki w cenie'] },
  { id: 'l-8', category: 'uslugi', subcategory: 'Transport', title: 'Przeprowadzki Londyn i okolice – konkurencyjne ceny', description: 'Van z kierowcą, pomoc przy noszeniu, ubezpieczenie ładunku. Także przeprowadzki do Polski.', image: 'moving', location: 'Cały Londyn', region: 'central', priceLabel: 'od £40/h', price: 40, postedAgo: '6 godz. temu', postedHours: 6, promoted: true, verified: true, seller: 'business', attributes: ['Firma', 'Ubezpieczenie'] },
  { id: 'l-9', category: 'motoryzacja', subcategory: 'Sprzedam', title: 'Sprzedam BMW 3 Series 2016, niski przebieg', description: 'Pełna historia serwisowa, ULEZ compliant, nowe opony.', image: 'car-bmw', location: 'Croydon, Londyn', postcode: 'CR0', region: 'south', priceLabel: '£9 800', price: 9800, postedAgo: '8 godz. temu', postedHours: 8, seller: 'private', condition: 'used', attributes: ['58 000 mil', 'Diesel', 'Automat'] },
  { id: 'l-10', category: 'uslugi', subcategory: 'Beauty', title: 'Paznokcie, rzęsy, brwi – profesjonalnie', description: 'Stylizacja paznokci, przedłużanie rzęs, laminacja brwi. Salon w Ealingu lub dojazd.', image: 'nails', location: 'Ealing, Londyn', postcode: 'W5', region: 'west', priceLabel: 'od £25', price: 25, postedAgo: '10 godz. temu', postedHours: 10, seller: 'business', attributes: ['Salon', 'Dojazd'] },
  { id: 'l-11', category: 'nieruchomosci', subcategory: 'Do wynajęcia', title: 'Dwuosobowy pokój w spokojnej okolicy', description: 'Duży pokój double z szafą wnękową, ogród, blisko Overground.', image: 'living-3', location: 'Stratford, Londyn', postcode: 'E15', region: 'east', priceLabel: '£820/mies.', price: 820, postedAgo: '12 godz. temu', postedHours: 12, seller: 'private', attributes: ['Pokój double', 'Ogród'] },
  { id: 'l-12', category: 'towarzyskie', subcategory: 'Wymiana językowa', title: 'Language exchange: polski ⇄ angielski w Camden', description: 'Co środę o 19:00 spotykamy się w kawiarni w Camden. Wszystkie poziomy mile widziane.', image: 'study-group', location: 'Camden, Londyn', postcode: 'NW1', region: 'north', priceLabel: 'Bezpłatnie', price: 0, postedAgo: 'Dzisiaj, 09:10', postedHours: 6, seller: 'private', attributes: ['Co tydzień', 'Bezpłatnie'] },
  { id: 'l-13', category: 'kupie-sprzedam', subcategory: 'Elektronika', title: 'iPhone 14, 128 GB, stan idealny + etui', description: 'Bateria 91%, bez rys. Komplet z pudełkiem.', image: 'electronics', location: 'Ealing, Londyn', postcode: 'W5', region: 'west', priceLabel: '£390', price: 390, postedAgo: '5 godz. temu', postedHours: 5, seller: 'private', condition: 'used', attributes: ['Używane', 'Odbiór osobisty'] },
  { id: 'l-14', category: 'kupie-sprzedam', subcategory: 'Dom', title: 'Fotel welurowy, musztardowy – nowy', description: 'Nieużywany, zamówiony w złym kolorze. Odbiór w Greenwich.', image: 'chair', location: 'Greenwich, Londyn', postcode: 'SE10', region: 'south', priceLabel: '£120', price: 120, postedAgo: 'Wczoraj', postedHours: 30, seller: 'private', condition: 'new', attributes: ['Nowe'] },
  { id: 'l-15', category: 'kupie-sprzedam', subcategory: 'Ogród', title: 'Zestaw narzędzi ogrodowych + ziemia do warzywnika', description: 'Szpadel, grabie, sekator i 6 worków kompostu.', image: 'garden', location: 'Richmond, Londyn', postcode: 'TW9', region: 'west', priceLabel: '£45', price: 45, postedAgo: '2 dni temu', postedHours: 50, seller: 'private', condition: 'used', attributes: ['Używane'] },
  { id: 'l-16', category: 'kupie-sprzedam', subcategory: 'Dzieci', title: 'Farby, sztalugi i zestaw plastyczny dla dzieci', description: 'Idealne na prezent dla dziecka 4–8 lat.', image: 'kids', location: 'Wembley, Londyn', postcode: 'HA9', region: 'north', priceLabel: '£20', price: 20, postedAgo: '3 dni temu', postedHours: 75, seller: 'private', condition: 'used', attributes: ['Używane'] },
  { id: 'l-17', category: 'kupie-sprzedam', subcategory: 'Sport', title: 'Buty do biegania Nike Pegasus, rozm. 43', description: 'Przebiegnięte ok. 50 km, stan bardzo dobry.', image: 'sport-run', location: 'Hackney, Londyn', postcode: 'E8', region: 'east', priceLabel: '£35', price: 35, postedAgo: '4 dni temu', postedHours: 98, seller: 'private', condition: 'used', attributes: ['Używane'] },
  { id: 'l-18', category: 'kupie-sprzedam', subcategory: 'Meble', title: 'Stół kuchenny z 4 krzesłami – dąb', description: 'Solidny, lekkie ślady użytkowania.', image: 'kitchen-2', location: 'Croydon, Londyn', postcode: 'CR0', region: 'south', priceLabel: '£150', price: 150, postedAgo: '5 dni temu', postedHours: 120, seller: 'private', condition: 'used', attributes: ['Używane', 'Odbiór osobisty'] },
  { id: 'l-19', category: 'kupie-sprzedam', subcategory: 'Inne', title: 'Polskie książki – 40 tytułów, kryminały i reportaże', description: 'Oddam w dobre ręce za symboliczną kwotę.', image: 'books', location: 'Hammersmith, Londyn', postcode: 'W6', region: 'west', priceLabel: '£30', price: 30, postedAgo: 'Wczoraj', postedHours: 28, seller: 'private', condition: 'used', attributes: ['Używane'] },
  { id: 'l-20', category: 'towarzyskie', subcategory: 'Sport', title: 'Polska drużyna piłkarska szuka zawodników – Sunday League', description: 'Gramy w niedziele na Hackney Marshes. Treningi we wtorki.', image: 'football', location: 'Hackney, Londyn', postcode: 'E8', region: 'east', priceLabel: 'Bezpłatnie', price: 0, postedAgo: 'Wczoraj', postedHours: 26, seller: 'private', attributes: ['Co tydzień'] },
  { id: 'l-21', category: 'towarzyskie', subcategory: 'Grupy lokalne', title: 'Mamy z Ealingu – spotkania przy kawie i zabawy dla dzieci', description: 'Grupa dla polskich rodziców z dziećmi 0–5 lat.', image: 'friends', location: 'Ealing, Londyn', postcode: 'W5', region: 'west', priceLabel: 'Bezpłatnie', price: 0, postedAgo: '2 dni temu', postedHours: 52, seller: 'private', attributes: ['Rodzina'] },
  { id: 'l-22', category: 'towarzyskie', subcategory: 'Aktywności', title: 'Weekendowe wędrówki po Surrey Hills – dołącz!', description: 'Raz w miesiącu wyjeżdżamy pociągiem na całodniowy trekking.', image: 'friends-sunset', location: 'Kingston, Londyn', postcode: 'KT1', region: 'south', priceLabel: 'Koszt biletu', price: 0, postedAgo: '3 dni temu', postedHours: 70, seller: 'private', attributes: ['Raz w miesiącu'] },
  { id: 'l-23', category: 'towarzyskie', subcategory: 'Poznaj ludzi', title: 'Nowi w Londynie? Spotkanie integracyjne w POSK-u', description: 'Dla osób, które przyjechały niedawno. Rozmowy, porady, nowe znajomości.', image: 'friends-selfie', location: 'Hammersmith, Londyn', postcode: 'W6', region: 'west', priceLabel: 'Bezpłatnie', price: 0, postedAgo: '4 dni temu', postedHours: 95, seller: 'private', attributes: ['Jednorazowe'] },
  { id: 'l-24', category: 'towarzyskie', subcategory: 'Grupy społeczne', title: 'Wolontariusze do polskiej biblioteki w POSK', description: 'Pomoc przy katalogowaniu i wydarzeniach dla dzieci, 2–4 h tygodniowo.', image: 'books', location: 'Hammersmith, Londyn', postcode: 'W6', region: 'west', priceLabel: 'Wolontariat', price: 0, postedAgo: '5 dni temu', postedHours: 118, seller: 'business', attributes: ['Wolontariat'] },
  { id: 'l-25', category: 'nieruchomosci', subcategory: 'Do wynajęcia', title: 'Nowoczesne mieszkanie 2 pokoje w Wembley', description: 'Balkon, winda, parking. Blisko Wembley Park.', image: 'flat-living-1', location: 'Wembley, Londyn', postcode: 'HA9', region: 'north', priceLabel: '£1 450/mies.', price: 1450, postedAgo: 'Wczoraj', postedHours: 22, promoted: true, verified: true, seller: 'business', attributes: ['2 sypialnie', 'Balkon'] },
  { id: 'l-26', category: 'praca', subcategory: 'Magazyn', title: 'Pracownik magazynu – zmiany nocne, Heathrow', description: 'Kompletowanie zamówień, praca od zaraz, tygodniowe wypłaty.', image: 'warehouse', location: 'Heathrow, Londyn', postcode: 'TW6', region: 'west', priceLabel: '£13,50/h', price: 13.5, postedAgo: '1 godz. temu', postedHours: 1, seller: 'business', attributes: ['Zmiany nocne', 'Od zaraz'] },
];

export const CLASSIFIEDS: Listing[] = attachGeo(CLASSIFIEDS_RAW);

export const classifiedById = (id: string) => CLASSIFIEDS.find((l) => l.id === id);
export const classifiedsIn = (category: ClassifiedCategory) => CLASSIFIEDS.filter((l) => l.category === category);
