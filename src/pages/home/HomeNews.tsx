import { SectionHeader } from '@/components/ui/primitives';
import { NewsCard, NewsCompactItem, NewsLead } from '@/components/cards/EditorialCards';
import { AdSlot } from '@/components/ads/AdSlot';
import { NEWS } from '@/data/articles';
import { AD_CREATIVES } from '@/data/misc';

export function HomeNews() {
  const [lead, ...rest] = NEWS;
  const secondary = rest.slice(0, 3);
  const compact = rest.slice(3, 8);
  if (!lead) return null;
  return (
    <section className="container section" aria-labelledby="home-news">
      <SectionHeader title="Ważne wiadomości" id="home-news" accent="news" action={{ label: 'Wszystkie wiadomości', to: '/wiadomosci' }} />
      <div className="home-news">
        <div className="home-news__lead">
          <NewsLead article={lead} />
        </div>
        <div className="home-news__stack">
          {secondary.map((a) => (
            <NewsCard key={a.id} article={a} variant="horizontal" />
          ))}
        </div>
        <aside className="home-news__aside" aria-label="Najczęściej czytane">
          <h3 className="home-news__aside-title">Najczęściej czytane</h3>
          {compact.map((a, i) => (
            <NewsCompactItem key={a.id} article={a} index={i} />
          ))}
          <AdSlot variant="sidebar" creative={AD_CREATIVES.money} />
        </aside>
      </div>
    </section>
  );
}
