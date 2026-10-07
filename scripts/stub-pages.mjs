// Dev helper: creates placeholder page modules for routes that are not implemented yet.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PAGES = {
  'classifieds/RealEstatePage': ['RealEstatePage'],
  'classifieds/JobsPage': ['JobsPage', 'CandidatesPage'],
  'classifieds/ServicesPage': ['ServicesPage'],
  'classifieds/MotoringPage': ['MotoringPage'],
  'classifieds/BuySellPage': ['BuySellPage'],
  'classifieds/SocialPage': ['SocialPage'],
  'classifieds/ListingDetailPage': ['ListingDetailPage'],
  'content/NewsPage': ['NewsPage'],
  'content/ReadingPage': ['ReadingPage'],
  'content/CuriositiesPage': ['CuriositiesPage'],
  'content/ArticlePage': ['ArticlePage'],
  'guide/GuidePage': ['GuidePage'],
  'guide/GuideTaskPage': ['GuideTaskPage'],
  'events/EventsPage': ['EventsPage'],
  'events/EventDetailPage': ['EventDetailPage'],
  'promotions/PromotionsPage': ['PromotionsPage'],
  'advertising/AdvertisingPage': ['AdvertisingPage'],
  'advertising/AdProductPage': ['AdProductPage'],
  'corporate/AboutPage': ['AboutPage'],
  'corporate/ContactPage': ['ContactPage'],
  'corporate/MediaPage': ['MediaPage'],
  'corporate/TermsPage': ['TermsPage'],
  'corporate/FaqPage': ['FaqPage'],
  'misc/SearchPage': ['SearchPage'],
  'misc/AuthPages': ['LoginPage', 'RegisterPage'],
  'misc/AddListingPage': ['AddListingPage'],
  'misc/SavedPage': ['SavedPage'],
  'misc/NotFoundPage': ['NotFoundPage'],
};

for (const [path, names] of Object.entries(PAGES)) {
  const file = `src/pages/${path}.tsx`;
  if (existsSync(file)) continue;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, names.map((n) => `export function ${n}() {\n  return <div className="container section">TODO ${n}</div>;\n}\n`).join('\n'));
  console.log('stub', file);
}
