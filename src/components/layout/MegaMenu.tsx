import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { MEGA_MENU } from '@/data/navigation';
import { Icon } from '@/components/ui/Icon';
import { Img } from '@/components/ui/Img';

interface MegaMenuProps {
  id: string;
  open: boolean;
  onClose: (returnFocus?: boolean) => void;
}

/** Structured four-column mega menu with featured CTA and promo slot. */
export function MegaMenu({ id, open, onClose }: MegaMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const links = [...(ref.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = e.key === 'ArrowDown' ? index + 1 : index - 1;
    const target = links[(next + links.length) % links.length];
    if (target) {
      e.preventDefault();
      target.focus();
    }
  };

  return (
    <div id={id} ref={ref} className={`mega ${open ? 'is-open' : ''}`} aria-hidden={!open} onKeyDown={onKeyDown}>
      <div className="mega__grid">
        {MEGA_MENU.map((group) => (
          <section key={group.id} className={`mega__group mega__group--${group.id}`} aria-labelledby={`${id}-${group.id}`}>
            <h2 className="mega__title" id={`${id}-${group.id}`}>
              {group.title}
            </h2>
            <ul className={group.id === 'ogloszenia' ? 'mega__links mega__links--two' : 'mega__links'}>
              {group.links.map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="mega__link" onClick={() => onClose()}>
                    {link.icon && (
                      <span className="mega__icon">
                        <Icon name={link.icon} size={18} />
                      </span>
                    )}
                    <span>
                      <span className="mega__label">{link.label}</span>
                      {link.description && <span className="mega__desc">{link.description}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mega__aside">
          <div className="mega__cta">
            <strong>Dodaj ogłoszenie za darmo</strong>
            <p>Dotrzyj do tysięcy Polaków w UK. Pokój, praca, usługi – w kilka minut.</p>
            <Link to="/dodaj-ogloszenie" className="btn btn--primary btn--sm" onClick={() => onClose()}>
              <Plus size={16} aria-hidden="true" /> Dodaj ogłoszenie
            </Link>
          </div>
          <Link to="/reklama" className="mega__promo" onClick={() => onClose()}>
            <span className="mega__promo-media">
              <Img name="office" alt="" sizes="280px" />
            </span>
            <span className="mega__promo-copy">
              <span className="badge badge--navy">Dla firm</span>
              <strong>Twoja marka bliżej Polaków w UK</strong>
              <span className="text-link text-link--inverse">
                Poznaj ofertę reklamową <ArrowRight size={16} aria-hidden="true" />
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
