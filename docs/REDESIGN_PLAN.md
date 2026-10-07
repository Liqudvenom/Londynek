# Londynek.net — Redesign Plan

"Everything a Pole living in London needs in one place."

## 1. Audit of the existing project

| Item | Finding |
| --- | --- |
| Repository | Empty directory, no git, no source files |
| Framework / build | None |
| Routing / CSS | None |
| Components / assets / logo / fonts | None |
| API / data sources | None — no backend access |
| Reference material | 4 visual mockups (home, classifieds, housing, home v2) + public content of londynek.net |

Because there is no stack to reuse, a lightweight, conventional stack was chosen.

## 2. Planned architecture

| Concern | Choice | Reason |
| --- | --- | --- |
| Build | Vite 5 | Fast dev server, zero-config TS |
| UI | React 18 + TypeScript (strict) | Typed, component-driven |
| Routing | React Router 6 (`createBrowserRouter`, lazy routes) | Code-split per page |
| Styling | Plain CSS with design tokens (CSS custom properties), one stylesheet per component/page | No runtime cost, no utility soup |
| Icons | `lucide-react` (tree-shaken SVG) | Consistent stroke icons |
| Fonts | `@fontsource-variable/newsreader` (editorial serif) + `@fontsource-variable/inter` (UI) | Self-hosted, no layout shift from 3rd party CDNs |
| Images | Curated Unsplash photos downloaded by `scripts/fetch-images.mjs`, converted to WebP in 2 widths, served from `/public/img` with `srcset` | Local, lazy, responsive, no broken hotlinks |
| Animation | CSS transitions + `IntersectionObserver`; SVG `stroke-dashoffset` route drawing | No animation library needed; `prefers-reduced-motion` respected globally |
| State | React state + context (`SavedProvider` with `localStorage`, `ToastProvider`) | No backend; saved items persist locally |

```
src/
  main.tsx, router.tsx
  styles/           tokens.css, base.css, layout.css, components.css
  components/
    layout/         AppHeader, DesktopNav, MegaMenu, MobileNavigation, MobileBottomNav, Footer, RootLayout
    search/         HeroSearch, GlobalSearch, LocationSelector, CategorySelector
    london/         LondonRouteNavigation, UndergroundLines, LondonMap, TransportStatus
    ui/             Img, SectionHeader, Tabs, FilterChip, SortSelect, SaveButton, ViewToggle, Pagination,
                    Reveal, Sheet, FAQAccordion, HorizontalRail, PageHero, Breadcrumbs, Badge
    cards/          NewsLead, NewsCard, NewsCompactItem, ListingCard, PropertyCard, JobCard, CandidateCard,
                    ServiceCard, VehicleCard, EventCard, DistrictCard, GuideCard
    ads/            AdSlot, SponsoredCard
    filters/        FilterSidebar (config-driven)
  context/          SavedContext, ToastContext
  hooks/            useScrolled, useMediaQuery, useReveal, useParallax
  data/             typed mock data (news, classifieds, properties, jobs, candidates, services, vehicles,
                    events, districts, guides, transport, navigation, faq, promotions, ads)
  pages/            one folder per route family
```

## 3. Routes

| Route | Page composition |
| --- | --- |
| `/` | Immersive city dashboard |
| `/ogloszenia` | Marketplace (filters / results / contextual rail) |
| `/ogloszenia/nieruchomosci` | Property search + map |
| `/ogloszenia/praca` | Employment portal (offers ⇄ candidates) |
| `/ogloszenia/kandydaci` | Candidate directory |
| `/ogloszenia/uslugi` | Local business directory |
| `/ogloszenia/motoryzacja` | Vehicle marketplace |
| `/ogloszenia/kupie-sprzedam` | Visual marketplace grid |
| `/ogloszenia/towarzyskie` | Community groups & activities |
| `/ogloszenie/:id` | Generic listing detail |
| `/wiadomosci` | Editorial newspaper |
| `/czytelnia` | Digital magazine |
| `/ciekawostki` | Visual discovery (asymmetric/masonry) |
| `/poradnik` | Task-based help centre |
| `/artykul/:id` | Article reader (news, magazine, curiosities, guides) |
| `/wydarzenia`, `/wydarzenia/:id` | Calendar / discovery, event detail |
| `/promocje` | Deals hub (sponsored clearly labelled) |
| `/reklama` + 5 sub-routes | B2B conversion landing pages |
| `/o-nas`, `/kontakt`, `/dla-mediow`, `/regulamin`, `/faq` | Calm informational layouts |
| `/szukaj` | Cross-content search over mock data |
| `/zaloguj`, `/rejestracja`, `/dodaj-ogloszenie` | Prototype forms (clearly marked, nothing is submitted) |
| `*` | 404 |

## 4. Design tokens

Defined in `src/styles/tokens.css`.

- Brand: `--brand-red #E51B35`, `--brand-red-dark #C91229`, `--navy #102A4C`, `--navy-dark #07192D`
- Text: `--ink #111827`, `--text-secondary #667085` (AA on white and on `--background`)
- Surfaces: `--background #F8F7F2`, `--surface #FFF`, `--surface-soft #F2F4F7`, `--border #E5E7EB`
- Category lines: jobs `#175CD3`, housing `#E51B35`, help `#EAAA08`, news `#157F3D`, events `#C11574`, services `#3538CD`
  (help yellow is used for lines/fills only, text uses a darkened `--line-help-ink` for contrast)
- Type scale: display `clamp(30px → 72px)`, section `clamp(26px → 34px)`, body 16–18px, meta 13–14px
- Spacing: 4px base (`--space-1 … --space-12`), radius `--radius-sm 6px / md 10px / lg 14px` (restrained)
- Motion: `--dur-micro 150ms`, `--dur-ui 200ms`, `--dur-section 400ms`, `--ease-out`
- Layout: `--container 1400px`, breakpoints 640 / 900 / 1200

## 5. Data model (src/types.ts)

`NewsArticle`, `Listing` (generic classified), `Property`, `Job`, `Candidate`, `Service`, `Vehicle`,
`EventItem`, `District`, `Region`, `Guide`, `GuideArea`, `TransportLine`, `FaqItem`, `Promotion`, `AdCreative`.

All mock data is clearly marked with `DEMO DATA` headers. Transport status is static mock data
(`isMock: true`) and is labelled "dane demonstracyjne" in the UI. Advertising metrics and prices are placeholders.

## 6. Implementation phases

1. Design system, header, mega menu, mobile nav, footer, global components
2. Homepage
3. Classifieds
4. Real estate
5. Jobs
6. News, reading, curiosities, guide, events
7. Services, automotive, buy/sell, social
8. Advertising
9. Corporate pages
10. Responsive, accessibility, animations, performance — then lint + typecheck + build after each phase

## 7. Image credits

Photos: Unsplash (Unsplash License), IDs listed in `src/data/images.generated.ts`.
