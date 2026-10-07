import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { Breadcrumbs, SectionHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { AD_PRODUCTS, AD_STEPS, AUDIENCE_METRICS, AUDIENCE_SEGMENTS } from '@/data/advertising';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { AdContactForm } from './AdContactForm';
import './advertising.css';

function PlacementPreview() {
  return (
    <div className="placement" aria-hidden="true">
      <span className="placement__bar" />
      <span className="placement__slot placement__slot--billboard">Billboard</span>
      <div className="placement__body">
        <div className="placement__content">
          <span />
          <span />
          <span className="placement__slot placement__slot--native">Artykuł sponsorowany</span>
          <span />
        </div>
        <span className="placement__slot placement__slot--side">Sidebar</span>
      </div>
    </div>
  );
}

export function AdvertisingPage() {
  useDocumentTitle('Reklama na Londynek.net');
  return (
    <div className="adv">
      <section className="adv-hero">
        <div className="container adv-hero__inner">
          <div>
            <Breadcrumbs items={[{ label: 'Reklama' }]} />
            <span className="adv-hero__eyebrow">Dla firm i marek</span>
            <h1 className="adv-hero__title">Dotrzyj do Polaków w Wielkiej Brytanii</h1>
            <p className="adv-hero__lead">Londynek.net to codzienne źródło informacji, ogłoszeń i pomocy dla polskiej społeczności w UK. Pomożemy zaplanować kampanię, która trafi do właściwych odbiorców.</p>
            <div className="cluster">
              <a href="#kontakt" className="btn btn--primary btn--lg">
                Zapytaj o ofertę
              </a>
              <Link to="/dla-mediow" className="btn btn--outline-inverse btn--lg">
                Media kit
              </Link>
            </div>
          </div>
          <PlacementPreview />
        </div>
      </section>

      <section className="container adv-metrics" aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="visually-hidden">
          Zasięg serwisu
        </h2>
        <ul>
          {AUDIENCE_METRICS.map((m) => (
            <li key={m.label}>
              <strong>{m.value}</strong>
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
        <p className="demo-label">Przykład – do zastąpienia danymi z analityki</p>
      </section>

      <section className="container section" aria-labelledby="products-title">
        <SectionHeader id="products-title" title="Formy reklamy" accent="navy" description="Wybierz format lub połącz kilka w jedną kampanię." />
        <ul className="adv-products">
          {AD_PRODUCTS.map((p) => (
            <li key={p.slug}>
              <Link to={`/reklama/${p.slug}`} className="adv-product">
                <span className="adv-product__icon">
                  <Icon name={p.icon} size={24} />
                </span>
                <strong>{p.title}</strong>
                <span>{p.short}</span>
                <span className="text-link">
                  Szczegóły i cennik <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section section--band" aria-labelledby="audience-title">
        <div className="container adv-audience">
          <SectionHeader id="audience-title" title="Kim są nasi czytelnicy" accent="navy" description="Segmenty odbiorców, do których możesz kierować kampanie." />
          <ul>
            {AUDIENCE_SEGMENTS.map((s) => (
              <li key={s.title}>
                <span className="adv-audience__share">{s.share}</span>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
          <p className="demo-label">Udziały procentowe – do uzupełnienia danymi z badań</p>
        </div>
      </section>

      <section className="container section" aria-labelledby="how-title">
        <SectionHeader id="how-title" title="Jak działa reklama" accent="navy" />
        <ol className="adv-steps">
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

      <section className="container section" aria-labelledby="pricing-title">
        <SectionHeader id="pricing-title" title="Orientacyjny cennik" accent="navy" description="Ceny netto. Ostateczna wycena zależy od terminu, targetowania i długości kampanii." />
        <div className="adv-pricing">
          {AD_PRODUCTS.map((p) => (
            <table key={p.slug} className="adv-table">
              <caption>
                <Link to={`/reklama/${p.slug}`}>{p.title}</Link>
              </caption>
              <tbody>
                {p.formats.map((f) => (
                  <tr key={f.name}>
                    <th scope="row">
                      {f.name}
                      <span>{f.spec}</span>
                    </th>
                    <td>{f.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <p className="demo-label">Ceny zastępcze (£XXX) – do uzupełnienia aktualnym cennikiem</p>
      </section>

      <div className="container section">
        <section id="kontakt" className="adv-contact" aria-labelledby="contact-title">
          <div className="adv-contact__intro">
            <h2 id="contact-title">Porozmawiajmy o Twojej kampanii</h2>
            <p>Odpowiadamy zwykle w ciągu jednego dnia roboczego i przygotowujemy propozycję dopasowaną do budżetu.</p>
            <ul>
              <li>
                <Mail size={18} aria-hidden="true" /> [e-mail działu reklamy]
              </li>
              <li>
                <Phone size={18} aria-hidden="true" /> +44 (0)20 XXXX XXXX
              </li>
            </ul>
          </div>
          <AdContactForm />
        </section>
      </div>
    </div>
  );
}
