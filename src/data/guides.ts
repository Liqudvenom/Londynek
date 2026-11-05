// DEMO DATA – practical guidance written as a general overview, not legal advice.
// Always link to official sources (gov.uk, nhs.uk) in production content.
import type { GuideArea, GuideTask } from '@/types';

export const GUIDE_AREAS: GuideArea[] = [
  { id: 'nhs', title: 'NHS i zdrowie', description: 'GP, dentysta, recepty, 111', icon: 'Stethoscope', accent: 'news', count: 24 },
  { id: 'praca', title: 'Praca', description: 'Umowy, wypłaty, prawa pracownika', icon: 'Briefcase', accent: 'jobs', count: 31 },
  { id: 'prawo', title: 'Prawo', description: 'Sąd, mandaty, konsument', icon: 'Scale', accent: 'services', count: 18 },
  { id: 'mieszkanie', title: 'Mieszkanie', description: 'Najem, depozyt, council tax', icon: 'Home', accent: 'housing', count: 27 },
  { id: 'podatki', title: 'Podatki', description: 'Self Assessment, HMRC, zwroty', icon: 'Receipt', accent: 'help', count: 22 },
  { id: 'uc', title: 'Universal Credit', description: 'Zasiłki i świadczenia', icon: 'Coins', accent: 'jobs', count: 12 },
  { id: 'szkoly', title: 'Szkoły', description: 'Zapisy, nursery, polska szkoła', icon: 'GraduationCap', accent: 'events', count: 15 },
  { id: 'transport', title: 'Transport', description: 'Oyster, ULEZ, mandaty', icon: 'Bus', accent: 'news', count: 14 },
  { id: 'dokumenty', title: 'Dokumenty', description: 'Paszport, NI number, akt urodzenia', icon: 'IdCard', accent: 'navy', count: 19 },
  { id: 'prawo-jazdy', title: 'Driving licence', description: 'Wymiana polskiego prawa jazdy', icon: 'Car', accent: 'services', count: 8 },
  { id: 'status', title: 'Brexit / status', description: 'EU Settlement Scheme, eVisa', icon: 'ShieldCheck', accent: 'housing', count: 11 },
];

export const GUIDE_TASKS: GuideTask[] = [
  {
    id: 'rejestracja-gp', area: 'nhs', question: 'Chcę zarejestrować się w NHS', readMin: 4, updated: '2 października 2026',
    answer: 'Rejestracja u lekarza rodzinnego (GP) jest bezpłatna i nie wymaga dowodu adresu ani statusu imigracyjnego.',
    steps: ['Znajdź przychodnię (GP surgery) w pobliżu na nhs.uk', 'Wypełnij formularz rejestracyjny online lub w recepcji', 'Podaj imię, datę urodzenia i adres', 'Poczekaj na potwierdzenie i numer NHS'],
  },
  {
    id: 'depozyt', area: 'mieszkanie', question: 'Landlord nie oddaje depozytu', readMin: 6, updated: '28 września 2026',
    answer: 'Depozyt w Anglii musi być zabezpieczony w jednym z trzech rządowych programów (DPS, MyDeposits, TDS) w ciągu 30 dni.',
    steps: ['Sprawdź, w którym programie zabezpieczono depozyt', 'Wyślij pisemne żądanie zwrotu do landlorda', 'Rozpocznij bezpłatny spór (dispute) w programie depozytowym', 'Jeśli depozyt nie był zabezpieczony – możesz żądać 1–3-krotności kwoty w sądzie'],
  },
  {
    id: 'ni-number', area: 'dokumenty', question: 'Jak uzyskać National Insurance Number', readMin: 3, updated: '1 października 2026',
    answer: 'NI number jest potrzebny do pracy i płacenia podatków. Wniosek składa się online na gov.uk.',
    steps: ['Przygotuj paszport lub dowód osobisty i status (share code)', 'Złóż wniosek online na gov.uk', 'Odpowiedz na ewentualne pytania DWP', 'Numer przyjdzie listownie w ciągu kilku tygodni'],
  },
  {
    id: 'self-assessment', area: 'podatki', question: 'Jak rozliczyć Self Assessment', readMin: 7, updated: '30 września 2026',
    answer: 'Osoby samozatrudnione muszą złożyć zeznanie online do 31 stycznia za poprzedni rok podatkowy.',
    steps: ['Zarejestruj się w HMRC i uzyskaj UTR', 'Zbierz faktury, wydatki i wyciągi', 'Wypełnij zeznanie online (SA100)', 'Zapłać podatek do 31 stycznia'],
  },
  {
    id: 'prawo-jazdy-wymiana', area: 'prawo-jazdy', question: 'Czy muszę wymienić polskie prawo jazdy?', readMin: 3, updated: '20 września 2026',
    answer: 'Polskie prawo jazdy jest ważne w UK do jego daty ważności. Wymiana jest dobrowolna, ale wygodna przy ubezpieczeniu.',
    steps: ['Pobierz formularz D1 z DVLA lub urzędu pocztowego', 'Dołącz oryginał prawa jazdy i zdjęcie', 'Wyślij do DVLA z opłatą', 'Brytyjskie prawo jazdy przyjdzie pocztą'],
  },
  {
    id: 'evisa', area: 'status', question: 'Jak sprawdzić swój status i eVisa', readMin: 4, updated: '15 września 2026',
    answer: 'Status z EU Settlement Scheme jest cyfrowy. Pracodawcy i landlordzi sprawdzają go za pomocą share code.',
    steps: ['Załóż konto UKVI', 'Połącz paszport z kontem', 'Wygeneruj share code', 'Przekaż kod pracodawcy lub landlordowi'],
  },
  {
    id: 'council-tax', area: 'mieszkanie', question: 'Mieszkam sam – jak dostać zniżkę na council tax?', readMin: 2, updated: '10 września 2026',
    answer: 'Osoba mieszkająca samotnie ma prawo do 25% zniżki (single person discount).',
    steps: ['Wejdź na stronę swojego boroughu', 'Wypełnij wniosek o single person discount', 'Zniżka zostanie naliczona od daty zamieszkania'],
  },
  {
    id: 'szkola-zapis', area: 'szkoly', question: 'Jak zapisać dziecko do szkoły w Londynie', readMin: 5, updated: '5 października 2026',
    answer: 'Wnioski do szkół publicznych składa się przez council, w którym mieszkasz – nawet jeśli szkoła jest w innym boroughu.',
    steps: ['Sprawdź terminy w swoim council', 'Wybierz do 6 szkół w kolejności preferencji', 'Złóż wniosek online', 'Poczekaj na offer day'],
  },
];

export const GUIDE_FAQ = [
  { id: 'gf-1', q: 'Czy porady w Poradniku zastępują poradę prawną?', a: 'Nie. Poradnik to ogólne informacje. W indywidualnych sprawach skontaktuj się z prawnikiem lub Citizens Advice.' },
  { id: 'gf-2', q: 'Skąd pochodzą informacje?', a: 'Z oficjalnych źródeł (gov.uk, nhs.uk, HMRC) oraz od współpracujących ekspertów. Każdy poradnik ma datę aktualizacji.' },
  { id: 'gf-3', q: 'Czy mogę zadać pytanie redakcji?', a: 'Tak – skorzystaj z formularza kontaktowego i wybierz dział „Redakcja”.' },
  { id: 'gf-4', q: 'Gdzie znajdę bezpłatną pomoc?', a: 'Citizens Advice, Shelter (mieszkania), ACAS (praca) oraz polskie organizacje społeczne udzielają bezpłatnych porad.' },
];

export const guideTaskById = (id: string) => GUIDE_TASKS.find((t) => t.id === id);
export const guideAreaById = (id: string) => GUIDE_AREAS.find((a) => a.id === id);
