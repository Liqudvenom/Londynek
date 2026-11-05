// Shared location model. Must use relative imports only – the server bundles this file too.

/**
 * `exact`  – a public address (businesses, employers, venues).
 * `area`   – an approximate point (postcode district / neighbourhood). Used for private
 *            housing & social listings and whenever the owner hides the exact address.
 */
export type GeoPrecision = 'exact' | 'area';

export interface GeoLocation {
  /** Public street address. Omitted when precision is `area`. */
  address?: string;
  /** Full postcode for exact locations, outcode (e.g. "E15") for areas. */
  postcode: string;
  lat: number;
  lng: number;
  /** Neighbourhood shown to users, e.g. "Stratford". */
  district: string;
  /** London borough, e.g. "Newham". */
  borough: string;
  precision: GeoPrecision;
  /** Owner chose to hide the exact address publicly. */
  hideExact?: boolean;
  /** For mobile services – how far they travel to clients. */
  serviceRadiusKm?: number;
}

export type LocationInputType = 'POSTCODE' | 'STATION' | 'ADDRESS' | 'PLACE';

export type LocationResultKind = 'place' | 'station' | 'address' | 'postcode';

/** A geocoder answer – what `geocode()` / the autocomplete returns. */
export interface LocationResult {
  id: string;
  kind: LocationResultKind;
  /** Primary label, e.g. "Ognisko" or "SW7 2PG" */
  label: string;
  /** Secondary label, e.g. "55 Exhibition Rd, South Kensington" */
  detail?: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  postcode: string | null;
  district: string | null;
  /** NaPTAN id when kind === 'station' */
  stationId?: string;
  /** Tube line ids when kind === 'station' */
  lines?: string[];
  /** Internal link for local places (listings, businesses) */
  to?: string;
}

export interface NearbyStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[];
  zone: string | null;
  distanceM: number;
  walkMin: number;
}

/** A point anywhere in London used as a journey end – coordinates and/or a station id. */
export interface JourneyPlace {
  name: string;
  lat?: number;
  lng?: number;
  stationId?: string;
}
