import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Grid2x2, List, Map } from 'lucide-react';
import { useReveal } from '@/hooks';
import type { Accent } from '@/types';

interface SectionHeaderProps {
  title: string;
  kicker?: string;
  description?: string;
  accent?: Accent;
  action?: { label: string; to: string };
  children?: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
}

/** Section title with Underground-style coloured bar, optional "see all" link and inline controls. */
export function SectionHeader({ title, kicker, description, accent = 'housing', action, children, as: Tag = 'h2', id }: SectionHeaderProps) {
  return (
    <div className={`section-header accent-${accent}`}>
      <div className="section-header__text">
        {kicker && <span className="kicker">{kicker}</span>}
        <Tag className="section-header__title" id={id}>
          {title}
        </Tag>
        {description && <p className="section-header__desc">{description}</p>}
      </div>
      {(children || action) && (
        <div className="section-header__aside">
          {children}
          {action && (
            <Link to={action.to} className="text-link">
              {action.label}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function Reveal({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag ref={ref} className={`reveal ${className}`}>
      {children}
    </Tag>
  );
}

export function FilterChip({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button type="button" className="chip" aria-pressed={active} onClick={onClick}>
      {label}
      {count !== undefined && <span className="chip__count">{count}</span>}
    </button>
  );
}

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

export function SortSelect<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: readonly SortOption<T>[]; id: string }) {
  return (
    <div className="sort-select">
      <label htmlFor={id}>Sortuj:</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export type ViewMode = 'list' | 'grid' | 'map';

const VIEW_META: Record<ViewMode, { label: string; icon: typeof List }> = {
  list: { label: 'Lista', icon: List },
  grid: { label: 'Siatka', icon: Grid2x2 },
  map: { label: 'Mapa', icon: Map },
};

export function ViewToggle({ value, onChange, modes = ['list', 'grid', 'map'] }: { value: ViewMode; onChange: (v: ViewMode) => void; modes?: ViewMode[] }) {
  return (
    <div className="segmented" role="group" aria-label="Widok wyników">
      {modes.map((m) => {
        const { label, icon: IconCmp } = VIEW_META[m];
        return (
          <button key={m} type="button" aria-pressed={value === m} onClick={() => onChange(m)}>
            <IconCmp size={16} aria-hidden="true" />
            <span className="segmented__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const list = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="Strony wyników">
      <button type="button" className="pagination__btn" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Poprzednia strona">
        <ChevronRight size={16} className="flip" aria-hidden="true" />
      </button>
      {list.map((p) => (
        <button key={p} type="button" className="pagination__btn" aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      <button type="button" className="pagination__btn" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Następna strona">
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Ścieżka nawigacji" className="breadcrumbs">
      <ol>
        <li>
          <Link to="/">Start</Link>
        </li>
        {items.map((item) => (
          <li key={item.label}>
            <ChevronRight size={14} aria-hidden="true" />
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Use `as="h1"` when the empty state replaces a whole page (e.g. unknown id). */
export function EmptyState({ title, children, as: Tag = 'strong' }: { title: string; children?: ReactNode; as?: 'strong' | 'h1' }) {
  return (
    <div className="empty">
      <Tag className="empty__title">{title}</Tag>
      {children}
    </div>
  );
}
