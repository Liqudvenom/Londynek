// DEMO DATA – FAQ, promotions and ad creatives. Brands are fictional; sponsored items are labelled.
import type { AdCreative, FaqItem, Promotion } from '@/types';

export const FAQ: FaqItem[] = [
  { id: 'f-1', category: 'Ogłoszenia', q: 'Czy dodanie ogłoszenia jest bezpłatne?', a: 'Podstawowe ogłoszenie w większości kategorii jest bezpłatne. Płatne są opcje wyróżnienia i promowania.' },
  { id: 'f-2', category: 'Ogłoszenia', q: 'Jak długo ogłoszenie jest widoczne?', a: 'Standardowo 30 dni. Możesz je odnowić z poziomu „Moje ogłoszenia”.' },
  { id: 'f-3', category: 'Ogłoszenia', q: 'Jak edytować lub usunąć ogłoszenie?', a: 'Zaloguj się, przejdź do „Moje ogłoszenia” i wybierz edycję lub usunięcie.' },
  { id: 'f-4', category: 'Konto', q: 'Zapomniałem hasła – co zrobić?', a: 'Kliknij „Nie pamiętam hasła” na stronie logowania. Link do resetu przyjdzie e-mailem.' },
  { id: 'f-5', category: 'Konto', q: 'Jak usunąć konto?', a: 'Napisz do działu technicznego przez formularz kontaktowy. Usuniemy konto i dane zgodnie z UK GDPR.' },
  { id: 'f-6', category: 'Bezpieczeństwo', q: 'Jak rozpoznać oszustwo w ogłoszeniu?', a: 'Nie płać z góry za obejrzenie mieszkania, nie wysyłaj kopii dokumentów nieznajomym i zgłaszaj podejrzane ogłoszenia.' },
  { id: 'f-7', category: 'Bezpieczeństwo', q: 'Jak zgłosić podejrzane ogłoszenie?', a: 'Użyj przycisku „Zgłoś” przy ogłoszeniu. Moderatorzy sprawdzą je w ciągu 24 godzin.' },
  { id: 'f-8', category: 'Reklama', q: 'Jak zamówić reklamę?', a: 'Wypełnij formularz na stronie Reklama. Przygotujemy ofertę dopasowaną do Twojego budżetu.' },
  { id: 'f-9', category: 'Reklama', q: 'Czy mogę wypromować wydarzenie?', a: 'Tak – oferujemy pakiety promocji wydarzeń, w tym patronat medialny.' },
  { id: 'f-10', category: 'Redakcja', q: 'Jak zgłosić temat do artykułu?', a: 'Skontaktuj się z redakcją przez formularz kontaktowy, wybierając dział „Redakcja”.' },
];

export const PROMOTIONS: Promotion[] = [
  { id: 'pr-1', brand: 'SendHome', category: 'Przekazy pieniężne', title: 'Pierwszy przelew do Polski bez prowizji', description: 'Szybkie i bezpieczne przekazy GBP → PLN.', image: 'money', badge: '0% prowizji', validUntil: '31.10.2026', sponsored: true },
  { id: 'pr-2', brand: 'Polskie Smaki', category: 'Polskie sklepy', title: '-20% na wędliny i nabiał w każdy czwartek', description: 'Oferta w 12 sklepach w Londynie.', image: 'grocery', badge: '-20%', validUntil: '30.11.2026', sponsored: true },
  { id: 'pr-3', brand: 'FlyEast', category: 'Loty', title: 'Loty Londyn – Kraków od £29', description: 'Promocja na listopad i grudzień.', image: 'plane', badge: 'od £29', validUntil: '15.10.2026', sponsored: true },
  { id: 'pr-4', brand: 'SafeHome Insurance', category: 'Ubezpieczenia', title: 'Ubezpieczenie mieszkania z obsługą po polsku', description: 'Pierwszy miesiąc gratis przy płatności rocznej.', image: 'documents', badge: '1 mies. gratis', validUntil: '31.12.2026', sponsored: true },
  { id: 'pr-5', brand: 'Bistro Wisła', category: 'Restauracje', title: 'Pierogi Tuesday – druga porcja za pół ceny', description: 'W każdy wtorek w Soho i Ealingu.', image: 'food', badge: '1+½', validUntil: '31.10.2026', sponsored: false },
  { id: 'pr-6', brand: 'Auto Polonia', category: 'Motoryzacja', title: 'Darmowy przegląd przed MOT', description: 'Przy zakupie auta lub serwisie powyżej £200.', image: 'car-garage', badge: 'Gratis', validUntil: '30.11.2026', sponsored: true },
  { id: 'pr-7', brand: 'Słodki Kącik', category: 'Polskie sklepy', title: 'Pączki i ciasta na zamówienie – dostawa gratis', description: 'Przy zamówieniu powyżej £30 w strefach 1–4.', image: 'sweets', badge: 'Dostawa 0 £', validUntil: '31.10.2026', sponsored: false },
  { id: 'pr-8', brand: 'BrightClean', category: 'Usługi', title: 'Sprzątanie po przeprowadzce -15%', description: 'Z kodem LONDYNEK15.', image: 'cleaning', badge: '-15%', validUntil: '30.11.2026', sponsored: true },
];

export const PROMO_CATEGORIES = ['Polskie sklepy', 'Loty', 'Przekazy pieniężne', 'Ubezpieczenia', 'Restauracje', 'Motoryzacja', 'Usługi'] as const;

export const AD_CREATIVES: Record<'property' | 'food' | 'money' | 'billboard', AdCreative> = {
  property: { advertiser: 'PrimeMove London', headline: 'Nowe inwestycje w Londynie', text: 'Mieszkania na wynajem i na sprzedaż', cta: 'Sprawdź oferty', to: '/ogloszenia/nieruchomosci', image: 'city-towers' },
  food: { advertiser: 'Polskie Smaki', headline: 'Polskie smaki w sercu Londynu', text: 'Restauracje, sklepy i usługi – wspieraj polskie firmy!', cta: 'Zobacz katalog firm', to: '/ogloszenia/uslugi', image: 'food' },
  money: { advertiser: 'SendHome', headline: 'Szybkie i bezpieczne przekazy do Polski', text: '0% prowizji przy pierwszym przelewie', cta: 'Sprawdź kurs', to: '/promocje', image: 'money' },
  billboard: { advertiser: 'FlyEast', headline: 'Święta w domu? Loty do Polski od £29', text: 'Kraków, Gdańsk, Katowice, Wrocław – rezerwuj do 15 października.', cta: 'Zobacz promocje', to: '/promocje', image: 'plane' },
};
