# Londyn na żywo — Tube: architektura

Moduł transportowy pokazuje status linii, mapę metra, przewidywane przyjazdy i planowy rozkład
na podstawie **TfL Unified API** (`https://api.tfl.gov.uk`).

## Przepływ danych

```
przeglądarka ──► /api/transport/* (nasz serwer) ──► TfL Unified API
   src/lib/tfl/api.ts      server/transport-api.ts      server/tfl-client.ts
   (bez kluczy)            (walidacja, cache, adaptery) (app_id/app_key z env)
```

- Przeglądarka **nigdy** nie woła TfL bezpośrednio i nie zna kluczy.
- `TFL_APP_ID` / `TFL_APP_KEY` czytane są wyłącznie po stronie serwera (`vite.config.ts` → `loadEnv(..., ['TFL_', 'FORMS_'])`,
  `server/index.ts` → `process.env`). Zmienne bez prefiksu `VITE_` nie trafiają do bundla.
- Bez klucza TfL odpowiada anonimowo z niskim limitem – do produkcji klucz jest wymagany.
- Ten sam middleware (`server/middleware.ts`) działa w `npm run dev`, `npm run preview` i w serwerze produkcyjnym (`npm start`).

## Warstwy

| Warstwa | Pliki | Odpowiedzialność |
|---|---|---|
| Klient TfL | `server/tfl-client.ts` | URL, klucze, timeout 10 s, mapowanie błędów (504/503/404/400/502) |
| Cache | `server/cache.ts` | TTL w pamięci, deduplikacja równoległych zapytań, „stale” przy awarii TfL |
| API | `server/transport-api.ts` | trasy `/api/transport/*`, walidacja parametrów, koperta `{data, meta}` |
| Adaptery | `src/lib/tfl/adapters.ts` | surowy JSON TfL → modele domenowe (`src/lib/tfl/types.ts`) |
| Pociągi | `src/lib/tfl/trains.ts` | predykcje → „sightings” (odcinek między stacjami) |
| Klient przeglądarki | `src/lib/tfl/api.ts`, `src/hooks/useTransport.ts` | fetch, odświeżanie, pauza przy ukrytej karcie |
| UI | `src/components/transport/*`, `src/pages/transport/*` | mapy, tablice, panele |

Kod w `src/lib/tfl/*` i `src/data/tube-colors.ts` jest współdzielony z serwerem – tylko importy względne.

## Endpointy wewnętrzne → TfL

| Nasz endpoint | TfL | TTL cache |
|---|---|---|
| `GET /api/transport/status?modes=tube,dlr,…` | `/Line/Mode/{modes}/Status` | 45 s |
| `GET /api/transport/tube/lines` | `/Line/Mode/tube` | 24 h |
| `GET /api/transport/tube/network` | `/Line/{id}/Route/Sequence/outbound` ×11 | 24 h (stale do 7 dni) |
| `GET /api/transport/tube/lines/{id}/route` | `/Line/{id}/Route` | 24 h |
| `GET /api/transport/tube/lines/{id}/accessibility` | `/StopPoint/{ids}` (paczki po 20) | 24 h |
| `GET /api/transport/tube/vehicles?lines=` | `/Line/{11 linii}/Arrivals` | 20 s |
| `GET /api/transport/stations/search?q=` | `/StopPoint/Search/{q}?modes=tube` | 1 h |
| `GET /api/transport/stations/{id}` | `/StopPoint/{id}` | 24 h |
| `GET /api/transport/stations/{id}/arrivals?line=` | `/StopPoint/{id}/Arrivals` lub `/Line/{line}/Arrivals/{id}` | 15 s |
| `GET /api/transport/tube/timetable/{line}?from=&to=` | `/Line/{line}/Timetable/{from}/to/{to}` | 10 min |

Odpowiedź: `{ data, meta: { fetchedAt, stale, source: 'tfl', serverTime } }`.
Błąd: `{ error: { kind, message } }`, `kind` ∈ `unavailable | timeout | rate-limit | not-found | bad-request | no-data`,
komunikaty po polsku.

Walidacja: identyfikator stacji `^[A-Z0-9]{4,20}$`, linie z listy 11 linii metra, tryby statusu z białej listy,
zapytanie wyszukiwania 2–60 znaków. Nieprawidłowe parametry kończą się 400/404 **bez** zapytania do TfL.

## Odświeżanie po stronie klienta

| Dane | Interwał | Uwagi |
|---|---|---|
| Status linii | 60 s | `useLineStatus` |
| Pociągi (mapa) | 20 s | `useVehicles` |
| Przyjazdy na stacji | 20 s | `useStationArrivals` |
| Sieć (stacje, trasy) | raz na sesję | `loadNetwork()` |

Odświeżanie wstrzymuje się, gdy karta jest ukryta. Przy błędzie zostają ostatnie poprawne dane
z komunikatem „Dane sprzed N min” / przyciskiem „Spróbuj ponownie”.

## Co jest prawdziwe, a co szacowane

- **Prawdziwe (TfL):** statusy i treść utrudnień (wyświetlana dosłownie, bez parafrazy), przewidywane przyjazdy
  (`timeToStation`, peron, kierunek, `currentLocation`), stacje, kolejność stacji i odgałęzienia, geometria tras,
  udogodnienia i dostęp windą, planowy rozkład.
- **Szacowane:** pozycja pociągu na mapie. TfL **nie publikuje GPS** pociągów metra. `buildSightings` wyznacza odcinek
  (stacja poprzednia → następna) z `currentLocation` i kolejnych predykcji, a `TrainAnimator` interpoluje pozycję
  liniowo w czasie. Każdy tooltip mówi: „Pozycja na mapie jest wizualnym oszacowaniem na podstawie danych TfL.”
- **Planowe:** sekcja „Rozkład jazdy” (oznaczona „Planowy rozkład”, oddzielona od „NA ŻYWO”).
- **Demonstracyjne:** blok „W okolicy stacji” (pokoje, praca, wydarzenia) – dane demo z etykietą.

## Mapy

- **Mapa Londynu** (`GeoTubeMap.tsx`): MapLibre GL + ciemny styl OpenFreeMap (`VITE_MAP_STYLE_URL`), przebarwiony;
  trasy z geometrii TfL. Gdy styl nie wczyta się w 9 s – tło awaryjne z komunikatem.
- **Mapa LED** (`LedTubeMap.tsx`, `ledLayout.ts`): schemat na canvasie – rzut „rybie oko”, przyciąganie do siatki,
  krawędzie oktylinearne, wiązki linii na wspólnych odcinkach, poświata LED. Pan/zoom wskaźnikiem, kółkiem, gestem i klawiaturą.
- `prefers-reduced-motion`: brak płynnego ruchu (pozycje zamrożone między odświeżeniami, odliczanie dalej działa),
  brak animacji „chase” i pulsowania.

## Testy

`npm test` (vitest): adaptery, `scheduleForDate`, parsowanie `currentLocation`, `buildSightings`, interpolacja
i `TrainAnimator`, cache (stale), klient TfL (sukces, timeout, 429, 404, 5xx), API (puste predykcje, linia zawieszona,
odgałęzienia, stacja wieloliniowa, złe identyfikatory, brak rozkładu), formatowanie odliczania.
Testy dymne na żywym API: `node scripts/api-smoke.mjs` (przy uruchomionym `npm run dev`).

## Ograniczenia

- Cache jest w pamięci procesu – przy wielu instancjach potrzebny Redis lub podobny.
- Pozycje pociągów to oszacowania; przy rzadkich predykcjach (końce linii) mogą być mniej dokładne.
- Rozkład TfL nie jest dostępny dla wszystkich par stacji (komunikat „TfL nie udostępnia rozkładu…”).
- Overground, Elizabeth line, DLR i Rail mają na razie tylko status (bez mapy i tablic).
