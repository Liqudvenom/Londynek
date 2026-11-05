import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, MapPin, Plug, ShieldCheck, X } from 'lucide-react';
import { LocationInput } from '@/components/location/LocationInput';
import { MiniMap } from '@/components/location/MiniMap';
import { PageIntro } from '@/components/ui/PageHero';
import { Icon } from '@/components/ui/Icon';
import { FormField, PrototypeForm } from '@/components/forms/PrototypeForm';
import { CLASSIFIED_CATEGORIES } from '@/data/classifieds';
import { REGIONS } from '@/data/districts';
import { publicPlaceLabel } from '@/lib/location/mapItems';
import type { GeoLocation, LocationResult } from '@/lib/location/types';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ClassifiedCategory } from '@/types';
import './misc.css';

const MAX_PHOTOS = 6;

interface Photo {
  url: string;
  name: string;
}

interface Draft {
  title: string;
  price: string;
  location: string;
}

const PRIVATE_CATS: ClassifiedCategory[] = ['nieruchomosci', 'towarzyskie'];

/** Firms that send their own listings to Londynek instead of posting one by one. */
const PARTNER = 'partner';
type Category = ClassifiedCategory | typeof PARTNER;

const PARTNER_DATA = [
  { name: 'dataJobs', label: 'Oferty pracy' },
  { name: 'dataHousing', label: 'Nieruchomości' },
  { name: 'dataServices', label: 'Usługi i cennik' },
  { name: 'dataEvents', label: 'Wydarzenia' },
  { name: 'dataVehicles', label: 'Motoryzacja' },
  { name: 'dataPlaces', label: 'Placówki i adresy firmy' },
];

const PARTNER_METHODS = [
  { value: '', label: 'Wybierz…' },
  { value: 'api', label: 'API (JSON / REST)' },
  { value: 'xml', label: 'Feed XML (np. z systemu ogłoszeń lub ATS)' },
  { value: 'csv', label: 'Plik CSV / Google Sheets' },
  { value: 'manual', label: 'Na razie ręcznie – pomóżcie mi to ustawić' },
];

function PartnerFields() {
  return (
    <>
      <h2 className="add-listing__step pform__full">
        <span>2</span> Firma
      </h2>
      <FormField label="Nazwa firmy" name="company" required autoComplete="organization" />
      <FormField label="Strona internetowa" name="companyUrl" type="url" required placeholder="https://" />
      <FormField label="Numer w Companies House" name="companyNo" hint="Opcjonalnie – przyspiesza weryfikację" />
      <FormField
        as="select"
        label="Branża"
        name="industry"
        options={[{ value: '', label: 'Wybierz…' }, ...CLASSIFIED_CATEGORIES.map((c) => ({ value: c.id, label: c.label })), { value: 'other', label: 'Inna' }]}
      />

      <h2 className="add-listing__step pform__full">
        <span>3</span> Jakie dane chcesz podłączyć
      </h2>
      <fieldset className="add-partner__data pform__full">
        <legend className="visually-hidden">Rodzaj danych</legend>
        {PARTNER_DATA.map((d) => (
          <label key={d.name} className="check">
            <input type="checkbox" name={d.name} value="tak" /> {d.label}
          </label>
        ))}
      </fieldset>
      <FormField as="select" label="Sposób połączenia" name="method" required options={PARTNER_METHODS} />
      <FormField label="Adres feedu lub dokumentacji API" name="feedUrl" type="url" placeholder="https://twojafirma.co.uk/feed.xml" hint="Nie wklejaj tu kluczy ani haseł – dostęp ustalimy osobno." />
      <FormField
        as="select"
        label="Jak często aktualizować"
        name="frequency"
        options={[
          { value: 'hourly', label: 'Co godzinę' },
          { value: 'daily', label: 'Raz dziennie' },
          { value: 'weekly', label: 'Raz w tygodniu' },
        ]}
        defaultValue="daily"
      />
      <FormField label="Szacowana liczba ofert" name="volume" type="number" inputMode="numeric" />
      <FormField as="textarea" label="Uwagi" name="notes" full rows={4} placeholder="Np. system, z którego eksportujecie oferty, kategorie, logo, zasięg dzielnic…" />

      <h2 className="add-listing__step pform__full">
        <span>4</span> Osoba kontaktowa
      </h2>
      <FormField label="Imię i nazwisko" name="contact" required autoComplete="name" />
      <FormField label="Służbowy e-mail" name="email" type="email" required autoComplete="email" />
      <FormField label="Telefon" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
      <label className="check pform__full">
        <input type="checkbox" name="consent" value="tak" required /> Mam prawo udostępniać te dane i zgadzam się na ich wyświetlanie w serwisie. Adresów prywatnych klientów nie przekazujemy – tylko adresy firmy i okolice ofert.
      </label>
    </>
  );
}

function resultToGeo(r: LocationResult, hideExact: boolean): GeoLocation {
  return {
    address: r.formattedAddress || r.label,
    postcode: r.postcode ?? '',
    lat: r.lat,
    lng: r.lng,
    district: r.district ?? r.label,
    borough: r.district ?? '',
    precision: hideExact ? 'area' : 'exact',
    hideExact,
  };
}

/** Local object-URL previews only; files never leave the browser. */
function usePhotoPreviews() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const urls = useRef<Photo[]>([]);
  useEffect(() => {
    urls.current = photos;
  }, [photos]);
  useEffect(() => () => urls.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const add = (e: ChangeEvent<HTMLInputElement>) => {
    const room = MAX_PHOTOS - photos.length;
    const files = [...(e.target.files ?? [])].filter((f) => f.type.startsWith('image/')).slice(0, room);
    setPhotos((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f), name: f.name }))]);
    e.target.value = '';
  };
  const remove = (photo: Photo) => {
    URL.revokeObjectURL(photo.url);
    setPhotos((prev) => prev.filter((p) => p !== photo));
  };
  return { photos, add, remove };
}

export function AddListingPage() {
  useDocumentTitle('Dodaj ogłoszenie');
  const [category, setCategory] = useState<Category>('nieruchomosci');
  const [draft, setDraft] = useState<Draft>({ title: '', price: '', location: '' });
  const [addr, setAddr] = useState('');
  const [picked, setPicked] = useState<LocationResult | null>(null);
  const [hideExact, setHideExact] = useState(true);
  const { photos, add, remove } = usePhotoPreviews();
  const isPartner = category === PARTNER;
  const meta = CLASSIFIED_CATEGORIES.find((c) => c.id === category) ?? CLASSIFIED_CATEGORIES[0]!;
  const isPrivate = !isPartner && PRIVATE_CATS.includes(category);
  const geo = picked ? resultToGeo(picked, isPrivate && hideExact) : null;

  const onInput = (e: FormEvent<HTMLDivElement>) => {
    const t = e.target as HTMLInputElement;
    if (t.name in draft) setDraft((d) => ({ ...d, [t.name]: t.value }));
  };

  return (
    <>
      <PageIntro title="Dodaj ogłoszenie" lead="Wybierz kategorię, opisz ofertę i sprawdź podgląd przed publikacją." crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Dodaj' }]} />
      <div className="container section--tight add-listing" onInput={onInput}>
        <PrototypeForm
          key={isPartner ? 'partner' : 'listing'}
          kind={isPartner ? 'partner' : 'listing'}
          submitLabel={isPartner ? 'Wyślij zgłoszenie współpracy' : 'Opublikuj ogłoszenie'}
          successTitle={isPartner ? 'Zgłoszenie współpracy wysłane' : 'Ogłoszenie gotowe do publikacji'}
          label={isPartner ? 'Współpraca firm' : 'Nowe ogłoszenie'}
          className="add-listing__form"
        >
          <fieldset className="add-listing__cats pform__full">
            <legend className="add-listing__step">
              <span>1</span> Kategoria
            </legend>
            {CLASSIFIED_CATEGORIES.map((c) => (
              <label key={c.id} className="add-cat">
                <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => { setCategory(c.id); if (PRIVATE_CATS.includes(c.id)) setHideExact(true); }} />
                <Icon name={c.icon} size={22} />
                <span>{c.label}</span>
              </label>
            ))}
            <label className="add-cat add-cat--partner">
              <input type="radio" name="category" value={PARTNER} checked={isPartner} onChange={() => setCategory(PARTNER)} />
              <Plug size={22} aria-hidden="true" />
              <span>Współpraca firm</span>
              <small>Podłącz dane swojej firmy</small>
            </label>
          </fieldset>

          {isPartner ? (
            <PartnerFields />
          ) : (
          <>
          <h2 className="add-listing__step pform__full">
            <span>2</span> Szczegóły
          </h2>
          <FormField label="Tytuł ogłoszenia" name="title" required full placeholder={`Np. ${meta.description}`} />
          <FormField label="Cena (£)" name="price" type="number" inputMode="decimal" hint="Zostaw puste, jeśli „do uzgodnienia”" />
          <FormField
            as="select"
            label="Region"
            name="region"
            required
            options={[{ value: '', label: 'Wybierz…' }, ...REGIONS.map((r) => ({ value: r.id, label: r.name }))]}
          />
          <div className="add-loc pform__full">
            <LocationInput
              label="Adres lub kod pocztowy"
              placeholder="Np. 55 Exhibition Rd albo SW7 2PG"
              value={addr}
              onChange={(t) => {
                setAddr(t);
                setPicked(null);
                setDraft((d) => ({ ...d, location: t }));
              }}
              onPick={(r) => {
                setPicked(r);
                setAddr(r.formattedAddress || r.label);
                setDraft((d) => ({ ...d, location: r.formattedAddress || r.label }));
              }}
              picked={picked}
            />
            {geo && (
              <>
                <MiniMap geo={geo} label={draft.title || 'Lokalizacja ogłoszenia'} />
                {isPrivate && (
                  <label className="add-loc__hide">
                    <input type="checkbox" name="hideExact" checked={hideExact} onChange={(e) => setHideExact(e.target.checked)} />
                    Ukryj dokładny adres publicznie
                    <span>Na stronie pojawi się okolica, np. „{geo.district} {geo.postcode.split(' ')[0]}”, bez numeru budynku.</span>
                  </label>
                )}
                <input type="hidden" name="location" value={hideExact && isPrivate ? publicPlaceLabel(geo) : geo.address ?? geo.postcode} />
                <input type="hidden" name="postcode" value={geo.postcode} />
                <input type="hidden" name="lat" value={String(geo.lat)} />
                <input type="hidden" name="lng" value={String(geo.lng)} />
              </>
            )}
          </div>
          <FormField as="textarea" label="Opis" name="description" required full rows={6} placeholder="Opisz stan, warunki, dostępność…" />

          <h2 className="add-listing__step pform__full">
            <span>3</span> Zdjęcia
          </h2>
          <div className="add-photos pform__full">
            <ul className="add-photos__list">
              {photos.map((p) => (
                <li key={p.url}>
                  <img src={p.url} alt={p.name} />
                  <button type="button" className="icon-btn" aria-label={`Usuń zdjęcie ${p.name}`} onClick={() => remove(p)}>
                    <X size={16} />
                  </button>
                </li>
              ))}
              {photos.length < MAX_PHOTOS && (
                <li>
                  <label className="add-photos__drop">
                    <ImagePlus size={26} aria-hidden="true" />
                    <span>Dodaj zdjęcia</span>
                    <input type="file" accept="image/*" multiple onChange={add} className="visually-hidden" />
                  </label>
                </li>
              )}
            </ul>
            <span className="field__hint">Do {MAX_PHOTOS} zdjęć. Podgląd tylko w przeglądarce – pliki nie są nigdzie wysyłane.</span>
          </div>

          <h2 className="add-listing__step pform__full">
            <span>4</span> Kontakt
          </h2>
          <FormField label="Imię lub nazwa firmy" name="contact" required autoComplete="name" />
          <FormField label="Telefon lub e-mail" name="reach" required autoComplete="email" />
          </>
          )}
        </PrototypeForm>

        {isPartner ? (
          <aside className="add-preview" aria-label="Jak działa współpraca">
            <h2>Jak to działa</h2>
            <ol className="add-partner__steps">
              <li>
                <strong>Zgłoszenie</strong> Wysyłasz formularz z adresem feedu lub API.
              </li>
              <li>
                <strong>Weryfikacja</strong> Sprawdzamy firmę i próbkę danych, zwykle w 2 dni robocze.
              </li>
              <li>
                <strong>Mapowanie</strong> Dopasowujemy Twoje pola do kategorii Londynka i dzielnic.
              </li>
              <li>
                <strong>Publikacja</strong> Oferty pojawiają się na liście, mapie i w wyszukiwarce, z logo firmy.
              </li>
            </ol>
            <div className="notice">
              <ShieldCheck size={18} aria-hidden="true" /> Klucze dostępu ustalamy osobno, poza formularzem. Prywatne adresy klientów nigdy nie są publikowane – na mapie widać tylko adres firmy albo okolicę.
            </div>
          </aside>
        ) : (
        <aside className="add-preview" aria-label="Podgląd ogłoszenia">
          <h2>Podgląd</h2>
          <article className="add-preview__card">
            <div className="add-preview__media">{photos[0] ? <img src={photos[0].url} alt="" /> : <Icon name={meta.icon} size={40} />}</div>
            <div className="add-preview__body">
              <span className="badge badge--soft">{meta.label}</span>
              <strong>{draft.title || 'Tytuł Twojego ogłoszenia'}</strong>
              <span className="add-preview__price">{draft.price ? `£${draft.price}` : 'Do uzgodnienia'}</span>
              <span className="add-preview__loc">
                <MapPin size={14} aria-hidden="true" /> {geo ? publicPlaceLabel(geo) : draft.location || 'Lokalizacja'}
              </span>
              {geo && <MiniMap geo={geo} label={draft.title || 'Podgląd lokalizacji'} className="add-preview__map" />}
            </div>
          </article>
          <div className="notice">
            <ShieldCheck size={18} aria-hidden="true" /> Ogłoszenia są moderowane. Nie podawaj numeru konta ani danych dokumentów w treści.
          </div>
        </aside>
        )}
      </div>
    </>
  );
}
