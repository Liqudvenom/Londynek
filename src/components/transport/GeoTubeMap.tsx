import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MlMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { onDark, drawCapsule, trainFill, TrainTooltip, type HoverTrain, type TubeMapProps } from './mapShared';
import { TrainAnimator, type AnimatedTrain } from './trainAnimator';

const STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/dark';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const LONDON: [number, number] = [-0.1276, 51.5072];
const BOUNDS: [[number, number], [number, number]] = [
  [-0.95, 51.25],
  [0.7, 51.8],
];

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#070A10' } }],
};

const STATION_LAYERS = ['tube-station', 'tube-interchange-outer'];

/** Recolours the vector basemap: deep-blue Thames, dark-green parks, quiet roads. */
function recolour(map: MlMap) {
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id;
    const set = (prop: string, value: unknown) => {
      try {
        map.setPaintProperty(id, prop, value);
      } catch {
        /* property not applicable to this layer */
      }
    };
    if (layer.type === 'background') set('background-color', '#070A10');
    else if (id === 'water') set('fill-color', '#0B2238');
    else if (id === 'waterway') set('line-color', '#0B2238');
    else if (id === 'landuse_park' || id === 'landcover_wood') {
      set('fill-color', '#0D2117');
      set('fill-opacity', 0.95);
    } else if (id === 'landuse_residential') set('fill-color', '#0A0E15');
    else if (id === 'building') {
      set('fill-color', '#0E121A');
      set('fill-outline-color', '#0E121A');
    } else if (layer.type === 'line' && /^(highway|road|aeroway|tunnel|bridge)/.test(id)) set('line-color', '#161B25');
    else if (layer.type === 'line' && id.startsWith('railway')) {
      set('line-color', '#1B202A');
      set('line-opacity', 0.6);
    }
    else if (layer.type === 'line' && id.startsWith('boundary')) set('line-color', '#1E2433');
    else if (layer.type === 'symbol') {
      set('text-color', id === 'water_name' ? '#3E6E9C' : '#5F6B7E');
      set('text-halo-color', '#070A10');
      if (id.startsWith('highway') || id.startsWith('road')) map.setLayoutProperty(id, 'visibility', 'none');
    }
  }
}

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
    paint: { 'circle-radius': w(1.4, 3.6, 6) as never, 'circle-color': '#EDF5FF', 'circle-stroke-color': '#070A10', 'circle-stroke-width': 1 },
  });
  map.addLayer({
    id: 'tube-interchange-outer',
    type: 'circle',
    source: 'tube-stations',
    filter: ['get', 'interchange'],
    paint: { 'circle-radius': w(3, 7, 11) as never, 'circle-color': '#070A10', 'circle-stroke-color': '#EDF5FF', 'circle-stroke-width': w(1, 1.8, 2.4) as never },
  });
  map.addLayer({
    id: 'tube-interchange-inner',
    type: 'circle',
    source: 'tube-stations',
    filter: ['get', 'interchange'],
    paint: { 'circle-radius': w(1.2, 3.2, 5) as never, 'circle-color': '#070A10', 'circle-stroke-color': '#EDF5FF', 'circle-stroke-width': w(0.8, 1.4, 2) as never },
  });
  map.addLayer({
    id: 'tube-station-hover',
    type: 'circle',
    source: 'tube-stations',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'circle-radius': w(5, 10, 14) as never, 'circle-color': 'rgba(237,245,255,0.08)', 'circle-stroke-color': '#EDF5FF', 'circle-stroke-width': 2 },
  });
  const label = (id: string, minzoom: number, filter: unknown) =>
    map.addLayer({
      id,
      type: 'symbol',
      source: 'tube-stations',
      minzoom,
      filter: filter as never,
      layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 13], 'text-offset': [0, 1], 'text-anchor': 'top', 'text-optional': true, 'text-padding': 4 },
      paint: { 'text-color': '#C9D3E0', 'text-halo-color': '#070A10', 'text-halo-width': 1.4 },
    });
  label('tube-labels-major', 11, ['get', 'interchange']);
  label('tube-labels', 13, ['!', ['get', 'interchange']]);
}

export default function GeoTubeMap(props: TubeMapProps) {
  const { network, visibleLines, focusLineId, selectedStationId, hoveredStationId, sightings, reducedMotion, focusRequest } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const [basemapNote, setBasemapNote] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverTrain | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const framePositions = useRef<{ t: AnimatedTrain; x: number; y: number }[]>([]);

  const animator = useMemo(() => new TrainAnimator((id) => {
    const s = network.stations[id];
    return s ? [s.lon, s.lat] : null;
  }), [network]);

  useEffect(() => {
    if (sightings) animator.update(sightings, reducedMotion);
  }, [animator, sightings, reducedMotion]);

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
      recolour(map);
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
    const trainAt = (x: number, y: number) => {
      let best: (typeof framePositions.current)[number] | null = null;
      let bestD = 11;
      for (const p of framePositions.current) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          best = p;
          bestD = d;
        }
      }
      return best;
    };
    let lastHoverStation: string | null = null;
    map.on('mousemove', (e) => {
      const t = trainAt(e.point.x, e.point.y);
      const station = t ? null : stationAt(e.point);
      setHover(t ? { sighting: t.t.sighting, secondsToNext: t.t.secondsToNext, x: e.point.x, y: e.point.y } : null);
      if (station !== lastHoverStation) {
        lastHoverStation = station;
        propsRef.current.onHoverStation(station);
      }
      map.getCanvas().style.cursor = t || station ? 'pointer' : '';
    });
    map.on('mouseout', () => {
      setHover(null);
      if (lastHoverStation) propsRef.current.onHoverStation((lastHoverStation = null));
    });
    map.on('click', (e) => {
      const t = trainAt(e.point.x, e.point.y);
      const id = t ? t.t.sighting.toStationId : stationAt(e.point);
      if (t) setHover({ sighting: t.t.sighting, secondsToNext: t.t.secondsToNext, x: e.point.x, y: e.point.y });
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
          properties: { lineId: l.id, colour: l.colour, casing: l.id === 'northern' ? '#7D8898' : '#070A10' },
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
    const dimLine = focusLineId ? ['case', ['==', ['get', 'lineId'], focusLineId], 1, 0.16] : 1;
    const dimStation = focusLineId ? ['case', ['in', ['get', 'id'], ['literal', focusIds]], 1, 0.25] : 1;
    map.setPaintProperty('tube-line', 'line-opacity', dimLine as never);
    map.setPaintProperty('tube-casing', 'line-opacity', dimLine as never);
    for (const l of ['tube-station', 'tube-interchange-outer', 'tube-interchange-inner']) {
      map.setPaintProperty(l, 'circle-opacity', dimStation as never);
      map.setPaintProperty(l, 'circle-stroke-opacity', dimStation as never);
    }
  }, [network, visibleLines, focusLineId, styleVersion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    map.setFilter('tube-station-hover', ['in', ['get', 'id'], ['literal', [hoveredStationId, selectedStationId].filter(Boolean)]] as never);
  }, [hoveredStationId, selectedStationId, styleVersion]);

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

  // Dynamic layer: trains on a canvas overlay, redrawn every frame (no network calls here).
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const map = mapRef.current;
      if (!map) return;
      const { visibleLines: vis, focusLineId: focus } = propsRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const zoom = map.getZoom();
      const len = zoom < 11 ? 9 : zoom < 13 ? 13 : 17;
      const w = zoom < 11 ? 5 : zoom < 13 ? 6.5 : 8;
      const out: typeof framePositions.current = [];
      const trains = animator.frame((s) => vis.has(s.lineId));
      for (const t of trains) {
        const p = map.project(t.pos as [number, number]);
        if (p.x < -20 || p.y < -20 || p.x > wrap.clientWidth + 20 || p.y > wrap.clientHeight + 20) continue;
        const angle = Math.atan2(-t.heading[1] * 1.6, t.heading[0]);
        const dim = focus && t.sighting.lineId !== focus;
        const id = t.sighting.lineId;
        drawCapsule(ctx, p.x, p.y, angle, len, w, trainFill(id), id === 'northern' ? '#D9E1EC' : 'rgba(237,245,255,0.55)', dim ? 0.18 : 1);
        if (!dim) out.push({ t, x: p.x, y: p.y });
      }
      framePositions.current = out;
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animator]);

  const hoverLine = hover ? onDark(hover.sighting.lineId) : null;

  return (
    <div ref={wrapRef} className="tmap-geo">
      <div ref={mapEl} className="tmap-geo__map" aria-label="Mapa Londynu z liniami metra. Wybierz stację z listy lub wyszukiwarki, aby zobaczyć odjazdy." role="region" />
      <canvas ref={canvasRef} className="tmap-geo__trains" aria-hidden="true" />
      {hover && hoverLine && <TrainTooltip hover={hover} network={network} />}
      {basemapNote && <p className="tmap-note">{basemapNote}</p>}
    </div>
  );
}
