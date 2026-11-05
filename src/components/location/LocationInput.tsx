import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Building2, Crosshair, Hash, Loader2, MapPin, Store, TrainFront, X } from 'lucide-react';
import { lineColour } from '@/data/tube-colors';
import { useLocationSearch, useNearestStations } from '@/hooks/useLocation';
import { detectInputType, INPUT_TYPE_LABEL } from '@/lib/location/detect';
import { formatDistance } from '@/lib/location/nearestStations';
import { currentPosition, reverseGeocode } from '@/lib/location/reverseGeocode';
import type { LocationResult } from '@/lib/location/types';
import './location-input.css';

const GROUPS = [
  { key: 'places', title: 'MIEJSCA', Icon: Store },
  { key: 'stations', title: 'STACJE', Icon: TrainFront },
  { key: 'addresses', title: 'ADRESY', Icon: Building2 },
  { key: 'postcodes', title: 'KODY POCZTOWE', Icon: Hash },
] as const;

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  /** Called when the user picks a suggestion (or their current location). */
  onPick: (r: LocationResult) => void;
  picked?: LocationResult | null;
  /** Small coloured marker before the input (route start / end) */
  marker?: ReactNode;
  showNearest?: boolean;
  allowMyLocation?: boolean;
  hideLabel?: boolean;
  className?: string;
  inputId?: string;
}

export function LocationInput({ label, placeholder, value, onChange, onPick, picked, marker, showNearest = true, allowMyLocation = false, hideLabel = false, className = '', inputId }: Props) {
  const autoId = useId();
  const id = inputId ?? `loc-${autoId}`;
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const blurTimer = useRef<number>();
  const query = picked && picked.label === value ? '' : value;
  const { groups, loading } = useLocationSearch(open ? query : '');
  const flat = useMemo(() => GROUPS.flatMap((g) => groups[g.key]), [groups]);
  const nearest = useNearestStations(showNearest && picked && picked.kind !== 'station' ? picked : null, 1)?.[0];
  const type = value.trim().length >= 2 && !picked ? detectInputType(value) : null;

  const pick = (r: LocationResult) => {
    onPick(r);
    setOpen(false);
    setActive(-1);
  };

  const useMine = async () => {
    setLocating(true);
    setGeoError(null);
    try {
      const pos = await currentPosition();
      const rev = await reverseGeocode(pos.lat, pos.lng).catch(() => null);
      pick({
        id: 'me',
        kind: 'address',
        label: 'Moja lokalizacja',
        detail: rev?.postcode ?? undefined,
        lat: pos.lat,
        lng: pos.lng,
        formattedAddress: rev ? `Moja lokalizacja (${rev.postcode})` : 'Moja lokalizacja',
        postcode: rev?.postcode ?? null,
        district: rev?.district ?? null,
      });
    } catch (e) {
      setGeoError((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === 'Enter' && open && flat.length) {
      e.preventDefault();
      pick(flat[Math.max(0, active)]!);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let idx = -1;
  const showList = open && query.trim().length >= 2;
  return (
    <div className={`locin ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : 'locin__label'}>
        {label}
      </label>
      <div className={`locin__box ${picked ? 'is-picked' : ''}`}>
        {marker ?? <MapPin size={16} aria-hidden="true" className="locin__icon" />}
        <input
          id={id}
          className="locin__input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => (blurTimer.current = window.setTimeout(() => setOpen(false), 150))}
          onKeyDown={onKey}
        />
        {type && <span className="locin__type">{INPUT_TYPE_LABEL[type]}</span>}
        {loading && showList && <Loader2 size={15} className="locin__spin" aria-hidden="true" />}
        {value && (
          <button type="button" className="locin__clear" onClick={() => onChange('')} aria-label={`Wyczyść: ${label}`}>
            <X size={15} aria-hidden="true" />
          </button>
        )}
        {allowMyLocation && !value && (
          <button type="button" className="locin__me" onClick={useMine} disabled={locating} aria-label="Użyj mojej lokalizacji" title="Użyj mojej lokalizacji">
            {locating ? <Loader2 size={15} className="locin__spin" aria-hidden="true" /> : <Crosshair size={15} aria-hidden="true" />}
          </button>
        )}
      </div>
      {showList && (
        <div className="locin__pop" id={listId} role="listbox" aria-label={`Podpowiedzi: ${label}`} onMouseDown={() => window.clearTimeout(blurTimer.current)}>
          {GROUPS.map(({ key, title, Icon }) => {
            const list = groups[key];
            if (!list.length) return null;
            return (
              <div key={key} role="group" aria-label={title}>
                <p className="locin__group">{title}</p>
                {list.map((r) => {
                  idx++;
                  const i = idx;
                  return (
                    <div
                      key={r.id}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className="locin__opt"
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(r)}
                    >
                      <Icon size={15} aria-hidden="true" className="locin__opt-icon" />
                      <span className="locin__opt-text">
                        <span className="locin__opt-label">{r.label}</span>
                        {r.detail && <span className="locin__opt-detail">{r.detail}</span>}
                      </span>
                      {r.lines && (
                        <span className="locin__lines" aria-hidden="true">
                          {r.lines.slice(0, 4).map((l) => (
                            <span key={l} style={{ background: lineColour(l) }} />
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {!loading && !flat.length && <p className="locin__empty">{groups.remoteError ?? 'Brak podpowiedzi – spróbuj kodu pocztowego, np. SW7 2PG.'}</p>}
          {!!flat.length && groups.remoteError && <p className="locin__empty">{groups.remoteError}</p>}
        </div>
      )}
      {picked && showNearest && nearest && (
        <p className="locin__nearest">
          <span className="locin__dot" style={{ background: lineColour(nearest.lines[0] ?? '') }} aria-hidden="true" />
          Najbliższa stacja: <strong>{nearest.name}</strong> · {formatDistance(nearest.distanceM)} · ok. {nearest.walkMin} min pieszo
        </p>
      )}
      {geoError && (
        <p className="locin__err" role="alert">
          {geoError}
        </p>
      )}
    </div>
  );
}
