// DEMO DATA – example vehicle adverts.
import type { Vehicle } from '@/types';
import { attachGeo } from './geo';

export const VEHICLES: Vehicle[] = attachGeo<Vehicle>([
  { id: 'v-1', title: 'BMW 3 Series 320d M Sport', make: 'BMW', model: '3 Series', year: 2019, price: 17900, mileage: 41000, fuel: 'Diesel', transmission: 'Automatyczna', location: 'Heathrow, TW6', seller: 'Auto Polonia Ltd', sellerType: 'business', image: 'car-bmw', ulez: true, postedAgo: '3 godz. temu', promoted: true },
  { id: 'v-2', title: 'Ford Mustang 5.0 V8 GT', make: 'Ford', model: 'Mustang', year: 2018, price: 27500, mileage: 32000, fuel: 'Benzyna', transmission: 'Manualna', location: 'Croydon, CR0', seller: 'Michał', sellerType: 'private', image: 'car-mustang', ulez: true, postedAgo: 'Wczoraj' },
  { id: 'v-3', title: 'Porsche 911 Carrera S', make: 'Porsche', model: '911', year: 2017, price: 64900, mileage: 28000, fuel: 'Benzyna', transmission: 'Automatyczna', location: 'Richmond, TW9', seller: 'Prestige Cars London', sellerType: 'business', image: 'car-porsche', ulez: true, postedAgo: '2 dni temu' },
  { id: 'v-4', title: 'BMW M4 Competition', make: 'BMW', model: 'M4', year: 2021, price: 52000, mileage: 15000, fuel: 'Benzyna', transmission: 'Automatyczna', location: 'Wembley, HA9', seller: 'Auto Polonia Ltd', sellerType: 'business', image: 'car-m4', ulez: true, postedAgo: '2 dni temu' },
  { id: 'v-5', title: 'Ford Transit Custom 2.0 TDCi', make: 'Ford', model: 'Transit Custom', year: 2020, price: 12500, mileage: 125000, fuel: 'Diesel', transmission: 'Manualna', location: 'Southall, UB2', seller: 'Van Centre West', sellerType: 'business', image: 'car-garage', ulez: true, postedAgo: 'Wczoraj' },
  { id: 'v-6', title: 'BMW 1 Series 118i Sport', make: 'BMW', model: '1 Series', year: 2016, price: 8400, mileage: 62000, fuel: 'Benzyna', transmission: 'Manualna', location: 'Ealing, W5', seller: 'Kasia', sellerType: 'private', image: 'car-bmw', ulez: true, postedAgo: '4 dni temu' },
]);

export const VEHICLE_MAKES = ['BMW', 'Ford', 'Porsche'] as const;

export const MOTORING_SERVICES = [
  { title: 'Mechanicy', description: 'Polskie warsztaty, MOT, serwis', icon: 'Wrench', to: '/ogloszenia/uslugi?kategoria=Naprawy' },
  { title: 'Części', description: 'Nowe i używane części', icon: 'Car', to: '/ogloszenia/kupie-sprzedam' },
  { title: 'Ubezpieczenia', description: 'Porównaj oferty OC/AC', icon: 'ShieldCheck', to: '/promocje' },
  { title: 'Poradniki', description: 'ULEZ, MOT, prawo jazdy', icon: 'BookOpen', to: '/poradnik' },
];

export const vehicleById = (id: string) => VEHICLES.find((v) => v.id === id);
