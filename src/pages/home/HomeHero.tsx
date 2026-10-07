import { Link } from 'react-router-dom';
import { Img } from '@/components/ui/Img';
import { HeroSearch } from '@/components/search/HeroSearch';
import { UndergroundLines } from '@/components/london/UndergroundLines';
import { POPULAR_CHIPS } from '@/lib/search';
import { useParallax } from '@/hooks';

export function HomeHero() {
  const bgRef = useParallax<HTMLDivElement>(0.95);
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <div className="home-hero__bg" ref={bgRef}>
        <Img name="hero-westminster" alt="Pałac Westminsterski i Big Ben o zachodzie słońca" sizes="100vw" priority />
      </div>
      <UndergroundLines />
      <div className="container home-hero__inner">
        <h1 id="home-hero-title" className="home-hero__title">
          Twój <span className="home-hero__accent">Londyn.</span>
          <br />
          Wszystko w jednym miejscu.
        </h1>
        <p className="home-hero__lead">Praca, mieszkanie, wiadomości, porady, wydarzenia i polska społeczność w UK.</p>
        <div className="home-hero__search">
          <HeroSearch placeholder="Czego szukasz? Np. pokój w Ealing, praca, NHS…" />
        </div>
        <div className="home-hero__chips">
          <span className="home-hero__chips-label">Popularne:</span>
          <ul className="cluster">
            {POPULAR_CHIPS.map((c) => (
              <li key={c.label}>
                <Link to={c.to} className="chip">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
