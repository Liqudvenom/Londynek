import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';

const page = <T extends Record<string, React.ComponentType>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(() => loader().then((m) => ({ default: m[name] as React.ComponentType })));

const HomePage = page(() => import('@/pages/home/HomePage'), 'HomePage');
const ClassifiedsPage = page(() => import('@/pages/classifieds/ClassifiedsPage'), 'ClassifiedsPage');
const RealEstatePage = page(() => import('@/pages/classifieds/RealEstatePage'), 'RealEstatePage');
const JobsPage = page(() => import('@/pages/classifieds/JobsPage'), 'JobsPage');
const CandidatesPage = page(() => import('@/pages/classifieds/JobsPage'), 'CandidatesPage');
const ServicesPage = page(() => import('@/pages/classifieds/ServicesPage'), 'ServicesPage');
const MotoringPage = page(() => import('@/pages/classifieds/MotoringPage'), 'MotoringPage');
const BuySellPage = page(() => import('@/pages/classifieds/BuySellPage'), 'BuySellPage');
const SocialPage = page(() => import('@/pages/classifieds/SocialPage'), 'SocialPage');
const ListingDetailPage = page(() => import('@/pages/classifieds/ListingDetailPage'), 'ListingDetailPage');
const NewsPage = page(() => import('@/pages/content/NewsPage'), 'NewsPage');
const ReadingPage = page(() => import('@/pages/content/ReadingPage'), 'ReadingPage');
const CuriositiesPage = page(() => import('@/pages/content/CuriositiesPage'), 'CuriositiesPage');
const ArticlePage = page(() => import('@/pages/content/ArticlePage'), 'ArticlePage');
const GuidePage = page(() => import('@/pages/guide/GuidePage'), 'GuidePage');
const GuideTaskPage = page(() => import('@/pages/guide/GuideTaskPage'), 'GuideTaskPage');
const EventsPage = page(() => import('@/pages/events/EventsPage'), 'EventsPage');
const EventDetailPage = page(() => import('@/pages/events/EventDetailPage'), 'EventDetailPage');
const PromotionsPage = page(() => import('@/pages/promotions/PromotionsPage'), 'PromotionsPage');
const AdvertisingPage = page(() => import('@/pages/advertising/AdvertisingPage'), 'AdvertisingPage');
const AdProductPage = page(() => import('@/pages/advertising/AdProductPage'), 'AdProductPage');
const AboutPage = page(() => import('@/pages/corporate/AboutPage'), 'AboutPage');
const ContactPage = page(() => import('@/pages/corporate/ContactPage'), 'ContactPage');
const MediaPage = page(() => import('@/pages/corporate/MediaPage'), 'MediaPage');
const TermsPage = page(() => import('@/pages/corporate/TermsPage'), 'TermsPage');
const FaqPage = page(() => import('@/pages/corporate/FaqPage'), 'FaqPage');
const SearchPage = page(() => import('@/pages/misc/SearchPage'), 'SearchPage');
const LoginPage = page(() => import('@/pages/misc/AuthPages'), 'LoginPage');
const RegisterPage = page(() => import('@/pages/misc/AuthPages'), 'RegisterPage');
const AddListingPage = page(() => import('@/pages/misc/AddListingPage'), 'AddListingPage');
const SavedPage = page(() => import('@/pages/misc/SavedPage'), 'SavedPage');
const NotFoundPage = page(() => import('@/pages/misc/NotFoundPage'), 'NotFoundPage');
const TransportPage = page(() => import('@/pages/transport/TransportPage'), 'TransportPage');
const TubePage = page(() => import('@/pages/transport/TubePage'), 'TubePage');
const TubeLinePage = page(() => import('@/pages/transport/TubeLinePage'), 'TubeLinePage');
const StationPage = page(() => import('@/pages/transport/StationPage'), 'StationPage');
const MapPage = page(() => import('@/pages/map/MapPage'), 'MapPage');
const BusinessDirectoryPage = page(() => import('@/pages/map/BusinessDirectoryPage'), 'BusinessDirectoryPage');

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/ogloszenia', element: <ClassifiedsPage /> },
      { path: '/ogloszenia/nieruchomosci', element: <RealEstatePage /> },
      { path: '/ogloszenia/praca', element: <JobsPage /> },
      { path: '/ogloszenia/kandydaci', element: <CandidatesPage /> },
      { path: '/ogloszenia/uslugi', element: <ServicesPage /> },
      { path: '/ogloszenia/motoryzacja', element: <MotoringPage /> },
      { path: '/ogloszenia/kupie-sprzedam', element: <BuySellPage /> },
      { path: '/ogloszenia/towarzyskie', element: <SocialPage /> },
      { path: '/ogloszenie/:id', element: <ListingDetailPage /> },
      { path: '/wiadomosci', element: <NewsPage /> },
      { path: '/czytelnia', element: <ReadingPage /> },
      { path: '/ciekawostki', element: <CuriositiesPage /> },
      { path: '/artykul/:id', element: <ArticlePage /> },
      { path: '/poradnik', element: <GuidePage /> },
      { path: '/poradnik/:id', element: <GuideTaskPage /> },
      { path: '/wydarzenia', element: <EventsPage /> },
      { path: '/wydarzenia/:id', element: <EventDetailPage /> },
      { path: '/promocje', element: <PromotionsPage /> },
      { path: '/reklama', element: <AdvertisingPage /> },
      { path: '/reklama/:product', element: <AdProductPage /> },
      { path: '/o-nas', element: <AboutPage /> },
      { path: '/kontakt', element: <ContactPage /> },
      { path: '/dla-mediow', element: <MediaPage /> },
      { path: '/regulamin', element: <TermsPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/transport', element: <TransportPage /> },
      { path: '/transport/tube', element: <TubePage /> },
      { path: '/transport/tube/:line', element: <TubeLinePage /> },
      { path: '/transport/station/:stationId', element: <StationPage /> },
      { path: '/szukaj', element: <SearchPage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/polskie-firmy', element: <BusinessDirectoryPage /> },
      { path: '/zaloguj', element: <LoginPage /> },
      { path: '/rejestracja', element: <RegisterPage /> },
      { path: '/dodaj-ogloszenie', element: <AddListingPage /> },
      { path: '/zapisane', element: <SavedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  ],
  basename ? { basename } : undefined,
);
