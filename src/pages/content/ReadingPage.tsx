import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { Img } from '@/components/ui/Img';
import { Breadcrumbs, FilterChip } from '@/components/ui/primitives';
import { MagazineCard } from '@/components/cards/EditorialCards';
import { AdSlot } from '@/components/ads/AdSlot';
import { MAGAZINE } from '@/data/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import './content.css';

const SECTIONS = Array.from(new Set(MAGAZINE.map((a) => a.section)));

export function ReadingPage() {
  useDocumentTitle('Czytelnia');
  const [section, setSection] = useState('');
  const [cover, ...others] = MAGAZINE;
  const filtered = section ? MAGAZINE.filter((a) => a.section === section) : others;
  const opinion = MAGAZINE.find((a) => a.section === 'Opinie');

  return (
    <div className="magazine">
      {cover && (
        <section className="mag-cover" aria-labelledby="cover-title">
          <div className="mag-cover__media">
            <Img name={cover.image} alt="" sizes="100vw" priority />
          </div>
          <div className="container mag-cover__inner">
            <Breadcrumbs items={[{ label: 'Czytelnia' }]} />
            <p className="mag-cover__brand">Czytelnia Londynka · magazyn</p>
            <span className="kicker">Temat numeru · {cover.section}</span>
            <h1 id="cover-title" className="mag-cover__title">
              <Link to={`/artykul/${cover.id}`}>{cover.title}</Link>
            </h1>
            <p className="mag-cover__lead">{cover.excerpt}</p>
            <p className="mag-cover__byline">
              {cover.author} · {cover.readMin} min czytania
            </p>
          </div>
        </section>
      )}

      <nav className="container mag-sections" aria-label="Działy Czytelni">
        <FilterChip label="Wszystkie teksty" active={section === ''} onClick={() => setSection('')} />
        {SECTIONS.map((s) => (
          <FilterChip key={s} label={s} active={section === s} onClick={() => setSection(section === s ? '' : s)} />
        ))}
      </nav>

      <section className="container section--tight mag-grid" aria-label="Teksty">
        {filtered.map((a, i) => (
          <div key={a.id} className={i === 0 && !section ? 'mag-grid__wide' : undefined}>
            <MagazineCard article={a} size={i === 0 && !section ? 'lg' : 'md'} />
          </div>
        ))}
      </section>

      {opinion && !section && (
        <section className="container section">
          <figure className="mag-quote">
            <Quote size={40} aria-hidden="true" />
            <blockquote>
              <p>Londyn wciąż daje szansę, ale coraz częściej pytamy, czy cena tej szansy nie stała się zbyt wysoka.</p>
            </blockquote>
            <figcaption>
              {opinion.author} — <Link to={`/artykul/${opinion.id}`}>{opinion.title}</Link>
            </figcaption>
          </figure>
        </section>
      )}

      <section className="container section mag-footer">
        <div>
          <h2>Piszesz? Fotografujesz?</h2>
          <p>Czytelnia publikuje reportaże, eseje i wywiady autorów z polskiej społeczności w UK.</p>
          <Link to="/kontakt?dzial=redakcja" className="text-link">
            Zaproponuj tekst <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <AdSlot variant="inline" />
      </section>
    </div>
  );
}
