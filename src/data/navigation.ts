import type { NavGroup, NavLink } from '@/types';

export const PRIMARY_NAV: NavLink[] = [
  { label: 'Wiadomości', to: '/wiadomosci' },
  { label: 'Ogłoszenia', to: '/ogloszenia' },
  { label: 'Praca', to: '/ogloszenia/praca' },
  { label: 'Nieruchomości', to: '/ogloszenia/nieruchomosci' },
  { label: 'Poradnik', to: '/poradnik' },
  { label: 'Wydarzenia', to: '/wydarzenia' },
  { label: 'Transport', to: '/transport/tube' },
  { label: 'Usługi', to: '/ogloszenia/uslugi' },
];

export const MEGA_MENU: NavGroup[] = [
  {
    id: 'ogloszenia',
    title: 'Ogłoszenia',
    links: [
      { label: 'Wszystkie ogłoszenia', to: '/ogloszenia', description: 'Cały marketplace Polaków w UK', icon: 'LayoutGrid' },
      { label: 'Nieruchomości', to: '/ogloszenia/nieruchomosci', description: 'Pokoje, mieszkania, domy', icon: 'Home' },
      { label: 'Pracę oferują', to: '/ogloszenia/praca', description: 'Oferty pracy w UK', icon: 'Briefcase' },
      { label: 'Profile kandydatów', to: '/ogloszenia/kandydaci', description: 'Szukasz pracownika?', icon: 'UserSearch' },
      { label: 'Usługi', to: '/ogloszenia/uslugi', description: 'Polskie firmy i fachowcy', icon: 'Wrench' },
      { label: 'Motoryzacja', to: '/ogloszenia/motoryzacja', description: 'Auta, części, mechanicy', icon: 'Car' },
      { label: 'Kupię & Sprzedam', to: '/ogloszenia/kupie-sprzedam', description: 'Rzeczy z drugiej ręki', icon: 'ShoppingBag' },
      { label: 'Towarzyskie', to: '/ogloszenia/towarzyskie', description: 'Grupy, hobby, wymiana językowa', icon: 'Users' },
      { label: 'Oferta i cennik ogłoszeń', to: '/reklama/promocje', description: 'Wyróżnij swoje ogłoszenie', icon: 'Tag' },
    ],
  },
  {
    id: 'portal',
    title: 'Portal',
    links: [
      { label: 'Wiadomości', to: '/wiadomosci', description: 'UK, Londyn, Polska, świat', icon: 'Newspaper' },
      { label: 'Czytelnia', to: '/czytelnia', description: 'Reportaże, historie, opinie', icon: 'BookOpen' },
      { label: 'Ciekawostki', to: '/ciekawostki', description: 'Sekrety Londynu', icon: 'Sparkles' },
      { label: 'Poradnik', to: '/poradnik', description: 'Praktyczna pomoc w UK', icon: 'LifeBuoy' },
      { label: 'Promocje', to: '/promocje', description: 'Oferty i rabaty', icon: 'BadgePercent' },
      { label: 'Wydarzenia', to: '/wydarzenia', description: 'Koncerty, kultura, spotkania', icon: 'CalendarDays' },
      { label: 'Metro na żywo', to: '/transport/tube', description: 'Mapa, odjazdy i utrudnienia TfL', icon: 'TrainFront' },
      { label: 'Transport – status linii', to: '/transport', description: 'Tube, Overground, DLR, Elizabeth', icon: 'Bus' },
      { label: 'Mapa Londynu', to: '/map', description: 'Ogłoszenia, firmy i wydarzenia na mapie', icon: 'Map' },
      { label: 'Polskie firmy', to: '/polskie-firmy', description: 'Katalog z mapą i dojazdem', icon: 'Store' },
    ],
  },
  {
    id: 'reklama',
    title: 'Reklama',
    links: [
      { label: 'Reklama', to: '/reklama', description: 'Dotrzyj do Polaków w UK', icon: 'Megaphone' },
      { label: 'Banery', to: '/reklama/banery', icon: 'PanelTop' },
      { label: 'Promocje', to: '/reklama/promocje', icon: 'Star' },
      { label: 'Linki sponsorowane', to: '/reklama/linki-sponsorowane', icon: 'Link' },
      { label: 'Artykuły sponsorowane', to: '/reklama/artykuly-sponsorowane', icon: 'FileText' },
      { label: 'Promocja wydarzeń', to: '/reklama/wydarzenia', icon: 'Ticket' },
    ],
  },
  {
    id: 'biuro',
    title: 'Biuro',
    links: [
      { label: 'O nas', to: '/o-nas', icon: 'Info' },
      { label: 'Kontakt', to: '/kontakt', icon: 'Mail' },
      { label: 'Dla mediów', to: '/dla-mediow', icon: 'Mic' },
      { label: 'Regulamin', to: '/regulamin', icon: 'Scale' },
      { label: 'FAQ', to: '/faq', icon: 'HelpCircle' },
    ],
  },
];

/** Mobile drawer groups (task-oriented, not a 30 item list) */
export const MOBILE_GROUPS: NavGroup[] = [
  {
    id: 'm-ogloszenia',
    title: 'Ogłoszenia',
    links: MEGA_MENU[0]!.links.slice(0, 8),
  },
  {
    id: 'm-zycie',
    title: 'Życie w UK',
    links: [
      { label: 'Metro na żywo (TfL)', to: '/transport/tube' },
      { label: 'Transport – status linii', to: '/transport' },
      { label: 'Mapa Londynu', to: '/map' },
      { label: 'Poradnik – pomoc w UK', to: '/poradnik' },
      { label: 'Polskie firmy', to: '/polskie-firmy' },
      { label: 'Usługi', to: '/ogloszenia/uslugi' },
      { label: 'Promocje', to: '/promocje' },
      { label: 'Ciekawostki', to: '/ciekawostki' },
    ],
  },
  {
    id: 'm-wiadomosci',
    title: 'Wiadomości',
    links: [
      { label: 'Najnowsze wiadomości', to: '/wiadomosci' },
      { label: 'Czytelnia', to: '/czytelnia' },
    ],
  },
  {
    id: 'm-wydarzenia',
    title: 'Wydarzenia',
    links: [
      { label: 'Kalendarz wydarzeń', to: '/wydarzenia' },
      { label: 'Promuj wydarzenie', to: '/reklama/wydarzenia' },
    ],
  },
  { id: 'm-firma', title: 'Firma / reklama', links: MEGA_MENU[2]!.links },
  { id: 'm-o', title: 'O Londynku', links: MEGA_MENU[3]!.links },
];

export const FOOTER_COLUMNS: NavGroup[] = [
  {
    id: 'f-portal',
    title: 'Londynek.net',
    links: [
      { label: 'Wiadomości', to: '/wiadomosci' },
      { label: 'Czytelnia', to: '/czytelnia' },
      { label: 'Ciekawostki', to: '/ciekawostki' },
      { label: 'Poradnik', to: '/poradnik' },
      { label: 'Wydarzenia', to: '/wydarzenia' },
      { label: 'Metro na żywo', to: '/transport/tube' },
      { label: 'Transport', to: '/transport' },
    ],
  },
  {
    id: 'f-ogl',
    title: 'Ogłoszenia',
    links: [
      { label: 'Nieruchomości', to: '/ogloszenia/nieruchomosci' },
      { label: 'Praca', to: '/ogloszenia/praca' },
      { label: 'Kandydaci', to: '/ogloszenia/kandydaci' },
      { label: 'Usługi', to: '/ogloszenia/uslugi' },
      { label: 'Motoryzacja', to: '/ogloszenia/motoryzacja' },
      { label: 'Kup / Sprzedaj', to: '/ogloszenia/kupie-sprzedam' },
      { label: 'Towarzyskie', to: '/ogloszenia/towarzyskie' },
    ],
  },
  {
    id: 'f-rek',
    title: 'Reklama',
    links: [
      { label: 'Banery', to: '/reklama/banery' },
      { label: 'Promocje', to: '/reklama/promocje' },
      { label: 'Linki sponsorowane', to: '/reklama/linki-sponsorowane' },
      { label: 'Artykuły sponsorowane', to: '/reklama/artykuly-sponsorowane' },
      { label: 'Wydarzenia', to: '/reklama/wydarzenia' },
      { label: 'Media kit', to: '/dla-mediow' },
    ],
  },
  {
    id: 'f-biuro',
    title: 'Biuro',
    links: [
      { label: 'O nas', to: '/o-nas' },
      { label: 'Kontakt', to: '/kontakt' },
      { label: 'Dla mediów', to: '/dla-mediow' },
      { label: 'Regulamin', to: '/regulamin' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
];
