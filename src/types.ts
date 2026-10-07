import type { ImageName } from '@/data/images.generated';

export type Accent = 'jobs' | 'housing' | 'help' | 'news' | 'events' | 'services' | 'navy';

export type RegionId = 'central' | 'north' | 'south' | 'east' | 'west';

export interface Region {
  id: RegionId;
  name: string;
}

export interface District {
  id: string;
  name: string;
  region: RegionId;
  postcode: string;
  image: ImageName;
  avgRent: number;
  avgRoom: number;
  avgSale: number;
  rentTrend: number;
  commuteMin: [number, number];
  profile: string;
  transport: string;
  schools: string;
  counts: { jobs: number; rooms: number; events: number; news: number };
  /** Position on the stylised map, percentage of width / height */
  map: { x: number; y: number };
}

export type NewsSection =
  | 'UK'
  | 'Londyn'
  | 'Polska'
  | 'Świat'
  | 'Biznes'
  | 'Zdrowie'
  | 'Transport'
  | 'Edukacja'
  | 'Polityka'
  | 'Sport';

export type ContentKind = 'news' | 'magazine' | 'curiosity' | 'guide';

export interface Article {
  id: string;
  kind: ContentKind;
  section: string;
  title: string;
  excerpt: string;
  image: ImageName;
  author: string;
  publishedAt: string;
  ago: string;
  readMin: number;
  comments: number;
  region?: RegionId;
  isLive?: boolean;
  body: string[];
}

export interface LiveUpdate {
  time: string;
  text: string;
}

export type ClassifiedCategory =
  | 'nieruchomosci'
  | 'praca'
  | 'kandydaci'
  | 'uslugi'
  | 'motoryzacja'
  | 'kupie-sprzedam'
  | 'towarzyskie';

export type SellerType = 'private' | 'business';

export interface Listing {
  id: string;
  category: ClassifiedCategory;
  subcategory: string;
  title: string;
  description: string;
  image: ImageName | null;
  location: string;
  postcode?: string;
  region: RegionId;
  priceLabel: string;
  price: number | null;
  postedAgo: string;
  postedHours: number;
  promoted?: boolean;
  verified?: boolean;
  seller: SellerType;
  condition?: 'new' | 'used';
  attributes: string[];
}

export type PropertyMode = 'rent' | 'sale';
export type PropertyType = 'room' | 'flat' | 'house' | 'flatshare' | 'studio';

export interface Property {
  id: string;
  title: string;
  mode: PropertyMode;
  type: PropertyType;
  price: number;
  bedrooms: number;
  bathrooms: number;
  district: string;
  location: string;
  postcode: string;
  commuteMin: number;
  agency: string;
  agencyKind: 'agency' | 'landlord';
  verified: boolean;
  isNew?: boolean;
  featured?: boolean;
  photos: number;
  image: ImageName;
  description: string;
}

export type ContractType = 'permanent' | 'contract' | 'temporary';
export type Schedule = 'full-time' | 'part-time' | 'shifts';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyColor: string;
  industry: string;
  salaryLabel: string;
  salaryMin: number;
  period: 'hour' | 'day' | 'week' | 'year';
  location: string;
  region: RegionId;
  contract: ContractType;
  schedule: Schedule;
  visaSponsor: boolean;
  polishSpeaking: boolean;
  english: 'basic' | 'communicative' | 'fluent';
  postedAgo: string;
  postedHours: number;
  isNew?: boolean;
  promoted?: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  profession: string;
  location: string;
  rate: string;
  availability: string;
  match: number;
  skills: string[];
  avatar: ImageName | null;
  verified?: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  tagline: string;
  location: string;
  region: RegionId;
  rating: number;
  reviews: number;
  verified: boolean;
  availability: string;
  priceFrom: string;
  image: ImageName;
  polishSpeaking: boolean;
  sponsored?: boolean;
}

export interface Vehicle {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: 'Diesel' | 'Benzyna' | 'Hybryda' | 'Elektryczny';
  transmission: 'Manualna' | 'Automatyczna';
  location: string;
  seller: string;
  sellerType: SellerType;
  image: ImageName;
  ulez: boolean;
  postedAgo: string;
  promoted?: boolean;
}

export type EventCategory = 'Koncerty' | 'Kultura' | 'Rodzina' | 'Biznes' | 'Społeczność' | 'Teatr' | 'Sport';

export interface EventItem {
  id: string;
  title: string;
  start: string;
  end?: string;
  time: string;
  venue: string;
  borough: string;
  region: RegionId;
  category: EventCategory;
  image: ImageName;
  free: boolean;
  priceLabel: string;
  polish: boolean;
  patronage?: boolean;
  description: string;
  map: { x: number; y: number };
}

export interface GuideArea {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: Accent;
  count: number;
}

export interface GuideTask {
  id: string;
  area: string;
  question: string;
  answer: string;
  steps: string[];
  readMin: number;
  updated: string;
}

export type TransportMode = 'tube' | 'overground' | 'elizabeth' | 'dlr' | 'rail';
export type TransportState = 'good' | 'minor' | 'severe' | 'closed';

export interface TransportLine {
  id: string;
  mode: TransportMode;
  name: string;
  color: string;
  state: TransportState;
  note?: string;
}

export interface FaqItem {
  id: string;
  category: string;
  q: string;
  a: string;
}

export interface Promotion {
  id: string;
  brand: string;
  category: string;
  title: string;
  description: string;
  image: ImageName;
  badge: string;
  validUntil: string;
  sponsored: boolean;
}

export interface AdCreative {
  advertiser: string;
  headline: string;
  text?: string;
  cta: string;
  to: string;
  image?: ImageName;
}

export interface NavLink {
  label: string;
  to: string;
  description?: string;
  icon?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  links: NavLink[];
}
