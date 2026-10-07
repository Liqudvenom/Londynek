import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchUrl, type SearchScope } from '@/lib/search';
import { CategorySelector, LocationSelector } from './Selectors';
import './search.css';

interface HeroSearchProps {
  placeholder?: string;
  defaultScope?: SearchScope;
  showCategory?: boolean;
  submitLabel?: string;
  /** Custom submit handler; defaults to navigating to /szukaj */
  onSearch?: (query: string, location: string, scope: SearchScope) => void;
  label?: string;
  defaultQuery?: string;
  defaultLocation?: string;
}

/** Large search bar: query + location + category + submit. */
export function HeroSearch({
  placeholder = 'Czego szukasz? Np. pokój, praca, hydraulik…',
  defaultScope = 'all',
  showCategory = true,
  submitLabel = 'Szukaj',
  onSearch,
  label = 'Szukaj w Londynek.net',
  defaultQuery = '',
  defaultLocation = '',
}: HeroSearchProps) {
  const id = useId();
  const navigate = useNavigate();
  const [query, setQuery] = useState(defaultQuery);
  const [location, setLocation] = useState(defaultLocation);
  const [scope, setScope] = useState<SearchScope>(defaultScope);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query.trim(), location, scope);
    else navigate(searchUrl(query.trim(), scope, location));
  };

  return (
    <form role="search" aria-label={label} className={`hero-search ${showCategory ? '' : 'hero-search--no-cat'}`} onSubmit={submit}>
      <div className="hero-search__query">
        <label htmlFor={`${id}-q`} className="visually-hidden">
          Czego szukasz?
        </label>
        <Search size={20} aria-hidden="true" className="hero-search__icon" />
        <input
          id={`${id}-q`}
          className="hero-search__input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      <LocationSelector id={`${id}-loc`} value={location} onChange={setLocation} />
      {showCategory && <CategorySelector id={`${id}-cat`} value={scope} onChange={setScope} />}
      <button type="submit" className="btn btn--primary btn--lg hero-search__submit">
        {submitLabel}
      </button>
    </form>
  );
}
