import { FormField, PrototypeForm } from '@/components/forms/PrototypeForm';
import { AD_PRODUCTS } from '@/data/advertising';

export function AdContactForm({ product = '' }: { product?: string }) {
  return (
    <PrototypeForm kind="advertising" label="Zapytanie o reklamę" submitLabel="Wyślij zapytanie" successTitle="Dziękujemy za zapytanie!">
      <FormField label="Imię i nazwisko" name="name" required autoComplete="name" />
      <FormField label="Firma" name="company" required autoComplete="organization" />
      <FormField label="E-mail służbowy" name="email" type="email" required autoComplete="email" />
      <FormField label="Telefon" name="phone" type="tel" autoComplete="tel" hint="Opcjonalnie – oddzwonimy w godzinach pracy." />
      <FormField
        as="select"
        label="Interesuje mnie"
        name="product"
        required
        defaultValue={product}
        options={[{ value: '', label: 'Wybierz produkt' }, ...AD_PRODUCTS.map((p) => ({ value: p.slug, label: p.title })), { value: 'inne', label: 'Kampania łączona / nie wiem' }]}
      />
      <FormField
        as="select"
        label="Orientacyjny budżet"
        name="budget"
        options={[
          { value: '', label: 'Wolę nie podawać' },
          { value: 's', label: 'do £XXX' },
          { value: 'm', label: '£XXX – £X XXX' },
          { value: 'l', label: 'powyżej £X XXX' },
        ]}
      />
      <FormField as="textarea" label="Opisz kampanię" name="message" full required placeholder="Cel, grupa docelowa, termin, region Londynu…" />
    </PrototypeForm>
  );
}
