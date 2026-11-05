import { Link } from 'react-router-dom';
import { ExternalLink, Maximize2 } from 'lucide-react';
import { googleMapsUrl, mapUrl } from '@/lib/location/mapItems';
import type { GeoLocation } from '@/lib/location/types';
import './location.css';

const TILE = 256;
const TILE_URL = import.meta.env.VITE_RASTER_TILES || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = import.meta.env.VITE_RASTER_ATTRIBUTION || '© OpenStreetMap contributors';

const tileUrl = (z: number, x: number, y: number) =>
  TILE_URL.replace('{s}', 'abcd'[(x + y) % 4]!)
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{r}', '');

function project(lat: number, lng: number, z: number) {
  const n = 2 ** z * TILE;
  const s = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}

interface StaticMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  approximate?: boolean;
  colour?: string;
  className?: string;
  /** Extra small markers; replaces the centre pin when given */
  dots?: { id: string; lat: number; lng: number; colour: string }[];
}

/**
 * Static raster map (6 lazy tiles + CSS pin) – cheap enough for every card in a list.
 * No map library is loaded; the full interactive map opens on click.
 */
export function StaticMap({ lat, lng, zoom, approximate = false, colour = 'var(--brand-red)', className = '', dots }: StaticMapProps) {
  const z = zoom ?? (approximate ? 15 : 16);
  const p = project(lat, lng, z);
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  const x0 = tx - 1;
  const y0 = p.y / TILE - ty < 0.5 ? ty - 1 : ty;
  const offX = p.x - x0 * TILE;
  const offY = p.y - y0 * TILE;
  const tiles: { x: number; y: number }[] = [];
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 3; dx++) tiles.push({ x: x0 + dx, y: y0 + dy });
  return (
    <div className={`smap-static ${className}`} aria-hidden="true">
      <div className="smap-static__tiles" style={{ left: `calc(50% - ${offX}px)`, top: `calc(50% - ${offY}px)` }}>
        {tiles.map((t) => (
          <img key={`${t.x}-${t.y}`} src={tileUrl(z, t.x, t.y)} alt="" loading="lazy" decoding="async" width={TILE} height={TILE} draggable={false} style={{ left: (t.x - x0) * TILE, top: (t.y - y0) * TILE }} />
        ))}
      </div>
      {dots ? (
        dots.map((d) => {
          const q = project(d.lat, d.lng, z);
          return <span key={d.id} className="smap-static__dot" style={{ left: `calc(50% + ${(q.x - p.x).toFixed(1)}px)`, top: `calc(50% + ${(q.y - p.y).toFixed(1)}px)`, background: d.colour }} />;
        })
      ) : approximate ? <span className="smap-static__area" style={{ ['--pin' as string]: colour }} /> : <span className="smap-static__pin" style={{ ['--pin' as string]: colour }} />}
    </div>
  );
}

interface MiniMapProps {
  geo: GeoLocation;
  listingId?: string;
  label: string;
  colour?: string;
  className?: string;
}

/** Card preview: static map → /map (with a view transition), plus a secondary Google Maps link. */
export function MiniMap({ geo, listingId, label, colour, className = '' }: MiniMapProps) {
  const approximate = geo.precision === 'area' || !!geo.hideExact;
  return (
    <div className={`minimap above-link ${className}`}>
      <Link
        to={mapUrl(geo, listingId)}
        viewTransition
        className="minimap__link"
        aria-label={`Pokaż na mapie: ${label}`}
        onClick={(e) => (e.currentTarget.style.viewTransitionName = 'londynek-map')}
      >
        <StaticMap lat={geo.lat} lng={geo.lng} approximate={approximate} colour={colour} />
        <span className="minimap__open">
          <Maximize2 size={13} aria-hidden="true" /> Otwórz na mapie
        </span>
        {approximate && <span className="minimap__badge">Okolica</span>}
      </Link>
      <a className="minimap__gmaps" href={googleMapsUrl(geo)} target="_blank" rel="noopener noreferrer">
        Google Maps <ExternalLink size={11} aria-hidden="true" />
        <span className="visually-hidden"> (otwiera się w nowej karcie)</span>
      </a>
      <span className="minimap__attr">{TILE_ATTRIBUTION}</span>
    </div>
  );
}
