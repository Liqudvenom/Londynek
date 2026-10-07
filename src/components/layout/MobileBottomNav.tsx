import { Link, NavLink } from 'react-router-dom';
import { CalendarDays, Home, LayoutGrid, Menu, Newspaper, Plus } from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Start', icon: Home, end: true },
  { to: '/wiadomosci', label: 'Wiadomości', icon: Newspaper, end: false },
  { to: '/ogloszenia', label: 'Ogłoszenia', icon: LayoutGrid, end: false },
  { to: '/wydarzenia', label: 'Wydarzenia', icon: CalendarDays, end: false },
] as const;

export function MobileBottomNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [first, second, third, fourth] = ITEMS;
  const renderItem = (item: (typeof ITEMS)[number]) => (
    <NavLink key={item.to} to={item.to} end={item.end} className="bottom-nav__item">
      <item.icon size={22} aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  );
  return (
    <nav className="bottom-nav" aria-label="Nawigacja mobilna">
      {renderItem(first)}
      {renderItem(second)}
      <Link to="/dodaj-ogloszenie" className="bottom-nav__add" aria-label="Dodaj ogłoszenie">
        <span className="bottom-nav__add-btn">
          <Plus size={26} aria-hidden="true" />
        </span>
      </Link>
      {renderItem(third)}
      {renderItem(fourth)}
      <button type="button" className="bottom-nav__item" onClick={onOpenMenu}>
        <Menu size={22} aria-hidden="true" />
        <span>Więcej</span>
      </button>
    </nav>
  );
}
