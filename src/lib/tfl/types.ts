// Domain models for transport data. UI code depends on these, never on raw TfL JSON.
// Shared with the server – keep imports relative.

export type StatusLevel = 'good' | 'minor' | 'severe' | 'closed' | 'unknown';

export interface Disruption {
  lineId: string;
  severity: StatusLevel;
  /** TfL wording, e.g. "Minor Delays" */
  severityDescription: string;
  /** Verbatim TfL disruption text – never paraphrased or invented. */
  description: string;
  reason: string | null;
  category: string | null;
}

export interface LineStatus {
  id: string;
  name: string;
  mode: string;
  colour: string;
  level: StatusLevel;
  /** Most severe TfL status code (10 = Good Service). */
  severity: number;
  statusDescription: string;
  disruptions: Disruption[];
}

/** TubeLine in the spec: line identity + live status. */
export type TubeLine = LineStatus;

export interface TubeStation {
  /** NaPTAN station id, e.g. 940GZZLUOXC */
  id: string;
  /** Short display name without "Underground Station" */
  name: string;
  lat: number;
  lon: number;
  /** Tube line ids serving this station */
  lines: string[];
  interchange: boolean;
  zone: string | null;
  /** Hub id when the station belongs to a multi-mode hub (e.g. HUBKGX) */
  hubId: string | null;
}

export interface LineBranch {
  /** TfL ordered route name, e.g. "Morden ↔ Edgware via Bank" */
  name: string;
  stationIds: string[];
}

export interface NetworkLine {
  id: string;
  name: string;
  colour: string;
  branches: LineBranch[];
  /** Geographic route geometry from TfL lineStrings: list of [lon, lat] polylines. */
  geometry: [number, number][][];
}

export interface TubeNetwork {
  lines: NetworkLine[];
  stations: Record<string, TubeStation>;
}

export interface TrainPrediction {
  id: string;
  vehicleId: string | null;
  lineId: string;
  lineName: string;
  stationId: string;
  stationName: string;
  platform: string | null;
  direction: string | null;
  /** Human-readable destination ("Walthamstow Central") */
  towards: string;
  destinationId: string | null;
  /** Seconds from the TfL timestamp – a prediction, not a guarantee. */
  timeToStation: number;
  expectedArrival: string;
  currentLocation: string | null;
  /** When TfL produced the prediction */
  timestamp: string;
}

/**
 * One train derived from TfL predictions. The map position is NOT GPS – the client
 * interpolates `estimatedVisualPosition` between `fromStationId` and `toStationId`.
 */
export interface TrainSighting {
  key: string;
  vehicleId: string;
  lineId: string;
  direction: string | null;
  towards: string;
  platform: string | null;
  currentLocation: string | null;
  fromStationId: string | null;
  toStationId: string;
  /** Seconds to reach `toStationId` at `observedAt` */
  timeToStation: number;
  /** Estimated duration of the current segment, seconds */
  segmentSeconds: number;
  /** Train is standing at `toStationId` */
  atStation: boolean;
  observedAt: string;
  nextStops: { stationId: string; name: string; timeToStation: number }[];
}

export interface RouteSection {
  name: string;
  direction: string;
  origin: string;
  destination: string;
  originId: string;
  destinationId: string;
}

export interface LineRoute {
  id: string;
  name: string;
  sections: RouteSection[];
}

export interface StationDetail {
  id: string;
  name: string;
  lat: number;
  lon: number;
  lines: string[];
  otherModes: string[];
  /** TfL facility/accessibility properties, labels translated, values verbatim. */
  facilities: { label: string; value: string }[];
  /** TfL "AccessViaLift" – not the same as full step-free access. */
  liftAccess: boolean | null;
}

export interface StationSearchResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  hub: boolean;
  zone: string | null;
}

export interface TimetableSchedule {
  /** TfL schedule name, e.g. "Monday - Thursday" */
  name: string;
  departures: { time: string; arrival: string | null }[];
}

export interface Timetable {
  lineId: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  direction: string;
  /** Planned travel time between the stops, minutes */
  travelMinutes: number | null;
  schedules: TimetableSchedule[];
}

export interface ApiMeta {
  fetchedAt: string;
  /** Data served from cache after an upstream failure */
  stale: boolean;
  source: 'tfl';
  /** Server clock at response time – lets the client correct for clock skew. */
  serverTime: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiMeta;
}

export type ApiErrorKind = 'unavailable' | 'timeout' | 'rate-limit' | 'not-found' | 'bad-request' | 'no-data';

export interface ApiErrorBody {
  error: { kind: ApiErrorKind; message: string };
}
