import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { LondonMap, type MapMarker } from '@/components/london/LondonMap';

export function MapPreview({ markers, onOpen, title = 'Zobacz ogłoszenia na mapie' }: { markers: MapMarker[]; onOpen: () => void; title?: string }) {
  return (
    <section className="rail-widget rail-widget--map" aria-label={title}>
      <div className="rail-widget__map">
        <LondonMap label="Podgląd mapy ogłoszeń" markers={markers} />
      </div>
      <div className="rail-widget__body">
        <strong>{title}</strong>
        <p>Przeglądaj ogłoszenia w swojej okolicy na interaktywnej mapie.</p>
        <button type="button" className="btn btn--sm" onClick={onOpen}>
          <MapPin size={16} aria-hidden="true" /> Otwórz mapę
        </button>
      </div>
    </section>
  );
}

export function AddListingCta({ title = 'Dodaj ogłoszenie za darmo', text = 'Szybko, łatwo i bezpłatnie. Dotrzyj do tysięcy Polaków w UK!' }: { title?: string; text?: string }) {
  return (
    <section className="rail-widget rail-widget--cta" aria-label={title}>
      <span className="rail-widget__plus" aria-hidden="true">
        <Plus size={22} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
      <Link to="/dodaj-ogloszenie" className="btn btn--inverse btn--block">
        Dodaj ogłoszenie <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function SafetyNotice() {
  return (
    <section className="rail-widget rail-widget--safety" aria-label="Bezpieczne ogłoszenia">
      <ShieldCheck size={28} aria-hidden="true" className="rail-widget__shield" />
      <div>
        <strong>Bezpieczne ogłoszenia</strong>
        <p>Nie płać z góry za oglądanie mieszkania, sprawdzaj profile i korzystaj z wiadomości w serwisie.</p>
        <Link to="/faq" className="text-link">
          Zobacz nasze wskazówki <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
