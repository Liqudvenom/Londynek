import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { AdSlot, SponsoredCard } from '@/components/ads/AdSlot';
import { BUSINESS_TYPES } from '@/data/services';
import { AD_CREATIVES } from '@/data/misc';

export function CommunitySection() {
  return (
    <section className="container section" aria-labelledby="community-title">
      <SectionHeader
        id="community-title"
        title="Polskie firmy i społeczność"
        description="Sprawdzone polskie firmy, fachowcy i instytucje w Londynie i całej Wielkiej Brytanii."
        accent="services"
        action={{ label: 'Katalog firm', to: '/ogloszenia/uslugi' }}
      />
      <div className="community">
        <ul className="community__grid">
          {BUSINESS_TYPES.map((b) => (
            <li key={b.label}>
              <Link to={b.to} className="community__item">
                <span className="community__icon">
                  <Icon name={b.icon} size={24} />
                </span>
                <span className="community__label">{b.label}</span>
                <span className="community__count">{b.count} firm</span>
              </Link>
            </li>
          ))}
        </ul>
        <SponsoredCard
          advertiser="Kowalski & Co"
          title="Self Assessment bez stresu – księgowi mówiący po polsku"
          text="Rozliczenia CIS, Ltd i zwroty podatku. Pierwsza konsultacja gratis."
          image="accounting"
          to="/ogloszenia/uslugi?kategoria=Księgowość"
        />
      </div>
    </section>
  );
}

export function AdvertisingStrip() {
  return (
    <section className="container section" aria-label="Reklama">
      <AdSlot variant="billboard" creative={AD_CREATIVES.billboard} />
      <div className="ad-cta">
        <div>
          <strong>Masz firmę? Dotrzyj do Polaków w UK.</strong>
          <p>Banery, ogłoszenia promowane, artykuły sponsorowane i patronaty wydarzeń.</p>
        </div>
        <Link to="/reklama" className="btn btn--navy">
          Oferta reklamowa <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
