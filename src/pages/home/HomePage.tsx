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
  { label: 'Ciekawostki', description: 'Historie i smaczki z Londynu', to: '/ciekawostki', icon: 'Sparkles', accent: 'jobs' },
  { label: 'Ogłoszenia', description: 'Praca, pokoje i mieszkania', to: '/ogloszenia', icon: 'LayoutGrid', accent: 'housing' },
  { label: 'Wydarzenia', description: 'Koncerty, imprezy, spotkania Polonii', to: '/wydarzenia', icon: 'Ticket', accent: 'help' },
  { label: 'Transport', description: 'Metro na żywo i trasy po Londynie', to: '/transport/tube', icon: 'TrainFront', accent: 'news' },
  { label: 'Wydarzenia', description: 'Koncerty, imprezy, spotkania Polonii', to: '/wydarzenia', icon: 'CalendarDays', accent: 'events' },
  { label: 'Polskie firmy', description: 'Usługi, sklepy, lekarze i więcej', to: '/polskie-firmy', icon: 'Store', accent: 'services' },
];

export function HomePage() {
  useDocumentTitle('Londynek.net – Twój Londyn. Wszystko w jednym miejscu.', true);
  const [region] = useState<RegionId>('west');
  return (
    <>
      <HomeHero />
      <div className="container home-journeys">
        <LondonRouteNavigation stops={JOURNEYS} label="Najważniejsze sprawy" />
      </div>
      <LondonDashboard />
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
