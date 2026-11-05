import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Hash, Home, LayoutGrid, Loader2, MapPin, Navigation, Search, Wrench, X, type LucideIcon } from 'lucide-react';
import { geocode } from '@/lib/location/geocode';
import { extraHits, NEAR_M, parseMapQuery } from '@/lib/location/mapQuery';
import { MAP_KIND_COLOUR, MAP_KIND_LABEL, publicPlaceLabel, type MapItem, type MapKind } from '@/lib/location/mapItems';
import { resultToPlace, routeSearchUrl } from '@/lib/location/routeParams';
import type { LocationResult } from '@/lib/location/types';
import type { SearchEntry } from '@/lib/search';

const NEAR_LINKS: { label: string; cat: MapKind | 'all'; icon: LucideIcon }[] = [
  { label: 'Praca', cat: 'jobs', icon: Briefcase },
  { label: 'Ogłoszenia', cat: 'all', icon: LayoutGrid },
  { label: 'Nieruchomości', cat: 'housing', icon: Home },
  { label: 'Usługi', cat: 'services', icon: Wrench },
];

/** Next steps once someone pasted their postcode: a route from there, or offers around it. */
function OriginActions({ origin, onNavigate }: { origin: LocationResult; onNavigate: () => void }) {
  const near = (cat: MapKind | 'all') =>
    `/map?${new URLSearchParams({ lat: origin.lat.toFixed(5), lng: origin.lng.toFixed(5), q: origin.label, r: String(NEAR_M), ...(cat === 'all' ? {} : { cat }) })}`;
  return (
    <div className="dashboard-map__actions">
      <Link className="dashboard-map__route" to={routeSearchUrl(resultToPlace(origin), null)} onClick={onNavigate}>
        <Navigation size={15} aria-hidden="true" />
        <span>
          <strong>Wyznacz trasę stąd</strong>
          <small>Metro, autobus i pociąg z {origin.label}</small>
        </span>
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
      <p className="dashboard-map__group">Szukaj w pobliżu</p>
      <div className="dashboard-map__near">
        {NEAR_LINKS.map((l) => (
          <Link key={l.label} to={near(l.cat)} onClick={onNavigate} style={l.cat === 'all' ? undefined : { ['--swatch' as string]: MAP_KIND_COLOUR[l.cat] }}>
            <l.icon size={14} aria-hidden="true" /> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const NO_ROWS: LocationResult[] = [];

type Row =
  | { key: string; kind: 'loc'; result: LocationResult }
  | { key: string; kind: 'pin'; item: MapItem }
  | { key: string; kind: 'link'; entry: SearchEntry };

export function MapFinder({
  query,
  onQuery,
  origin,
  onOrigin,
  items,
  onPickItem,
}: {
  query: string;
  onQuery: (value: string) => void;
  origin: LocationResult | null;
  onOrigin: (value: LocationResult | null) => void;
  items: MapItem[];
  onPickItem: (id: string) => void;
}) {
  const listId = useId();
  const navigate = useNavigate();
  const parsed = parseMapQuery(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pack, setPack] = useState<{ place: string; rows: LocationResult[]; loading: boolean; error: string | null }>({ place: '', rows: [], loading: false, error: null });
  const pasteRef = useRef(false);
  const blurTimer = useRef<number>();
  const place = parsed.place?.trim() ?? '';
  const located = pack.place === place && !pack.loading;
  const locations = located ? pack.rows : NO_ROWS;
  const locError = located ? pack.error : null;

  useEffect(() => {
    if (place.length < 2) {
      setPack({ place, rows: [], loading: false, error: null });
      return;
    }
    const ctrl = new AbortController();
    setPack((prev) => ({ ...prev, loading: true, error: null }));
    const t = window.setTimeout(() => {
      geocode(place, ctrl.signal).then(
        (rows) => setPack({ place, rows: rows.filter((r) => r.kind === 'postcode' || r.kind === 'address').slice(0, 4), loading: false, error: null }),
        (e: Error) => {
          if (e.name === 'AbortError') return;
          setPack({ place, rows: [], loading: false, error: e.message });
        },
      );
    }, 250);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [place]);

  const guides = useMemo(() => extraHits(query, new Set(items.map((i) => i.id))), [query, items]);
  const placeOnly = Boolean(place) && !parsed.intent && !parsed.text && !origin;
  const pins = placeOnly ? [] : items.slice(0, 6);

  const rows: Row[] = [
    ...locations.map((result) => ({ key: result.id, kind: 'loc' as const, result })),
    ...pins.map((item) => ({ key: item.id, kind: 'pin' as const, item })),
    ...guides.map((entry) => ({ key: entry.id, kind: 'link' as const, entry })),
  ];

  useEffect(() => {
    if (!pasteRef.current || !located || !place) return;
    pasteRef.current = false;
    const hit = locations[0];
    if (hit) onOrigin(hit);
  }, [located, locations, place, onOrigin]);

  const show = open && query.trim().length >= 2;
  const searchingPlace = place.length >= 2 && !located;

  const choose = (row: Row) => {
    if (row.kind === 'loc') {
      onOrigin(row.result);
      setOpen(true);
      return;
    }
    if (row.kind === 'pin') {
      onPickItem(row.item.id);
      setOpen(false);
      return;
    }
    setOpen(false);
    navigate(row.entry.to);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = rows[Math.max(0, active)];
      if (row) choose(row);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let index = -1;

  return (
    <form className="dashboard-map__search" role="search" onSubmit={(e) => e.preventDefault()}>
      <Search size={16} aria-hidden="true" className="dashboard-map__search-icon" />
      <input
        type="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Praca, pokój, pomoc lub kod pocztowy"
        value={query}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          onQuery(e.target.value);
          if (origin) onOrigin(null);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 160);
        }}
        onPaste={() => {
          pasteRef.current = true;
        }}
        onKeyDown={onKey}
      />
      {searchingPlace && <Loader2 size={15} className="dashboard-map__spin" aria-hidden="true" />}
      {(query || origin) && (
        <button
          type="button"
          className="dashboard-map__clear"
          aria-label="Wyczyść wyszukiwanie"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onQuery('');
            onOrigin(null);
            setOpen(false);
          }}
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}

      {show && (
        <div className="dashboard-map__panel" id={listId} role="listbox" aria-label="Wyniki wyszukiwania" onMouseDown={(e) => e.preventDefault()}>
          {origin && (
            <p className="dashboard-map__where">
              <MapPin size={13} aria-hidden="true" /> Wokół {origin.label}
              {origin.postcode && origin.label !== origin.postcode ? ` · ${origin.postcode}` : ''} · {items.length} w pobliżu
            </p>
          )}
          {origin && <OriginActions origin={origin} onNavigate={() => setOpen(false)} />}
          {parsed.intent && !origin && (
            <p className="dashboard-map__where">
              {parsed.intent.label} · {items.length} {items.length === 1 ? 'oferta' : 'ofert'}
            </p>
          )}

          {locations.length > 0 && <p className="dashboard-map__group">Lokalizacja</p>}
          {locations.map((result) => {
            index += 1;
            const i = index;
            return (
              <button key={result.id} id={`${listId}-${i}`} type="button" role="option" aria-selected={active === i} className={`dashboard-map__hit ${active === i ? 'is-on' : ''}`} onClick={() => choose({ key: result.id, kind: 'loc', result })}>
                {result.kind === 'postcode' ? <Hash size={15} aria-hidden="true" /> : <MapPin size={15} aria-hidden="true" />}
                <span>
                  <strong>{result.label}</strong>
                  {result.detail && <small>{result.detail}</small>}
                </span>
              </button>
            );
          })}

          {pins.length > 0 && <p className="dashboard-map__group">Oferty</p>}
          {pins.map((item) => {
            index += 1;
            const i = index;
            return (
              <button key={item.id} id={`${listId}-${i}`} type="button" role="option" aria-selected={active === i} className={`dashboard-map__hit ${active === i ? 'is-on' : ''}`} onClick={() => choose({ key: item.id, kind: 'pin', item })}>
                <span className="dashboard-map__dot" style={{ background: MAP_KIND_COLOUR[item.kind] }} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {MAP_KIND_LABEL[item.kind]} · {publicPlaceLabel(item.geo)}
                  </small>
                </span>
              </button>
            );
          })}

          {guides.length > 0 && <p className="dashboard-map__group">{parsed.intent?.id === 'help' ? 'Pomoc i poradnik' : 'W serwisie'}</p>}
          {guides.map((entry) => {
            index += 1;
            const i = index;
            return (
              <Link key={entry.id} id={`${listId}-${i}`} role="option" aria-selected={active === i} className={`dashboard-map__hit ${active === i ? 'is-on' : ''}`} to={entry.to} onClick={() => setOpen(false)}>
                <Search size={15} aria-hidden="true" />
                <span>
                  <strong>{entry.title}</strong>
                  <small>{entry.type}</small>
                </span>
              </Link>
            );
          })}

          {searchingPlace && locations.length === 0 && <p className="dashboard-map__empty">Szukam tego adresu…</p>}
          {!searchingPlace && rows.length === 0 && <p className="dashboard-map__empty">Nic nie pasuje. Wpisz pracę, pokój, pomoc albo wklej kod pocztowy.</p>}
          {locError && place && <p className="dashboard-map__empty">{locError}</p>}
        </div>
      )}
    </form>
  );
}
