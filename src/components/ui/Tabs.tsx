import { useId, useRef, type KeyboardEvent } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number | string;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  variant?: 'line' | 'pill';
  className?: string;
  /** id of the controlled panel, if a single panel swaps content */
  controls?: string;
}

/** Accessible tablist with roving focus (arrow keys, Home, End). */
export function Tabs<T extends string>({ items, value, onChange, label, variant = 'line', className = '', controls }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`tabs ${variant === 'pill' ? 'tabs--pill' : ''} ${className}`}>
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${baseId}-${item.id}`}
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={selected}
            aria-controls={controls}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.label}
            {item.count !== undefined && <span className="tabs__count">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
