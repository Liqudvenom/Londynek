import { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { LocationSelector } from '@/components/search/Selectors';
import { arr, str, type FilterValue, type FilterValues } from '@/hooks/useFilters';
import { plural } from '@/lib/format';
import './filters.css';

interface Option {
  value: string;
  label: string;
}

export type FilterField =
  | { type: 'select'; id: string; label: string; options: Option[] }
  | { type: 'location'; id: string; label: string }
  | { type: 'range'; id: string; label: string; unit?: string }
  | { type: 'checks'; id: string; label: string; options: Option[] }
  | { type: 'chips'; id: string; label: string; options: Option[] };

interface FilterPanelProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (id: string, value: FilterValue) => void;
}

function FilterPanel({ fields, values, onChange }: FilterPanelProps) {
  const uid = useId();
  return (
    <div className="filters__fields">
      {fields.map((f) => {
        const fid = `${uid}-${f.id}`;
        switch (f.type) {
          case 'select':
            return (
              <div key={f.id} className="field">
                <label htmlFor={fid} className="field__label">
                  {f.label}
                </label>
                <select id={fid} className="select" value={str(values[f.id])} onChange={(e) => onChange(f.id, e.target.value)}>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          case 'location':
            return <LocationSelector key={f.id} id={fid} label={f.label} showLabel value={str(values[f.id])} onChange={(v) => onChange(f.id, v)} />;
          case 'range':
            return (
              <fieldset key={f.id} className="filters__fieldset">
                <legend className="field__label">{f.label}</legend>
                <div className="filters__range">
                  <label className="visually-hidden" htmlFor={`${fid}-min`}>
                    {f.label} od
                  </label>
                  <input id={`${fid}-min`} className="input" inputMode="numeric" placeholder={`Od ${f.unit ?? ''}`} value={str(values[`${f.id}Min`])} onChange={(e) => onChange(`${f.id}Min`, e.target.value.replace(/\D/g, ''))} />
                  <label className="visually-hidden" htmlFor={`${fid}-max`}>
                    {f.label} do
                  </label>
                  <input id={`${fid}-max`} className="input" inputMode="numeric" placeholder={`Do ${f.unit ?? ''}`} value={str(values[`${f.id}Max`])} onChange={(e) => onChange(`${f.id}Max`, e.target.value.replace(/\D/g, ''))} />
                </div>
              </fieldset>
            );
          case 'checks': {
            const current = arr(values[f.id]);
            return (
              <fieldset key={f.id} className="filters__fieldset">
                <legend className="field__label">{f.label}</legend>
                {f.options.map((o) => (
                  <label key={o.value} className="check">
                    <input
                      type="checkbox"
                      checked={current.includes(o.value)}
                      onChange={(e) => onChange(f.id, e.target.checked ? [...current, o.value] : current.filter((x) => x !== o.value))}
                    />
                    {o.label}
                  </label>
                ))}
              </fieldset>
            );
          }
          case 'chips': {
            const current = str(values[f.id]);
            return (
              <fieldset key={f.id} className="filters__fieldset">
                <legend className="field__label">{f.label}</legend>
                <div className="cluster">
                  {f.options.map((o) => (
                    <button key={o.value} type="button" className="chip" aria-pressed={current === o.value} onClick={() => onChange(f.id, o.value)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

interface FilterSidebarProps extends FilterPanelProps {
  title?: string;
  onReset: () => void;
  resultCount: number;
  activeCount: number;
}

/** Desktop sticky filter column. Filters apply instantly (client-side demo data). */
export function FilterSidebar({ title = 'Filtry wyszukiwania', onReset, resultCount, activeCount, ...panel }: FilterSidebarProps) {
  return (
    <section className="filters panel" aria-label={title}>
      <div className="filters__head">
        <h2 className="filters__title">{title}</h2>
        <button type="button" className="filters__reset" onClick={onReset} disabled={activeCount === 0}>
          Wyczyść wszystko
        </button>
      </div>
      <FilterPanel {...panel} />
      <p className="filters__count" aria-live="polite">
        {resultCount} {plural(resultCount, 'wynik', 'wyniki', 'wyników')}
      </p>
    </section>
  );
}

/** Mobile: button that opens the same filters in a bottom sheet. */
export function MobileFilters({ title = 'Filtry', onReset, resultCount, activeCount, ...panel }: FilterSidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn mobile-filters__btn" onClick={() => setOpen(true)}>
        <SlidersHorizontal size={18} aria-hidden="true" /> Filtry
        {activeCount > 0 && <span className="mobile-filters__count">{activeCount}</span>}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        side="bottom"
        footer={
          <div className="mobile-filters__foot">
            <button type="button" className="btn" onClick={onReset} disabled={activeCount === 0}>
              Wyczyść
            </button>
            <button type="button" className="btn btn--navy" onClick={() => setOpen(false)}>
              Pokaż {resultCount} {plural(resultCount, 'wynik', 'wyniki', 'wyników')}
            </button>
          </div>
        }
      >
        <FilterPanel {...panel} />
      </Sheet>
    </>
  );
}
