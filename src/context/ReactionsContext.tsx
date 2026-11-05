import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const REACTIONS = [
  { id: 'like', label: 'Lubię', icon: 'like' },
  { id: 'love', label: 'Super', icon: 'love' },
  { id: 'haha', label: 'Haha', icon: 'haha' },
  { id: 'sad', label: 'Smutne', icon: 'sad' },
] as const;

export type ReactionId = (typeof REACTIONS)[number]['id'];

const STORAGE_KEY = 'londynek:reactions';

type Store = Record<string, ReactionId>;

interface ReactionsValue {
  mine: (id: string) => ReactionId | null;
  /** Toggle: the same reaction again clears it. */
  react: (id: string, reaction: ReactionId) => void;
  count: (id: string, reaction: ReactionId) => number;
  total: (id: string) => number;
}

const ReactionsContext = createContext<ReactionsValue | null>(null);

function readStorage(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Stable demo totals so a post looks lived-in before anyone reacts. */
function seed(id: string, reaction: ReactionId) {
  let h = 0;
  const key = `${id}:${reaction}`;
  for (let i = 0; i < key.length; i++) h = (h * 33 + key.charCodeAt(i)) >>> 0;
  return 3 + (h % (reaction === 'like' ? 220 : 80));
}

export function ReactionsProvider({ children }: { children: ReactNode }) {
  const [mineMap, setMineMap] = useState<Store>(readStorage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mineMap));
    } catch {
      /* private mode */
    }
  }, [mineMap]);

  const react = useCallback((id: string, reaction: ReactionId) => {
    setMineMap((prev) => {
      const next = { ...prev };
      if (next[id] === reaction) delete next[id];
      else next[id] = reaction;
      return next;
    });
  }, []);

  const value = useMemo<ReactionsValue>(() => {
    const mine = (id: string) => mineMap[id] ?? null;
    const count = (id: string, reaction: ReactionId) => seed(id, reaction) + (mineMap[id] === reaction ? 1 : 0);
    const total = (id: string) => REACTIONS.reduce((sum, r) => sum + count(id, r.id), 0);
    return { mine, react, count, total };
  }, [mineMap, react]);

  return <ReactionsContext.Provider value={value}>{children}</ReactionsContext.Provider>;
}

export function useReactions() {
  const ctx = useContext(ReactionsContext);
  if (!ctx) throw new Error('useReactions must be used inside ReactionsProvider');
  return ctx;
}
