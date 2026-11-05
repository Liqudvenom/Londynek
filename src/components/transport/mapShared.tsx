import { tubeLineColours, isTubeLineId } from '@/data/tube-colors';
import { formatSeconds } from '@/lib/tfl/format';
import type { NetworkIndex } from '@/lib/tfl/network';
import type { Journey, TrainSighting, TubeNetwork } from '@/lib/tfl/types';

export interface FocusRequest {
  kind: 'line' | 'station' | 'all';
  id: string;
  nonce: number;
}

export interface TubeMapProps {
  network: TubeNetwork;
  index: NetworkIndex;
  visibleLines: ReadonlySet<string>;
  focusLineId: string | null;
  selectedStationId: string | null;
  hoveredStationId: string | null;
  onSelectStation: (id: string) => void;
  onHoverStation: (id: string | null) => void;
  onFocusLine?: (id: string | null) => void;
  sightings: TrainSighting[] | null;
  reducedMotion: boolean;
  focusRequest: FocusRequest | null;
  /** Selected TfL journey – highlighted on the geographic map only. */
  journey?: Journey | null;
}

/** Display colour of a line on dark backgrounds – Northern's black needs a light outline. */
export const onDark = (lineId: string) => (isTubeLineId(lineId) ? tubeLineColours[lineId] : null);

export function trainFill(lineId: string) {
  const c = onDark(lineId);
  if (!c) return '#EDF5FF';
  return lineId === 'northern' ? '#0B0B0B' : c.colour;
}

export interface HoverTrain {
  sighting: TrainSighting;
  secondsToNext: number;
  x: number;
  y: number;
}

export function TrainTooltip({ hover, network }: { hover: HoverTrain; network: TubeNetwork }) {
  const s = hover.sighting;
  const line = onDark(s.lineId);
  const next = network.stations[s.toStationId]?.name ?? s.nextStops[0]?.name ?? '—';
  return (
    <div className="train-tip" style={{ transform: `translate(${Math.round(hover.x)}px, ${Math.round(hover.y)}px)` }} role="status">
      <p className="train-tip__line">
        <span className="train-tip__swatch" style={{ background: line?.colour }} aria-hidden="true" />
        {line?.name ?? s.lineId} line
      </p>
      <dl>
        <div>
          <dt>Kierunek</dt>
          <dd>{s.towards}</dd>
        </div>
        <div>
          <dt>{s.atStation ? 'Na stacji' : 'Następna stacja'}</dt>
          <dd>
            {next} <span className="train-tip__eta">{s.atStation ? '' : formatSeconds(hover.secondsToNext)}</span>
          </dd>
        </div>
        {s.currentLocation && (
          <div>
            <dt>TfL</dt>
            <dd>{s.currentLocation}</dd>
          </div>
        )}
      </dl>
      <p className="train-tip__note">Pozycja na mapie jest wizualnym oszacowaniem na podstawie danych TfL.</p>
    </div>
  );
}

export function pointAlong(pts: readonly [number, number][], t: number): [number, number] | null {
  if (pts.length < 2) return pts[0] ?? null;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  if (total <= 0) return pts[0]!;
  let d = (((t % 1) + 1) % 1) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, d / seg) : 0;
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    d -= seg;
  }
  return pts[pts.length - 1]!;
}

export function pulsePhase(now: number, delay: number) {
  return 0.5 + 0.5 * Math.sin((now + delay) / 320);
}

/** Soft circle that grows and fades – one per Tube line instead of a swarm of train capsules. */
export function drawPulse(ctx: CanvasRenderingContext2D, x: number, y: number, colour: string, radius: number, phase: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha * (1 - phase) * 0.42;
  ctx.strokeStyle = colour;
  ctx.lineWidth = Math.max(1.4, radius * 0.28);
  ctx.beginPath();
  ctx.arc(x, y, radius + phase * radius * 2.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.82 + 0.18 * (1 - phase)), 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = alpha * 0.92;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws a capsule-shaped train marker centred at (x, y) along `angle` (radians). */
export function drawCapsule(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, len: number, w: number, fill: string, ring: string, alpha: number, glow = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  if (glow) {
    ctx.shadowColor = fill === '#0B0B0B' ? '#E9EEF5' : fill;
    ctx.shadowBlur = glow;
  }
  ctx.beginPath();
  ctx.roundRect(-len / 2, -w / 2, len, w, w / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = ring;
  ctx.stroke();
  ctx.restore();
}
