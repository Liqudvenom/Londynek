import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { POPULAR_CHIPS, searchUrl } from '@/lib/search';
import { useBodyLock, useEscape } from '@/hooks';
import { useSiteSearch } from '@/hooks/useContent';
import { useTransportSearch } from '@/hooks/useTransportSearch';
import './search.css';

const MAX_RESULTS = 7;

/** Command-palette style search overlay with instant results from the demo index. */
export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useBodyLock(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const transport = useTransportSearch(query, 3);
  const content = useSiteSearch(query.trim().length > 1 ? query : '', 'all', '', 200);
  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const hits = content.data.map((r) => ({ id: `${r.scope}-${r.id}`, type: r.type, title: r.title, snippet: r.location ? `${r.location} · ${r.snippet}` : r.snippet, to: r.to }));
    return [...transport, ...hits].slice(0, MAX_RESULTS);
  }, [query, transport, content.data]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = results[active];
      go(hit ? hit.to : searchUrl(query.trim()));
    }
  };

  return createPortal(
    <div className="gsearch" role="dialog" aria-modal="true" aria-label="Wyszukiwarka">
      <div className="gsearch__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="gsearch__panel">
        <div className="gsearch__bar">
          <Search size={22} aria-hidden="true" />
          <label htmlFor="gsearch-input" className="visually-hidden">
            Szukaj ogłoszeń, artykułów, wydarzeń
          </label>
          <input
            ref={inputRef}
            id="gsearch-input"
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="gsearch-results"
            aria-activedescendant={results[active] ? `gs-${results[active].id}` : undefined}
            aria-autocomplete="list"
            placeholder="Szukaj ogłoszeń, firm, artykułów, wydarzeń…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Zamknij wyszukiwarkę">
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        {results.length > 0 ? (
          <ul id="gsearch-results" role="listbox" className="gsearch__results" aria-label="Wyniki">
            {results.map((r, i) => (
              <li key={r.id} id={`gs-${r.id}`} role="option" aria-selected={i === active}>
                <button type="button" className="gsearch__result" onClick={() => go(r.to)} onMouseEnter={() => setActive(i)} tabIndex={-1}>
                  <span className="gsearch__type">{r.type}</span>
                  <span className="gsearch__title">{r.title}</span>
                  <span className="gsearch__snippet">{r.snippet}</span>
                </button>
              </li>
            ))}
            <li role="presentation">
              <button type="button" className="gsearch__all" onClick={() => go(searchUrl(query.trim()))}>
                Pokaż wszystkie wyniki dla „{query}” <ArrowRight size={16} aria-hidden="true" />
              </button>
            </li>
          </ul>
        ) : (
          <div className="gsearch__empty">
            {query.trim().length > 1 && content.loading && <p className="gsearch__none">Szukam…</p>}
            {query.trim().length > 1 && !content.loading && <p className="gsearch__none">Brak wyników dla „{query}”. Spróbuj innej frazy.</p>}
            <p className="gsearch__hint">Popularne:</p>
            <div className="cluster">
              {POPULAR_CHIPS.map((c) => (
                <Link key={c.label} to={c.to} className="chip" onClick={onClose}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
