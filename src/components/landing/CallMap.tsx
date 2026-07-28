'use client';

import { useEffect, useRef } from 'react';

/**
 * Live-call map for the "Command center" section.
 *
 * A flat dot-matrix continent bitmap is composited onto a transparent canvas,
 * and every light effect — nodes, arcs, travelling pulses, ping rings — is
 * drawn per frame on top. Drawing the motion rather than baking it into a video
 * keeps it crisp at any DPI, weighs a few KB, and composites straight onto the
 * page background, so there is no video rectangle to blend away.
 *
 * Node positions are approximate map fractions that get SNAPPED to the nearest
 * land pixel sampled from the bitmap itself. That way a node can never end up
 * in the ocean, even if the artwork is regenerated with a different framing.
 */

const MAP_SRC = '/assets/landing/world-dots.png';
const SRC_RATIO = 1584 / 672;

type Node = { x: number; y: number; hub?: boolean };

const NODES: Node[] = [
  { x: 0.11, y: 0.30 },
  { x: 0.19, y: 0.27, hub: true },
  { x: 0.30, y: 0.24 },
  { x: 0.22, y: 0.42 },
  { x: 0.33, y: 0.70 },
  { x: 0.46, y: 0.26 },
  { x: 0.50, y: 0.19, hub: true },
  { x: 0.55, y: 0.24 },
  { x: 0.58, y: 0.36 },
  { x: 0.63, y: 0.44 },
  { x: 0.69, y: 0.44 },
  { x: 0.78, y: 0.52 },
  { x: 0.85, y: 0.28 },
  { x: 0.86, y: 0.78, hub: true },
  { x: 0.50, y: 0.62 },
];

const LINKS: [number, number][] = [
  [1, 6], [2, 6], [0, 1], [1, 2], [6, 7], [7, 8], [8, 9], [9, 10],
  [10, 11], [11, 13], [12, 13], [1, 4], [4, 5], [5, 14], [3, 1], [6, 12],
];

const ACCENT = '143,187,255';
const ACCENT_DEEP = '45,106,255';

/** Downsampled land mask so nodes can be snapped onto actual continents. */
const GRID_W = 264;
const GRID_H = 112;

export function CallMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let visible = true;
    let disposed = false;
    let land: Uint8Array | null = null;
    let snapped: Node[] = NODES;
    let mapImg: HTMLImageElement | null = null;

    /* ---- load bitmap, build land mask, snap nodes ---- */
    const img = new Image();
    img.decoding = 'async';
    img.src = MAP_SRC;
    img.onload = () => {
      if (disposed) return;
      mapImg = img;

      const off = document.createElement('canvas');
      off.width = GRID_W;
      off.height = GRID_H;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, GRID_W, GRID_H);
      const { data } = octx.getImageData(0, 0, GRID_W, GRID_H);

      const mask = new Uint8Array(GRID_W * GRID_H);
      for (let i = 0; i < GRID_W * GRID_H; i++) {
        // Continents are mid-grey dots on a black ocean.
        mask[i] = data[i * 4] > 40 ? 1 : 0;
      }
      land = mask;

      snapped = NODES.map((n) => {
        const gx = Math.round(n.x * (GRID_W - 1));
        const gy = Math.round(n.y * (GRID_H - 1));
        if (mask[gy * GRID_W + gx]) return n;
        // spiral outwards for the closest land cell
        for (let r = 1; r < 26; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
              const x = gx + dx;
              const y = gy + dy;
              if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
              if (mask[y * GRID_W + x]) {
                return { ...n, x: x / (GRID_W - 1), y: y / (GRID_H - 1) };
              }
            }
          }
        }
        return n;
      });
    };

    /* ---- sizing ---- */
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '160px' });
    io.observe(wrap);

    /* ---- cover-fit geometry, shared by bitmap and overlay ---- */
    const cover = () => {
      const boxRatio = w / h;
      let dw = w;
      let dh = h;
      if (boxRatio > SRC_RATIO) dh = w / SRC_RATIO;
      else dw = h * SRC_RATIO;
      return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh };
    };

    const arcCtrl = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      return {
        cx: (a.x + b.x) / 2 - dy * 0.16,
        cy: (a.y + b.y) / 2 + dx * 0.16 - len * 0.12,
      };
    };

    const pointOn = (
      a: { x: number; y: number },
      c: { cx: number; cy: number },
      b: { x: number; y: number },
      t: number
    ) => {
      const u = 1 - t;
      return {
        x: u * u * a.x + 2 * u * t * c.cx + t * t * b.x,
        y: u * u * a.y + 2 * u * t * c.cy + t * t * b.y,
      };
    };

    const start = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const t = (now - start) / 1000;
      const { dx, dy, dw, dh } = cover();

      ctx.clearRect(0, 0, w, h);

      if (mapImg) {
        // Kept deliberately faint: the continents are texture, the animated
        // nodes and pulses are the subject.
        ctx.globalAlpha = 0.3;
        ctx.drawImage(mapImg, dx, dy, dw, dh);
        ctx.globalAlpha = 1;
      }
      if (!land) return;

      const pts = snapped.map((n) => ({ x: dx + n.x * dw, y: dy + n.y * dh }));

      ctx.lineCap = 'round';
      LINKS.forEach(([i, j], k) => {
        const a = pts[i];
        const b = pts[j];
        if (!a || !b) return;
        const c = arcCtrl(a, b);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.cx, c.cy, b.x, b.y);
        ctx.strokeStyle = `rgba(${ACCENT_DEEP},0.42)`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        if (reduced) return;

        const period = 3.4 + (k % 5) * 0.75;
        const phase = ((t + k * 1.31) % period) / period;
        if (phase > 0.82) return;
        const tt = phase / 0.82;
        const head = pointOn(a, c, b, tt);
        const tail = pointOn(a, c, b, Math.max(0, tt - 0.18));

        const g = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        g.addColorStop(0, `rgba(${ACCENT},0)`);
        g.addColorStop(1, `rgba(${ACCENT},0.9)`);
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(head.x, head.y);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(head.x, head.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(225,238,255,0.95)';
        ctx.fill();
      });

      pts.forEach((p, i) => {
        const n = snapped[i];
        const base = n.hub ? 3.8 : 2.6;
        const breathe = reduced ? 1 : 0.72 + 0.28 * Math.sin(t * 1.5 + i);

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, base * 8);
        glow.addColorStop(0, `rgba(${ACCENT},${0.55 * breathe})`);
        glow.addColorStop(1, `rgba(${ACCENT_DEEP},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, base * 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, base, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(238,246,255,${0.8 * breathe + 0.2})`;
        ctx.fill();

        if (!reduced && n.hub) {
          const period = 3;
          for (let r = 0; r < 2; r++) {
            const ph = ((t + i * 0.9 + r * 1.5) % period) / period;
            ctx.beginPath();
            ctx.arc(p.x, p.y, base + ph * 38, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${ACCENT},${0.3 * (1 - ph)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
    };

    raf = requestAnimationFrame(draw);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        // Feathers every edge so the layer dissolves into the page rather than
        // ending on a visible rectangle.
        maskImage: 'radial-gradient(105% 135% at 78% 50%, #000 18%, rgba(0,0,0,0.45) 52%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(105% 135% at 78% 50%, #000 18%, rgba(0,0,0,0.45) 52%, transparent 80%)',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
