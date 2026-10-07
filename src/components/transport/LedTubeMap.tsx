import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { tubeLineColours, isTubeLineId } from '@/data/tube-colors';
import { alongPolyline, buildLedLayout, type Pt } from './ledLayout';
import { TrainTooltip, type HoverTrain, type TubeMapProps } from './mapShared';
import { TrainAnimator, type AnimatedTrain } from './trainAnimator';

interface View {
  s: number;
  tx: number;
  ty: number;
}

const MIN_SCALE = 2.5;
const MAX_SCALE = 60;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const ledColour = (id: string) => (isTubeLineId(id) ? tubeLineColours[id] : { colour: '#EDF5FF', glow: '#EDF5FF', name: id, ink: '#000' });

/**
 * "Mapa LED": a schematic board drawn on canvas. Static geometry is rebuilt only when the network
 * changes; each frame redraws strokes (cheap) plus the animated chase and estimated train positions.
 */
export default function LedTubeMap(props: TubeMapProps) {
  const { network, sightings, reducedMotion, focusRequest } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useRef<View>({ s: 8, tx: 0, ty: 0 });
  const viewAnim = useRef<{ from: View; to: View; start: number } | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const framePositions = useRef<{ t: AnimatedTrain; x: number; y: number }[]>([]);
  const [hover, setHover] = useState<HoverTrain | null>(null);

  const layout = useMemo(() => buildLedLayout(network), [network]);
  const paths = useMemo(() => {
    const m = new Map<string, Path2D>();
    for (const [id, runs] of layout.lines) {
      const p = new Path2D();
      for (const run of runs) run.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      m.set(id, p);
    }
    const thames = new Path2D();
    for (const run of layout.thames) run.forEach(([x, y], i) => (i ? thames.lineTo(x, y) : thames.moveTo(x, y)));
    return { lines: m, thames };
  }, [layout]);

  const animator = useMemo(
    () =>
      new TrainAnimator(
        (id) => layout.stations.get(id) ?? null,
        (s, fromId, p) => {
          const edge = layout.edges.get(`${s.lineId}:${fromId}>${s.toStationId}`);
          return edge ? alongPolyline(edge, p) : null;
        },
      ),
    [layout],
  );
  useEffect(() => {
    if (sightings) animator.update(sightings, reducedMotion);
  }, [animator, sightings, reducedMotion]);

  const fitView = (bounds = layout.bounds, pad = 24): View => {
    const { w, h } = size.current;
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    const s = clamp(Math.min((w - pad * 2) / bw, (h - pad * 2) / bh), MIN_SCALE, MAX_SCALE);
    return { s, tx: (w - bw * s) / 2 - bounds.minX * s, ty: (h - bh * s) / 2 - bounds.minY * s };
  };

  const animateTo = (to: View) => {
    if (propsRef.current.reducedMotion) {
      view.current = to;
      viewAnim.current = null;
    } else viewAnim.current = { from: { ...view.current }, to, start: performance.now() };
  };

  // Camera requests from search / line isolation.
  useEffect(() => {
    if (!focusRequest || !size.current.w) return;
    if (focusRequest.kind === 'all') return animateTo(fitView());
    const ids =
      focusRequest.kind === 'line'
        ? Object.values(network.stations)
            .filter((s) => s.lines.includes(focusRequest.id))
            .map((s) => s.id)
        : [focusRequest.id];
    const pts = ids.map((id) => layout.stations.get(id)).filter((p): p is Pt => !!p);
    if (!pts.length) return;
    if (focusRequest.kind === 'station') {
      const [x, y] = pts[0]!;
      const s = Math.max(view.current.s, 18);
      animateTo({ s, tx: size.current.w / 2 - x * s, ty: size.current.h / 2 - y * s });
    } else {
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      animateTo(fitView({ minX: Math.min(...xs) - 3, minY: Math.min(...ys) - 3, maxX: Math.max(...xs) + 3, maxY: Math.max(...ys) + 3 }, 30));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new requests
  }, [focusRequest, layout]);

  // Render loop + input.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let dpr = 1;
    let raf = 0;
    let first = true;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = wrap;
      const prev = size.current;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      size.current = { w, h };
      if (first && w) {
        view.current = fitView();
        first = false;
      } else if (prev.w) {
        view.current = { ...view.current, tx: view.current.tx + (w - prev.w) / 2, ty: view.current.ty + (h - prev.h) / 2 };
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const toScreen = (p: Pt): Pt => [p[0] * view.current.s + view.current.tx, p[1] * view.current.s + view.current.ty];

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      const { visibleLines: vis, focusLineId: focus, selectedStationId: sel, hoveredStationId: hov, reducedMotion: rm } = propsRef.current;
      const a = viewAnim.current;
      if (a) {
        const k = clamp((time - a.start) / 420, 0, 1);
        const e = 1 - (1 - k) ** 3;
        view.current = { s: a.from.s + (a.to.s - a.from.s) * e, tx: a.from.tx + (a.to.tx - a.from.tx) * e, ty: a.from.ty + (a.to.ty - a.from.ty) * e };
        if (k >= 1) viewAnim.current = null;
      }
      const { s, tx, ty } = view.current;
      const { w, h } = size.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const k = clamp(s / 9, 0.75, 1.7);

      // Layout-space strokes
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * tx, dpr * ty);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const b = layout.bounds;
      ctx.save();
      ctx.beginPath();
      ctx.rect(b.minX, b.minY, b.maxX - b.minX, b.maxY - b.minY);
      ctx.clip();
      ctx.strokeStyle = '#0C2540';
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = Math.max(6, 0.9 * s) / s;
      ctx.stroke(paths.thames);
      ctx.strokeStyle = '#123A5E';
      ctx.lineWidth = Math.max(2.5, 0.4 * s) / s;
      ctx.stroke(paths.thames);
      ctx.restore();

      for (const line of network.lines) {
        if (!vis.has(line.id)) continue;
        const path = paths.lines.get(line.id);
        if (!path) continue;
        const c = ledColour(line.id);
        const alpha = focus && focus !== line.id ? 0.1 : 1;
        ctx.globalAlpha = alpha * 0.16;
        ctx.strokeStyle = c.glow;
        ctx.lineWidth = (10 * k) / s;
        ctx.stroke(path);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = line.id === 'northern' ? '#1A1E26' : c.colour;
        ctx.lineWidth = (3.8 * k) / s;
        ctx.stroke(path);
        ctx.globalAlpha = alpha * 0.75;
        ctx.strokeStyle = c.glow;
        ctx.lineWidth = (1.1 * k) / s;
        ctx.stroke(path);
        if (!rm && alpha === 1) {
          ctx.setLineDash([3 / s, 26 / s]);
          ctx.lineDashOffset = -((time * 0.02) % 29) / s;
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = (1.8 * k) / s;
          ctx.stroke(path);
          ctx.setLineDash([]);
        }
      }

      // Screen-space nodes, labels and trains
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const labels: [number, number, number, number][] = [];
      const showAll = s >= 20;
      const showMajor = s >= 7;
      ctx.font = `600 ${Math.round(9 * Math.min(k, 1.25))}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      for (const st of Object.values(network.stations)) {
        if (!st.lines.some((l) => vis.has(l))) continue;
        const lp = layout.stations.get(st.id);
        if (!lp) continue;
        const [x, y] = toScreen(lp);
        if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;
        const dim = focus && !st.lines.includes(focus);
        ctx.globalAlpha = dim ? 0.18 : 1;
        if (st.interchange) {
          ctx.fillStyle = '#070A10';
          ctx.strokeStyle = '#EDF5FF';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(x, y, 5.4 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(x, y, 2.5 * k, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#EDF5FF';
          ctx.beginPath();
          ctx.arc(x, y, 2.3 * k, 0, Math.PI * 2);
          ctx.fill();
        }
        const highlighted = st.id === sel || st.id === hov;
        if (highlighted) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#EDF5FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 9 * k, 0, Math.PI * 2);
          ctx.stroke();
          if (st.id === sel && !rm) {
            const phase = (time % 1600) / 1600;
            ctx.globalAlpha = 1 - phase;
            ctx.beginPath();
            ctx.arc(x, y, 9 * k + phase * 16, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        if (!dim && (highlighted || showAll || (showMajor && st.interchange))) {
          const text = st.name.toUpperCase();
          const tw = ctx.measureText(text).width;
          const lx = x + 8 * k;
          const ly = y - 5 * k;
          const box: [number, number, number, number] = [lx - 2, ly - 10, lx + tw + 2, ly + 3];
          if (highlighted || !labels.some((b) => b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1])) {
            labels.push(box);
            ctx.globalAlpha = highlighted ? 1 : 0.72;
            ctx.fillStyle = '#EDF5FF';
            ctx.fillText(text, lx, ly);
          }
        }
      }

      const out: typeof framePositions.current = [];
      const trains = animator.frame((t) => vis.has(t.lineId));
      for (const t of trains) {
        const [x, y] = toScreen(t.pos);
        if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue;
        const dim = focus && t.sighting.lineId !== focus;
        const c = ledColour(t.sighting.lineId);
        const angle = Math.atan2(t.heading[1], t.heading[0]);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.globalAlpha = dim ? 0.08 : 0.22;
        ctx.fillStyle = c.glow;
        ctx.beginPath();
        ctx.roundRect(-8 * k, -4.5 * k, 16 * k, 9 * k, 4.5 * k);
        ctx.fill();
        ctx.globalAlpha = dim ? 0.18 : 1;
        ctx.beginPath();
        ctx.roundRect(-5.5 * k, -2.2 * k, 11 * k, 4.4 * k, 2.2 * k);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = dim ? 0.15 : 0.85;
        ctx.fillRect(1.5 * k, -0.9 * k, 3 * k, 1.8 * k);
        ctx.restore();
        if (!dim) out.push({ t, x, y });
      }
      framePositions.current = out;
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);

    // --- input -------------------------------------------------------------
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = 0;
    let pinch: { d: number; mx: number; my: number } | null = null;
    const local = (e: PointerEvent | WheelEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const zoomAt = (x: number, y: number, factor: number) => {
      viewAnim.current = null;
      const v = view.current;
      const s = clamp(v.s * factor, MIN_SCALE, MAX_SCALE);
      const f = s / v.s;
      view.current = { s, tx: x - (x - v.tx) * f, ty: y - (y - v.ty) * f };
    };
    const hit = (x: number, y: number) => {
      let train: (typeof framePositions.current)[number] | null = null;
      let td = 12;
      for (const p of framePositions.current) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < td) {
          train = p;
          td = d;
        }
      }
      if (train) return { train, station: null };
      let station: string | null = null;
      let sd = 14;
      const { visibleLines: vis } = propsRef.current;
      for (const st of Object.values(network.stations)) {
        if (!st.lines.some((l) => vis.has(l))) continue;
        const lp = layout.stations.get(st.id);
        if (!lp) continue;
        const [sx, sy] = toScreen(lp);
        const d = Math.hypot(sx - x, sy - y);
        if (d < sd) {
          station = st.id;
          sd = d;
        }
      }
      return { train: null, station };
    };

    let lastHover: string | null = null;
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, local(e));
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const prev = pointers.get(e.pointerId);
      if (prev) {
        pointers.set(e.pointerId, p);
        if (pointers.size === 1) {
          moved += Math.hypot(p.x - prev.x, p.y - prev.y);
          viewAnim.current = null;
          view.current = { ...view.current, tx: view.current.tx + p.x - prev.x, ty: view.current.ty + p.y - prev.y };
        } else if (pointers.size === 2 && pinch) {
          moved += 10;
          const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          view.current = { ...view.current, tx: view.current.tx + mx - pinch.mx, ty: view.current.ty + my - pinch.my };
          zoomAt(mx, my, d / pinch.d);
          pinch = { d, mx, my };
        }
        return;
      }
      if (e.pointerType !== 'mouse') return;
      const h = hit(p.x, p.y);
      setHover(h.train ? { sighting: h.train.t.sighting, secondsToNext: h.train.t.secondsToNext, x: p.x, y: p.y } : null);
      if (h.station !== lastHover) propsRef.current.onHoverStation((lastHover = h.station));
      canvas.style.cursor = h.train || h.station ? 'pointer' : 'grab';
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (moved < 6 && pointers.size === 0) {
        const h = hit(p.x, p.y);
        if (h.train) {
          setHover({ sighting: h.train.t.sighting, secondsToNext: h.train.t.secondsToNext, x: p.x, y: p.y });
          propsRef.current.onSelectStation(h.train.t.sighting.toStationId);
        } else {
          setHover(null);
          if (h.station) propsRef.current.onSelectStation(h.station);
        }
      }
    };
    const onLeave = () => {
      if (pointers.size) return;
      setHover(null);
      if (lastHover) propsRef.current.onHoverStation((lastHover = null));
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loop reads live props via propsRef
  }, [layout, paths, animator, network]);

  const zoomBy = (f: number) => {
    const { w, h } = size.current;
    const v = view.current;
    const s = clamp(v.s * f, MIN_SCALE, MAX_SCALE);
    animateTo({ s, tx: w / 2 - (w / 2 - v.tx) * (s / v.s), ty: h / 2 - (h / 2 - v.ty) * (s / v.s) });
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 60;
    const v = view.current;
    const pan = (dx: number, dy: number) => animateTo({ ...v, tx: v.tx + dx, ty: v.ty + dy });
    if (e.key === '+' || e.key === '=') zoomBy(1.4);
    else if (e.key === '-') zoomBy(1 / 1.4);
    else if (e.key === '0') animateTo(fitView());
    else if (e.key === 'ArrowLeft') pan(step, 0);
    else if (e.key === 'ArrowRight') pan(-step, 0);
    else if (e.key === 'ArrowUp') pan(0, step);
    else if (e.key === 'ArrowDown') pan(0, -step);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={wrapRef} className="led-board">
      <div className="led-board__backlight" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="led-board__canvas"
        tabIndex={0}
        role="img"
        aria-label="Schematyczna mapa LED metra. Strzałki przesuwają, + i − przybliżają, 0 pokazuje całość. Stacje wybierzesz też z wyszukiwarki i listy linii."
        onKeyDown={onKeyDown}
      />
      <div className="led-board__glass" aria-hidden="true" />
      <div className="led-board__zoom">
        <button type="button" className="tmap-btn" onClick={() => zoomBy(1.4)} aria-label="Przybliż">
          <Plus size={18} aria-hidden="true" />
        </button>
        <button type="button" className="tmap-btn" onClick={() => zoomBy(1 / 1.4)} aria-label="Oddal">
          <Minus size={18} aria-hidden="true" />
        </button>
        <button type="button" className="tmap-btn" onClick={() => animateTo(fitView())} aria-label="Pokaż całą sieć">
          <Maximize2 size={16} aria-hidden="true" />
        </button>
      </div>
      {hover && <TrainTooltip hover={hover} network={network} />}
    </div>
  );
}
