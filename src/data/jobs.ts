// DEMO DATA – example job offers and candidate profiles. Company names are fictional.
import type { Candidate, Job } from '@/types';
import { attachGeo } from './geo';

export const INDUSTRIES = ['Budownictwo', 'Logistyka', 'Gastronomia', 'Opieka', 'Sprzątanie', 'Transport', 'IT', 'Biuro', 'Handel'] as const;

export const JOBS: Job[] = attachGeo<Job>([
  { id: 'j-1', title: 'Pracownik magazynu – zmiany nocne', company: 'NorthLink Logistics', companyColor: '#175CD3', industry: 'Logistyka', salaryLabel: '£12,50–£14,00/h', salaryMin: 12.5, period: 'hour', location: 'Heathrow, Londyn', region: 'west', contract: 'permanent', schedule: 'shifts', visaSponsor: false, polishSpeaking: true, english: 'basic', postedAgo: '1 godz. temu', postedHours: 1, isNew: true, promoted: true },
  { id: 'j-2', title: 'Opiekunka osoby starszej (live-in)', company: 'CareWell Homes', companyColor: '#157F3D', industry: 'Opieka', salaryLabel: '£650–£800/tydz.', salaryMin: 650, period: 'week', location: 'Londyn i okolice', region: 'north', contract: 'contract', schedule: 'full-time', visaSponsor: true, polishSpeaking: true, english: 'communicative', postedAgo: '3 godz. temu', postedHours: 3, isNew: true },
  { id: 'j-3', title: 'Kierowca kat. B – dostawy lokalne', company: 'Swift Parcel', companyColor: '#E51B35', industry: 'Transport', salaryLabel: '£28 000–£32 000/rok', salaryMin: 28000, period: 'year', location: 'Park Royal, Londyn', region: 'west', contract: 'permanent', schedule: 'full-time', visaSponsor: false, polishSpeaking: false, english: 'communicative', postedAgo: '5 godz. temu', postedHours: 5 },
  { id: 'j-4', title: 'Hydraulik / Plumber – stała praca', company: 'AquaFix Ltd', companyColor: '#3538CD', industry: 'Budownictwo', salaryLabel: '£18–£25/h', salaryMin: 18, period: 'hour', location: 'Londyn i okolice', region: 'central', contract: 'permanent', schedule: 'full-time', visaSponsor: false, polishSpeaking: true, english: 'basic', postedAgo: 'Wczoraj', postedHours: 25 },
  { id: 'j-5', title: 'Kucharz / Chef de partie', company: 'Bistro Wisła', companyColor: '#C11574', industry: 'Gastronomia', salaryLabel: '£15–£17/h', salaryMin: 15, period: 'hour', location: 'Soho, Londyn', region: 'central', contract: 'permanent', schedule: 'shifts', visaSponsor: true, polishSpeaking: true, english: 'communicative', postedAgo: '2 godz. temu', postedHours: 2, isNew: true },
  { id: 'j-6', title: 'Pomocnik budowlany – CSCS', company: 'BuildRight Group', companyColor: '#B54708', industry: 'Budownictwo', salaryLabel: '£140–£160/dzień', salaryMin: 140, period: 'day', location: 'Stratford, Londyn', region: 'east', contract: 'temporary', schedule: 'full-time', visaSponsor: false, polishSpeaking: true, english: 'basic', postedAgo: 'Wczoraj', postedHours: 22 },
  { id: 'j-7', title: 'Junior Frontend Developer (React)', company: 'Thames Digital', companyColor: '#102A4C', industry: 'IT', salaryLabel: '£38 000–£45 000/rok', salaryMin: 38000, period: 'year', location: 'Shoreditch / hybrydowo', region: 'east', contract: 'permanent', schedule: 'full-time', visaSponsor: true, polishSpeaking: false, english: 'fluent', postedAgo: '2 dni temu', postedHours: 50 },
  { id: 'j-8', title: 'Sprzątanie biur – part-time, wieczory', company: 'BrightClean', companyColor: '#157F3D', industry: 'Sprzątanie', salaryLabel: '£12,60/h', salaryMin: 12.6, period: 'hour', location: 'Canary Wharf, Londyn', region: 'east', contract: 'permanent', schedule: 'part-time', visaSponsor: false, polishSpeaking: true, english: 'basic', postedAgo: '2 dni temu', postedHours: 48 },
  { id: 'j-9', title: 'Księgowa / Bookkeeper z językiem polskim', company: 'Kowalski & Co Accountants', companyColor: '#3538CD', industry: 'Biuro', salaryLabel: '£30 000–£34 000/rok', salaryMin: 30000, period: 'year', location: 'Ealing, Londyn', region: 'west', contract: 'permanent', schedule: 'full-time', visaSponsor: false, polishSpeaking: true, english: 'fluent', postedAgo: '3 dni temu', postedHours: 72, promoted: true },
  { id: 'j-10', title: 'Sprzedawca w polskich delikatesach', company: 'Polskie Smaki', companyColor: '#E51B35', industry: 'Handel', salaryLabel: '£12,20/h', salaryMin: 12.2, period: 'hour', location: 'Hammersmith, Londyn', region: 'west', contract: 'permanent', schedule: 'part-time', visaSponsor: false, polishSpeaking: true, english: 'basic', postedAgo: '4 dni temu', postedHours: 96 },
  { id: 'j-11', title: 'Elektryk z uprawnieniami 18th Edition', company: 'Volt Services', companyColor: '#EAAA08', industry: 'Budownictwo', salaryLabel: '£25–£30/h', salaryMin: 25, period: 'hour', location: 'Croydon, Londyn', region: 'south', contract: 'contract', schedule: 'full-time', visaSponsor: false, polishSpeaking: false, english: 'communicative', postedAgo: '5 dni temu', postedHours: 120 },
]);

export const EMPLOYERS = ['NorthLink Logistics', 'CareWell Homes', 'Swift Parcel', 'BuildRight Group', 'Thames Digital', 'Polskie Smaki', 'BrightClean'];

export const CANDIDATES: Candidate[] = [
  { id: 'c-1', name: 'Marta K.', profession: 'Opiekunka / Senior carer', location: 'Ealing, W5', rate: '£14/h', availability: 'Od zaraz', match: 94, skills: ['NVQ 3', 'Demencja', 'Prawo jazdy'], avatar: 'person-1', verified: true },
  { id: 'c-2', name: 'Paweł W.', profession: 'Elektryk – 18th Edition', location: 'Croydon, CR0', rate: '£28/h', availability: 'Od 1 listopada', match: 88, skills: ['ECS Gold', 'Instalacje', 'PAT testing'], avatar: 'person-3', verified: true },
  { id: 'c-3', name: 'Agnieszka N.', profession: 'Księgowa (ACCA w trakcie)', location: 'Hammersmith, W6', rate: '£32 000/rok', availability: '2 tyg. wypowiedzenia', match: 82, skills: ['Xero', 'Payroll', 'VAT'], avatar: 'person-4' },
  { id: 'c-4', name: 'Tomasz B.', profession: 'Kierowca C+E', location: 'Wembley, HA9', rate: '£19/h', availability: 'Od zaraz', match: 79, skills: ['CPC', 'Tachograf', 'ADR'], avatar: 'person-5', verified: true },
  { id: 'c-5', name: 'Katarzyna L.', profession: 'Frontend developer', location: 'Stratford, E15', rate: '£45 000/rok', availability: '1 mies. wypowiedzenia', match: 76, skills: ['React', 'TypeScript', 'Figma'], avatar: 'person-2' },
  { id: 'c-6', name: 'Rafał M.', profession: 'Stolarz / wykończenia', location: 'Harrow, HA1', rate: '£180/dzień', availability: 'Od zaraz', match: 71, skills: ['CSCS', 'Kuchnie', 'Podłogi'], avatar: null },
];

export const CONTRACT_LABEL = { permanent: 'Stała umowa', contract: 'Kontrakt', temporary: 'Tymczasowa' } as const;
export const SCHEDULE_LABEL = { 'full-time': 'Pełny etat', 'part-time': 'Część etatu', shifts: 'Zmiany' } as const;
export const ENGLISH_LABEL = { basic: 'Angielski podstawowy', communicative: 'Angielski komunikatywny', fluent: 'Angielski biegły' } as const;

export const jobById = (id: string) => JOBS.find((j) => j.id === id);
export const candidateById = (id: string) => CANDIDATES.find((c) => c.id === id);
