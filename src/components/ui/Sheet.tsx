import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBodyLock, useEscape } from '@/hooks';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right' | 'bottom';
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Modal drawer / bottom sheet with focus trap, Escape and backdrop close. */
export function Sheet({ open, onClose, title, side = 'right', children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  useBodyLock(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => returnFocus.current?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className={`sheet sheet--${side}`}>
      <div className="sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className="sheet__panel" role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}>
        <div className="sheet__head">
          <h2 className="sheet__title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
