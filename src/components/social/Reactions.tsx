import { Frown, Heart, Laugh, ThumbsUp } from 'lucide-react';
import { REACTIONS, useReactions } from '@/context/ReactionsContext';
import './social.css';

const ICONS = {
  like: ThumbsUp,
  love: Heart,
  haha: Laugh,
  sad: Frown,
} as const;

export function Reactions({ id, labelled = false }: { id: string; labelled?: boolean }) {
  const { mine, react, count, total } = useReactions();
  const current = mine(id);

  return (
    <div className={`reacts above-link ${labelled ? 'reacts--labelled' : ''}`} role="group" aria-label="Reakcje">
      {REACTIONS.map((r) => {
        const Icon = ICONS[r.id];
        const pressed = current === r.id;
        const n = count(id, r.id);
        return (
          <button
            key={r.id}
            type="button"
            className={`reacts__btn reacts__btn--${r.id} ${pressed ? 'is-on' : ''}`}
            aria-pressed={pressed}
            aria-label={pressed ? `Cofnij: ${r.label}` : r.label}
            onClick={() => react(id, r.id)}
          >
            <Icon size={labelled ? 18 : 15} aria-hidden="true" />
            {labelled && <span>{r.label}</span>}
            <span className="reacts__n">{n}</span>
          </button>
        );
      })}
      {!labelled && (
        <span className="reacts__sum" aria-hidden="true">
          {total(id)}
        </span>
      )}
    </div>
  );
}
