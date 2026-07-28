'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated voice-signal streams for the closing CTA.
 *
 * Replaces the static light-trail photograph. Pure canvas on a transparent
 * backdrop, so it composites onto the page background with no rectangle edge —
 * the mask on the wrapper feathers it away toward the copy on the left.
 */

const STREAMS = 9;
const PULSES_PER_STREAM = 3;
const ACCENT = '143,187,255';
const ACCENT_DEEP = '45,106,255';

type Stream = {
  seed: number;
  y0: number;
  y1: number;
  amp: number;
  speed: number;
  width: number;
};

export function SignalFlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const streams: Stream[] = Array.from({ length: STREAMS }, (_, i) => ({
      seed: i * 7.31,
      y0: 0.12 + (i / STREAMS) * 0.8,
      y1: 0.1 + ((i * 0.63) % 1) * 0.85,
      amp: 0.06 + ((i * 0.37) % 1) * 0.13,
      speed: 0.1 + ((i * 0.29) % 1) * 0.16,
      width: i % 3 === 0 ? 1.5 : 1,
    }));

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
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '160px' });
    io.observe(wrap);

    /** Cubic bezier sweeping left→right, control points drifting over time. */
    const geom = (s: Stream, t: number) => {
      const wob = Math.sin(t * s.speed + s.seed);
      const wob2 = Math.cos(t * s.speed * 0.7 + s.seed * 1.4);
      return {
        ax: -0.08 * w,
        ay: s.y0 * h,
        c1x: 0.3 * w,
        c1y: (s.y0 + s.amp * wob) * h,
        c2x: 0.68 * w,
        c2y: (s.y1 - s.amp * wob2) * h,
        bx: 1.08 * w,
        by: s.y1 * h,
      };
    };

    const at = (g: ReturnType<typeof geom>, t: number) => {
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      return {
        x: a * g.ax + b * g.c1x + c * g.c2x + d * g.bx,
        y: a * g.ay + b * g.c1y + c * g.c2y + d * g.by,
      };
    };

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const t = reduced ? 4 : (now - start) / 1000;

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';

      streams.forEach((s, i) => {
        const g = geom(s, t);

        // resting ribbon
        ctx.beginPath();
        ctx.moveTo(g.ax, g.ay);
        ctx.bezierCurveTo(g.c1x, g.c1y, g.c2x, g.c2y, g.bx, g.by);
        ctx.strokeStyle = `rgba(${ACCENT_DEEP},0.2)`;
        ctx.lineWidth = s.width;
        ctx.stroke();

        if (reduced) return;

        // travelling pulses
        for (let p = 0; p < PULSES_PER_STREAM; p++) {
          const period = 7 + (i % 4) * 1.6;
          const phase = ((t + i * 1.7 + p * (period / PULSES_PER_STREAM)) % period) / period;
          const head = at(g, phase);
          const segs = 12;
          const tailLen = 0.16;

          for (let k = 0; k < segs; k++) {
            const t0 = Math.max(0, phase - (tailLen * k) / segs);
            const t1 = Math.max(0, phase - (tailLen * (k + 1)) / segs);
            if (t1 <= 0) break;
            const p0 = at(g, t0);
            const p1 = at(g, t1);
            const fade = (1 - k / segs) ** 2;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(${ACCENT},${0.75 * fade})`;
            ctx.lineWidth = s.width * (0.6 + 1.5 * fade);
            ctx.stroke();
          }

          const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 26);
          glow.addColorStop(0, `rgba(${ACCENT},0.5)`);
          glow.addColorStop(1, `rgba(${ACCENT_DEEP},0)`);
          ctx.beginPath();
          ctx.arc(head.x, head.y, 26, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(235,244,255,0.95)';
          ctx.fill();
        }
      });
    };

    raf = requestAnimationFrame(draw);

    return () => {
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
        maskImage: 'radial-gradient(115% 125% at 78% 50%, #000 22%, rgba(0,0,0,0.45) 56%, transparent 84%)',
        WebkitMaskImage: 'radial-gradient(115% 125% at 78% 50%, #000 22%, rgba(0,0,0,0.45) 56%, transparent 84%)',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
