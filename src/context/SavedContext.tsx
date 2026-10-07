import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'londynek:saved';

interface SavedValue {
  saved: ReadonlySet<string>;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => boolean;
}

const SavedContext = createContext<SavedValue | null>(null);

function readStorage(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Saved listings / articles / events. Persisted locally only — no account backend. */
export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(readStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
    } catch {
      /* storage unavailable (private mode) – keep in memory */
    }
  }, [saved]);

  const toggle = useCallback(
    (id: string) => {
      const willSave = !saved.has(id);
      setSaved((prev) => {
        const copy = new Set(prev);
        if (willSave) copy.add(id);
        else copy.delete(id);
        return copy;
      });
      return willSave;
    },
    [saved],
  );

  const value = useMemo<SavedValue>(() => ({ saved, isSaved: (id) => saved.has(id), toggle }), [saved, toggle]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error('useSaved must be used inside SavedProvider');
  return ctx;
}
