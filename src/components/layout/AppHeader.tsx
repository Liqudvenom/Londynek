import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Plus, Search, UserRound } from 'lucide-react';
import { PRIMARY_NAV } from '@/data/navigation';
import { useScrolled } from '@/hooks';
import { useToast } from '@/context/ToastContext';
import { Logo } from './Logo';
import { MegaMenu } from './MegaMenu';
import { MobileNavigation } from './MobileNavigation';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import './header.css';

const MEGA_ID = 'mega-menu';
/** Also reachable via "Więcej"; dropped from the bar on narrow desktops so the header never overflows. */
const SECONDARY_NAV = ['/ciekawostki', '/ogloszenia/uslugi'];

export function EnglishVersionButton({ compact = false }: { compact?: boolean }) {
  const notify = useToast();
  return (
    <button
      type="button"
      className="lang-btn"
      lang="en"
      onClick={() => notify('English version – the bilingual edition will be connected once translated content is available.')}
    >
      <span className="lang-btn__flag" aria-hidden="true" />
      {!compact && <span>English version</span>}
      {compact && <span className="visually-hidden">English version</span>}
    </button>
  );
}

export function AppHeader({ onOpenMenu, menuOpen, onCloseMenu }: { onOpenMenu: () => void; menuOpen: boolean; onCloseMenu: () => void }) {
  const scrolled = useScrolled();
  const location = useLocation();
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const megaWrapRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);

  const closeMega = useCallback((returnFocus = false) => {
    setMegaOpen(false);
    if (returnFocus) moreBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    setMegaOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!megaOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!megaWrapRef.current?.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [megaOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className={`app-header ${scrolled || megaOpen ? 'is-scrolled' : ''}`}>
        <div className="container app-header__inner" ref={megaWrapRef}>
          <Logo />

          <nav className="desktop-nav" aria-label="Główna nawigacja">
            <ul className="desktop-nav__list">
              {PRIMARY_NAV.map((item) => (
                <li key={item.to} className={SECONDARY_NAV.includes(item.to) ? 'hide-below-xl' : undefined}>
                  <NavLink to={item.to} end={item.to === '/ogloszenia'} className="desktop-nav__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <button
                  ref={moreBtnRef}
                  type="button"
                  className="desktop-nav__link desktop-nav__more"
                  aria-expanded={megaOpen}
                  aria-controls={MEGA_ID}
                  onClick={() => setMegaOpen((o) => !o)}
                >
                  Więcej <ChevronDown size={16} aria-hidden="true" />
                </button>
              </li>
            </ul>
          </nav>

          <div className="app-header__actions">
            <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Szukaj (skrót /)">
              <Search size={20} aria-hidden="true" />
            </button>
            <span className="hide-below-desktop">
              <EnglishVersionButton compact />
            </span>
            <Link to="/zaloguj" className="icon-btn" aria-label="Konto – zaloguj się lub zarejestruj" title="Zaloguj się">
              <UserRound size={20} aria-hidden="true" />
            </Link>
            <Link to="/dodaj-ogloszenie" className="btn btn--primary hide-below-desktop">
              <Plus size={18} aria-hidden="true" /> Dodaj ogłoszenie
            </Link>
            <button type="button" className="icon-btn show-below-desktop" onClick={onOpenMenu} aria-label="Otwórz menu" aria-expanded={menuOpen}>
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>

          <MegaMenu id={MEGA_ID} open={megaOpen} onClose={closeMega} />
        </div>
      </header>
      <MobileNavigation open={menuOpen} onClose={onCloseMenu} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
