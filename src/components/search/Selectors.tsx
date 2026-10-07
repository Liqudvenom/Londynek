import { MapPin, LayoutGrid } from 'lucide-react';
import { DISTRICTS, REGIONS } from '@/data/districts';
import { SEARCH_SCOPES, type SearchScope } from '@/lib/search';

interface LocationSelectorProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label?: string;
  showLabel?: boolean;
}

/** Region + borough select. Values are display names so they can be matched against listing locations. */
export function LocationSelector({ id, value, onChange, label = 'Lokalizacja', showLabel = false }: LocationSelectorProps) {
  return (
    <div className="selector">
      <label htmlFor={id} className={showLabel ? 'field__label' : 'visually-hidden'}>
        {label}
      </label>
      <MapPin size={18} className="selector__icon" aria-hidden="true" />
      <select id={id} className="select selector__select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Londyn i okolice</option>
        <optgroup label="Regiony">
          {REGIONS.map((r) => (
            <option key={r.id} value={r.name}>
              {r.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Dzielnice">
          {DISTRICTS.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name} ({d.postcode})
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

export function CategorySelector({ id, value, onChange }: { id: string; value: SearchScope; onChange: (v: SearchScope) => void }) {
  return (
    <div className="selector">
      <label htmlFor={id} className="visually-hidden">
        Kategoria
      </label>
      <LayoutGrid size={18} className="selector__icon" aria-hidden="true" />
      <select id={id} className="select selector__select" value={value} onChange={(e) => onChange(e.target.value as SearchScope)}>
        {SEARCH_SCOPES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
