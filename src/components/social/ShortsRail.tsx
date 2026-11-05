import { useEffect, useId, useState } from 'react';
import { Play, X } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { ALL_CLIPS, RELACJE, SHORTY, formatClipTime, type Clip } from '@/data/shorts';
import { Reactions } from './Reactions';
import './social.css';

function Viewer({ clip, onClose }: { clip: Clip; onClose: () => void }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="clipview" role="presentation" onClick={onClose}>
      <div className="clipview__sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="clipview__close icon-btn" onClick={onClose} aria-label="Zamknij">
          <X size={18} aria-hidden="true" />
        </button>
        <div className="clipview__stage">
          <Img name={clip.image} alt="" sizes="360px" priority />
          <span className="clipview__play" aria-hidden="true">
            <Play size={28} />
          </span>
          <span className="clipview__time">{formatClipTime(clip.seconds)}</span>
        </div>
        <div className="clipview__body">
          <p className="clipview__kind">{clip.kind === 'relacja' ? 'Relacja' : 'Short'}</p>
          <h2 id={titleId}>{clip.title}</h2>
          <p className="clipview__by">{clip.author}</p>
          <p className="clipview__note">Klip demonstracyjny — odtwarzacz wideo podłączymy razem z materiałami redakcji.</p>
          <Reactions id={clip.id} labelled />
        </div>
      </div>
    </div>
  );
}

export function ShortsRail({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState<Clip | null>(null);
  const stories = compact ? RELACJE.slice(0, 5) : RELACJE;
  const shorts = compact ? SHORTY.slice(0, 6) : SHORTY;

  return (
    <section className={`clips ${compact ? 'clips--compact' : ''}`} aria-labelledby="clips-title">
      <div className="clips__head">
        <h2 id="clips-title">Relacje i shorty</h2>
        <p>Krótkie materiały redakcji i społeczności. Oznaczamy je jako demo.</p>
      </div>

      <div className="clips__stories" aria-label="Relacje">
        {stories.map((clip) => (
          <button key={clip.id} type="button" className="story" onClick={() => setOpen(clip)}>
            <span className="story__ring">
              <Img name={clip.image} alt="" sizes="72px" />
            </span>
            <span className="story__name">{clip.author}</span>
          </button>
        ))}
      </div>

      <div className="clips__row" aria-label="Shorty">
        {shorts.map((clip) => (
          <button key={clip.id} type="button" className="short" onClick={() => setOpen(clip)}>
            <span className="short__media">
              <Img name={clip.image} alt="" sizes="180px" />
              <span className="short__play" aria-hidden="true">
                <Play size={16} />
              </span>
              <span className="short__time">{formatClipTime(clip.seconds)}</span>
            </span>
            <span className="short__title">{clip.title}</span>
            <span className="short__by">{clip.author}</span>
          </button>
        ))}
      </div>

      {open && <Viewer clip={ALL_CLIPS.find((c) => c.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </section>
  );
}
