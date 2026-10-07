import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/Tabs';
import { HorizontalRail } from '@/components/ui/HorizontalRail';
import { ListingCard } from '@/components/cards/ListingCards';
import { CLASSIFIEDS } from '@/data/classifieds';
import type { ClassifiedCategory } from '@/types';

type TabId = 'all' | ClassifiedCategory;

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'praca', label: 'Praca' },
  { id: 'nieruchomosci', label: 'Pokoje' },
  { id: 'uslugi', label: 'Usługi' },
  { id: 'motoryzacja', label: 'Motoryzacja' },
  { id: 'kupie-sprzedam', label: 'Sprzedaż' },
  { id: 'towarzyskie', label: 'Towarzyskie' },
];

export function LatestClassifieds() {
  const [tab, setTab] = useState<TabId>('all');
  const items = useMemo(
    () => [...CLASSIFIEDS].filter((l) => tab === 'all' || l.category === tab).sort((a, b) => a.postedHours - b.postedHours).slice(0, 10),
    [tab],
  );
  return (
    <section className="container section" aria-labelledby="latest-classifieds">
      <SectionHeader title="Najnowsze ogłoszenia" id="latest-classifieds" accent="housing" action={{ label: 'Zobacz wszystkie', to: '/ogloszenia' }}>
        <Link to="/dodaj-ogloszenie" className="btn btn--sm">
          <Plus size={16} aria-hidden="true" /> Dodaj ogłoszenie
        </Link>
      </SectionHeader>
      <Tabs items={TABS} value={tab} onChange={setTab} label="Kategorie ogłoszeń" controls="latest-rail" className="latest__tabs" />
      <div id="latest-rail" role="tabpanel" className="latest__rail">
        <HorizontalRail label="Najnowsze ogłoszenia – przewiń" itemWidth="236px">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} layout="rail" />
          ))}
        </HorizontalRail>
      </div>
    </section>
  );
}
