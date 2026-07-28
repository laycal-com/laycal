'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

import './landing.css';
import { DEMO_URL } from '@/lib/links';
import { ScrollFx } from '@/components/landing/ScrollFx';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroPanel } from '@/components/landing/HeroPanel';
import { RoiCalc } from '@/components/landing/RoiCalc';
import { Faq, type FaqItem } from '@/components/landing/Faq';
import { LOGO_MARKS } from '@/components/landing/LogoMarks';
import { CallMap } from '@/components/landing/CallMap';
import { SignalFlow } from '@/components/landing/SignalFlow';

const DEFAULT_RATE = 0.07;

/* ---------------- shared style fragments ---------------- */
const eyebrow = {
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#6E788C',
} as const;

const h2 = {
  margin: 0,
  fontSize: 46,
  lineHeight: 1.04,
  letterSpacing: '-0.035em',
  fontWeight: 600,
} as const;

const body = { fontSize: 14.5, lineHeight: 1.6, color: '#8E99AC' } as const;
const panel = { padding: '40px 34px' } as const;

/* ---------------- content ---------------- */
const STEPS = [
  {
    n: '01',
    title: 'Upload the list, build the agent',
    copy: 'CSV or Google Form in, prompt builder for tone, objections and qualification logic.',
    icon: (
      <>
        <rect x="3" y="14" width="18" height="7" rx="2" />
        <line x1="12" y1="3" x2="12" y2="11" />
        <polyline points="8 7 12 3 16 7" />
      </>
    ),
  },
  {
    n: '02',
    title: 'Launch the campaign',
    copy: 'Up to 500 concurrent dials across providers and regions. One click, no seat maths.',
    icon: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="12" cy="12" r="8" />
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
      </>
    ),
  },
  {
    n: '03',
    title: 'Watch, listen, scale',
    copy: 'Recordings, transcripts and answer-rate analytics per campaign. Booked meetings land in Calendar.',
    icon: (
      <>
        <line x1="4" y1="20" x2="20" y2="20" />
        <rect x="5" y="12" width="3.4" height="5" />
        <rect x="10.3" y="8" width="3.4" height="9" />
        <rect x="15.6" y="4" width="3.4" height="13" />
      </>
    ),
  },
];

const FEATURES: { title: string; copy: string; icon: React.ReactNode }[] = [
  {
    title: 'Bulk call launcher',
    copy: 'Hundreds of simultaneous dials from a single list, with pacing and retry rules.',
    icon: (
      <>
        <circle cx="12" cy="12" r="2.4" />
        <circle cx="12" cy="12" r="6.4" />
        <circle cx="12" cy="12" r="10.4" />
      </>
    ),
  },
  {
    title: 'Real-time dashboard',
    copy: 'Campaign health, live call states and outcomes without refreshing anything.',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="9" x2="9" y2="20" />
      </>
    ),
  },
  {
    title: 'Call recording hub',
    copy: 'Every conversation stored, searchable and shareable with the team.',
    icon: (
      <>
        <rect x="9" y="2.5" width="6" height="11" rx="3" />
        <path d="M5.5 12a6.5 6.5 0 0 0 13 0" />
        <line x1="12" y1="18.5" x2="12" y2="21.5" />
      </>
    ),
  },
  {
    title: 'Performance analytics',
    copy: 'Answer rate, qualification rate and cost per booked meeting, per script version.',
    icon: (
      <>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="15 7 21 7 21 13" />
      </>
    ),
  },
  {
    title: 'Multi-provider setup',
    copy: 'Bring your own telephony and voice providers, switch without rebuilding campaigns.',
    icon: (
      <>
        <circle cx="12" cy="12" r="9.2" />
        <ellipse cx="12" cy="12" rx="4" ry="9.2" />
        <line x1="2.8" y1="12" x2="21.2" y2="12" />
      </>
    ),
  },
  {
    title: 'AI voice customisation',
    copy: 'Voice, pace and personality tuned per campaign, then held consistent on every call.',
    icon: (
      <>
        <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
        <line x1="12" y1="1.5" x2="12" y2="4.5" />
        <line x1="12" y1="19.5" x2="12" y2="22.5" />
      </>
    ),
  },
];

const RESULTS = [
  ['Real estate', '2,000 → 340', 'leads dialled to qualified conversations in one week. +340% qualified pipeline.'],
  ['Insurance', '85%', 'answer rate on a re-engagement list previously worked by two SDRs.'],
  ['B2B sales', '$47 / lead', 'cost per qualified lead — an 83% reduction against their previous dialer stack.'],
];

const COMPARE: [string, string, string, string][] = [
  ['Massive call power', '500 concurrent', 'Seat-limited', 'Parallel, seat-priced'],
  ['Pricing model', 'Usage, per minute', 'Per seat / month', 'Per seat / month'],
  ['Prompt builder control', 'Full, per campaign', 'Limited templates', 'Partial'],
  ['Time to first campaign', 'Under an hour', 'Onboarding call', 'Implementation'],
  ['Google Calendar booking', 'Native', 'Via integration', 'Via integration'],
  ['Multi-provider failover', 'Included', 'Single stack', 'Single stack'],
  ['Cost for 10,000 calls', 'Usage only', 'Seats + usage', 'Seats + usage'],
];

const FAQS: FaqItem[] = [
  {
    q: 'Does it sound like a robot?',
    a: 'No. You pick the voice, pace and personality, and the agent handles interruptions and objections mid-sentence. We play real recordings on the demo so you can judge for yourself.',
  },
  {
    q: 'How do I get access?',
    a: 'Laycal is invite-only right now. Book a demo, and if it is a fit we send a Clerk invitation to your email — that link creates your account and provisions your first assistant.',
  },
  {
    q: 'How fast can I launch a campaign?',
    a: 'Upload a CSV or connect a Google Form, write the prompt, launch. Most teams run their first live calls the same afternoon their invite lands.',
  },
  {
    q: 'What does it actually cost at volume?',
    a: 'Usage-based per calling minute, with no seat licences. Use the calculator above with your own numbers — it compares against fully loaded SDR cost. Exact rates are confirmed on the demo.',
  },
  {
    q: 'Can it book meetings on my calendar?',
    a: 'Yes — Google Calendar is native. The agent offers real open slots and writes the event the moment the prospect agrees.',
  },
  {
    q: 'How is this different from JustCall or Nooks?',
    a: 'Both price by seat and assume a human on every call. Laycal prices by minute and runs up to 500 conversations at once — see the table above.',
  },
  {
    q: 'Do I need my own telephony provider?',
    a: 'You can bring your own, or use ours. Multi-provider routing means a provider outage reroutes rather than stopping the campaign.',
  },
];

/* ---------------- small building blocks ---------------- */
function Icon({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6FA8FF"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      {children}
    </svg>
  );
}

function DemoButton({ children, variant = 'solid' }: { children: React.ReactNode; variant?: 'solid' | 'ghost' }) {
  return (
    <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className={variant === 'solid' ? 'lc-btn' : 'lc-btn-ghost'}>
      {children}
    </a>
  );
}

/* ---------------- page ---------------- */
export default function Home() {
  const [rate, setRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    let alive = true;
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.cost_per_minute_payg) setRate(Number(d.cost_per_minute_payg));
      })
      .catch(() => {
        /* keep the default rate */
      });
    return () => {
      alive = false;
    };
  }, []);

  const rateLabel = `$${rate.toFixed(2)}`;

  return (
    <div className="lc">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Laycal',
            description:
              'Invite-only AI voice calling platform for B2B sales teams. Runs up to 500 concurrent outbound calls that qualify leads, handle objections and book meetings straight into Google Calendar.',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web-based',
            offers: {
              '@type': 'Offer',
              price: String(rate),
              priceCurrency: 'USD',
              description: `Usage-based pricing from ${rateLabel} per minute`,
            },
            author: { '@type': 'Organization', name: 'Laycal', url: 'https://laycal.com' },
            featureList: [
              'AI Voice Agents',
              '500+ Simultaneous Calls',
              'Usage-based Pricing',
              'Google Calendar Integration',
              'Lead Management',
              'Real-time Analytics',
              'Multiple Voice Providers',
            ],
          }),
        }}
      />

      {/* ---------- fixed background stage ---------- */}
      <div id="lc-bgstage" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div
          id="lc-scene-a"
          style={{ position: 'absolute', inset: 0, opacity: 1, background: 'radial-gradient(120% 80% at 15% 0%, #0F1A3A 0%, #080A14 55%, #06070B 100%)' }}
        />
        <div
          id="lc-scene-b"
          style={{ position: 'absolute', inset: 0, opacity: 0, background: 'radial-gradient(100% 90% at 85% 20%, #10214E 0%, #070B18 60%, #06070B 100%)' }}
        />
        <div
          id="lc-scene-c"
          style={{ position: 'absolute', inset: 0, opacity: 0, background: 'radial-gradient(90% 70% at 50% 100%, #0B1B44 0%, #070912 60%, #06070B 100%)' }}
        />
        <div
          id="lc-orb-1"
          className="lc-orb"
          style={{
            position: 'absolute',
            top: '-8%',
            left: '52%',
            width: '46vw',
            height: '46vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(45,106,255,0.45), rgba(45,106,255,0) 65%)',
            filter: 'blur(30px)',
          }}
        />
        <div
          id="lc-orb-2"
          className="lc-orb--slow"
          style={{
            position: 'absolute',
            bottom: '-18%',
            left: '-10%',
            width: '38vw',
            height: '38vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 60% 40%, rgba(91,157,255,0.26), rgba(91,157,255,0) 68%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          id="lc-grid"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.5,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '88px 88px',
            maskImage: 'radial-gradient(120% 90% at 50% 10%, #000 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(120% 90% at 50% 10%, #000 20%, transparent 80%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6,7,11,0.35) 0%, rgba(6,7,11,0) 25%, rgba(6,7,11,0) 70%, rgba(6,7,11,0.75) 100%)',
          }}
        />
      </div>

      <div
        id="lc-progress"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 2,
          width: '0%',
          background: 'linear-gradient(90deg,#2D6AFF,#7FB2FF)',
          zIndex: 60,
          boxShadow: '0 0 12px rgba(45,106,255,0.8)',
        }}
      />

      <ScrollFx />
      <LandingNav />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ---------- hero ---------- */}
        <section className="lc-shell lc-hero" style={{ paddingTop: 186, paddingBottom: 96 }}>
          <div
            data-reveal
            className="lc-mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 14px 7px 10px',
              border: '1px solid rgba(45,106,255,0.4)',
              borderRadius: 999,
              background: 'rgba(45,106,255,0.09)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#9EC0FF',
            }}
          >
            <span
              className="lc-pulse"
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B9DFF', boxShadow: '0 0 10px #5B9DFF' }}
            />
            Invite-only · 500 concurrent AI calls
          </div>

          <h1
            data-reveal
            className="lc-h1"
            style={{ margin: '26px 0 0', fontSize: 82, lineHeight: 0.96, letterSpacing: '-0.045em', fontWeight: 600, maxWidth: '15ch', textWrap: 'balance' }}
          >
            Scale your sales calls to <span style={{ color: '#6FA8FF' }}>500+ simultaneous</span> conversations.
          </h1>

          <p data-reveal style={{ margin: '28px 0 0', maxWidth: '52ch', fontSize: 19, lineHeight: 1.6, color: '#98A2B4' }}>
            Turn a lead list into a 24/7 AI calling floor. Laycal dials, qualifies, handles objections and books straight
            into your calendar — so your team spends its hours in live conversations, not on the dial pad.
          </p>

          <div data-reveal className="lc-cta-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 38 }}>
            <SignedOut>
              <DemoButton>
                Request a demo
                <span className="lc-mono" style={{ fontSize: 11, opacity: 0.8 }}>
                  15 MIN
                </span>
              </DemoButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="lc-btn">
                Go to dashboard
              </Link>
            </SignedIn>
            <a href="#compare" className="lc-btn-ghost">
              See the comparison
            </a>
            <span className="lc-mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: '#5F6A7D', textTransform: 'uppercase' }}>
              Access by invitation
            </span>
          </div>

          <HeroPanel />
        </section>

        {/* ---------- logo strip ---------- */}
        <section
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(8,10,16,0.6)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            className="lc-shell"
            style={{ paddingTop: 26, paddingBottom: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}
          >
            <span className="lc-mono" style={{ ...eyebrow, color: '#5F6A7D' }}>
              Running outbound for
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap', color: '#7C8798' }}>
              {LOGO_MARKS.map((Mark, i) => (
                <Mark key={i} />
              ))}
            </div>
            <span className="lc-mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: '#8E99AC' }}>
              {rateLabel} / min · 99.9% uptime target
            </span>
          </div>
        </section>

        {/* ---------- contrast ---------- */}
        <section className="lc-shell" style={{ paddingTop: 130, paddingBottom: 130 }}>
          <div
            data-reveal
            className="lc-split"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden' }}
          >
            <div style={{ padding: '52px 48px', background: 'rgba(12,13,18,0.7)' }}>
              <div className="lc-mono" style={eyebrow}>
                One human dialer
              </div>
              <div style={{ marginTop: 28, fontSize: 72, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: '#5B6373' }}>80</div>
              <div style={{ marginTop: 10, fontSize: 15, color: '#8E99AC' }}>
                calls in an 8-hour day, one conversation at a time, energy fading by 3pm.
              </div>
              <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['22%', '14%', '8%'].map((w, i) => (
                  <div key={w} style={{ height: 6, width: w, borderRadius: 3, background: `rgba(255,255,255,${0.12 - i * 0.02})` }} />
                ))}
              </div>
            </div>
            <div
              style={{
                padding: '52px 48px',
                background: 'linear-gradient(160deg, rgba(45,106,255,0.16), rgba(45,106,255,0.03))',
                borderLeft: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <div className="lc-mono" style={{ ...eyebrow, color: '#9EC0FF' }}>
                Laycal
              </div>
              <div style={{ marginTop: 28, fontSize: 72, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1, color: '#EAF1FF' }}>12,000</div>
              <div style={{ marginTop: 10, fontSize: 15, color: '#A9BADA' }}>
                calls a day. 500 running at once, every time zone, same script quality at 3am.
              </div>
              <div className="lc-eq" style={{ marginTop: 34, display: 'flex', alignItems: 'flex-end', gap: 5, height: 38 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(180deg,#5B9DFF,#2D6AFF)',
                      borderRadius: 2,
                      height: '100%',
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ROI ---------- */}
        <section id="roi" className="lc-shell lc-section">
          <div className="lc-split" style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 72, alignItems: 'start' }}>
            <div data-reveal>
              <div className="lc-mono" style={eyebrow}>
                ROI calculator
              </div>
              <h2 className="lc-h2" style={{ ...h2, marginTop: 18 }}>
                What you stop paying for.
              </h2>
              <p style={{ margin: '18px 0 0', fontSize: 16, lineHeight: 1.65, color: '#98A2B4', maxWidth: '38ch' }}>
                Move the sliders to your team. We compare fully loaded SDR cost against Laycal usage at {rateLabel} per
                minute.
              </p>
            </div>
            <RoiCalc costPerMinute={rate} />
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="lc-shell lc-section">
          <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <h2 className="lc-h2" style={{ ...h2, maxWidth: '20ch' }}>
              Live in an afternoon, not a quarter.
            </h2>
            <span className="lc-mono" style={eyebrow}>
              Three steps
            </span>
          </div>
          <div className="lc-hair lc-cols-3" style={{ marginTop: 56 }}>
            {STEPS.map((s) => (
              <div key={s.n} data-reveal style={panel}>
                <Icon size={22}>{s.icon}</Icon>
                <div className="lc-mono" style={{ marginTop: 26, fontSize: 11, color: '#6E788C', letterSpacing: '0.14em' }}>
                  {s.n}
                </div>
                <div style={{ marginTop: 12, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{s.title}</div>
                <p style={{ margin: '12px 0 0', ...body }}>{s.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- command center ---------- */}
        <section style={{ position: 'relative', marginBottom: 130 }}>
          <div style={{ position: 'relative', minHeight: 620, display: 'flex', alignItems: 'stretch' }}>
            {/* CallMap feathers its own edges via a mask, so it needs no darkening
                overlay — only a soft scrim under the copy column for legibility. */}
            <CallMap />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(90deg, rgba(6,7,11,0.97) 0%, rgba(6,7,11,0.95) 32%, rgba(6,7,11,0.72) 46%, rgba(6,7,11,0.22) 62%, rgba(6,7,11,0) 78%)',
              }}
            />
            <div
              className="lc-shell lc-split"
              style={{ position: 'relative', paddingTop: 96, paddingBottom: 96, width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,560px) 1fr', gap: 72 }}
            >
              <div data-reveal>
                <div className="lc-mono" style={{ ...eyebrow, color: '#9EC0FF' }}>
                  Command center
                </div>
                <h2 className="lc-h2-lg" style={{ ...h2, marginTop: 18, fontSize: 52, lineHeight: 1.02, letterSpacing: '-0.04em', maxWidth: '18ch' }}>
                  Every call, visible while it happens.
                </h2>
                <p style={{ margin: '20px 0 0', fontSize: 16, lineHeight: 1.65, color: '#A9B3C6', maxWidth: '42ch' }}>
                  No black box. Watch dials connect, read live transcripts, pull a recording the second a call ends.
                </p>
                <div
                  className="lc-mono"
                  style={{
                    marginTop: 36,
                    padding: 22,
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 16,
                    background: 'rgba(8,10,16,0.7)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 12,
                    lineHeight: 2,
                    color: '#8FB6F5',
                    height: 150,
                    overflow: 'hidden',
                  }}
                >
                  <div className="lc-marq">
                    {[0, 1].map((dup) =>
                      [
                        'CONNECTED · lead #1247 · Denver, CO',
                        'DIALING · lead #1248 · Austin, TX',
                        'QUALIFIED · lead #1241 · booked Thu 10:00',
                        'OBJECTION HANDLED · lead #1239 · "too expensive"',
                        'VOICEMAIL · lead #1250 · retry queued',
                        'CONNECTED · lead #1252 · Lisbon, PT',
                      ].map((line) => <div key={`${dup}-${line}`}>{line}</div>)
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 28px', fontSize: 14, color: '#B6C0D2' }}>
                  {[
                    'Real-time dial and connect status',
                    'Live transcript per conversation',
                    'Recording hub with instant playback',
                    'Answer rate and objection analytics',
                    'Multi-provider failover routing',
                    'Calendar handoff on agreement',
                  ].map((f) => (
                    <div key={f}>{f}</div>
                  ))}
                </div>
              </div>
              <div />
            </div>
          </div>
        </section>

        {/* ---------- stats ---------- */}
        <section className="lc-shell lc-section">
          <div
            data-reveal
            className="lc-cols-4"
            style={{
              display: 'grid',
              gap: 48,
              padding: '44px 0',
              borderTop: '1px solid rgba(255,255,255,0.09)',
              borderBottom: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            {[
              ['500', 'concurrent calls per campaign'],
              [rateLabel, 'all-in cost per minute'],
              ['24/7', 'coverage across time zones'],
              ['0', 'per-seat licences to buy'],
            ].map(([big, small]) => (
              <div key={small}>
                <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.035em' }}>{big}</div>
                <div style={{ marginTop: 8, fontSize: 14, color: '#8E99AC' }}>{small}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- features ---------- */}
        <section id="features" className="lc-shell lc-section">
          <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <h2 className="lc-h2" style={{ ...h2, maxWidth: '22ch' }}>
              The dialer, the analytics and the voice stack in one place.
            </h2>
            <span className="lc-mono" style={eyebrow}>
              Platform
            </span>
          </div>
          <div className="lc-stack-sm" style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 72 }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-reveal
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '30px 0',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  borderBottom: i >= FEATURES.length - 2 ? '1px solid rgba(255,255,255,0.08)' : undefined,
                }}
              >
                <span style={{ marginTop: 3 }}>
                  <Icon>{f.icon}</Icon>
                </span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>{f.title}</div>
                  <p style={{ margin: '8px 0 0', ...body }}>{f.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- results ---------- */}
        <section id="results" className="lc-shell lc-section">
          <div data-reveal className="lc-mono" style={eyebrow}>
            Results
          </div>
          <div className="lc-hair lc-cols-3" style={{ marginTop: 40 }}>
            {RESULTS.map(([tag, big, copy]) => (
              <div key={tag} data-reveal style={panel}>
                <div className="lc-mono" style={{ ...eyebrow, letterSpacing: '0.14em' }}>
                  {tag}
                </div>
                <div style={{ marginTop: 22, fontSize: 34, fontWeight: 600, letterSpacing: '-0.035em' }}>{big}</div>
                <div style={{ marginTop: 10, ...body }}>{copy}</div>
              </div>
            ))}
          </div>

          <div data-reveal style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '64px 1fr', gap: 26, alignItems: 'start', maxWidth: 820 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
              <Image src="/assets/landing/quote-face.jpg" alt="" fill sizes="64px" style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 22, lineHeight: 1.5, letterSpacing: '-0.02em', color: '#E6ECF7' }}>
                &ldquo;We replaced a four-seat dialer contract and still tripled dial volume. The numbers got me on a
                demo; the recordings are what made me stay.&rdquo;
              </p>
              <div className="lc-mono" style={{ marginTop: 14, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E788C' }}>
                Don — Texas Roofing Lead Gen
              </div>
            </div>
          </div>
        </section>

        {/* ---------- comparison ---------- */}
        <section
          id="compare"
          style={{
            position: 'relative',
            padding: '110px 0 130px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(13,22,50,0.75), rgba(6,7,11,0.4))',
          }}
        >
          <div className="lc-shell">
            <div data-reveal style={{ maxWidth: '26ch' }}>
              <div className="lc-mono" style={{ ...eyebrow, color: '#9EC0FF' }}>
                Head to head
              </div>
              <h2 className="lc-h2-lg" style={{ ...h2, marginTop: 18, fontSize: 56, lineHeight: 1, letterSpacing: '-0.042em' }}>
                Laycal vs JustCall vs Nooks.
              </h2>
            </div>

            <div
              data-reveal
              style={{
                marginTop: 52,
                border: '1px solid rgba(255,255,255,0.11)',
                borderRadius: 20,
                overflow: 'hidden',
                background: 'rgba(8,10,16,0.72)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <div
                className="lc-mono lc-cmp-head"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
                  alignItems: 'center',
                  padding: '22px 28px',
                  borderBottom: '1px solid rgba(255,255,255,0.09)',
                  ...eyebrow,
                  letterSpacing: '0.14em',
                }}
              >
                <div>Capability</div>
                <div style={{ color: '#9EC0FF', textAlign: 'center' }}>Laycal</div>
                <div style={{ textAlign: 'center' }}>JustCall</div>
                <div style={{ textAlign: 'center' }}>Nooks</div>
              </div>
              {COMPARE.map(([cap, us, jc, nk], i) => (
                <div
                  key={cap}
                  className="lc-cmp-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
                    alignItems: 'center',
                    padding: '22px 28px',
                    borderBottom: i === COMPARE.length - 1 ? undefined : '1px solid rgba(255,255,255,0.07)',
                    fontSize: 15,
                  }}
                >
                  <div style={{ color: '#D9E2F2' }}>{cap}</div>
                  <div
                    className="lc-cmp-cell lc-cmp-cell--win"
                    data-label="Laycal"
                    style={{ color: '#EAF1FF', background: 'rgba(45,106,255,0.1)', margin: '-22px 0', padding: '22px 0', textAlign: 'center' }}
                  >
                    {us}
                  </div>
                  <div className="lc-cmp-cell" data-label="JustCall" style={{ color: '#8E99AC', textAlign: 'center' }}>
                    {jc}
                  </div>
                  <div className="lc-cmp-cell" data-label="Nooks" style={{ color: '#8E99AC', textAlign: 'center' }}>
                    {nk}
                  </div>
                </div>
              ))}
            </div>

            <div data-reveal className="lc-cols-3" style={{ marginTop: 32, display: 'grid', gap: 20 }}>
              {[
                ['Volume without headcount', 'Concurrency is a setting, not a hiring plan.'],
                ['Pay for minutes, not chairs', 'A quiet month costs a quiet month.'],
                ['Own the script', 'Edit the prompt, relaunch, measure the delta.'],
              ].map(([t, c]) => (
                <div key={t} style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: 26, background: 'rgba(9,11,17,0.6)' }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{t}</div>
                  <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#8E99AC' }}>{c}</p>
                </div>
              ))}
            </div>

            <div data-reveal style={{ marginTop: 40 }}>
              <DemoButton>Run your own comparison — book a demo</DemoButton>
            </div>
          </div>
        </section>

        {/* ---------- pricing ---------- */}
        <section id="pricing" className="lc-shell lc-section">
          <div data-reveal style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
            <h2 className="lc-h2" style={{ ...h2, maxWidth: '20ch' }}>
              Pricing that tracks usage, not headcount.
            </h2>
            <span className="lc-mono" style={eyebrow}>
              Confirmed on your demo
            </span>
          </div>

          <div className="lc-cols-3" style={{ marginTop: 56, display: 'grid', gap: 20, alignItems: 'stretch' }}>
            {/* trial */}
            <div data-reveal style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 34, background: 'rgba(9,11,17,0.65)', display: 'flex', flexDirection: 'column' }}>
              <div className="lc-mono" style={{ ...eyebrow, letterSpacing: '0.14em' }}>
                Free trial
              </div>
              <div style={{ marginTop: 22, fontSize: 30, fontWeight: 600, letterSpacing: '-0.035em' }}>Included with your invite</div>
              <div style={{ marginTop: 6, fontSize: 14, color: '#8E99AC' }}>1 assistant · 5 calls · no card</div>
              <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14.5, color: '#98A2B4' }}>
                {['Full dashboard access', 'Recordings and transcripts', 'Prompt builder', 'Google Calendar booking'].map((f) => (
                  <div key={f}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="lc-textlink" style={{ fontSize: 14.5 }}>
                  Start free trial →
                </a>
              </div>
            </div>

            {/* payg */}
            <div
              data-reveal
              style={{
                position: 'relative',
                border: '1px solid rgba(45,106,255,0.55)',
                borderRadius: 20,
                padding: 34,
                background: 'linear-gradient(180deg, rgba(45,106,255,0.16), rgba(9,11,17,0.75))',
                boxShadow: '0 30px 90px rgba(45,106,255,0.22)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                className="lc-mono"
                style={{ position: 'absolute', top: -11, left: 34, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#06070B', background: '#6FA8FF', padding: '4px 10px', borderRadius: 6 }}
              >
                Most teams
              </div>
              <div className="lc-mono" style={{ ...eyebrow, letterSpacing: '0.14em', color: '#9EC0FF' }}>
                Usage-based
              </div>
              <div style={{ marginTop: 22, fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em' }}>
                from {rateLabel}
                <span style={{ fontSize: 20, color: '#A9BADA' }}> / min</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 14, color: '#A9BADA' }}>no seats, no monthly minimum</div>
              <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14.5, color: '#C3D2EC' }}>
                {['Unlimited assistants', 'Up to 500 concurrent calls', 'Multi-provider routing', 'Analytics and recording hub', 'Google Calendar booking'].map((f) => (
                  <div key={f}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="lc-btn lc-btn--sm">
                  Request a demo
                </a>
              </div>
            </div>

            {/* enterprise */}
            <div data-reveal style={{ border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 34, background: 'rgba(9,11,17,0.65)', display: 'flex', flexDirection: 'column' }}>
              <div className="lc-mono" style={{ ...eyebrow, letterSpacing: '0.14em' }}>
                Enterprise
              </div>
              <div style={{ marginTop: 22, fontSize: 44, fontWeight: 600, letterSpacing: '-0.04em' }}>Custom</div>
              <div style={{ marginTop: 6, fontSize: 14, color: '#8E99AC' }}>volume rates · agencies</div>
              <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14.5, color: '#98A2B4' }}>
                {['Committed-volume pricing', 'Dedicated provider capacity', 'Sub-accounts for clients', 'Priority support and SLA'].map((f) => (
                  <div key={f}>{f}</div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="lc-textlink" style={{ fontSize: 14.5 }}>
                  Talk to sales →
                </a>
              </div>
            </div>
          </div>

          <div
            data-reveal
            className="lc-cols-3"
            style={{ marginTop: 28, display: 'grid', gap: 48, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 14, color: '#8E99AC' }}
          >
            <div>
              <span style={{ color: '#D9E2F2' }}>Invite-only.</span> Accounts are provisioned by us after the demo — no
              open signup.
            </div>
            <div>
              <span style={{ color: '#D9E2F2' }}>Spend per minute.</span> Billing is call minutes plus provider
              pass-through.
            </div>
            <div>
              <span style={{ color: '#D9E2F2' }}>See it per campaign.</span> Cost per booked meeting on the dashboard.
            </div>
          </div>
        </section>

        {/* ---------- trust ---------- */}
        <section className="lc-shell lc-section">
          <div
            data-reveal
            className="lc-cols-3"
            style={{ display: 'grid', gap: 48, padding: '36px 0', borderTop: '1px solid rgba(255,255,255,0.09)', borderBottom: '1px solid rgba(255,255,255,0.09)' }}
          >
            {[
              [
                <>
                  <rect x="4" y="10" width="16" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </>,
                'Encrypted in transit and at rest',
              ],
              [
                <>
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 6.5 12 12 16.5 14" />
                </>,
                '99.9% uptime target, multi-provider failover',
              ],
              [<path key="s" d="M12 3l7 3v6c0 4.2-3 7.3-7 9-4-1.7-7-4.8-7-9V6z" />, 'SOC 2 readiness in progress'],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Icon size={18}>{icon as React.ReactNode}</Icon>
                <span style={{ fontSize: 14.5, color: '#B6C0D2' }}>{text as string}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="lc-shell lc-section">
          <div className="lc-split" style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr', gap: 72, alignItems: 'start' }}>
            <h2 data-reveal className="lc-h2" style={h2}>
              Questions sales leaders ask.
            </h2>
            <Faq items={FAQS} />
          </div>
        </section>

        {/* ---------- final CTA ---------- */}
        <section style={{ position: 'relative' }}>
          <div style={{ position: 'relative', minHeight: 520, display: 'flex', alignItems: 'center' }}>
            <SignalFlow />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(90deg, rgba(6,7,11,0.96) 0%, rgba(6,7,11,0.82) 34%, rgba(6,7,11,0.3) 58%, rgba(6,7,11,0) 78%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: 'radial-gradient(70% 110% at 20% 100%, rgba(45,106,255,0.26), rgba(6,7,11,0) 65%)',
              }}
            />
            <div data-reveal className="lc-shell" style={{ position: 'relative', width: '100%' }}>
              <h2 className="lc-h1" style={{ margin: 0, fontSize: 60, lineHeight: 1, letterSpacing: '-0.045em', fontWeight: 600, maxWidth: '16ch' }}>
                Make 1,000 calls before lunch.
              </h2>
              <p style={{ margin: '22px 0 0', maxWidth: '42ch', fontSize: 17, lineHeight: 1.6, color: '#A9B3C6' }}>
                Laycal is invite-only. Book 15 minutes, hear real call recordings, and we&apos;ll send an invite if it&apos;s a
                fit.
              </p>
              <div className="lc-cta-row" style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <SignedOut>
                  <DemoButton>Schedule a demo call</DemoButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" className="lc-btn">
                    Launch your next campaign
                  </Link>
                </SignedIn>
                <a href="#roi" className="lc-btn-ghost">
                  Estimate your savings
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- footer ---------- */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(5,6,10,0.92)' }}>
          <div
            className="lc-shell lc-stack-sm"
            style={{ paddingTop: 64, paddingBottom: 40, display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48 }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: 'linear-gradient(140deg,#2D6AFF,#8FBBFF)' }} />
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>Laycal</span>
              </div>
              <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.6, color: '#6E788C', maxWidth: '34ch' }}>
                AI voice agents that dial, qualify and book meetings for B2B sales teams — at a volume a human floor
                can&apos;t reach.
              </p>
            </div>
            {[
              ['Product', [['Features', '#features'], ['Pricing', '#pricing'], ['ROI calculator', '#roi']]],
              ['Compare', [['JustCall alternative', '/justcall-alternative'], ['Nooks alternative', '/nooks-alternative'], ['Speed to lead', '/speed-to-lead']]],
              ['Company', [['Blog', '/blogs'], ['Contact', '/contact'], ['Support', '/support']]],
            ].map(([heading, links]) => (
              <div key={heading as string} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div className="lc-mono" style={{ ...eyebrow, fontSize: 10, color: '#5F6A7D' }}>
                  {heading as string}
                </div>
                {(links as string[][]).map(([label, href]) =>
                  href.startsWith('#') ? (
                    <a key={label} href={href} className="lc-footlink">
                      {label}
                    </a>
                  ) : (
                    <Link key={label} href={href} className="lc-footlink">
                      {label}
                    </Link>
                  )
                )}
              </div>
            ))}
          </div>
          <div
            className="lc-shell lc-mono"
            style={{ paddingBottom: 48, display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 11, letterSpacing: '0.1em', color: '#4E5768', textTransform: 'uppercase' }}
          >
            <span>© {new Date().getFullYear()} Laycal</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link href="/privacy" className="lc-footlink">
                Privacy
              </Link>
              <Link href="/terms" className="lc-footlink">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
