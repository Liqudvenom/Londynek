import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, MapPin, ShieldCheck, X } from 'lucide-react';
import { PageIntro } from '@/components/ui/PageHero';
import { Icon } from '@/components/ui/Icon';
import { FormField, PrototypeForm } from '@/components/forms/PrototypeForm';
import { CLASSIFIED_CATEGORIES } from '@/data/classifieds';
import { REGIONS } from '@/data/districts';
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
  const [category, setCategory] = useState<ClassifiedCategory>('nieruchomosci');
  const [draft, setDraft] = useState<Draft>({ title: '', price: '', location: '' });
  const { photos, add, remove } = usePhotoPreviews();
  const meta = CLASSIFIED_CATEGORIES.find((c) => c.id === category)!;

  const onInput = (e: FormEvent<HTMLDivElement>) => {
    const t = e.target as HTMLInputElement;
    if (t.name in draft) setDraft((d) => ({ ...d, [t.name]: t.value }));
  };

  return (
    <>
      <PageIntro title="Dodaj ogłoszenie" lead="Wybierz kategorię, opisz ofertę i sprawdź podgląd przed publikacją." crumbs={[{ label: 'Ogłoszenia', to: '/ogloszenia' }, { label: 'Dodaj' }]} />
      <div className="container section--tight add-listing" onInput={onInput}>
        <PrototypeForm kind="listing" submitLabel="Opublikuj ogłoszenie" successTitle="Ogłoszenie gotowe do publikacji" label="Nowe ogłoszenie" className="add-listing__form">
          <fieldset className="add-listing__cats pform__full">
            <legend className="add-listing__step">
              <span>1</span> Kategoria
            </legend>
            {CLASSIFIED_CATEGORIES.map((c) => (
              <label key={c.id} className="add-cat">
                <input type="radio" name="category" value={c.id} checked={category === c.id} onChange={() => setCategory(c.id)} />
                <Icon name={c.icon} size={22} />
                <span>{c.label}</span>
              </label>
            ))}
          </fieldset>

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
          <FormField label="Dzielnica lub kod pocztowy" name="location" required full placeholder="Np. Ealing, W5" />
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
        </PrototypeForm>

        <aside className="add-preview" aria-label="Podgląd ogłoszenia">
          <h2>Podgląd</h2>
          <article className="add-preview__card">
            <div className="add-preview__media">{photos[0] ? <img src={photos[0].url} alt="" /> : <Icon name={meta.icon} size={40} />}</div>
            <div className="add-preview__body">
              <span className="badge badge--soft">{meta.label}</span>
              <strong>{draft.title || 'Tytuł Twojego ogłoszenia'}</strong>
              <span className="add-preview__price">{draft.price ? `£${draft.price}` : 'Do uzgodnienia'}</span>
              <span className="add-preview__loc">
                <MapPin size={14} aria-hidden="true" /> {draft.location || 'Lokalizacja'}
              </span>
            </div>
          </article>
          <div className="notice">
            <ShieldCheck size={18} aria-hidden="true" /> Ogłoszenia są moderowane. Nie podawaj numeru konta ani danych dokumentów w treści.
          </div>
        </aside>
      </div>
    </>
  );
}
