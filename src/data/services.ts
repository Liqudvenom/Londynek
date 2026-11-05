// DEMO DATA – fictional businesses for the local directory.
import type { Service } from '@/types';
import { attachGeo } from './geo';

export const SERVICE_CATEGORIES = [
  { id: 'Budowa', icon: 'Hammer' },
  { id: 'Transport', icon: 'Truck' },
  { id: 'Sprzątanie', icon: 'Sparkles' },
  { id: 'Naprawy', icon: 'Wrench' },
  { id: 'Prawo', icon: 'Scale' },
  { id: 'Księgowość', icon: 'Receipt' },
  { id: 'Zdrowie', icon: 'Stethoscope' },
  { id: 'Beauty', icon: 'Star' },
  { id: 'Edukacja', icon: 'GraduationCap' },
  { id: 'IT', icon: 'Laptop' },
  { id: 'Sklepy', icon: 'Store' },
] as const;

export const BUSINESS_TYPES = [
  { label: 'Polskie sklepy', icon: 'Store', to: '/ogloszenia/uslugi?kategoria=Sklepy', count: 86 },
  { label: 'Prawnicy', icon: 'Scale', to: '/ogloszenia/uslugi?kategoria=Prawo', count: 34 },
  { label: 'Księgowi', icon: 'Receipt', to: '/ogloszenia/uslugi?kategoria=Księgowość', count: 52 },
  { label: 'Lekarze', icon: 'Stethoscope', to: '/ogloszenia/uslugi?kategoria=Zdrowie', count: 41 },
  { label: 'Dentyści', icon: 'HeartPulse', to: '/ogloszenia/uslugi?kategoria=Zdrowie', count: 27 },
  { label: 'Remonty', icon: 'Hammer', to: '/ogloszenia/uslugi?kategoria=Budowa', count: 148 },
  { label: 'Transport', icon: 'Truck', to: '/ogloszenia/uslugi?kategoria=Transport', count: 73 },
  { label: 'Szkoły', icon: 'GraduationCap', to: '/ogloszenia/uslugi?kategoria=Edukacja', count: 29 },
];

export const SERVICES: Service[] = attachGeo<Service>([
  { id: 's-1', name: 'Remonty Kowalczyk', category: 'Budowa', tagline: 'Kompleksowe remonty, łazienki i kuchnie', location: 'Ealing, W5', region: 'west', rating: 4.9, reviews: 48, verified: true, availability: 'Wolne terminy od 14.10', priceFrom: 'Wycena gratis', image: 'construction', polishSpeaking: true, sponsored: true },
  { id: 's-2', name: 'MoveIt Przeprowadzki', category: 'Transport', tagline: 'Przeprowadzki Londyn – Polska, van z kierowcą', location: 'Cały Londyn', region: 'central', rating: 4.8, reviews: 112, verified: true, availability: 'Dostępne jutro', priceFrom: 'od £40/h', image: 'moving', polishSpeaking: true },
  { id: 's-3', name: 'BrightClean', category: 'Sprzątanie', tagline: 'Sprzątanie domów, biur i po remoncie', location: 'Stratford, E15', region: 'east', rating: 4.7, reviews: 86, verified: true, availability: 'Dostępne dziś', priceFrom: 'od £18/h', image: 'cleaning', polishSpeaking: true },
  { id: 's-4', name: 'Złota Rączka Marek', category: 'Naprawy', tagline: 'Drobne naprawy, montaż mebli, elektryka', location: 'Hammersmith, W6', region: 'west', rating: 4.9, reviews: 64, verified: false, availability: 'Wolne terminy w weekend', priceFrom: 'od £30/h', image: 'electrician', polishSpeaking: true },
  { id: 's-5', name: 'Nowak Solicitors', category: 'Prawo', tagline: 'Prawo imigracyjne, najem, rodzina', location: 'Central London, WC2', region: 'central', rating: 4.8, reviews: 39, verified: true, availability: 'Konsultacje online', priceFrom: 'od £90', image: 'documents', polishSpeaking: true, sponsored: true },
  { id: 's-6', name: 'Kowalski & Co Accountants', category: 'Księgowość', tagline: 'Self Assessment, CIS, spółki Ltd', location: 'Ealing, W5', region: 'west', rating: 4.9, reviews: 151, verified: true, availability: 'Wolne terminy od 9.10', priceFrom: 'od £120', image: 'accounting', polishSpeaking: true },
  { id: 's-7', name: 'Przychodnia Medicus', category: 'Zdrowie', tagline: 'Polscy lekarze rodzinni i specjaliści', location: 'Hammersmith, W6', region: 'west', rating: 4.6, reviews: 203, verified: true, availability: 'Wizyty dziś', priceFrom: 'od £65', image: 'xray', polishSpeaking: true },
  { id: 's-8', name: 'Smile Dental Clinic', category: 'Zdrowie', tagline: 'Stomatologia, implanty, higienizacja', location: 'Wembley, HA9', region: 'north', rating: 4.8, reviews: 97, verified: true, availability: 'Wolne terminy od 10.10', priceFrom: 'od £50', image: 'dentist', polishSpeaking: true },
  { id: 's-9', name: 'Studio Urody Ola', category: 'Beauty', tagline: 'Paznokcie, rzęsy, brwi', location: 'Ealing, W5', region: 'west', rating: 4.9, reviews: 77, verified: false, availability: 'Dostępne jutro', priceFrom: 'od £25', image: 'nails', polishSpeaking: true },
  { id: 's-10', name: 'Salon Fryzjerski Bella', category: 'Beauty', tagline: 'Strzyżenie, koloryzacja, upięcia', location: 'Croydon, CR0', region: 'south', rating: 4.7, reviews: 58, verified: true, availability: 'Wolne terminy w sobotę', priceFrom: 'od £30', image: 'salon', polishSpeaking: true },
  { id: 's-11', name: 'Szkoła Językowa Bridge', category: 'Edukacja', tagline: 'Angielski dla dorosłych, przygotowanie do IELTS', location: 'Online / Camden', region: 'north', rating: 4.8, reviews: 44, verified: true, availability: 'Zapisy na listopad', priceFrom: 'od £20/lekcja', image: 'study-group', polishSpeaking: true },
  { id: 's-12', name: 'PC Serwis Londyn', category: 'IT', tagline: 'Naprawa laptopów, strony www, sieci', location: 'Stratford, E15', region: 'east', rating: 4.6, reviews: 31, verified: false, availability: 'Dostępne dziś', priceFrom: 'od £35', image: 'it', polishSpeaking: true },
  { id: 's-13', name: 'Polskie Smaki Delikatesy', category: 'Sklepy', tagline: 'Polskie pieczywo, wędliny i nabiał codziennie', location: 'Hammersmith, W6', region: 'west', rating: 4.7, reviews: 182, verified: true, availability: 'Otwarte dziś do 21:00', priceFrom: 'Dostawa od £4', image: 'grocery', polishSpeaking: true },
  { id: 's-14', name: 'Słodka Chwila Cukiernia', category: 'Sklepy', tagline: 'Torty na zamówienie, pączki i sernik', location: 'Ealing, W5', region: 'west', rating: 4.9, reviews: 96, verified: false, availability: 'Zamówienia z 2-dniowym wyprzedzeniem', priceFrom: 'od £25', image: 'sweets', polishSpeaking: true },
]);

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
