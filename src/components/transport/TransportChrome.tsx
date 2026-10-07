import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/primitives';
import { ERROR_TEXT, formatClock, staleLabel } from '@/lib/tfl/format';
import type { ApiErrorKind, ApiMeta } from '@/lib/tfl/types';
import { useNow } from '@/hooks/useTransport';

export const TRANSPORT_MODES = [
  { id: 'tube', label: 'Tube', to: '/transport/tube' },
  { id: 'overground', label: 'Overground', to: '/transport?tryb=overground' },
  { id: 'elizabeth-line', label: 'Elizabeth line', to: '/transport?tryb=elizabeth-line' },
  { id: 'dlr', label: 'DLR', to: '/transport?tryb=dlr' },
  { id: 'national-rail', label: 'Rail', to: '/transport?tryb=national-rail' },
] as const;

export function TransportModeTabs({ active }: { active: string }) {
  return (
    <nav className="tnav" aria-label="Rodzaje transportu">
      <ul>
        {TRANSPORT_MODES.map((m) => (
          <li key={m.id}>
            <Link to={m.to} className="tnav__link" aria-current={m.id === active ? 'page' : undefined}>
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface HeaderProps {
  crumbs: { label: string; to?: string }[];
  kicker?: string;
  title: string;
  subtitle?: string;
  mode: string;
  accent?: string;
  children?: ReactNode;
}

export function TransportHeader({ crumbs, kicker = 'Londyn na żywo — Tube', title, subtitle, mode, accent, children }: HeaderProps) {
  return (
    <header className="thead" style={accent ? ({ '--accent': accent } as React.CSSProperties) : undefined}>
      <div className="container">
        <Breadcrumbs items={crumbs} />
        <p className="thead__kicker">
          <span className="thead__roundel" aria-hidden="true" />
          {kicker}
        </p>
        <h1 className="thead__title">{title}</h1>
        {subtitle && <p className="thead__subtitle">{subtitle}</p>}
        {children}
        <TransportModeTabs active={mode} />
      </div>
    </header>
  );
}

/** "NA ŻYWO · Aktualizacja: HH:MM:SS · ● połączono" */
export function LiveDataIndicator({ meta, error, loading, onRetry }: { meta: ApiMeta | null; error: { kind: ApiErrorKind } | null; loading?: boolean; onRetry?: () => void }) {
  const now = useNow(5000);
  const stale = meta ? (meta.stale ? 'Dane z pamięci podręcznej' : staleLabel(meta.fetchedAt, now)) : null;
  const state = error ? 'error' : stale ? 'stale' : meta ? 'ok' : 'loading';
  return (
    <p className={`live is-${state}`} role="status" aria-live="polite">
      <span className="live__badge">NA ŻYWO</span>
      {meta && <span>Aktualizacja: {formatClock(meta.fetchedAt)}</span>}
      {state === 'ok' && (
        <span className="live__conn">
          <span className="live__dot" aria-hidden="true" /> połączono
        </span>
      )}
      {state === 'loading' && <span>{loading ? 'Łączenie z TfL…' : 'Oczekiwanie na dane'}</span>}
      {stale && !error && <span className="live__warn">{stale}</span>}
      {error && (
        <span className="live__warn">
          <WifiOff size={14} aria-hidden="true" /> {ERROR_TEXT[error.kind]}
          {onRetry && (
            <button type="button" className="live__retry" onClick={onRetry}>
              <RefreshCw size={13} aria-hidden="true" /> Ponów
            </button>
          )}
        </span>
      )}
    </p>
  );
}

export function TransportError({ kind, onRetry, compact }: { kind: ApiErrorKind; onRetry?: () => void; compact?: boolean }) {
  return (
    <div className={`terr${compact ? ' terr--compact' : ''}`} role="alert">
      <AlertTriangle size={compact ? 16 : 22} aria-hidden="true" />
      <div>
        <p className="terr__title">{ERROR_TEXT[kind]}</p>
        {!compact && <p className="terr__hint">Spróbuj ponownie za chwilę. Rozkłady i układ linii nadal są dostępne na tfl.gov.uk.</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" /> Spróbuj ponownie
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`tskel ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="tskel__bar" style={{ width: `${92 - ((i * 17) % 40)}%` }} />
      ))}
    </div>
  );
}
