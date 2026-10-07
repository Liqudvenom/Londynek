# Kontrakt API treści Londynek.net

Frontend może pobierać treści z prawdziwego API Londynek.net zamiast z danych demonstracyjnych
(`src/data/*`). Wystarczy ustawić publiczny adres bazowy:

```
VITE_LONDYNEK_API_URL=https://api.londynek.net
```

Bez tej zmiennej – albo gdy API nie odpowiada – strona używa danych demo i oznacza je
(„Wyszukiwanie działa lokalnie na danych demonstracyjnych”). Warstwa: `src/lib/content/source.ts`,
hooki: `src/hooks/useContent.ts` (`useSiteSearch`, `useCollection`).

`VITE_LONDYNEK_API_URL` trafia do bundla przeglądarki – **nie umieszczaj w nim tokenów ani kluczy**.
Endpointy muszą być publiczne (odczyt) i obsługiwać CORS dla domeny strony.

## Konwencje

- JSON, UTF-8, `Accept: application/json`.
- Sukces: `200 { "data": ... }`. Błąd: `4xx/5xx { "error": { "kind": string, "message": string, "fields"?: string[] } }`,
  `message` po polsku (pokazywany użytkownikowi).
- Timeout po stronie klienta: 8 s (formularze 15 s). Po timeoucie/błędzie lista i wyszukiwarka przechodzą na demo.
- Daty ISO 8601, kwoty w GBP jako liczby.
- Kształty obiektów = interfejsy TypeScript w `src/types.ts`.

## Odczyt

| Metoda | Ścieżka | `data` | Typ w `src/types.ts` |
|---|---|---|---|
| GET | `/v1/jobs` | `Job[]` | `Job` |
| GET | `/v1/properties` | `Property[]` | `Property` |
| GET | `/v1/classifieds` | `Listing[]` | `Listing` |
| GET | `/v1/services` | `Service[]` | `Service` |
| GET | `/v1/vehicles` | `Vehicle[]` | `Vehicle` |
| GET | `/v1/articles` | `Article[]` | `Article` |
| GET | `/v1/events` | `EventItem[]` | `EventItem` |
| GET | `/v1/guides` | `GuideTask[]` | `GuideTask` |
| GET | `/v1/search?q=&scope=&location=` | `SearchHit[]` | `SearchHit` w `src/lib/content/source.ts` |

`SearchHit`:

```ts
{
  id: string;
  scope: 'ogloszenia' | 'praca' | 'nieruchomosci' | 'wiadomosci' | 'poradnik' | 'wydarzenia' | 'uslugi';
  type: string;          // etykieta, np. "Praca", "Wynajem"
  title: string;
  snippet: string;
  location?: string;
  region?: 'central' | 'north' | 'south' | 'east' | 'west';
  to: string;            // ścieżka w serwisie, np. "/ogloszenie/123"
  image?: null;          // nazwy obrazów demo – API zwraca null
  imageUrl?: string | null;
}
```

`scope` pomijany = wszystkie kategorie. `location` = nazwa regionu („North London”) lub dzielnicy/kodu.

Paginacja (zalecana do wdrożenia): `?page=1&perPage=24` → `{ data, meta: { page, perPage, total } }`.
Klient obecnie czyta tylko `data`.

## Formularze

| Metoda | Ścieżka | Body |
|---|---|---|
| POST | `/v1/forms` (API Londynek) lub `/api/forms` (serwer tej strony) | `{ kind, fields, page }` |

- `kind`: `contact` | `advertising` | `listing`.
- `fields`: `Record<string, string>` – nazwy pól z formularzy (`name`, `email`, `subject`, `message`, `department`,
  `company`, `phone`, `product`, `budget`, `category`, `title`, `price`, `region`, `location`, `description`, `contact`, `reach`).
- Pole-pułapka `website` musi być puste (wypełnione = bot; odpowiedź 202 bez dostarczenia).
- Odpowiedź: `202 { "data": { "id": string, "delivered": "webhook" | "stored" } }`.
- Błędy: `400` (walidacja, `fields` wskazuje pola), `413` (za duże), `415` (nie JSON), `429` (limit 5/min na IP), `502` (dostarczenie nieudane).

Wbudowany `/api/forms` (`server/forms.ts`) waliduje dane i:
- wysyła JSON na `FORMS_WEBHOOK_URL` (np. CRM, Zapier, Slack), jeśli ustawiony;
- w przeciwnym razie dopisuje do `FORMS_STORE_FILE` (domyślnie `data/form-submissions.jsonl`, poza gitem).

Logowanie i rejestracja **nie** są wysyłane – pola z hasłami są odrzucane. Wymagają prawdziwego backendu autoryzacji.
Zdjęcia w „Dodaj ogłoszenie” nie są przesyłane (potrzebny endpoint uploadu, np. `POST /v1/uploads` → URL).

## Migracja stron na API

Strony list i szczegółów nadal importują `src/data/*` synchronicznie. Aby przełączyć stronę:

```tsx
const { data: jobs, loading, source } = useCollection('jobs');
if (loading) return <Skeleton />;
// source === 'demo' → pokaż etykietę „Dane demonstracyjne”
```

Wyszukiwarka (strona `/szukaj` i okno wyszukiwania) już korzysta z `useSiteSearch`.
