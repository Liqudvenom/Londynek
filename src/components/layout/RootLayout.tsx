import { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';

function PageFallback() {
  return (
    <div className="container page-loading" role="status">
      <span className="visually-hidden">Ładowanie strony…</span>
    </div>
  );
}

/** Moves focus to main content on route change so screen-reader users land on the new page. */
function useRouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById('main');
    main?.focus({ preventScroll: true });
  }, [pathname]);
}

/** Lazy pages render after navigation, so wait for the hash target before scrolling to it. */
function useHashScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let frame = 0;
    let tries = 0;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
      if (++tries < 60) frame = requestAnimationFrame(attempt);
    };
    frame = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
}

export function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useRouteFocus();
  useHashScroll();

  return (
    <>
      <a href="#main" className="skip-link">
        Przejdź do treści
      </a>
      <AppHeader onOpenMenu={openMenu} menuOpen={menuOpen} onCloseMenu={closeMenu} />
      <main id="main" className="main" tabIndex={-1}>
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileBottomNav onOpenMenu={openMenu} />
      <ScrollRestoration />
    </>
  );
}
