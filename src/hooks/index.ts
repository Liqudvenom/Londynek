import { useEffect, useRef, useState, type RefObject } from 'react';

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** Adds `is-visible` once the element enters the viewport. */
export function useReveal<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/**
 * Subtle parallax: background moves at `factor` of scroll speed.
 * Disabled on touch/small screens and for reduced motion.
 */
export function useParallax<T extends HTMLElement>(factor = 0.95): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const allowed = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = window.scrollY * (1 - factor);
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const bind = () => {
      window.removeEventListener('scroll', onScroll);
      if (allowed.matches) {
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else {
        el.style.transform = '';
      }
    };
    bind();
    allowed.addEventListener('change', bind);
    return () => {
      window.removeEventListener('scroll', onScroll);
      allowed.removeEventListener('change', bind);
      cancelAnimationFrame(frame);
    };
  }, [factor]);
  return ref;
}

/** Locks body scroll while `active` (drawers, sheets, dialogs). */
export function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, [active]);
}

/** Calls handler on Escape while `active`. */
export function useEscape(active: boolean, handler: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, handler]);
}
