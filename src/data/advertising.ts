// PLACEHOLDERS – replace every [XXX] value with figures from analytics and the commercial price list.
// Do not publish these numbers: they are intentionally not real.

export interface AdFormat {
  name: string;
  spec: string;
  price: string;
}

export interface AdProduct {
  slug: string;
  title: string;
  short: string;
  lead: string;
  icon: string;
  benefits: string[];
  formats: AdFormat[];
  bestFor: string[];
}

export const AUDIENCE_METRICS = [
  { value: '[XXX XXX]', label: 'użytkowników miesięcznie' },
  { value: '[X XXX XXX]', label: 'odsłon miesięcznie' },
  { value: '[XX XXX]', label: 'subskrybentów newslettera' },
  { value: '[XXX XXX]', label: 'obserwujących w social media' },
];

export const AUDIENCE_SEGMENTS = [
  { title: 'Rodziny', text: 'Szkoły, zdrowie, mieszkanie, zakupy', share: '[XX]%' },
  { title: 'Młodzi profesjonaliści', text: 'Praca, wynajem, finanse, wydarzenia', share: '[XX]%' },
  { title: 'Właściciele firm', text: 'Księgowość, prawo, rekrutacja, B2B', share: '[XX]%' },
  { title: 'Nowo przybyli', text: 'Dokumenty, NHS, NI number, pierwsza praca', share: '[XX]%' },
];

export const AD_STEPS = [
  { title: 'Brief', text: 'Opowiedz nam o celu kampanii, grupie docelowej i budżecie.' },
  { title: 'Propozycja', text: 'Przygotujemy plan mediowy: formaty, terminy, szacowany zasięg.' },
  { title: 'Emisja', text: 'Publikujemy kampanię i dbamy o jakość kreacji oraz oznaczenia.' },
  { title: 'Raport', text: 'Po kampanii dostajesz raport z wyświetleń, kliknięć i wniosków.' },
];

const QUOTE = 'Wycena indywidualna';

export const AD_PRODUCTS: AdProduct[] = [
  {
    slug: 'banery',
    title: 'Banery reklamowe',
    short: 'Billboard, leaderboard, sidebar i formaty mobilne',
    lead: 'Klasyczne formaty display na stronie głównej i w działach tematycznych. Zawsze oznaczone jako „Reklama” i oddzielone od treści redakcyjnych.',
    icon: 'PanelTop',
    benefits: ['Duża widoczność marki', 'Targetowanie według działu i regionu Londynu', 'Rotacja kreacji i testy A/B', 'Raport wyświetleń i kliknięć'],
    formats: [
      { name: 'Billboard', spec: '970×250 · strona główna', price: '£XXX / tydzień' },
      { name: 'Leaderboard', spec: '728×90 · działy', price: '£XXX / tydzień' },
      { name: 'Sidebar', spec: '300×250 · ogłoszenia i artykuły', price: '£XXX / tydzień' },
      { name: 'Mobile', spec: '320×100 · wszystkie strony', price: '£XXX / tydzień' },
    ],
    bestFor: ['Kampanie wizerunkowe', 'Otwarcia sklepów i lokali', 'Sezonowe promocje'],
  },
  {
    slug: 'promocje',
    title: 'Promowanie ogłoszeń',
    short: 'Wyróżnienie, podbicie i ogłoszenia premium',
    lead: 'Wyróżnij ogłoszenie w wynikach wyszukiwania i na stronie głównej. Idealne dla agencji nieruchomości, rekruterów i lokalnych usług.',
    icon: 'Star',
    benefits: ['Pozycja na górze listy', 'Oznaczenie „Wyróżnione” lub „Promowane”', 'Obecność w module „Najnowsze ogłoszenia”', 'Pakiety dla firm'],
    formats: [
      { name: 'Wyróżnienie', spec: '7 dni · kolor i badge', price: '£XX' },
      { name: 'Podbicie', spec: 'powrót na górę listy', price: '£X' },
      { name: 'Ogłoszenie premium', spec: '30 dni · strona główna', price: '£XXX' },
      { name: 'Pakiet firmowy', spec: 'wiele ogłoszeń', price: QUOTE },
    ],
    bestFor: ['Agencje nieruchomości', 'Agencje pracy', 'Firmy usługowe'],
  },
  {
    slug: 'linki-sponsorowane',
    title: 'Linki sponsorowane',
    short: 'Wpisy w katalogu firm i modułach tematycznych',
    lead: 'Krótkie, natywne wpisy tekstowe w katalogu usług, poradniku i modułach tematycznych – zawsze z etykietą „Sponsorowane”.',
    icon: 'Link',
    benefits: ['Kontekst tematyczny (np. Poradnik → Podatki)', 'Wysoki CTR przy niskim koszcie', 'Prosta realizacja – tekst i link', 'Długi okres emisji'],
    formats: [
      { name: 'Link w katalogu firm', spec: 'kategoria usług', price: '£XX / mies.' },
      { name: 'Link w Poradniku', spec: 'wybrany obszar', price: '£XX / mies.' },
      { name: 'Pakiet tematyczny', spec: 'kilka sekcji', price: QUOTE },
    ],
    bestFor: ['Kancelarie i biura księgowe', 'Lekarze i dentyści', 'Szkoły językowe'],
  },
  {
    slug: 'artykuly-sponsorowane',
    title: 'Artykuły sponsorowane',
    short: 'Treści natywne przygotowane z redakcją',
    lead: 'Artykuł, poradnik lub wywiad przygotowany we współpracy z redakcją, oznaczony jako „Artykuł sponsorowany”. Promowany na stronie głównej, w newsletterze i social media.',
    icon: 'FileText',
    benefits: ['Wiarygodny kontekst redakcyjny', 'Profesjonalna redakcja i korekta', 'Promocja w newsletterze', 'Trwała obecność w wynikach wyszukiwania'],
    formats: [
      { name: 'Artykuł sponsorowany', spec: 'do 6000 znaków + zdjęcia', price: '£XXX' },
      { name: 'Wywiad / case study', spec: 'z sesją zdjęciową', price: QUOTE },
      { name: 'Seria artykułów', spec: '3–6 publikacji', price: QUOTE },
    ],
    bestFor: ['Banki i fintech', 'Deweloperzy', 'Uczelnie i kursy'],
  },
  {
    slug: 'wydarzenia',
    title: 'Promocja wydarzeń',
    short: 'Kalendarz, patronat medialny i bilety',
    lead: 'Wyróżnienie w kalendarzu wydarzeń, patronat medialny Londynka, konkursy z biletami i relacje z wydarzeń.',
    icon: 'Ticket',
    benefits: ['Wyróżnienie w kalendarzu i na mapie', 'Patronat medialny z logo', 'Konkursy i wejściówki dla czytelników', 'Relacja po wydarzeniu'],
    formats: [
      { name: 'Wyróżnione wydarzenie', spec: 'do dnia wydarzenia', price: '£XX' },
      { name: 'Pakiet promocyjny', spec: 'kalendarz + banery + social', price: '£XXX' },
      { name: 'Patronat medialny', spec: 'pełna współpraca', price: QUOTE },
    ],
    bestFor: ['Koncerty i teatry', 'Targi i konferencje', 'Organizacje polonijne'],
  },
];

export const adProductBySlug = (slug: string) => AD_PRODUCTS.find((p) => p.slug === slug);
