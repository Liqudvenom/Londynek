import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Clock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { GuideCard } from '@/components/cards/LocalCards';
import { Icon } from '@/components/ui/Icon';
import { GUIDE_TASKS, guideAreaById, guideTaskById } from '@/data/guides';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './guide.css';

export function GuideTaskPage() {
  const { id = '' } = useParams();
  const task = guideTaskById(id);
  const [done, setDone] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  useDocumentTitle(task?.question ?? 'Nie znaleziono poradnika');

  if (!task) {
    return (
      <div className="container section">
        <EmptyState as="h1" title="Nie znaleźliśmy tego poradnika">
          <Link to="/poradnik" className="btn btn--navy">
            Wróć do Poradnika
          </Link>
        </EmptyState>
      </div>
    );
  }

  const area = guideAreaById(task.area);
  const related = GUIDE_TASKS.filter((t) => t.id !== task.id && t.area === task.area).concat(GUIDE_TASKS.filter((t) => t.area !== task.area)).slice(0, 2);
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  return (
    <article className="container guide-task-page">
      <Breadcrumbs items={[{ label: 'Poradnik', to: '/poradnik' }, ...(area ? [{ label: area.title, to: `/poradnik?obszar=${area.id}` }] : []), { label: task.question }]} />

      <header className="gtp__head">
        {area && (
          <span className={`gtp__area accent-${area.accent}`}>
            <Icon name={area.icon} size={18} /> {area.title}
          </span>
        )}
        <h1 className="gtp__title">{task.question}</h1>
        <p className="meta">
          <span>
            <Clock size={14} aria-hidden="true" /> {task.readMin} min czytania
          </span>
          <span>
            <CalendarClock size={14} aria-hidden="true" /> Aktualizacja: {task.updated}
          </span>
        </p>
      </header>

      <div className="gtp__layout">
        <div className="gtp__main">
          <section className="gtp__answer" aria-labelledby="short">
            <h2 id="short">W skrócie</h2>
            <p>{task.answer}</p>
          </section>

          <section aria-labelledby="steps">
            <h2 id="steps" className="gtp__h2">
              Krok po kroku
              <span className="gtp__progress" aria-live="polite">
                {done.length}/{task.steps.length} gotowe
              </span>
            </h2>
            <ol className="gtp__steps">
              {task.steps.map((s, i) => (
                <li key={s} className={done.includes(i) ? 'is-done' : undefined}>
                  <span className="gtp__num" aria-hidden="true">
                    {done.includes(i) ? <CheckCircle2 size={20} /> : i + 1}
                  </span>
                  <div>
                    <p>{s}</p>
                    <label className="check gtp__check">
                      <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} /> Zrobione
                    </label>
                  </div>
                </li>
              ))}
            </ol>
            <p className="gtp__hint">Postęp zapisuje się tylko na tej stronie – to lista kontrolna dla Ciebie.</p>
          </section>

          <section className="gtp__feedback" aria-labelledby="fb">
            <h2 id="fb">Czy ta porada była pomocna?</h2>
            {feedback ? (
              <p role="status">{feedback === 'yes' ? 'Dziękujemy! Cieszymy się, że pomogliśmy.' : 'Dziękujemy – postaramy się uzupełnić ten poradnik.'}</p>
            ) : (
              <div className="cluster">
                <button type="button" className="btn btn--sm" onClick={() => setFeedback('yes')}>
                  <ThumbsUp size={16} aria-hidden="true" /> Tak
                </button>
                <button type="button" className="btn btn--sm" onClick={() => setFeedback('no')}>
                  <ThumbsDown size={16} aria-hidden="true" /> Nie
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="gtp__aside" aria-label="Powiązane poradniki">
          <div className="notice">
            <p>
              <strong>Ważne:</strong> poradnik ma charakter informacyjny i nie zastępuje porady prawnej. Zawsze sprawdź aktualne zasady na gov.uk.
            </p>
          </div>
          <h2 className="gtp__aside-title">Zobacz też</h2>
          {related.map((t) => (
            <GuideCard key={t.id} task={t} areaTitle={guideAreaById(t.area)?.title} />
          ))}
        </aside>
      </div>
    </article>
  );
}
