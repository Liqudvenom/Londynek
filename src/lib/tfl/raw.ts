// Subset of raw TfL Unified API response shapes that the adapters read.
// Only adapters.ts may depend on these – UI code uses the domain models in types.ts.

export interface RawLineStatus {
  statusSeverity: number;
  statusSeverityDescription: string;
  reason?: string;
  disruption?: { category?: string; categoryDescription?: string; description?: string; additionalInfo?: string; closureText?: string };
  validityPeriods?: { fromDate: string; toDate: string; isNow: boolean }[];
}

export interface RawLine {
  id: string;
  name: string;
  modeName: string;
  lineStatuses?: RawLineStatus[];
}

export interface RawMatchedStop {
  id: string;
  stationId?: string;
  topMostParentId?: string;
  parentId?: string;
  name: string;
  lat: number;
  lon: number;
  zone?: string;
  modes?: string[];
  lines?: { id: string; name: string }[];
}

export interface RawRouteSequence {
  lineId: string;
  lineName: string;
  direction: string;
  lineStrings: string[];
  stations: RawMatchedStop[];
  stopPointSequences: { branchId: number; serviceType: string; stopPoint: RawMatchedStop[] }[];
  orderedLineRoutes: { name: string; naptanIds: string[]; serviceType: string }[];
}

export interface RawRoute {
  id: string;
  name: string;
  routeSections: { name: string; direction: string; originationName: string; destinationName: string; originator: string; destination: string; serviceType: string; validTo?: string; validFrom?: string }[];
}

export interface RawPrediction {
  id: string;
  vehicleId?: string;
  naptanId: string;
  stationName: string;
  lineId: string;
  lineName: string;
  platformName?: string;
  direction?: string;
  destinationNaptanId?: string;
  destinationName?: string;
  timestamp: string;
  timeToStation: number;
  currentLocation?: string;
  towards?: string;
  expectedArrival: string;
  modeName?: string;
}

export interface RawTimetableResponse {
  lineId: string;
  lineName: string;
  direction: string;
  stops?: RawMatchedStop[];
  stations?: RawMatchedStop[];
  timetable?: {
    departureStopId: string;
    routes: {
      stationIntervals: { id: string; intervals: { stopId: string; timeToArrival: number }[] }[];
      schedules: { name: string; knownJourneys: { hour: string; minute: string; intervalId: number }[] }[];
    }[];
  };
  statusErrorMessage?: string;
}

export interface RawSearchResponse {
  query: string;
  total: number;
  matches: { id: string; name: string; lat: number; lon: number; modes?: string[]; zone?: string; topMostParentId?: string }[];
}

export interface RawStopPoint {
  id: string;
  naptanId?: string;
  commonName: string;
  lat: number;
  lon: number;
  modes?: string[];
  lines?: { id: string; name: string }[];
  additionalProperties?: { category: string; key: string; value: string }[];
  children?: RawStopPoint[];
}
