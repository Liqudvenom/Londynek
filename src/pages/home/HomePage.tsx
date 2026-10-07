import { useState } from 'react';
import { LondonRouteNavigation, type RouteStop } from '@/components/london/LondonRouteNavigation';
import { Reveal } from '@/components/ui/primitives';
import { HomeHero } from './HomeHero';
import { LondonDashboard } from './LondonDashboard';
import { LatestClassifieds } from './LatestClassifieds';
import { HomeNews } from './HomeNews';
import { HomeModules } from './HomeModules';
import { LocalLondon } from './LocalLondon';
import { AdvertisingStrip, CommunitySection } from './CommunitySection';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { RegionId } from '@/types';
import './home.css';

const JOURNEYS: RouteStop[] = [
  { label: 'Praca', description: 'Oferty pracy w UK', to: '/ogloszenia/praca', icon: 'Briefcase', accent: 'jobs' },
  { label: 'Pokoje i mieszkania', description: 'Wynajem i nieruchomości', to: '/ogloszenia/nieruchomosci', icon: 'Home', accent: 'housing' },
  { label: 'Pomoc', description: 'Porady, formalności i wsparcie', to: '/poradnik', icon: 'LifeBuoy', accent: 'help' },
  { label: 'Wiadomości', description: 'Co słychać w Londynie i UK', to: '/wiadomosci', icon: 'Newspaper', accent: 'news' },
  { label: 'Wydarzenia', description: 'Koncerty, imprezy, spotkania Polonii', to: '/wydarzenia', icon: 'CalendarDays', accent: 'events' },
  { label: 'Polskie firmy', description: 'Usługi, sklepy, lekarze i więcej', to: '/ogloszenia/uslugi', icon: 'Users', accent: 'services' },
];

export function HomePage() {
  useDocumentTitle('Londynek.net – Twój Londyn. Wszystko w jednym miejscu.', true);
  const [region, setRegion] = useState<RegionId>('west');
  return (
    <>
      <HomeHero />
      <div className="container home-journeys">
        <LondonRouteNavigation stops={JOURNEYS} label="Najważniejsze sprawy" />
      </div>
      <LondonDashboard region={region} onRegionChange={setRegion} />
      <Reveal>
        <LatestClassifieds />
      </Reveal>
      <Reveal>
        <HomeNews />
      </Reveal>
      <Reveal>
        <HomeModules />
      </Reveal>
      <LocalLondon region={region} />
      <Reveal>
        <CommunitySection />
      </Reveal>
      <AdvertisingStrip />
    </>
  );
}
