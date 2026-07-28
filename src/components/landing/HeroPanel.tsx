'use client';

import { useEffect, useRef, useState } from 'react';

const CALLS = [
  { city: 'Denver, CO', state: 'CONNECTED', tone: '#5B9DFF', secs: 134 },
  { city: 'Austin, TX', state: 'DIALING', tone: '#8E99AC', secs: 3 },
  { city: 'Lisbon, PT', state: 'QUALIFIED', tone: '#4ADE80', secs: 281 },
  { city: 'Tulsa, OK', state: 'VOICEMAIL', tone: '#6E788C', secs: 22 },
  { city: 'Leeds, UK', state: 'CONNECTED', tone: '#5B9DFF', secs: 76 },
  { city: 'Phoenix, AZ', state: 'OBJECTION', tone: '#FBBF24', secs: 195 },
];

const clock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Live audio waveform. Canvas, drawn from a cheap sum-of-sines — no audio input. */
function Waveform() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const io = new IntersectionObserver(([e]) => (running = e.isIntersecting));
    io.observe(c);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!running) return;
      const { width: w, height: h } = c;
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 620;
      const bars = 56;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const env = Math.sin((i / bars) * Math.PI);
        const a = Math.sin(t + i * 0.42) * 0.5 + Math.sin(t * 1.7 + i * 0.19) * 0.5;
        const bh = Math.max(2, Math.abs(a) * env * h * 0.82);
        const grad = ctx.createLinearGradient(0, (h - bh) / 2, 0, (h + bh) / 2);
        grad.addColorStop(0, 'rgba(143,187,255,0.95)');
        grad.addColorStop(1, 'rgba(45,106,255,0.65)');
        ctx.fillStyle = grad;
        ctx.fillRect(i * bw + bw * 0.28, (h - bh) / 2, bw * 0.44, bh);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} width={600} height={120} style={{ width: '100%', height: 76, marginTop: 12 }} />;
}

/**
 * The hero product panel. Deliberately built from real DOM rather than a
 * screenshot: text stays sharp at any DPI, it restyles with the theme, and
 * there is no multi-hundred-KB image on the critical path.
 */
export function HeroPanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      data-parallax
      style={{
        marginTop: 72,
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgba(20,26,42,0.9), rgba(9,11,18,0.9))',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        perspective: 1600,
      }}
    >
      {/* window chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.16)' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.16)' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(45,106,255,0.8)' }} />
        <span className="lc-mono" style={{ marginLeft: 10, fontSize: 11, color: '#6E788C', letterSpacing: '0.08em' }}>
          app.laycal.com / campaign / q3-outbound
        </span>
      </div>

      <div className="lc-hero-panel-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: 460 }}>
        {/* live call board */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="lc-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6E788C', textTransform: 'uppercase' }}>
              Active calls
            </span>
            <span className="lc-mono" style={{ fontSize: 11, color: '#5B9DFF' }}>487 / 500 concurrent</span>
          </div>

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
            {CALLS.map((c, i) => (
              <div
                key={c.city}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '10px 1fr auto auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.055)',
                }}
              >
                <span
                  className={c.state === 'CONNECTED' || c.state === 'DIALING' ? 'lc-pulse' : undefined}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: c.tone, boxShadow: `0 0 10px ${c.tone}` }}
                />
                <span style={{ fontSize: 14, color: '#D9E2F2' }}>{c.city}</span>
                <span className="lc-mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: c.tone }}>
                  {c.state}
                </span>
                <span className="lc-mono" style={{ fontSize: 12, color: '#6E788C', minWidth: 42, textAlign: 'right' }}>
                  {clock(c.secs + (c.state === 'DIALING' || c.state === 'CONNECTED' ? tick : 0))}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 'auto',
              paddingTop: 22,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 18,
            }}
          >
            {[
              ['Answer rate', '68%'],
              ['Meetings booked', '34'],
              ['Cost / meeting', '$4.10'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="lc-mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', color: '#6E788C', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ marginTop: 6, fontSize: 21, fontWeight: 600, letterSpacing: '-0.03em', color: '#EAF1FF' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* audio + transcript */}
        <div className="lc-hero-side" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="lc-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6E788C', textTransform: 'uppercase' }}>
              Live agent audio
            </div>
            <Waveform />
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <div className="lc-mono" style={{ fontSize: 10, letterSpacing: '0.16em', color: '#6E788C', textTransform: 'uppercase' }}>
            Transcript
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ color: '#8E99AC' }}>
              <span style={{ color: '#6FA8FF' }}>Agent</span> — Hi Dana, quick one: are you still handling outbound for the Denver team?
            </div>
            <div style={{ color: '#8E99AC' }}>
              <span style={{ color: '#D9E2F2' }}>Lead</span> — I am, yeah. What&apos;s this about?
            </div>
            <div style={{ color: '#8E99AC' }}>
              <span style={{ color: '#6FA8FF' }}>Agent</span> — We cut dialer spend for teams your size. Worth 15 minutes Thursday at 10?
            </div>
            <div style={{ color: '#8E99AC' }}>
              <span style={{ color: '#D9E2F2' }}>Lead</span> — Thursday works.
            </div>
          </div>
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              border: '1px solid rgba(45,106,255,0.35)',
              borderRadius: 12,
              background: 'rgba(45,106,255,0.1)',
            }}
          >
            <span className="lc-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B9DFF' }} />
            <span style={{ fontSize: 13, color: '#BBD0F5' }}>Meeting booked → Google Calendar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
