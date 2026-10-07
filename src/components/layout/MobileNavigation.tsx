import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Plus, UserRound } from 'lucide-react';
import { MOBILE_GROUPS } from '@/data/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { EnglishVersionButton } from './AppHeader';

/** Mobile drawer with expandable task groups instead of a long flat list. */
export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(MOBILE_GROUPS[0]?.id ?? null);
  const location = useLocation();

  useEffect(() => {
    onClose();
    // close whenever the route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Menu"
      side="right"
      footer={
        <div className="mobile-menu__foot">
          <Link to="/dodaj-ogloszenie" className="btn btn--primary btn--block">
            <Plus size={18} aria-hidden="true" /> Dodaj ogłoszenie
          </Link>
          <div className="mobile-menu__account">
            <Link to="/zaloguj" className="btn">
              <UserRound size={18} aria-hidden="true" /> Zaloguj się
            </Link>
            <Link to="/rejestracja" className="btn">
              Zarejestruj się
            </Link>
          </div>
          <EnglishVersionButton />
        </div>
      }
    >
      <nav aria-label="Menu mobilne" className="mobile-menu">
        {MOBILE_GROUPS.map((group) => {
          const isOpen = expanded === group.id;
          return (
            <div key={group.id} className="mobile-menu__group">
              <button
                type="button"
                className="mobile-menu__toggle"
                aria-expanded={isOpen}
                aria-controls={`${group.id}-list`}
                onClick={() => setExpanded(isOpen ? null : group.id)}
              >
                {group.title}
                <ChevronDown size={20} aria-hidden="true" />
              </button>
              <ul id={`${group.id}-list`} className="mobile-menu__list" hidden={!isOpen}>
                {group.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </Sheet>
  );
}
