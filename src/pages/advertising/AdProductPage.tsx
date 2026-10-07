import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs, EmptyState } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_CREATIVES } from '@/data/misc';
import { AD_PRODUCTS, AD_STEPS, adProductBySlug } from '@/data/advertising';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AdContactForm } from './AdContactForm';
import './advertising.css';

export function AdProductPage() {
  const { product = '' } = useParams();
  const p = adProductBySlug(product);
  useDocumentTitle(p ? `${p.title} – reklama` : 'Reklama');

  if (!p) {
    return (
      <div className="container section">
        <EmptyState as="h1" title="Nie mamy takiego produktu reklamowego">
          <Link to="/reklama" className="btn btn--navy">
            Zobacz wszystkie formy reklamy
          </Link>
        </EmptyState>
      </div>
    );
  }

  const others = AD_PRODUCTS.filter((x) => x.slug !== p.slug);

  return (
    <div className="adv">
      <section className="adv-hero adv-hero--product">
        <div className="container adv-hero__inner adv-hero__inner--product">
          <div>
            <Breadcrumbs items={[{ label: 'Reklama', to: '/reklama' }, { label: p.title }]} />
            <span className="adv-hero__icon">
              <Icon name={p.icon} size={28} />
            </span>
            <h1 className="adv-hero__title">{p.title}</h1>
            <p className="adv-hero__lead">{p.lead}</p>
            <a href="#kontakt" className="btn btn--primary btn--lg">
              Poproś o wycenę
            </a>
          </div>
          <ul className="adv-benefits">
            {p.benefits.map((b) => (
              <li key={b}>
                <CheckCircle2 size={20} aria-hidden="true" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container section adv-product-layout">
        <section aria-labelledby="formats-title">
          <h2 id="formats-title" className="adv-h2">
            Formaty i ceny
          </h2>
          <table className="adv-table adv-table--lg">
            <thead>
              <tr>
                <th scope="col">Format</th>
                <th scope="col">Specyfikacja</th>
                <th scope="col">Cena netto</th>
              </tr>
            </thead>
            <tbody>
              {p.formats.map((f) => (
                <tr key={f.name}>
                  <th scope="row">{f.name}</th>
                  <td>{f.spec}</td>
                  <td>{f.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="demo-label">Ceny zastępcze – do uzupełnienia aktualnym cennikiem</p>

          <h2 className="adv-h2">Najlepsze dla</h2>
          <ul className="cluster">
            {p.bestFor.map((b) => (
              <li key={b} className="badge badge--outline">
                {b}
              </li>
            ))}
          </ul>

          <h2 className="adv-h2">Jak wygląda współpraca</h2>
          <ol className="adv-steps adv-steps--compact">
            {AD_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="adv-steps__num" aria-hidden="true">
                  {i + 1}
                </span>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="adv-example" aria-labelledby="example-title">
          <h2 id="example-title" className="adv-h2">
            Przykład oznaczenia
          </h2>
          <p>Każda emisja jest wyraźnie oznaczona i oddzielona od treści redakcyjnych.</p>
          <AdSlot variant="sidebar" creative={AD_CREATIVES.money} />
          <h3>Inne formy reklamy</h3>
          <ul className="adv-others">
            {others.map((o) => (
              <li key={o.slug}>
                <Link to={`/reklama/${o.slug}`}>
                  <Icon name={o.icon} size={18} /> {o.title} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="container section">
        <section id="kontakt" className="adv-contact" aria-labelledby="contact-title">
          <div className="adv-contact__intro">
            <h2 id="contact-title">Zapytaj o {p.title.toLowerCase()}</h2>
            <p>Przygotujemy propozycję z terminami, szacowanym zasięgiem i wyceną.</p>
          </div>
          <AdContactForm key={p.slug} product={p.slug} />
        </section>
      </div>
    </div>
  );
}
