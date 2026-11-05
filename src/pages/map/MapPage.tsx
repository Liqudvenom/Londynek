import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { List, Map as MapIcon } from 'lucide-react';
import { LocationInput } from '@/components/location/LocationInput';
import { LazyListingMap, MapItemCard } from '@/components/location/MapParts';
import { Breadcrumbs } from '@/components/ui/primitives';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNearestStations } from '@/hooks/useLocation';
import { allMapItems, MAP_KIND_COLOUR, MAP_KIND_LABEL, mapItemById, publicPlaceLabel, type MapKind } from '@/lib/location/mapItems';
import { distanceM, formatDistance } from '@/lib/location/nearestStations';
import type { LocationResult } from '@/lib/location/types';
import './map.css';

const FILTERS: { id: 'all' | MapKind; label: string }[] = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'jobs', label: 'Praca' },
  { id: 'housing', label: 'Nieruchomości' },
  { id: 'services', label: 'Usługi' },
  { id: 'business', label: 'Firmy' },
  { id: 'events', label: 'Wydarzenia' },
  { id: 'market', label: 'Ogłoszenia' },
];
const RADII = [500, 1000, 2000, 5000];

const num = (v: string | null) => (v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

export function MapPage() {
  useDocumentTitle('Mapa Londynu – ogłoszenia, firmy i wydarzenia');
  const [params, setParams] = useSearchParams();
  const lat = num(params.get('lat'));
  const lng = num(params.get('lng'));
  const listingId = params.get('listingId');
  const cat = (params.get('cat') as MapKind | 'all' | null) ?? 'all';
  const radius = num(params.get('r'));
  const placeName = params.get('q');
  const [text, setText] = useState(placeName ?? '');
  const [picked, setPicked] = useState<LocationResult | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const selected = listingId ? (mapItemById(listingId) ?? null) : null;

  // A point search (no listing) centres the map and filters by distance.
  const point = lat != null && lng != null && !listingId ? { lat, lng, label: placeName ?? 'Wybrany punkt' } : null;
  const effRadius = point ? (radius ?? 1000) : null;

  const items = useMemo(() => {
    let list = allMapItems().filter((i) => cat === 'all' || i.kind === cat);
    if (point && effRadius) {
      list = list
        .map((i) => ({ i, d: distanceM(point.lat, point.lng, i.geo.lat, i.geo.lng) }))
        .filter((x) => x.d <= effRadius)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.i);
    }
    return list;
  }, [cat, point?.lat, point?.lng, effRadius]); // eslint-disable-line react-hooks/exhaustive-deps

  const stations = useNearestStations(point ?? selected?.geo ?? null, 3);
  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const onPick = (r: LocationResult) => {
    setPicked(r);
    setText(r.label);
    if (r.to && r.id.startsWith('local:')) update({ listingId: r.id.slice(6), lat: null, lng: null, q: null });
    else update({ lat: r.lat.toFixed(5), lng: r.lng.toFixed(5), q: r.label, listingId: null });
  };

  const counts = useMemo(() => {
    const base = point && effRadius ? allMapItems().filter((i) => distanceM(point.lat, point.lng, i.geo.lat, i.geo.lng) <= effRadius) : allMapItems();
    const c: Record<string, number> = { all: base.length };
    for (const i of base) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [point?.lat, point?.lng, effRadius]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mappage">
      <div className="container mappage__head">
        <Breadcrumbs items={[{ label: 'Mapa Londynu' }]} />
        <h1 className="mappage__title">Mapa Londynu</h1>
        <p className="mappage__lead">Ogłoszenia, polskie firmy i wydarzenia w jednym miejscu. Lokalizacje prywatnych ogłoszeń są przybliżone.</p>
      </div>

      <div className="container mappage__toolbar">
        <div className="mappage__filters" role="toolbar" aria-label="Kategorie na mapie">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`mchip ${cat === f.id ? 'is-active' : ''}`}
              aria-pressed={cat === f.id}
              style={f.id !== 'all' ? { ['--pin' as string]: MAP_KIND_COLOUR[f.id] } : undefined}
              onClick={() => update({ cat: f.id === 'all' ? null : f.id })}
            >
              {f.id !== 'all' && <span className="mchip__dot" aria-hidden="true" />}
              {f.label}
              <span className="mchip__count">{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="mappage__search">
          <LocationInput label="Szukaj na mapie" hideLabel placeholder="Adres, postcode lub miejsce" value={text} onChange={(v) => { setText(v); if (!v) setPicked(null); }} onPick={onPick} picked={picked} allowMyLocation />
          {point && (
            <label className="mappage__radius">
              <span>Promień</span>
              <select className="select" value={effRadius ?? 1000} onChange={(e) => update({ r: e.target.value })}>
                {RADII.map((r) => (
                  <option key={r} value={r}>
                    {formatDistance(r)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <div className="mappage__switch container">
        <div className="segmented" role="group" aria-label="Widok">
          <button type="button" aria-pressed={mobileView === 'map'} onClick={() => setMobileView('map')}>
            <MapIcon size={15} aria-hidden="true" /> Mapa
          </button>
          <button type="button" aria-pressed={mobileView === 'list'} onClick={() => setMobileView('list')}>
            <List size={15} aria-hidden="true" /> Lista ({items.length})
          </button>
        </div>
      </div>

      <div className={`container mappage__body is-${mobileView}`}>
        <aside className="mappage__list" aria-label="Wyniki na mapie">
          <p className="mappage__count" aria-live="polite">
            {point ? `${items.length} w promieniu ${formatDistance(effRadius ?? 1000)} od: ${point.label}` : `${items.length} miejsc na mapie`}
          </p>
          {stations && stations.length > 0 && (point || selected) && (
            <p className="mappage__stations">
              Najbliższe metro: {stations.map((s) => `${s.name} (${s.walkMin} min)`).join(', ')}
            </p>
          )}
          <ul className="mlist">
            {items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className={`mlist__item ${hovered === i.id || selected?.id === i.id ? 'is-active' : ''}`}
                  style={{ ['--pin' as string]: MAP_KIND_COLOUR[i.kind] }}
                  onMouseEnter={() => setHovered(i.id)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i.id)}
                  onBlur={() => setHovered(null)}
                  onClick={() => update({ listingId: i.id })}
                  aria-current={selected?.id === i.id ? 'true' : undefined}
                >
                  <span className="mlist__dot" aria-hidden="true" />
                  <span className="mlist__text">
                    <span className="mlist__title">{i.title}</span>
                    <span className="mlist__meta">
                      {MAP_KIND_LABEL[i.kind]} · {publicPlaceLabel(i.geo)}
                      {point && ` · ${formatDistance(distanceM(point.lat, point.lng, i.geo.lat, i.geo.lng))}`}
                    </span>
                  </span>
                  {i.priceLabel && <span className="mlist__price">{i.priceLabel}</span>}
                </button>
              </li>
            ))}
          </ul>
          {!items.length && (
            <div className="empty">
              <p>Brak wyników w tym obszarze. Zwiększ promień lub wybierz inną kategorię.</p>
            </div>
          )}
        </aside>
        <div className="mappage__map">
          <LazyListingMap
            items={items}
            hoveredId={hovered}
            selectedId={selected?.id ?? null}
            onHover={setHovered}
            onSelect={(id) => update({ listingId: id })}
            center={selected ? { lat: selected.geo.lat, lng: selected.geo.lng, zoom: 14.5 } : point ? { lat: point.lat, lng: point.lng, zoom: 13.5 } : null}
            searchPoint={point}
            radiusM={effRadius}
            stations={stations ?? undefined}
            preview={selected ? <MapItemCard item={selected} onClose={() => update({ listingId: null })} /> : null}
            ariaLabel="Interaktywna mapa Londynu z ogłoszeniami. Lista wyników obok zawiera te same miejsca."
            className="lmap--tilt"
          />
        </div>
      </div>
      <p className="container mappage__foot">
        Szukasz dojazdu? <Link to="/transport/tube">Zaplanuj trasę metrem</Link>.
      </p>
    </div>
  );
}
