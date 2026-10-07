import { SectionHeader } from '@/components/ui/primitives';
import { DistrictCard } from '@/components/cards/LocalCards';
import { LOCAL_DISTRICT_IDS, districtsByIds, regionName } from '@/data/districts';
import type { RegionId } from '@/types';

export function LocalLondon({ region }: { region: RegionId }) {
  const districts = districtsByIds(LOCAL_DISTRICT_IDS);
  return (
    <section className="local-london section" id="lokalnie" aria-labelledby="local-title">
      <div className="container">
        <SectionHeader
          id="local-title"
          title="Co dzieje się w Twojej części Londynu?"
          description={`Wybrany region: ${regionName(region)}. Dzielnice z tego regionu są wyróżnione – zmień region na mapie powyżej.`}
          accent="jobs"
          action={{ label: 'Przeglądaj dzielnice', to: '/ogloszenia/nieruchomosci' }}
        />
        <div className="local-london__grid">
          {districts.map((d) => (
            <DistrictCard key={d.id} district={d} variant="stats" active={d.region === region} />
          ))}
        </div>
      </div>
    </section>
  );
}
