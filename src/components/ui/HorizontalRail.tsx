import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalRailProps {
  children: ReactNode;
  label: string;
  /** CSS width of each item column */
  itemWidth?: string;
}

const DRAG_THRESHOLD = 6;

/** Scroll-snapping horizontal rail with pointer drag, arrow buttons and keyboard support. */
export function HorizontalRail({ children, label, itemWidth = '232px' }: HorizontalRailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  };

  useEffect(() => {
    updateEdges();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    drag.current = { active: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      drag.current.moved = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    drag.current.active = false;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') scrollByPage(1);
    if (e.key === 'ArrowLeft') scrollByPage(-1);
  };

  return (
    <div className="rail">
      <div
        ref={ref}
        className="rail__track"
        style={{ '--col': itemWidth } as React.CSSProperties}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={updateEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
      <button type="button" className="rail__arrow rail__arrow--prev" onClick={() => scrollByPage(-1)} disabled={edges.start} aria-label="Przewiń w lewo">
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <button type="button" className="rail__arrow rail__arrow--next" onClick={() => scrollByPage(1)} disabled={edges.end} aria-label="Przewiń w prawo">
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
