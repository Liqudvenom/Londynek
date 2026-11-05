import { useEffect, useMemo, useRef } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import { tubeLineColours, isTubeLineId } from '@/data/tube-colors';
import { buildLedLayout, type Pt } from './ledLayout';
import { type TubeMapProps } from './mapShared';

interface View {
  s: number;
  tx: number;
  ty: number;
}

const MIN_SCALE = 2.5;
const MAX_SCALE = 60;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const ledColour = (id: string) => (isTubeLineId(id) ? tubeLineColours[id] : { colour: '#667085', glow: '#667085', name: id, ink: '#101828' });

function polyLen(run: Pt[]) {
  let n = 0;
  for (let i = 1; i < run.length; i++) n += Math.hypot(run[i]![0] - run[i - 1]![0], run[i]![1] - run[i - 1]![1]);
  return n;
}

function seed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** CodePen ZeEpgd: easeInOutSine, alternate draw ↔ undraw. */
function dashProgress(now: number, delay: number, dur: number) {
  const t = now - delay;
  if (t < 0) return 0;
  const u = (t % (dur * 2)) / dur;
  const x = u <= 1 ? u : 2 - u;
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

function distToRun(px: number, py: number, run: Pt[]) {
  let best = Infinity;
  for (let i = 1; i < run.length; i++) {
    const ax = run[i - 1]![0];
    const ay = run[i - 1]![1];
    const bx = run[i]![0];
    const by = run[i]![1];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d < best) best = d;
  }
  return best;
}

interface RunPath {
  id: string;
  path: Path2D;
  pts: Pt[];
  len: number;
  delay: number;
  dur: number;
}

/**
 * TfL-style schematic: octilinear lines, official colours, CodePen dash pulse.
 * Geometry is rebuilt only when the network changes.
 */
export default function LedTubeMap(props: TubeMapProps) {
  const { network, focusRequest } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useRef<View>({ s: 8, tx: 0, ty: 0 });
  const viewAnim = useRef<{ from: View; to: View; start: number } | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const hoverLine = useRef<string | null>(null);

  const layout = useMemo(() => buildLedLayout(network), [network]);
  const paths = useMemo(() => {
    const runs: RunPath[] = [];
    for (const [id, lineRuns] of layout.lines) {
      lineRuns.forEach((pts, i) => {
        if (pts.length < 2) return;
        const path = new Path2D();
        pts.forEach(([x, y], j) => (j ? path.lineTo(x, y) : path.moveTo(x, y)));
        const n = seed(`${id}:${i}`);
        runs.push({ id, path, pts, len: Math.max(polyLen(pts), 0.01), delay: n % 2000, dur: 1000 + (n % 2000) });
      });
    }
    const thames = new Path2D();
    for (const run of layout.thames) run.forEach(([x, y], i) => (i ? thames.lineTo(x, y) : thames.moveTo(x, y)));
    return { runs, thames };
  }, [layout]);

  const fitView = (bounds = layout.bounds, pad = 20): View => {
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
      const k = clamp(s / 8.5, 0.85, 1.55);

      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * tx, dpr * ty);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#c8d8e4';
      ctx.lineWidth = 11 / s;
      ctx.stroke(paths.thames);
      ctx.strokeStyle = '#e7eef3';
      ctx.lineWidth = 7 / s;
      ctx.stroke(paths.thames);

      const hoverId = hoverLine.current;
      const casing = 7.4 / s;
      const width = 4.8 / s;
      for (const run of paths.runs) {
        if (!vis.has(run.id)) continue;
        const dim = (focus && focus !== run.id) || (hoverId && hoverId !== run.id);
        const hold = rm || focus === run.id || hoverId === run.id;
        const p = hold ? 1 : dashProgress(time, run.delay, run.dur);
        const colour = ledColour(run.id).colour;
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.globalAlpha = dim ? 0.16 : 0.4;
        ctx.stroke(run.path);
        ctx.setLineDash([run.len * p, run.len]);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = casing;
        ctx.globalAlpha = dim ? 0.28 : 1;
        ctx.stroke(run.path);
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.globalAlpha = dim ? 0.28 : 1;
        ctx.stroke(run.path);
        ctx.setLineDash([]);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const labels: [number, number, number, number][] = [];
      const showAll = s >= 11;
      const showMany = s >= 6.4;
      const fs = Math.round(12 * Math.min(k, 1.18));
      ctx.font = `650 ${fs}px "Gill Sans", "Johnston", "Segoe UI", sans-serif`;
      ctx.textBaseline = 'middle';
      const listed = Object.values(network.stations)
        .filter((st) => st.lines.some((l) => vis.has(l)))
        .sort((a, b) => Number(b.interchange) - Number(a.interchange) || a.name.length - b.name.length);

      for (const st of listed) {
        const lp = layout.stations.get(st.id);
        if (!lp) continue;
        const [x, y] = toScreen(lp);
        if (x < -36 || y < -36 || x > w + 36 || y > h + 36) continue;
        const dim = Boolean(focus && !st.lines.includes(focus));
        ctx.globalAlpha = dim ? 0.28 : 1;
        if (st.interchange) {
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#101828';
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.arc(x, y, 6.1 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 2.15 * k, 0, Math.PI * 2);
          ctx.fillStyle = '#101828';
          ctx.fill();
        } else {
          const c = ledColour(st.lines.find((l) => vis.has(l)) ?? st.lines[0] ?? '');
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = c.colour;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 3.4 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        const highlighted = st.id === sel || st.id === hov;
        if (highlighted) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#101828';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 10 * k, 0, Math.PI * 2);
          ctx.stroke();
          if (st.id === sel && !rm) {
            const phase = (time % 1600) / 1600;
            ctx.globalAlpha = 1 - phase;
            ctx.beginPath();
            ctx.arc(x, y, 10 * k + phase * 14, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        const named = highlighted || st.interchange || showAll || showMany;
        if (!dim && named) {
          const text = st.name;
          const tw = ctx.measureText(text).width;
          const right = lp[0] >= 0;
          const lx = right ? x + 9 * k : x - 9 * k;
          const ly = y - (st.interchange ? 0.5 : 0) * k;
          const pad = 3;
          const box: [number, number, number, number] = right
            ? [lx - pad, ly - fs * 0.55, lx + tw + pad, ly + fs * 0.55]
            : [lx - tw - pad, ly - fs * 0.55, lx + pad, ly + fs * 0.55];
          if (highlighted || !labels.some((b) => b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1])) {
            labels.push(box);
            ctx.textAlign = right ? 'left' : 'right';
            ctx.globalAlpha = highlighted ? 1 : 0.96;
            ctx.lineJoin = 'round';
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fbfcfe';
            ctx.strokeText(text, lx, ly);
            ctx.fillStyle = '#101828';
            ctx.fillText(text, lx, ly);
          }
        }
      }
      ctx.textAlign = 'left';
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
      let station: string | null = null;
      let sd = 12;
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
      if (station) return { station, line: null };
      const lx = (x - view.current.tx) / view.current.s;
      const ly = (y - view.current.ty) / view.current.s;
      const max = 10 / view.current.s;
      let line: string | null = null;
      let ld = max;
      for (const run of paths.runs) {
        if (!vis.has(run.id)) continue;
        const d = distToRun(lx, ly, run.pts);
        if (d < ld) {
          line = run.id;
          ld = d;
        }
      }
      return { station: null, line };
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
      if (h.station !== lastHover) propsRef.current.onHoverStation((lastHover = h.station));
      hoverLine.current = h.line;
      canvas.style.cursor = h.station || h.line ? 'pointer' : 'grab';
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (moved < 6 && pointers.size === 0) {
        const h = hit(p.x, p.y);
        if (h.station) {
          propsRef.current.onSelectStation(h.station);
        } else if (h.line) {
          const current = propsRef.current.focusLineId;
          propsRef.current.onFocusLine?.(current === h.line ? null : h.line);
        }
      }
    };
    const onLeave = () => {
      if (pointers.size) return;
      hoverLine.current = null;
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
  }, [layout, paths, network]);

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
    <div ref={wrapRef} className="led-board led-board--schematic">
      <div className="led-board__backlight" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="led-board__canvas"
        tabIndex={0}
        role="img"
        aria-label="Schemat metra jak w wagonie. Strzałki przesuwają, + i − przybliżają, 0 pokazuje całość. Stację wybierzesz kliknięciem."
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
    </div>
  );
}
