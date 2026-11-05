import { useEffect, useRef, useState, type ReactNode } from 'react';
import maplibregl, { type GeoJSONSource, type Map as MlMap, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { lineColour } from '@/data/tube-colors';
import { MAP_KIND_COLOUR, type MapItem } from '@/lib/location/mapItems';
import type { NearbyStation } from '@/lib/location/types';
import { TILE_ATTRIBUTION } from './MiniMap';
import './listing-map.css';

const STYLE_URL = import.meta.env.VITE_LIGHT_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/positron';
const RASTER = (import.meta.env.VITE_RASTER_TILES || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png').replace('{r}', '').replace('{s}', 'a');
const LONDON: [number, number] = [-0.1276, 51.5072];
const BOUNDS: [[number, number], [number, number]] = [
  [-0.95, 51.2],
  [0.7, 51.8],
];

const OSM_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: { type: 'raster', tiles: [RASTER], tileSize: 256, attribution: '© OpenStreetMap contributors' },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: { raster: { type: 'raster', tiles: ['a', 'b', 'c'].map((s) => RASTER.replace('{s}', s)), tileSize: 256, attribution: TILE_ATTRIBUTION } },
  layers: [{ id: 'raster', type: 'raster', source: 'raster' }],
};

const KIND_COLOUR = ['match', ['get', 'kind'], ...Object.entries(MAP_KIND_COLOUR).flat(), '#475467'];
const EMPTY = { type: 'FeatureCollection' as const, features: [] };

export interface ListingMapProps {
  items: MapItem[];
  hoveredId?: string | null;
  selectedId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string | null) => void;
  /** Initial camera; otherwise fits all items */
  center?: { lat: number; lng: number; zoom?: number } | null;
  /** Re-fit when the item set changes (filters) */
  fitOnChange?: boolean;
  /** Searched point – drawn as a blue dot */
  searchPoint?: { lat: number; lng: number; label: string } | null;
  /** Radius ring around `searchPoint`, metres */
  radiusM?: number | null;
  stations?: NearbyStation[];
  /** Mini card for the selected pin */
  preview?: ReactNode;
  ariaLabel: string;
  className?: string;
  cluster?: boolean;
  /** Street map like the public London view, instead of the pale listing style. */
  basemap?: 'light' | 'osm';
  /** Navy count bubbles, as on the homepage overview. */
  clusterTone?: 'light' | 'navy';
  /** Cap street-level zoom on public overviews. */
  maxZoom?: number;
}

function toFeatures(items: MapItem[]) {
  return {
    type: 'FeatureCollection' as const,
    features: items.map((i) => ({
      type: 'Feature' as const,
      properties: { id: i.id, kind: i.kind, precision: i.geo.precision === 'exact' && !i.geo.hideExact ? 'exact' : 'area', title: i.title },
      geometry: { type: 'Point' as const, coordinates: [i.geo.lng, i.geo.lat] },
    })),
  };
}

function circlePolygon(lat: number, lng: number, radiusM: number, steps = 64) {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([lng + (radiusM * Math.sin(a)) / (111320 * Math.cos((lat * Math.PI) / 180)), lat + (radiusM * Math.cos(a)) / 111320]);
  }
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [coords] } };
}

function addLayers(map: MlMap, cluster: boolean, navyClusters: boolean) {
  map.addSource('items', { type: 'geojson', data: EMPTY, cluster, clusterRadius: 46, clusterMaxZoom: 14 });
  map.addSource('focus', { type: 'geojson', data: EMPTY });
  map.addSource('ring', { type: 'geojson', data: EMPTY });
  map.addSource('search', { type: 'geojson', data: EMPTY });
  map.addSource('stations', { type: 'geojson', data: EMPTY });

  map.addLayer({ id: 'ring-fill', type: 'fill', source: 'ring', paint: { 'fill-color': '#2563EB', 'fill-opacity': 0.06 } });
  map.addLayer({ id: 'ring-line', type: 'line', source: 'ring', paint: { 'line-color': '#2563EB', 'line-opacity': 0.5, 'line-width': 1.5, 'line-dasharray': [2, 2] } });

  map.addLayer({
    id: 'stations',
    type: 'circle',
    source: 'stations',
    paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': ['get', 'colour'], 'circle-stroke-width': 3 },
  });
  map.addLayer({
    id: 'station-labels',
    type: 'symbol',
    source: 'stations',
    layout: { 'text-field': ['get', 'label'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true },
    paint: { 'text-color': '#344054', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });

  const unclustered = ['!', ['has', 'point_count']];
  map.addLayer({
    id: 'areas',
    type: 'circle',
    source: 'items',
    minzoom: 10.5,
    filter: ['all', unclustered, ['==', ['get', 'precision'], 'area']] as never,
    paint: {
      /* ≈ 600 m on the ground at London's latitude. */
      'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10.5, 9, 16, 403] as never,
      'circle-color': KIND_COLOUR as never,
      'circle-opacity': 0.1,
      'circle-stroke-color': KIND_COLOUR as never,
      'circle-stroke-opacity': 0.4,
      'circle-stroke-width': 1,
    },
  });
  if (cluster) {
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'items',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': navyClusters ? '#0E2747' : '#fff',
        'circle-stroke-color': navyClusters ? '#ffffff' : '#0E2747',
        'circle-stroke-width': 2,
        'circle-radius': ['step', ['get', 'point_count'], navyClusters ? 16 : 15, 8, navyClusters ? 20 : 18, 20, navyClusters ? 24 : 22] as never,
      },
    });
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'items',
      filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': navyClusters ? 13 : 12, 'text-allow-overlap': true },
      paint: { 'text-color': navyClusters ? '#ffffff' : '#0E2747' },
    });
  }
  map.addLayer({
    id: 'pins',
    type: 'circle',
    source: 'items',
    filter: unclustered as never,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 5, 14, 7.5] as never,
      'circle-color': ['case', ['==', ['get', 'precision'], 'area'], '#fff', KIND_COLOUR] as never,
      'circle-stroke-color': ['case', ['==', ['get', 'precision'], 'area'], KIND_COLOUR, '#fff'] as never,
      'circle-stroke-width': ['case', ['==', ['get', 'precision'], 'area'], 3, 2] as never,
    },
  });
  map.addLayer({
    id: 'focus',
    type: 'circle',
    source: 'focus',
    paint: {
      'circle-radius': ['case', ['get', 'selected'], 11, 10] as never,
      'circle-color': KIND_COLOUR as never,
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 3,
    },
  });
  map.addLayer({
    id: 'search',
    type: 'circle',
    source: 'search',
    paint: { 'circle-radius': 7, 'circle-color': '#2563EB', 'circle-stroke-color': '#fff', 'circle-stroke-width': 3 },
  });
}

export default function ListingMap(props: ListingMapProps) {
  const { items, hoveredId = null, selectedId = null, center, fitOnChange = true, searchPoint, radiusM, stations, preview, ariaLabel, className = '' } = props;
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [ready, setReady] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!el.current) return;
    const start = propsRef.current.center;
    const map = new maplibregl.Map({
      container: el.current,
      style: propsRef.current.basemap === 'osm' ? OSM_STYLE : STYLE_URL,
      center: start ? [start.lng, start.lat] : LONDON,
      zoom: start?.zoom ?? 10,
      minZoom: 8.5,
      maxZoom: propsRef.current.maxZoom ?? 18,
      maxBounds: BOUNDS,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      cooperativeGestures: false,
      attributionControl: { compact: true },
      fadeDuration: reduced ? 0 : 200,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    let fellBack = false;
    const timer = window.setTimeout(() => {
      if (fellBack || map.isStyleLoaded()) return;
      fellBack = true;
      setNote('Wektorowy podkład mapy jest niedostępny – używamy prostszej mapy.');
      map.setStyle(FALLBACK_STYLE);
    }, 9000);
    map.on('style.load', () => {
      window.clearTimeout(timer);
      addLayers(map, propsRef.current.cluster ?? true, propsRef.current.clusterTone === 'navy');
      setReady((v) => v + 1);
    });

    map.on('mousemove', 'pins', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      map.getCanvas().style.cursor = 'pointer';
      if (id) propsRef.current.onHover?.(id);
    });
    map.on('mouseleave', 'pins', () => {
      map.getCanvas().style.cursor = '';
      propsRef.current.onHover?.(null);
    });
    map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));
    map.on('click', (e) => {
      const layers = ['pins', 'focus', 'clusters'].filter((l) => map.getLayer(l));
      const f = map.queryRenderedFeatures(e.point, { layers })[0];
      if (!f) return propsRef.current.onSelect?.(null);
      if (f.layer.id === 'clusters') {
        const src = map.getSource('items') as GeoJSONSource;
        const cid = f.properties?.cluster_id as number;
        void src.getClusterExpansionZoom(cid).then((zoom) => {
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.2, duration: reduced ? 0 : 300 });
        });
        return;
      }
      const id = f.properties?.id as string | undefined;
      if (id) propsRef.current.onSelect?.(id);
    });

    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; props read through propsRef
  }, []);

  // Items + camera fit.
  const fitted = useRef(false);
  const itemKey = items.map((i) => i.id).join(',');
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource('items') as GeoJSONSource | undefined)?.setData(toFeatures(items));
    if (fitted.current && !fitOnChange) return;
    if (!fitted.current && center) {
      fitted.current = true;
      return;
    }
    fitted.current = true;
    if (!items.length) return;
    const b = new maplibregl.LngLatBounds([items[0]!.geo.lng, items[0]!.geo.lat], [items[0]!.geo.lng, items[0]!.geo.lat]);
    for (const i of items) b.extend([i.geo.lng, i.geo.lat]);
    map.fitBounds(b, { padding: 48, maxZoom: items.length === 1 ? 15 : 13.5, duration: reduced ? 0 : 300 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- itemKey tracks the item set
  }, [itemKey, ready]);

  // Hover/selected ghost markers (visible even when the item is inside a cluster).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const ids = [...new Set([hoveredId, selectedId].filter((x): x is string => !!x))];
    const feats = ids
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is MapItem => !!i)
      .map((i) => ({ type: 'Feature' as const, properties: { id: i.id, kind: i.kind, selected: i.id === selectedId }, geometry: { type: 'Point' as const, coordinates: [i.geo.lng, i.geo.lat] } }));
    (map.getSource('focus') as GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features: feats });
  }, [hoveredId, selectedId, items, ready]);

  // Selected: pulse once + bring into view.
  useEffect(() => {
    const map = mapRef.current;
    const item = selectedId ? items.find((i) => i.id === selectedId) : null;
    if (!map || !ready || !item) return;
    const dot = document.createElement('div');
    dot.className = 'lmap-pulse';
    dot.style.setProperty('--pin', MAP_KIND_COLOUR[item.kind]);
    dot.setAttribute('aria-hidden', 'true');
    const marker = new maplibregl.Marker({ element: dot }).setLngLat([item.geo.lng, item.geo.lat]).addTo(map);
    const p = map.project([item.geo.lng, item.geo.lat]);
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    if (p.x < 40 || p.y < 40 || p.x > w - 40 || p.y > h - 140) map.easeTo({ center: [item.geo.lng, item.geo.lat], duration: reduced ? 0 : 300 });
    return () => void marker.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on selection change
  }, [selectedId, ready]);

  // Search point + radius.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource('search') as GeoJSONSource | undefined)?.setData(
      searchPoint ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [searchPoint.lng, searchPoint.lat] } }] } : EMPTY,
    );
    (map.getSource('ring') as GeoJSONSource | undefined)?.setData(
      searchPoint && radiusM ? { type: 'FeatureCollection', features: [circlePolygon(searchPoint.lat, searchPoint.lng, radiusM)] } : EMPTY,
    );
    if (searchPoint) {
      const zoom = radiusM ? (radiusM <= 800 ? 14.5 : radiusM <= 1600 ? 13.5 : 12.5) : 14;
      map.easeTo({ center: [searchPoint.lng, searchPoint.lat], zoom, duration: reduced ? 0 : 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on coordinates
  }, [searchPoint?.lat, searchPoint?.lng, radiusM, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource('stations') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection',
      features: (stations ?? []).map((s) => ({
        type: 'Feature' as const,
        properties: { label: `${s.name} · ${s.walkMin} min`, colour: lineColour(s.lines[0] ?? '') },
        geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
      })),
    });
  }, [stations, ready]);

  return (
    <div className={`lmap ${className}`}>
      <div ref={el} className="lmap__canvas" role="region" aria-label={ariaLabel} />
      {note && <p className="lmap__note">{note}</p>}
      {preview && <div className="lmap__preview">{preview}</div>}
    </div>
  );
}
