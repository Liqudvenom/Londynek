import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, MessageSquare } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { PageIntro } from '@/components/ui/PageHero';
import { FilterChip } from '@/components/ui/primitives';
import { CURIOSITIES } from '@/data/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Article } from '@/types';
import './content.css';

const SECTIONS = Array.from(new Set(CURIOSITIES.map((a) => a.section)));

const FACTS = [
  { value: '272', text: 'stacje ma londyńskie metro – najstarsze na świecie, otwarte w 1863 roku.' },
  { value: '300+', text: 'języków słychać na ulicach Londynu. Polski jest jednym z najczęściej używanych po angielskim.' },
  { value: '47%', text: 'powierzchni Londynu to tereny zielone – parki, ogrody i rezerwaty.' },
];

/** Card height varies with index so the masonry columns read as an asymmetric collage. */
const SHAPES = ['tall', 'square', 'wide', 'square', 'tall', 'wide'] as const;

function CuriosityTile({ article, shape }: { article: Article; shape: (typeof SHAPES)[number] }) {
  return (
    <article className={`curio curio--${shape} hover-zoom`}>
      <div className="media curio__media">
        <Img name={article.image} alt="" sizes="(max-width: 640px) 100vw, 400px" />
      </div>
      <div className="curio__body">
        <span className="kicker">{article.section}</span>
        <h2 className="curio__title">
          <Link to={`/artykul/${article.id}`} className="card-link">
            {article.title}
          </Link>
        </h2>
        <p className="curio__excerpt">{article.excerpt}</p>
        <p className="meta">
          <span>{article.ago}</span>
          <span aria-label={`${article.comments} komentarzy`}>
            <MessageSquare size={14} aria-hidden="true" /> {article.comments}
          </span>
        </p>
      </div>
    </article>
  );
}

export function CuriositiesPage() {
  useDocumentTitle('Ciekawostki');
  const [section, setSection] = useState('');
  const items = section ? CURIOSITIES.filter((a) => a.section === section) : CURIOSITIES;

  return (
    <>
      <PageIntro title="Ciekawostki" lead="Sekrety Londynu, historie, odkrycia naukowców i rzeczy, o których nie mówi się w przewodnikach." crumbs={[{ label: 'Ciekawostki' }]}>
        <div className="cluster curio-filters" role="group" aria-label="Tematy">
          <FilterChip label="Wszystko" active={section === ''} onClick={() => setSection('')} />
          {SECTIONS.map((s) => (
            <FilterChip key={s} label={s} active={section === s} onClick={() => setSection(section === s ? '' : s)} />
          ))}
        </div>
      </PageIntro>

      <section className="container section--tight curio-masonry" aria-label="Ciekawostki">
        {items.map((a, i) => {
          const fact = !section && i % 4 === 2 ? FACTS[Math.floor(i / 4)] : undefined;
          return (
            <Fragment key={a.id}>
              <CuriosityTile article={a} shape={SHAPES[i % SHAPES.length] ?? 'square'} />
              {fact && (
                <aside className="curio-fact" aria-label="Czy wiesz, że…">
                  <Lightbulb size={22} aria-hidden="true" />
                  <span className="curio-fact__label">Czy wiesz, że…</span>
                  <strong>{fact.value}</strong>
                  <p>{fact.text}</p>
                </aside>
              )}
            </Fragment>
          );
        })}
      </section>
    </>
  );
}
