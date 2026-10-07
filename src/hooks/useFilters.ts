import { useCallback, useMemo, useState } from 'react';

export type FilterValue = string | string[];
export type FilterValues = Record<string, FilterValue>;

/** `initial` must be a stable (module-level) object – it is also the reset target. */
export function useFilters(initial: FilterValues) {
  const [values, setValues] = useState<FilterValues>(initial);
  const set = useCallback((id: string, value: FilterValue) => setValues((v) => ({ ...v, [id]: value })), []);
  const reset = useCallback(() => setValues(initial), [initial]);
  const activeCount = useMemo(
    () =>
      Object.entries(values).filter(([k, v]) => {
        const init = initial[k];
        return Array.isArray(v) ? v.length > 0 && JSON.stringify(v) !== JSON.stringify(init) : v !== '' && v !== init;
      }).length,
    [values, initial],
  );
  return { values, set, reset, activeCount };
}

export const str = (v: FilterValue | undefined) => (typeof v === 'string' ? v : '');
export const arr = (v: FilterValue | undefined) => (Array.isArray(v) ? v : []);
