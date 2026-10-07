import { Heart } from 'lucide-react';
import { useSaved } from '@/context/SavedContext';

interface SaveButtonProps {
  id: string;
  label: string;
  variant?: 'floating' | 'plain';
}

/** Local favourite toggle (persisted in localStorage). */
export function SaveButton({ id, label, variant = 'plain' }: SaveButtonProps) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(id);
  return (
    <button
      type="button"
      className={`save-btn save-btn--${variant} above-link`}
      aria-pressed={saved}
      aria-label={saved ? `Usuń z zapisanych: ${label}` : `Zapisz: ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
    >
      <Heart size={18} aria-hidden="true" />
    </button>
  );
}
