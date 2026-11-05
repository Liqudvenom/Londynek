import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { LazyListingMap, MapItemCard } from '@/components/location/MapParts';
import { MAP_KIND_COLOUR, MAP_KIND_LABEL, allMapItems, type MapKind } from '@/lib/location/mapItems';
import { filterMapItems, NEAR_M } from '@/lib/location/mapQuery';
import type { LocationResult } from '@/lib/location/types';
import { MapFinder } from './MapFinder';

const KINDS: MapKind[] = ['jobs', 'housing', 'services', 'business', 'events', 'market'];

export function LondonDashboard() {
  const all = allMapItems();
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<LocationResult | null>(null);
  const [kinds, setKinds] = useState<ReadonlySet<MapKind>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const matched = useMemo(() => filterMapItems(all, query, origin), [all, query, origin]);
  const items = useMemo(() => (kinds.size ? matched.filter((i) => kinds.has(i.kind)) : matched), [matched, kinds]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<MapKind, number>;
    for (const i of matched) c[i.kind]++;
    return c;
  }, [matched]);
  const selected = selectedId ? items.find((i) => i.id === selectedId) ?? null : null;

  const toggle = (kind: MapKind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <section className="container section dashboard" aria-label="Interaktywna mapa Londynu">
      <div className="dashboard-map">
        <LazyListingMap
          items={items}
          center={{ lat: 51.5072, lng: -0.1276, zoom: 10.2 }}
          fitOnChange={!origin}
          cluster
          basemap="osm"
          clusterTone="navy"
          maxZoom={14.5}
          searchPoint={origin ? { lat: origin.lat, lng: origin.lng, label: origin.label } : null}
          radiusM={origin ? NEAR_M : null}
          selectedId={selectedId}
          onSelect={setSelectedId}
          preview={selected ? <MapItemCard item={selected} onClose={() => setSelectedId(null)} /> : null}
          ariaLabel="Mapa Londynu z ofertami, firmami i wydarzeniami"
          className="dashboard-map__canvas"
        />

        <div className="dashboard-map__legend">
          <div className="dashboard-map__legend-head">
            <p>Na mapie · {items.length}</p>
            {kinds.size > 0 && (
              <button type="button" className="dashboard-map__all" onClick={() => setKinds(new Set())}>
                Wszystkie
              </button>
            )}
          </div>
          <div className="dashboard-map__filters" role="group" aria-label="Rodzaj ofert">
            {KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`dashboard-map__filter ${kinds.has(kind) ? 'is-on' : ''}`}
                style={{ ['--swatch' as string]: MAP_KIND_COLOUR[kind] }}
                aria-pressed={kinds.has(kind)}
                onClick={() => toggle(kind)}
              >
                <span className="dashboard-map__dot" style={{ background: MAP_KIND_COLOUR[kind] }} aria-hidden="true" />
                {MAP_KIND_LABEL[kind]}
                <b>{counts[kind]}</b>
              </button>
            ))}
          </div>
          <p>
            <span className="dashboard-map__dot dashboard-map__dot--area" aria-hidden="true" />
            <span>
              Pusta pinezka z kręgiem to okolica kodu pocztowego. Adres zamieszkania osoby prywatnej widzi tylko autor ogłoszenia.
            </span>
          </p>
          <Link to="/zaloguj" className="dashboard-map__login">
            <ShieldCheck size={13} aria-hidden="true" /> Zaloguj się jako zleceniodawca lub zleceniobiorca
          </Link>
        </div>

        <MapFinder query={query} onQuery={setQuery} origin={origin} onOrigin={setOrigin} items={items} onPickItem={setSelectedId} />
      </div>
    </section>
  );
}
