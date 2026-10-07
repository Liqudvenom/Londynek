import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { Img } from '@/components/ui/Img';
import { SaveButton } from '@/components/ui/SaveButton';
import { EmptyState, FilterChip } from '@/components/ui/primitives';
import { useSaved } from '@/context/SavedContext';
import { SAVED_GROUPS, resolveSaved, type SavedEntry, type SavedGroup } from '@/lib/saved';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './misc.css';

export function SavedPage() {
  useDocumentTitle('Zapisane');
  const { saved } = useSaved();
  const [group, setGroup] = useState<SavedGroup | null>(null);

  // Snapshot the list so un-saving an item keeps it visible (with the toggle) until the next visit.
  const [ids] = useState(() => [...saved]);
  const entries = useMemo(() => ids.map(resolveSaved).filter((e): e is SavedEntry => !!e), [ids]);
  const shown = group ? entries.filter((e) => e.group === group) : entries;

  return (
    <>
      <PageIntro title="Zapisane" lead="Ogłoszenia, artykuły i wydarzenia, do których chcesz wrócić." crumbs={[{ label: 'Zapisane' }]}>
        <p className="notice saved-notice">Zapisane elementy są przechowywane tylko w tej przeglądarce. Synchronizacja z kontem wymaga backendu.</p>
      </PageIntro>

      <div className="container section--tight saved">
        {entries.length === 0 ? (
          <EmptyState title="Nic jeszcze nie zapisałeś">
            <p>
              Kliknij ikonę <Bookmark size={16} aria-hidden="true" className="inline-icon" /> przy ogłoszeniu, artykule lub wydarzeniu.
            </p>
            <div className="cluster">
              <Link to="/ogloszenia" className="btn btn--primary">
                Przeglądaj ogłoszenia
              </Link>
              <Link to="/wydarzenia" className="btn">
                Wydarzenia
              </Link>
            </div>
          </EmptyState>
        ) : (
          <>
            <div className="cluster" role="group" aria-label="Filtruj zapisane">
              <FilterChip label="Wszystkie" active={!group} onClick={() => setGroup(null)} count={entries.length} />
              {SAVED_GROUPS.map((g) => {
                const n = entries.filter((e) => e.group === g).length;
                return n ? <FilterChip key={g} label={g} active={group === g} onClick={() => setGroup(group === g ? null : g)} count={n} /> : null;
              })}
            </div>
            <ul className="saved__list">
              {shown.map((e) => (
                <li key={e.id} className="saved-item">
                  <span className="saved-item__media">{e.image ? <Img name={e.image} alt="" sizes="120px" /> : <Bookmark size={28} aria-hidden="true" />}</span>
                  <div className="saved-item__body">
                    <span className="saved-item__type">{e.type}</span>
                    <Link to={e.to} className="saved-item__title">
                      {e.title}
                    </Link>
                    <span className="saved-item__meta">{e.meta}</span>
                  </div>
                  <SaveButton id={e.id} label={e.title} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
