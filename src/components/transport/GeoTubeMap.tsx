import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MlMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { type TubeMapProps } from './mapShared';

const STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const RASTER = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const LONDON: [number, number] = [-0.1276, 51.5072];
const BOUNDS: [[number, number], [number, number]] = [
  [-0.95, 51.25],
  [0.7, 51.8],
];

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    raster: { type: 'raster', tiles: [RASTER], tileSize: 256, attribution: '© OpenStreetMap contributors' },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e8eef4' } },
    { id: 'raster', type: 'raster', source: 'raster' },
  ],
};

const STATION_LAYERS = ['tube-station', 'tube-interchange-outer'];

function addTubeLayers(map: MlMap) {
  const empty = { type: 'FeatureCollection' as const, features: [] };
  map.addSource('tube-lines', { type: 'geojson', data: empty });
  map.addSource('tube-stations', { type: 'geojson', data: empty });
  const w = (a: number, b: number, c: number) => ['interpolate', ['linear'], ['zoom'], 9, a, 13, b, 16, c];
  map.addLayer({ id: 'tube-casing', type: 'line', source: 'tube-lines', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'casing'], 'line-width': w(3, 7, 13) as never } });
  map.addLayer({ id: 'tube-line', type: 'line', source: 'tube-lines', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'colour'], 'line-width': w(1.6, 4, 8) as never } });
  map.addLayer({
    id: 'tube-station',
    type: 'circle',
    source: 'tube-stations',
    filter: ['!', ['get', 'interchange']],
    paint: { 'circle-radius': w(1.4, 3.6, 6) as never, 'circle-color': '#101828', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
  });
  map.addLayer({
    id: 'tube-interchange-outer',
    type: 'circle',
    source: 'tube-stations',
    filter: ['get', 'interchange'],
    paint: { 'circle-radius': w(3, 7, 11) as never, 'circle-color': '#ffffff', 'circle-stroke-color': '#101828', 'circle-stroke-width': w(1, 1.8, 2.4) as never },
  });
  map.addLayer({
    id: 'tube-interchange-inner',
    type: 'circle',
    source: 'tube-stations',
    filter: ['get', 'interchange'],
    paint: { 'circle-radius': w(1.2, 3.2, 5) as never, 'circle-color': '#101828', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': w(0.8, 1.4, 2) as never },
  });
  map.addLayer({
    id: 'tube-station-hover',
    type: 'circle',
    source: 'tube-stations',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'circle-radius': w(5, 10, 14) as never, 'circle-color': 'rgba(16,24,40,0.08)', 'circle-stroke-color': '#101828', 'circle-stroke-width': 2 },
  });
  const label = (id: string, minzoom: number, filter: unknown) =>
    map.addLayer({
      id,
      type: 'symbol',
      source: 'tube-stations',
      minzoom,
      filter: filter as never,
      layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13], 'text-offset': [0, 1], 'text-anchor': 'top', 'text-optional': true, 'text-padding': 4 },
      paint: { 'text-color': '#101828', 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 },
    });
  label('tube-labels-major', 11, ['get', 'interchange']);
  label('tube-labels', 13, ['!', ['get', 'interchange']]);
  map.addSource('journey', { type: 'geojson', data: empty });
  map.addSource('journey-stops', { type: 'geojson', data: empty });
  map.addLayer({
    id: 'journey-halo',
    type: 'line',
    source: 'journey',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#101828', 'line-width': 12, 'line-opacity': 0.18, 'line-blur': 0.6 },
  });
  map.addLayer({
    id: 'journey-line',
    type: 'line',
    source: 'journey',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': ['get', 'colour'], 'line-width': 7, 'line-opacity': 0.96 },
  });
  map.addLayer({
    id: 'journey-stops',
    type: 'circle',
    source: 'journey-stops',
    paint: { 'circle-radius': ['case', ['get', 'end'], 7, 4.5], 'circle-color': '#fff', 'circle-stroke-color': ['get', 'colour'], 'circle-stroke-width': 2.4 },
  });
}

export default function GeoTubeMap(props: TubeMapProps) {
  const { network, visibleLines, focusLineId, selectedStationId, hoveredStationId, reducedMotion, focusRequest, journey } = props;
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const [basemapNote, setBasemapNote] = useState<string | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  // Map instance – created once.
  useEffect(() => {
    const el = mapEl.current;
    if (!el) return;
    const map = new maplibregl.Map({
      container: el,
      style: STYLE_URL,
      center: LONDON,
      zoom: window.innerWidth < 700 ? 9.6 : 10.4,
      minZoom: 8.5,
      maxZoom: 16.5,
      maxBounds: BOUNDS,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      attributionControl: { compact: true },
      fadeDuration: reducedMotion ? 0 : 200,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    let fellBack = false;
    const fallback = () => {
      if (fellBack || map.isStyleLoaded()) return;
      fellBack = true;
      setBasemapNote('Podkład mapy jest niedostępny – pokazujemy same linie metra.');
      map.setStyle(FALLBACK_STYLE);
    };
    const timer = window.setTimeout(fallback, 9000);
    map.on('error', (e) => {
      if (!map.isStyleLoaded() && /style/i.test(String(e.error?.message ?? ''))) fallback();
    });
    map.on('style.load', () => {
      window.clearTimeout(timer);
      addTubeLayers(map);
      setStyleVersion((v) => v + 1);
    });

    const stationAt = (pt: maplibregl.Point) => {
      const f = map.queryRenderedFeatures(
        [
          [pt.x - 7, pt.y - 7],
          [pt.x + 7, pt.y + 7],
        ],
        { layers: STATION_LAYERS.filter((l) => map.getLayer(l)) },
      )[0];
      return (f?.properties?.id as string | undefined) ?? null;
    };
    let lastHoverStation: string | null = null;
    map.on('mousemove', (e) => {
      const station = stationAt(e.point);
      if (station !== lastHoverStation) {
        lastHoverStation = station;
        propsRef.current.onHoverStation(station);
      }
      map.getCanvas().style.cursor = station ? 'pointer' : '';
    });
    map.on('mouseout', () => {
      if (lastHoverStation) propsRef.current.onHoverStation((lastHoverStation = null));
    });
    map.on('click', (e) => {
      const id = stationAt(e.point);
      if (id) propsRef.current.onSelectStation(id);
    });

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; props are read through propsRef
  }, []);

  // Static layer: line geometry + stations.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const lines = map.getSource('tube-lines') as GeoJSONSource | undefined;
    const stations = map.getSource('tube-stations') as GeoJSONSource | undefined;
    lines?.setData({
      type: 'FeatureCollection',
      features: network.lines.flatMap((l) =>
        l.geometry.map((coords) => ({
          type: 'Feature' as const,
          properties: { lineId: l.id, colour: l.colour, casing: '#ffffff' },
          geometry: { type: 'LineString' as const, coordinates: coords },
        })),
      ),
    });
    stations?.setData({
      type: 'FeatureCollection',
      features: Object.values(network.stations).map((s) => ({
        type: 'Feature' as const,
        properties: { id: s.id, name: s.name, interchange: s.interchange },
        geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
      })),
    });
  }, [network, styleVersion]);

  // Line visibility + isolation.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const visible = [...visibleLines];
    const lineFilter = ['in', ['get', 'lineId'], ['literal', visible]];
    map.setFilter('tube-casing', lineFilter as never);
    map.setFilter('tube-line', lineFilter as never);
    const shown = Object.values(network.stations).filter((s) => s.lines.some((l) => visibleLines.has(l)));
    const ids = shown.map((s) => s.id);
    const focusIds = focusLineId ? shown.filter((s) => s.lines.includes(focusLineId)).map((s) => s.id) : ids;
    const inShown = ['in', ['get', 'id'], ['literal', ids]];
    map.setFilter('tube-station', ['all', ['!', ['get', 'interchange']], inShown] as never);
    map.setFilter('tube-interchange-outer', ['all', ['get', 'interchange'], inShown] as never);
    map.setFilter('tube-interchange-inner', ['all', ['get', 'interchange'], inShown] as never);
    map.setFilter('tube-labels-major', ['all', ['get', 'interchange'], ['in', ['get', 'id'], ['literal', focusIds]]] as never);
    map.setFilter('tube-labels', ['all', ['!', ['get', 'interchange']], ['in', ['get', 'id'], ['literal', focusIds]]] as never);
    const dimLine = propsRef.current.journey
      ? 0.32
      : focusLineId
        ? ['case', ['==', ['get', 'lineId'], focusLineId], 1, 0.28]
        : 1;
    const dimStation = propsRef.current.journey
      ? 0.4
      : focusLineId
        ? ['case', ['in', ['get', 'id'], ['literal', focusIds]], 1, 0.28]
        : 1;
    map.setPaintProperty('tube-line', 'line-opacity', dimLine as never);
    map.setPaintProperty('tube-casing', 'line-opacity', dimLine as never);
    for (const l of ['tube-station', 'tube-interchange-outer', 'tube-interchange-inner']) {
      map.setPaintProperty(l, 'circle-opacity', dimStation as never);
      map.setPaintProperty(l, 'circle-stroke-opacity', dimStation as never);
    }
  }, [network, visibleLines, focusLineId, styleVersion, journey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    map.setFilter('tube-station-hover', ['in', ['get', 'id'], ['literal', [hoveredStationId, selectedStationId].filter(Boolean)]] as never);
  }, [hoveredStationId, selectedStationId, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const src = map.getSource('journey') as GeoJSONSource | undefined;
    const stops = map.getSource('journey-stops') as GeoJSONSource | undefined;
    const empty = { type: 'FeatureCollection' as const, features: [] };
    if (!journey?.legs.length) {
      src?.setData(empty);
      stops?.setData(empty);
      return;
    }
    const features: { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'LineString'; coordinates: [number, number][] } }[] = [];
    const stopFeatures: { type: 'Feature'; properties: Record<string, unknown>; geometry: { type: 'Point'; coordinates: [number, number] } }[] = [];
    const bounds = new maplibregl.LngLatBounds();
    let hasPt = false;
    journey.legs.forEach((leg, i) => {
      const coords: [number, number][] =
        leg.path.length > 1
          ? leg.path
          : leg.from.lng != null && leg.from.lat != null && leg.to.lng != null && leg.to.lat != null
            ? [
                [leg.from.lng, leg.from.lat],
                [leg.to.lng, leg.to.lat],
              ]
            : [];
      if (coords.length > 1) {
        features.push({ type: 'Feature', properties: { colour: leg.colour, mode: leg.mode }, geometry: { type: 'LineString', coordinates: coords } });
        for (const c of coords) {
          bounds.extend(c as [number, number]);
          hasPt = true;
        }
      }
      if (leg.from.lng != null && leg.from.lat != null) {
        stopFeatures.push({ type: 'Feature', properties: { colour: leg.colour, end: i === 0 }, geometry: { type: 'Point', coordinates: [leg.from.lng, leg.from.lat] } });
      }
      if (i === journey.legs.length - 1 && leg.to.lng != null && leg.to.lat != null) {
        stopFeatures.push({ type: 'Feature', properties: { colour: '#E31E36', end: true }, geometry: { type: 'Point', coordinates: [leg.to.lng, leg.to.lat] } });
      }
    });
    src?.setData({ type: 'FeatureCollection', features });
    stops?.setData({ type: 'FeatureCollection', features: stopFeatures });
    if (hasPt) map.fitBounds(bounds, { padding: { top: 56, bottom: 48, left: 48, right: 48 }, duration: reducedMotion ? 0 : 500, maxZoom: 13.5 });
  }, [journey, styleVersion, reducedMotion]);

  // Selected station pulse.
  useEffect(() => {
    const map = mapRef.current;
    const s = selectedStationId ? network.stations[selectedStationId] : null;
    if (!map || !s) return;
    const el = document.createElement('div');
    el.className = 'tmap-pulse';
    el.setAttribute('aria-hidden', 'true');
    const marker = new maplibregl.Marker({ element: el }).setLngLat([s.lon, s.lat]).addTo(map);
    return () => void marker.remove();
  }, [selectedStationId, network]);

  // Camera requests (search result, line isolation, reset).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) return;
    const duration = reducedMotion ? 0 : 450;
    if (focusRequest.kind === 'station') {
      const s = network.stations[focusRequest.id];
      if (s) map.easeTo({ center: [s.lon, s.lat], zoom: Math.max(map.getZoom(), 13.5), duration });
    } else if (focusRequest.kind === 'line') {
      const line = network.lines.find((l) => l.id === focusRequest.id);
      const pts = line?.geometry.flat() ?? [];
      if (!pts.length) return;
      const b = new maplibregl.LngLatBounds(pts[0], pts[0]);
      for (const p of pts) b.extend(p);
      map.fitBounds(b, { padding: { top: 60, bottom: 40, left: 40, right: 40 }, duration, maxZoom: 13 });
    } else {
      map.easeTo({ center: LONDON, zoom: window.innerWidth < 700 ? 9.6 : 10.4, duration });
    }
  }, [focusRequest, network, reducedMotion]);

  return (
    <div className="tmap-geo">
      <div ref={mapEl} className="tmap-geo__map" aria-label="Mapa Londynu z liniami metra. Wybierz stację z listy lub wyszukiwarki, aby zobaczyć odjazdy." role="region" />
      {basemapNote && <p className="tmap-note">{basemapNote}</p>}
    </div>
  );
}
