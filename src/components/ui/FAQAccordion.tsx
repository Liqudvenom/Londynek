import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  id: string;
  q: string;
  a: string;
}

/** Disclosure list. Each item is a button with aria-expanded controlling a region. */
export function FAQAccordion({ items, defaultOpen }: { items: AccordionItem[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const base = useId();
  return (
    <div className="accordion">
      {items.map((item) => {
        const expanded = open === item.id;
        const panelId = `${base}-${item.id}-panel`;
        const btnId = `${base}-${item.id}-btn`;
        return (
          <div key={item.id} className="accordion__item">
            <h3 className="accordion__heading">
              <button
                id={btnId}
                type="button"
                className="accordion__btn"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : item.id)}
              >
                <span>{item.q}</span>
                <ChevronDown size={20} aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} className="accordion__panel" hidden={!expanded}>
              <p>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
