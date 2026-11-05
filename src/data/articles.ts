// DEMO DATA – editorial placeholders inspired by typical Londynek.net topics.
// Replace with the CMS/news API. Headlines are illustrative, not published reporting.
import type { Article, ContentKind, LiveUpdate } from '@/types';

const DEMO_NOTE = 'Treść demonstracyjna – w wersji produkcyjnej artykuł zostanie pobrany z systemu redakcyjnego Londynek.net.';

function body(...paragraphs: string[]) {
  return [...paragraphs, DEMO_NOTE];
}

export const NEWS: Article[] = [
  {
    id: 'najem-2026', kind: 'news', section: 'Londyn', title: 'Nowe przepisy dla najemców w UK. Co zmienia się w 2026 roku?',
    excerpt: 'Renters’ Rights Act wchodzi w życie etapami. Sprawdzamy, co oznacza koniec eksmisji „bez winy”, limity podwyżek i nowy rejestr landlordów dla Polaków wynajmujących w Londynie.',
    image: 'westminster-bridge', author: 'Redakcja Londynek', publishedAt: '2026-10-07T13:10', ago: '2 godz. temu', readMin: 6, comments: 124, region: 'central',
    body: body(
      'Ustawa o prawach najemców zmienia zasady gry na rynku wynajmu w Anglii. Najważniejsza zmiana to zniesienie tzw. Section 21, czyli możliwości wypowiedzenia umowy bez podania przyczyny.',
      'Landlordzi będą mogli podnosić czynsz tylko raz w roku, a najemca zyska prawo zakwestionowania podwyżki przed trybunałem. Wprowadzony zostanie także publiczny rejestr wynajmujących.',
      'Eksperci radzą, by sprawdzić swoją obecną umowę i zachować całą korespondencję z właścicielem mieszkania.',
    ),
  },
  {
    id: 'oplaty-linie', kind: 'news', section: 'UK', title: 'Koniec z opłatami do 40 funtów za błędy w rezerwacji biletów lotniczych',
    excerpt: 'Rząd chce ograniczyć opłaty za poprawki literówek w nazwisku. Zmiana obejmie m.in. tanie linie latające do Polski.',
    image: 'plane', author: 'Anna Kowalczyk', publishedAt: '2026-10-07T12:00', ago: '3 godz. temu', readMin: 4, comments: 600,
    body: body('Nowe regulacje mają objąć wszystkie linie operujące z brytyjskich lotnisk.', 'Pasażerowie zyskają prawo do bezpłatnej korekty drobnych błędów w ciągu 48 godzin od rezerwacji.'),
  },
  {
    id: 'kradzione-auta', kind: 'news', section: 'UK', title: 'Najczęściej kradzione samochody w pierwszej połowie 2026 roku. Nowe dane DVLA',
    excerpt: 'Na liście dominują popularne SUV-y i auta z systemem bezkluczykowym. Policja radzi, jak zabezpieczyć samochód.',
    image: 'car-bmw', author: 'Tomasz Nowak', publishedAt: '2026-10-07T10:20', ago: '5 godz. temu', readMin: 3, comments: 532,
    body: body('Dane pokazują wzrost kradzieży metodą „relay attack”.', 'Ubezpieczyciele zalecają stosowanie etui blokujących sygnał kluczyka.'),
  },
  {
    id: 'muzyka-autobusy', kind: 'news', section: 'Transport', title: 'Głośna muzyka w autobusach. Apel o skuteczniejsze kary dla pasażerów',
    excerpt: 'Pasażerowie skarżą się na muzykę puszczaną bez słuchawek. TfL rozważa wyższe mandaty.',
    image: 'bigben-bus', author: 'Redakcja Londynek', publishedAt: '2026-10-07T08:30', ago: 'Dziś', readMin: 3, comments: 477, region: 'central',
    body: body('Przepisy TfL już teraz zakazują odtwarzania muzyki na głos, ale egzekwowanie jest rzadkie.', 'Kampania ma ruszyć jeszcze przed świętami.'),
  },
  {
    id: 'diesel', kind: 'news', section: 'Biznes', title: 'Rekordowe ceny diesla zagrażają transportowi w Wielkiej Brytanii',
    excerpt: 'Firmy przewozowe ostrzegają przed podwyżkami cen usług. Najbardziej odczują to małe firmy transportowe.',
    image: 'warehouse', author: 'Piotr Wiśniewski', publishedAt: '2026-10-06T18:00', ago: 'Wczoraj', readMin: 4, comments: 89,
    body: body('Średnia cena litra diesla przekroczyła poziom z 2022 roku.', 'Branża apeluje o czasowe obniżenie akcyzy.'),
  },
  {
    id: 'covid-wzrost', kind: 'news', section: 'Zdrowie', title: 'Wzrost przypadków Covid w UK. NHS przypomina o jesiennych szczepieniach',
    excerpt: 'Liczba hospitalizacji wzrosła w ciągu miesiąca. Kto może bezpłatnie zaszczepić się w aptece?',
    image: 'doctor', author: 'Redakcja Londynek', publishedAt: '2026-10-07T13:00', ago: '2 godz. temu', readMin: 4, comments: 77,
    body: body('Bezpłatne szczepienia przysługują osobom 75+, kobietom w ciąży i osobom z grup ryzyka.', 'Termin można zarezerwować przez aplikację NHS.'),
  },
  {
    id: 'ranking-miast', kind: 'news', section: 'Londyn', title: 'Londyn wysoko w światowym rankingu najlepszych miast do życia',
    excerpt: 'Autorzy docenili kulturę, transport i różnorodność. Słabym punktem pozostają koszty mieszkań.',
    image: 'tower-bridge', author: 'Marta Zielińska', publishedAt: '2026-10-06T09:00', ago: 'Wczoraj', readMin: 3, comments: 48, region: 'central',
    body: body('Londyn wyprzedził m.in. Paryż i Nowy Jork w kategorii kultury.', 'Na koszty życia wskazało 7 na 10 ankietowanych mieszkańców.'),
  },
  {
    id: 'pluskwy', kind: 'news', section: 'Transport', title: 'Pluskwy w pociągach Southeastern. Przewoźnik wycofuje składy do dezynsekcji',
    excerpt: 'Zgłoszenia pasażerów dotyczyły tras z Kent do Londynu. Część kursów odwołano.',
    image: 'train', author: 'Redakcja Londynek', publishedAt: '2026-10-06T07:40', ago: 'Wczoraj', readMin: 2, comments: 112, region: 'south',
    body: body('Southeastern zapewnia, że wszystkie składy zostaną sprawdzone w ciągu tygodnia.', 'Pasażerowie mogą ubiegać się o zwrot w ramach Delay Repay.'),
  },
  {
    id: 'sainsburys', kind: 'news', section: 'Biznes', title: 'Sainsbury’s rusza z nową ofertą oszczędnościową. Chce konkurować z Tesco',
    excerpt: 'Konto oszczędnościowe z oprocentowaniem do 4,35 proc. i bonusem dla posiadaczy karty Nectar.',
    image: 'grocery', author: 'Piotr Wiśniewski', publishedAt: '2026-10-07T14:10', ago: '52 min temu', readMin: 3, comments: 28,
    body: body('Oferta jest dostępna dla klientów, którzy otworzą konto w aplikacji.', 'Eksperci radzą porównać warunki z kontami ISA.'),
  },
  {
    id: 'pogoda', kind: 'news', section: 'UK', title: 'Jesień wraca do Wielkiej Brytanii: deszcz, wiatr i spadek temperatur',
    excerpt: 'Met Office wydało żółte ostrzeżenia dla południowej Anglii. W Londynie do 12°C.',
    image: 'big-ben-statue', author: 'Redakcja Londynek', publishedAt: '2026-10-07T06:00', ago: 'Dziś', readMin: 2, comments: 34,
    body: body('Najsilniejsze opady przewidywane są w czwartek wieczorem.', 'Kierowcy powinni liczyć się z utrudnieniami na M25.'),
  },
  {
    id: 'polska-gotowosc', kind: 'news', section: 'Polska', title: 'Polska szykuje się na pełną gotowość państwa. Co z Polakami za granicą?',
    excerpt: 'Nowe przepisy dotyczą m.in. obrony cywilnej i rejestracji obywateli przebywających za granicą.',
    image: 'documents', author: 'Katarzyna Lis', publishedAt: '2026-10-06T15:00', ago: 'Wczoraj', readMin: 5, comments: 600,
    body: body('MSZ przypomina o bezpłatnym systemie Odyseusz dla podróżujących i mieszkających za granicą.', 'Zmiany nie nakładają nowych obowiązków na Polaków w UK.'),
  },
  {
    id: 'swiatek', kind: 'news', section: 'Sport', title: 'Turniej WTA w Pekinie: Świątek awansowała do ćwierćfinału',
    excerpt: 'Polka pokonała Amerykankę Ivę Jovic 6:1, 6:3 i zagra o półfinał.',
    image: 'sport-run', author: 'Dział sportowy', publishedAt: '2026-10-07T14:40', ago: '22 min temu', readMin: 2, comments: 12,
    body: body('Mecz trwał niespełna półtorej godziny.', 'Kolejną rywalką będzie zwyciężczyni pary Gauff – Andriejewa.'),
  },
  {
    id: 'szkoly-wnioski', kind: 'news', section: 'Edukacja', title: 'Rekrutacja do szkół średnich w Londynie: termin mija 31 października',
    excerpt: 'Rodzice dzieci z rocznika 2015/16 muszą złożyć wniosek przez portal Pan-London Admissions.',
    image: 'education', author: 'Redakcja Londynek', publishedAt: '2026-10-05T10:00', ago: '2 dni temu', readMin: 4, comments: 41,
    body: body('Można wskazać do sześciu szkół w kolejności preferencji.', 'Wyniki zostaną ogłoszone 1 marca.'),
  },
  {
    id: 'tarcza', kind: 'news', section: 'Świat', title: 'Konserwatyści proponują „Tarczę Brytanii” – system obrony przed rakietami i dronami',
    excerpt: 'Opozycja chce przeznaczyć dodatkowe środki na obronę powietrzną. Rząd odpowiada, że plan jest nierealny.',
    image: 'westminster-bus', author: 'Katarzyna Lis', publishedAt: '2026-10-07T13:00', ago: '2 godz. temu', readMin: 4, comments: 31,
    body: body('Projekt zakłada współpracę z partnerami z NATO.', 'Debata w Izbie Gmin zaplanowana jest na przyszły tydzień.'),
  },
];

export const LIVE_UPDATES: LiveUpdate[] = [
  { time: '15:42', text: 'TfL: Central line – utrudnienia między Liverpool Street a Stratford.' },
  { time: '15:10', text: 'Met Office podnosi ostrzeżenie przed wiatrem dla Kent i Sussex.' },
  { time: '14:35', text: 'Kurs GBP/PLN spada do 5,15 zł po danych o inflacji.' },
  { time: '13:58', text: 'Heathrow: opóźnienia odlotów do 40 minut z powodu mgły.' },
  { time: '13:20', text: 'Rada Ealing ogłasza konsultacje w sprawie nowych stref parkowania.' },
];

export const MAGAZINE: Article[] = [
  {
    id: 'powroty', kind: 'magazine', section: 'Polacy w UK', title: 'Powroty z Wielkiej Brytanii. Dlaczego coraz więcej z nas pakuje walizki – i co zabiera ze sobą',
    excerpt: 'Po latach w Londynie wracają z oszczędnościami, językiem i nowymi nawykami. Rozmawiamy z tymi, którzy zaczęli od nowa w Polsce – i z tymi, którzy po roku wrócili na Wyspy.',
    image: 'travel', author: 'Joanna Malinowska', publishedAt: '2026-10-07T08:00', ago: 'Dziś', readMin: 14, comments: 66,
    body: body('„Najtrudniejsze było nie pakowanie, tylko tłumaczenie dzieciom, dlaczego” – mówi Agnieszka, która spędziła w Ealingu jedenaście lat.', 'Badania pokazują, że decyzja o powrocie rzadko jest jednorazowa.'),
  },
  {
    id: 'nocna-zmiana', kind: 'magazine', section: 'Historie', title: 'Nocna zmiana. Jeden dzień z życia polskiej pielęgniarki w londyńskim szpitalu',
    excerpt: 'Dwanaście godzin, trzy oddziały i jedna przerwa na kawę. Reportaż z oddziału ratunkowego w południowym Londynie.',
    image: 'care', author: 'Ewa Domańska', publishedAt: '2026-10-05T09:00', ago: '2 dni temu', readMin: 11, comments: 39,
    body: body('Maria przyjechała do Londynu w 2008 roku z dyplomem z Lublina.', 'Dziś koordynuje zespół dwunastu osób.'),
  },
  {
    id: 'polski-sklep', kind: 'magazine', section: 'Lifestyle', title: 'Twaróg, ogórki i tęsknota. Jak polskie sklepy zmieniły brytyjskie ulice',
    excerpt: 'Od pierwszych półek z kiszonkami po sieci delikatesów. Historia polskiego handlu na Wyspach.',
    image: 'shop-open', author: 'Michał Sowa', publishedAt: '2026-10-02T10:00', ago: '5 dni temu', readMin: 9, comments: 52,
    body: body('W 2004 roku polskie produkty można było kupić w kilku sklepach w Hammersmith.', 'Dziś są w każdym większym supermarkecie.'),
  },
  {
    id: 'opinia-czynsze', kind: 'magazine', section: 'Opinie', title: 'Czynsze rosną szybciej niż pensje. Czy Londyn wciąż się opłaca?',
    excerpt: 'Felieton o liczbach, które każdy z nas zna z własnego budżetu.',
    image: 'london-night', author: 'Paweł Krajewski', publishedAt: '2026-09-30T10:00', ago: '7 dni temu', readMin: 6, comments: 210,
    body: body('Kiedy przyjechałem, pokój w Zone 2 kosztował 400 funtów.', 'Dziś za tę kwotę trudno o miejsce parkingowe.'),
  },
  {
    id: 'wywiad-chopin', kind: 'magazine', section: 'Wywiady', title: '„Chopin w Londynie to wciąż nieopowiedziana historia” – rozmowa z pianistką',
    excerpt: 'Przed wieczorem „Rescuing Chopin in London” pytamy o ostatnią wizytę kompozytora na Wyspach.',
    image: 'theatre', author: 'Joanna Malinowska', publishedAt: '2026-09-28T10:00', ago: '9 dni temu', readMin: 10, comments: 14,
    body: body('W 1848 roku Chopin dał w Londynie kilka koncertów.', 'Ostatni publiczny występ odbył się w Guildhall.'),
  },
  {
    id: 'kultura-teatr', kind: 'magazine', section: 'Kultura', title: 'Scena Polska w Londynie. Teatr, który gra mimo wszystko',
    excerpt: 'Amatorzy i zawodowcy, próby po pracy i pełne sale w POSK-u. Jak powstaje polski teatr na emigracji.',
    image: 'audience', author: 'Michał Sowa', publishedAt: '2026-09-25T10:00', ago: '12 dni temu', readMin: 8, comments: 9,
    body: body('Próby odbywają się w czwartki po 19:00.', 'Najbliższa premiera: „Tango” Sławomira Mrożka.'),
  },
];

export const CURIOSITIES: Article[] = [
  { id: 'pizzeria', kind: 'curiosity', section: 'Miejsca', title: 'Najlepsza pizzeria na świecie znajduje się w Londynie', excerpt: 'Ranking 50 Top Pizza wskazał lokal w Islington.', image: 'restaurant', author: 'Redakcja', publishedAt: '2026-10-02T10:00', ago: '5 dni temu', readMin: 3, comments: 283, body: body('Lokal słynie z długo fermentowanego ciasta.') },
  { id: 'welling', kind: 'curiosity', section: 'Historia', title: 'Welling: ulica wytyczona przez Rzymian', excerpt: 'Watling Street ma ponad 1900 lat i wciąż prowadzi ruch do centrum.', image: 'london-street', author: 'Redakcja', publishedAt: '2026-10-06T10:00', ago: 'Wczoraj', readMin: 4, comments: 18, body: body('Trasa łączyła Dover z Wroxeter.') },
  { id: 'ghost-stations', kind: 'curiosity', section: 'Sekrety Londynu', title: 'Stacje-widma. 40 nieczynnych przystanków metra pod Twoimi stopami', excerpt: 'Aldwych, Down Street, British Museum – część z nich można zwiedzać.', image: 'crossing', author: 'Redakcja', publishedAt: '2026-10-01T10:00', ago: '6 dni temu', readMin: 6, comments: 44, body: body('Down Street służyła Churchillowi jako schron.') },
  { id: 'meta-ai', kind: 'curiosity', section: 'Gadżety', title: 'Meta zapowiada przenośne urządzenie AI i nowe okulary', excerpt: 'Meta Charm ma obsługiwać asystenta Muse.', image: 'electronics', author: 'Redakcja', publishedAt: '2026-10-07T10:00', ago: 'Dziś', readMin: 3, comments: 5, body: body('Premiera w UK planowana jest na wiosnę.') },
  { id: 'samotnosc', kind: 'curiosity', section: 'Zdaniem naukowców', title: 'Samotność może odbierać nawet sześć lat życia w zdrowiu', excerpt: 'Badacze zwracają uwagę na emigrantów jako grupę ryzyka.', image: 'friends-sunset', author: 'Redakcja', publishedAt: '2026-10-01T10:00', ago: '6 dni temu', readMin: 4, comments: 46, body: body('Regularne kontakty społeczne obniżają ryzyko depresji.') },
  { id: 'thames-beaches', kind: 'curiosity', section: 'Weekend', title: 'Plaże nad Tamizą. Gdzie przy odpływie szukać skarbów (legalnie)', excerpt: 'Mudlarking wymaga pozwolenia Port of London Authority.', image: 'london-thames', author: 'Redakcja', publishedAt: '2026-09-29T10:00', ago: '8 dni temu', readMin: 5, comments: 22, body: body('Najczęstsze znaleziska to fajki z XVII wieku.') },
  { id: 'big-ben-fakty', kind: 'curiosity', section: 'Czy wiesz, że…', title: 'Big Ben to nie wieża. 7 rzeczy, których nie wiesz o symbolu Londynu', excerpt: 'Nazwa odnosi się do dzwonu, a wieża nazywa się Elizabeth Tower.', image: 'big-ben', author: 'Redakcja', publishedAt: '2026-09-27T10:00', ago: '10 dni temu', readMin: 4, comments: 31, body: body('Dzwon waży ponad 13 ton.') },
  { id: 'polscy-lotnicy', kind: 'curiosity', section: 'Ludzie', title: 'Dywizjon 303 w Northolt. Ślady polskich lotników w zachodnim Londynie', excerpt: 'Pomnik Lotników Polskich stoi przy A40 od 1948 roku.', image: 'westminster-bus', author: 'Redakcja', publishedAt: '2026-09-20T10:00', ago: '17 dni temu', readMin: 7, comments: 58, body: body('Co roku we wrześniu odbywają się tu uroczystości.') },
  { id: 'street-art', kind: 'curiosity', section: 'Kultura', title: 'Shoreditch i street art: trasa spacerowa na sobotę', excerpt: 'Od Brick Lane po Leake Street – mapa najciekawszych murali.', image: 'art', author: 'Redakcja', publishedAt: '2026-09-18T10:00', ago: '19 dni temu', readMin: 5, comments: 12, body: body('Leake Street to legalna galeria graffiti pod Waterloo.') },
  { id: 'pierniki', kind: 'curiosity', section: 'Nowinki kulinarne', title: 'Pieczywo w lodówce? Dietetycy wyjaśniają, jak przechowywać chleb', excerpt: 'Lodówka przyspiesza czerstwienie – lepiej zamrozić.', image: 'food', author: 'Redakcja', publishedAt: '2026-09-15T10:00', ago: '22 dni temu', readMin: 3, comments: 39, body: body('Chleb najlepiej kroić przed zamrożeniem.') },
];

export const ALL_ARTICLES: Article[] = [...NEWS, ...MAGAZINE, ...CURIOSITIES];

export const articleById = (id: string) => ALL_ARTICLES.find((a) => a.id === id);

export const KIND_ROUTE: Record<ContentKind, { label: string; to: string }> = {
  news: { label: 'Wiadomości', to: '/wiadomosci' },
  magazine: { label: 'Czytelnia', to: '/czytelnia' },
  curiosity: { label: 'Ciekawostki', to: '/ciekawostki' },
  guide: { label: 'Poradnik', to: '/poradnik' },
};

export const NEWS_SECTIONS = ['UK', 'Londyn', 'Polska', 'Świat', 'Biznes', 'Zdrowie', 'Transport', 'Edukacja', 'Sport'] as const;
