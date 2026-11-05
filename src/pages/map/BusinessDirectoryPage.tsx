import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, List, Map as MapIcon, Search, Star } from 'lucide-react';
import { GeoStrip } from '@/components/location/GeoStrip';
import { MiniMap } from '@/components/location/MiniMap';
import { LocationInput } from '@/components/location/LocationInput';
import { LazyListingMap, MapItemCard } from '@/components/location/MapParts';
import { Breadcrumbs } from '@/components/ui/primitives';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { fold } from '@/lib/location/geocode';
import { directoryEntries, isOpenNow, type DirectoryEntry } from '@/lib/location/directory';
import { MAP_KIND_COLOUR, mapItemById, type MapItem } from '@/lib/location/mapItems';
import { distanceM, formatDistance } from '@/lib/location/nearestStations';
import type { LocationResult } from '@/lib/location/types';
import './map.css';

const DISTANCES = [1000, 3000, 5000, 10000];

export function BusinessDirectoryPage() {
  useDocumentTitle('Polskie firmy w Londynie – katalog z mapą');
  const all = useMemo(directoryEntries, []);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [borough, setBorough] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [placeText, setPlaceText] = useState('');
  const [origin, setOrigin] = useState<LocationResult | null>(null);
  const [maxDist, setMaxDist] = useState(5000);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const categories = useMemo(() => [...new Set(all.map((e) => e.category))].sort((a, b) => a.localeCompare(b, 'pl')), [all]);
  const boroughs = useMemo(() => [...new Set(all.map((e) => e.geo.borough))].sort((a, b) => a.localeCompare(b, 'en')), [all]);

  const results = useMemo(() => {
    const tokens = fold(q).split(' ').filter(Boolean);
    let list: { e: DirectoryEntry; d: number | null }[] = all
      .filter((e) => !category || e.category === category)
      .filter((e) => !borough || e.geo.borough === borough)
      .filter((e) => !openNow || isOpenNow(e.hours) === true)
      .filter((e) => !minRating || (e.rating ?? 0) >= minRating)
      .filter((e) => {
        if (!tokens.length) return true;
        const hay = fold(`${e.name} ${e.category} ${e.tagline ?? ''} ${e.geo.district}`);
        return tokens.every((t) => hay.includes(t));
      })
      .map((e) => ({ e, d: origin ? distanceM(origin.lat, origin.lng, e.geo.lat, e.geo.lng) : null }));
    if (origin) list = list.filter((x) => (x.d ?? 0) <= maxDist).sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
    else list.sort((a, b) => Number(b.e.seed) - Number(a.e.seed) || a.e.name.localeCompare(b.e.name, 'pl'));
    return list;
  }, [all, q, category, borough, openNow, minRating, origin, maxDist]);

  const mapItems = useMemo(() => results.map((r) => mapItemById(r.e.id)).filter((m): m is MapItem => !!m), [results]);
  const selectedItem = selected ? (mapItems.find((m) => m.id === selected) ?? null) : null;
  const hoursUnknown = openNow && all.some((e) => e.hours === null);

  return (
    <div className="mappage">
      <div className="container mappage__head">
        <Breadcrumbs items={[{ label: 'Polskie firmy' }]} />
        <h1 className="mappage__title">Polskie firmy w Londynie</h1>
        <p className="mappage__lead">
          Restauracje, delikatesy i usługi z mapą, najbliższą stacją metra i dojazdem. <span className="demo-label">Dane demonstracyjne</span>
        </p>
      </div>

      <form className="container dirbar" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="dirbar__q">
          <span className="visually-hidden">Szukaj firmy</span>
          <Search size={16} aria-hidden="true" />
          <input className="input" type="search" placeholder="Nazwa lub branża, np. delikatesy" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          <span className="dirbar__label">Kategoria</span>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Wszystkie</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="dirbar__label">Dzielnica (borough)</span>
          <select className="select" value={borough} onChange={(e) => setBorough(e.target.value)}>
            <option value="">Cały Londyn</option>
            {boroughs.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <div className="dirbar__near">
          <LocationInput label="W pobliżu" placeholder="Adres, postcode lub stacja" value={placeText} onChange={(v) => { setPlaceText(v); if (!v) setOrigin(null); }} onPick={(r) => { setOrigin(r); setPlaceText(r.label); }} picked={origin} allowMyLocation showNearest={false} />
          <label>
            <span className="dirbar__label">Odległość</span>
            <select className="select" value={maxDist} onChange={(e) => setMaxDist(Number(e.target.value))} disabled={!origin}>
              {DISTANCES.map((d) => (
                <option key={d} value={d}>
                  do {formatDistance(d)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="dirbar__label">Ocena</span>
          <select className="select" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
            <option value={0}>Dowolna</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </label>
        <label className="check dirbar__open">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} /> Otwarte teraz
        </label>
      </form>

      <div className="mappage__switch container">
        <div className="segmented" role="group" aria-label="Widok">
          <button type="button" aria-pressed={mobileView === 'list'} onClick={() => setMobileView('list')}>
            <List size={15} aria-hidden="true" /> Lista ({results.length})
          </button>
          <button type="button" aria-pressed={mobileView === 'map'} onClick={() => setMobileView('map')}>
            <MapIcon size={15} aria-hidden="true" /> Mapa
          </button>
        </div>
      </div>

      <div className={`container mappage__body mappage__body--dir is-${mobileView}`}>
        <section className="mappage__list" aria-label="Firmy">
          <p className="mappage__count" aria-live="polite">
            {results.length} {results.length === 1 ? 'firma' : 'firm'}
            {origin && ` w promieniu ${formatDistance(maxDist)} od: ${origin.label}`}
          </p>
          {hoursUnknown && <p className="mappage__stations">Godziny otwarcia znamy tylko dla części wpisów – miejsca bez godzin są ukryte przy tym filtrze.</p>}
          <ul className="dirlist">
            {results.map(({ e, d }) => {
              const open = isOpenNow(e.hours);
              return (
                <li key={e.id}>
                  <article
                    className={`dircard ${hovered === e.id || selected === e.id ? 'is-active' : ''}`}
                    style={{ ['--pin' as string]: e.seed ? MAP_KIND_COLOUR.business : MAP_KIND_COLOUR.services }}
                    onMouseEnter={() => setHovered(e.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className="dircard__head">
                      <span className="dircard__dot" aria-hidden="true" />
                      <h2 className="dircard__name">
                        <Link to={e.to}>{e.name}</Link>
                      </h2>
                      {e.rating != null && (
                        <span className="dircard__rating" aria-label={`Ocena ${e.rating} na 5`}>
                          <Star size={13} aria-hidden="true" /> {e.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="dircard__meta">
                      {e.category}
                      {d != null && ` · ${formatDistance(d)}`}
                      {open != null && (
                        <span className={open ? 'dircard__open' : 'dircard__closed'}>
                          <Clock size={12} aria-hidden="true" /> {open ? 'Otwarte' : 'Zamknięte'} (godz. przykładowe)
                        </span>
                      )}
                      {e.seed && <span className="dircard__seed">Wpis demonstracyjny</span>}
                    </p>
                    <div className="dircard__geo">
                      <GeoStrip geo={e.geo} name={e.name} listingId={e.id} variant="service" />
                      <MiniMap geo={e.geo} listingId={e.id} label={e.name} colour={e.seed ? MAP_KIND_COLOUR.business : MAP_KIND_COLOUR.services} />
                    </div>
                    <button type="button" className="dircard__show" onClick={() => { setSelected(e.id); setMobileView('map'); }}>
                      <MapIcon size={13} aria-hidden="true" /> Pokaż na mapie
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
          {!results.length && (
            <div className="empty">
              <p>Brak firm dla wybranych filtrów.</p>
            </div>
          )}
        </section>
        <div className="mappage__map">
          <LazyListingMap
            items={mapItems}
            hoveredId={hovered}
            selectedId={selected}
            onHover={setHovered}
            onSelect={setSelected}
            searchPoint={origin ? { lat: origin.lat, lng: origin.lng, label: origin.label } : null}
            radiusM={origin ? maxDist : null}
            preview={selectedItem ? <MapItemCard item={selectedItem} onClose={() => setSelected(null)} /> : null}
            ariaLabel="Mapa polskich firm w Londynie. Lista obok zawiera te same firmy."
            className="lmap--tilt"
          />
        </div>
      </div>
      <p className="container mappage__foot">
        Wpisy oznaczone jako demonstracyjne to publicznie znane miejsca użyte jako przykład – nie są klientami ani partnerami Londynek.net. Prowadzisz firmę?{' '}
        <Link to="/dodaj-ogloszenie">Dodaj ją do katalogu</Link>.
      </p>
    </div>
  );
}
