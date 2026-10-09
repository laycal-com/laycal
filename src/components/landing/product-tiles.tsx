import { CalendarCheck, Check, Play } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ParallaxTile } from '@/components/ui/hero-parallax';
import { cn } from '@/lib/utils';
import { Dot } from './primitives';

/**
 * Product tiles for the hero. Each one is a small, real-DOM fragment of the
 * product rather than a screenshot. All names and figures are illustrative.
 */

const WAVE = [
  30, 48, 72, 40, 86, 60, 34, 78, 96, 52, 44, 70, 88, 36, 58, 92, 64, 40, 76, 50, 84, 32, 66, 94, 46, 72, 38, 82,
  56, 90, 42, 68, 34, 78, 60, 48, 86, 36, 70, 54, 44, 62, 30, 74, 50, 40, 58, 34,
];

export function Waveform({
  played = 0.6,
  bars = WAVE.length,
  className,
}: {
  played?: number;
  bars?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex h-12 items-center gap-[3px]', className)}>
      {WAVE.slice(0, bars).map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className={cn('w-full rounded-full', i / bars < played ? 'bg-primary' : 'bg-white/15')}
        />
      ))}
    </div>
  );
}

function Tile({
  label,
  meta,
  className,
  children,
}: {
  label: string;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-2xl border-white/10 bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors duration-200 group-hover/tile:border-white/20">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.08] px-5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">{label}</span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-neutral-500">{meta}</span>
      </div>
      <div className={cn('flex min-h-0 flex-1 flex-col p-5', className)}>{children}</div>
    </Card>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xs font-medium text-neutral-200">
      {initials}
    </span>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2.5 text-[13px] last:border-b-0">
      <span className="text-neutral-500">{k}</span>
      <span className="text-neutral-200">{v}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LiveCall() {
  return (
    <Tile
      label="Live call"
      meta={
        <>
          <Dot tone="brand" pulse /> 02:14
        </>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar initials="MR" />
        <div className="min-w-0">
          <div className="text-[15px] font-medium text-neutral-50">Maria Reyes</div>
          <div className="text-xs text-neutral-500">Denver, CO · lead #1247</div>
        </div>
        <Badge variant="outline" className="ml-auto border-primary/40 bg-primary/10 font-normal text-brand-soft">
          Connected
        </Badge>
      </div>
      <Waveform className="mt-6" played={0.62} />
      <div className="mt-6 space-y-3 text-[13px] leading-5">
        <p className="text-neutral-400">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-neutral-600">Agent</span>
          Does Thursday at 10 work for a quick walkthrough?
        </p>
        <p className="text-neutral-200">
          <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-neutral-600">Maria</span>
          Thursday works. Send me the invite.
        </p>
      </div>
    </Tile>
  );
}

function Booked() {
  return (
    <Tile label="Meetings booked" meta="Last 30 days">
      <div className="flex items-end gap-3">
        <span className="font-mono text-5xl font-medium tracking-[-0.03em] tabular-nums text-neutral-50">128</span>
        <span className="mb-1.5 font-mono text-xs text-green-500">+18.2%</span>
      </div>
      <svg viewBox="0 0 440 150" className="mt-auto h-40 w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="tile-booked-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--brand)" stopOpacity="0.35" />
            <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 70, 110].map((y) => (
          <line key={y} x1="0" x2="440" y1={y} y2={y} stroke="white" strokeOpacity="0.06" />
        ))}
        <path
          d="M0 118 C40 112 60 96 100 98 S160 70 200 74 S270 50 310 44 S390 22 440 14 L440 150 L0 150 Z"
          fill="url(#tile-booked-fill)"
        />
        <path
          d="M0 118 C40 112 60 96 100 98 S160 70 200 74 S270 50 310 44 S390 22 440 14"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </Tile>
  );
}

const LEADS: [string, string, string, 'brand' | 'success' | 'neutral' | 'dim', string][] = [
  ['Maria Reyes', 'Denver, CO', 'Booked', 'success', '4:12'],
  ['James Okafor', 'Austin, TX', 'Calling', 'brand', '0:48'],
  ['Priya Nair', 'Seattle, WA', 'Qualified', 'neutral', '3:05'],
  ['Tom Becker', 'Chicago, IL', 'Voicemail', 'dim', '0:21'],
  ['Elena Rossi', 'Miami, FL', 'Booked', 'success', '5:37'],
  ['Noah Kim', 'Portland, OR', 'Queued', 'dim', '—'],
];

function Leads() {
  return (
    <Tile label="Leads" meta="Today" className="p-0">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-x-4 border-b border-white/[0.06] px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
        <span>Name</span>
        <span>Location</span>
        <span>Status</span>
        <span>Time</span>
      </div>
      {LEADS.map(([name, city, status, tone, time]) => (
        <div
          key={name}
          className="grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-x-4 border-b border-white/[0.05] px-5 py-[11px] text-[13px] last:border-b-0"
        >
          <span className="truncate text-neutral-100">{name}</span>
          <span className="truncate text-neutral-500">{city}</span>
          <span className="flex items-center gap-2 text-neutral-300">
            <Dot tone={tone} pulse={status === 'Calling'} />
            {status}
          </span>
          <span className="w-8 text-right font-mono text-xs tabular-nums text-neutral-500">{time}</span>
        </div>
      ))}
    </Tile>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
/* [day, top %, height %, booked?] */
const SLOTS: [number, number, number, boolean][] = [
  [0, 8, 22, false],
  [0, 58, 18, false],
  [1, 30, 26, false],
  [2, 6, 16, false],
  [2, 64, 22, false],
  [3, 22, 24, true],
  [3, 70, 16, false],
  [4, 40, 30, false],
];

function Calendar() {
  return (
    <Tile label="Calendar" meta="Google Calendar">
      <div className="grid flex-1 grid-cols-5 gap-2">
        {DAYS.map((d, di) => (
          <div key={d} className="flex min-h-0 flex-col">
            <div className={cn('pb-2 text-center font-mono text-[10px] uppercase tracking-wider', di === 3 ? 'text-neutral-200' : 'text-neutral-600')}>
              {d}
            </div>
            <div className="relative flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              {SLOTS.filter(([day]) => day === di).map(([, top, height, booked], i) => (
                <div
                  key={i}
                  style={{ top: `${top}%`, height: `${height}%` }}
                  className={cn(
                    'absolute inset-x-1 rounded-md px-1.5 py-1 text-[10px] leading-tight',
                    booked ? 'bg-primary text-white' : 'bg-white/[0.07]'
                  )}
                >
                  {booked && (
                    <>
                      <div className="font-medium">Demo</div>
                      <div className="opacity-80">10:00</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400">
        <CalendarCheck className="size-3.5 text-brand-soft" />
        Booked by the agent while the lead was still on the line
      </div>
    </Tile>
  );
}

function Transcript() {
  const lines: [boolean, string][] = [
    [true, 'Hi James, this is Ava from Northwind. You just asked for a quote on our site. Is now a good time?'],
    [false, 'Sure. That was quick.'],
    [true, 'Two quick questions, then I can book you straight in with a specialist.'],
    [false, 'Go ahead.'],
  ];
  return (
    <Tile label="Transcript" meta="lead #1248">
      <div className="space-y-2.5">
        {lines.map(([agent, text], i) => (
          <div key={i} className={cn('flex', agent ? 'justify-start' : 'justify-end')}>
            <p
              className={cn(
                'max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-5',
                agent ? 'rounded-bl-md bg-white/[0.06] text-neutral-300' : 'rounded-br-md bg-primary/15 text-neutral-100'
              )}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </Tile>
  );
}

/* Deterministic concurrency grid: 0 idle, 1 dialling, 2 connected. */
const CELLS = Array.from({ length: 100 }, (_, i) => {
  const n = (i * 37 + 11) % 20;
  return n < 13 ? 2 : n < 17 ? 1 : 0;
});

export function ConcurrencyGrid({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1', className)}>
      {CELLS.map((c, i) => (
        <span
          key={i}
          className={cn(
            'aspect-square rounded-[3px]',
            c === 2 ? 'bg-primary' : c === 1 ? 'bg-white/30' : 'bg-white/[0.07]',
            c === 1 && i % 3 === 0 && 'animate-pulse'
          )}
        />
      ))}
    </div>
  );
}

function Campaign() {
  return (
    <Tile
      label="Lead source"
      meta={
        <>
          <Dot tone="brand" pulse /> Running
        </>
      }
    >
      <div className="text-[15px] font-medium text-neutral-50">Website quote form</div>
      <div className="mt-4 flex items-baseline justify-between text-xs">
        <span className="text-neutral-500">Called within a minute</span>
        <span className="font-mono tabular-nums text-neutral-300">1,398 / 1,412</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-[99%] rounded-full bg-white" />
      </div>
      <div className="mt-auto">
        <div className="mb-3 flex items-baseline justify-between text-xs">
          <span className="text-neutral-500">Concurrent calls</span>
          <span className="font-mono tabular-nums text-neutral-300">372 / 500</span>
        </div>
        <ConcurrencyGrid />
      </div>
    </Tile>
  );
}

/* Donut segments as [label, value, stroke colour]. */
const OUTCOMES: [string, number, string][] = [
  ['Booked', 128, 'var(--brand)'],
  ['Answered', 746, '#fafafa'],
  ['No answer', 392, '#737373'],
  ['Failed', 146, '#404040'],
];

function Outcomes() {
  const total = OUTCOMES.reduce((s, [, v]) => s + v, 0);
  const C = 2 * Math.PI * 42;
  let offset = 0;
  return (
    <Tile label="Call outcomes" meta="This month" className="flex-row items-center gap-7">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
          {OUTCOMES.map(([label, value, color]) => {
            const len = (value / total) * C;
            const seg = (
              <circle
                key={label}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="9"
                strokeDasharray={`${Math.max(len - 1.5, 0)} ${C}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-medium tabular-nums tracking-tight text-neutral-50">
            {total.toLocaleString('en-US')}
          </span>
          <span className="text-[11px] text-neutral-500">calls</span>
        </div>
      </div>
      <div className="flex-1">
        {OUTCOMES.map(([label, value, color]) => (
          <div key={label} className="flex items-center gap-2.5 border-b border-white/[0.06] py-2.5 text-[13px] last:border-b-0">
            <span className="size-2 rounded-sm" style={{ background: color }} />
            <span className="text-neutral-300">{label}</span>
            <span className="ml-auto font-mono tabular-nums text-neutral-500">{value}</span>
          </div>
        ))}
      </div>
    </Tile>
  );
}

function Recording() {
  return (
    <Tile label="Recording" meta="3:42">
      <div className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-black">
          <Play className="ml-0.5 size-4 fill-current" />
        </span>
        <Waveform played={0.38} className="flex-1" />
      </div>
      <div className="mt-2 flex justify-between pl-[60px] font-mono text-[11px] tabular-nums text-neutral-600">
        <span>1:24</span>
        <span>3:42</span>
      </div>
      <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">Summary</div>
        <p className="mt-2 text-[13px] leading-5 text-neutral-300">
          Requested a quote to replace a rooftop unit. Decision maker confirmed, wants it done this month. Site
          visit booked for Thursday at 10:00.
        </p>
      </div>
    </Tile>
  );
}

function Assistant() {
  return (
    <Tile
      label="Assistant"
      meta={
        <>
          <Dot tone="success" /> Active
        </>
      }
    >
      <div className="text-[15px] font-medium text-neutral-50">Ava · lead response</div>
      <div className="mt-3">
        <Row k="Voice" v="Warm, mid-tempo" />
        <Row k="Style" v="Natural" />
        <Row k="Objective" v="Book a meeting" />
        <Row k="Call length" v="Normal" />
      </div>
      <div className="mt-auto">
        <div className="mb-2.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600">Objections covered</div>
        <div className="flex flex-wrap gap-1.5">
          {['Too expensive', 'Send me an email', 'Not the right time', 'Already have a vendor'].map((o) => (
            <Badge key={o} variant="outline" className="border-white/10 bg-white/[0.03] font-normal text-neutral-300">
              {o}
            </Badge>
          ))}
        </div>
      </div>
    </Tile>
  );
}

const FEED: [string, string, boolean][] = [
  ['CONNECTED', 'lead #1247 · Denver, CO', true],
  ['DIALING', 'lead #1248 · Austin, TX', false],
  ['QUALIFIED', 'lead #1241 · booked Thu 10:00', true],
  ['OBJECTION HANDLED', 'lead #1239 · "too expensive"', false],
  ['VOICEMAIL', 'lead #1250 · retry queued', false],
  ['CONNECTED', 'lead #1252 · Lisbon, PT', true],
  ['DIALING', 'lead #1253 · Toronto, ON', false],
];

export function LiveFeed({ rows = FEED.length }: { rows?: number }) {
  return (
    <div className="space-y-[9px] font-mono text-[11.5px] leading-5">
      {FEED.slice(0, rows).map(([status, detail, hot], i) => (
        <div key={i} className="flex gap-2.5 whitespace-nowrap">
          <span className="tabular-nums text-neutral-700">{`14:0${i}:${String((i * 17 + 12) % 60).padStart(2, '0')}`}</span>
          <span className={hot ? 'text-brand-soft' : 'text-neutral-300'}>{status}</span>
          <span className="truncate text-neutral-500">{detail}</span>
        </div>
      ))}
    </div>
  );
}

function Feed() {
  return (
    <Tile
      label="Live feed"
      meta={
        <>
          <Dot tone="brand" pulse /> 372 active
        </>
      }
    >
      <LiveFeed />
    </Tile>
  );
}

const RATE_BARS: [string, number][] = [
  ['Mon', 54],
  ['Tue', 61],
  ['Wed', 58],
  ['Thu', 72],
  ['Fri', 66],
  ['Sat', 41],
  ['Sun', 38],
];

export function RateBars({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-3', className)}>
      {RATE_BARS.map(([day, v]) => (
        <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <div
            style={{ height: `${v}%` }}
            className={cn('w-full rounded-t-md', v === 72 ? 'bg-primary' : 'bg-white/15')}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">{day}</span>
        </div>
      ))}
    </div>
  );
}

function AnswerRate() {
  return (
    <Tile label="Answer rate" meta="By day">
      <div className="flex items-end gap-3">
        <span className="font-mono text-5xl font-medium tracking-[-0.03em] tabular-nums text-neutral-50">62%</span>
        <span className="mb-1.5 text-xs text-neutral-500">average this week</span>
      </div>
      <RateBars className="mt-6 min-h-0 flex-1" />
    </Tile>
  );
}

function Objection() {
  return (
    <Tile label="Objection handled" meta="lead #1239">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">Prospect</div>
        <p className="mt-1.5 text-[15px] leading-6 text-neutral-100">&ldquo;Honestly, it sounds too expensive.&rdquo;</p>
      </div>
      <div className="ml-6 mt-3 rounded-xl border border-primary/25 bg-primary/[0.08] p-4">
        <div className="font-mono text-[10px] uppercase tracking-wider text-brand-soft">Agent</div>
        <p className="mt-1.5 text-[13px] leading-5 text-neutral-200">
          Fair. That is why the visit is free and the quote comes with no obligation. Would Thursday at 10 work
          for a look?
        </p>
      </div>
      <div className="mt-auto flex items-center gap-2 text-xs text-neutral-400">
        <Check className="size-3.5 text-green-500" />
        Stayed on the call · booked Thu 10:00
      </div>
    </Tile>
  );
}

const PROVIDERS: [string, string, string, 'success' | 'dim'][] = [
  ['Twilio', 'Primary', '38 ms', 'success'],
  ['Plivo', 'Standby', '44 ms', 'success'],
  ['Vonage', 'Standby', '51 ms', 'success'],
];

export function ProviderRows() {
  return (
    <div>
      {PROVIDERS.map(([name, role, latency, tone]) => (
        <div key={name} className="flex items-center gap-3 border-b border-white/[0.06] py-3 text-[13px] last:border-b-0">
          <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-neutral-200">
            {name[0]}
          </span>
          <div>
            <div className="text-neutral-100">{name}</div>
            <div className="text-[11px] text-neutral-500">{role}</div>
          </div>
          <span className="ml-auto font-mono text-xs tabular-nums text-neutral-500">{latency}</span>
          <span className="flex w-16 items-center gap-2 text-xs text-neutral-300">
            <Dot tone={tone} /> Healthy
          </span>
        </div>
      ))}
    </div>
  );
}

function Providers() {
  return (
    <Tile label="Telephony" meta="Failover on">
      <ProviderRows />
      <p className="mt-auto text-xs leading-5 text-neutral-500">
        If the primary provider degrades, calls reroute to the next one. The campaign keeps running.
      </p>
    </Tile>
  );
}

function Confirmation() {
  return (
    <Tile label="Booked" meta="Just now" className="items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
        <Check className="size-6 text-brand-soft" />
      </span>
      <div className="mt-5 text-2xl font-semibold tracking-tight text-neutral-50">Thursday, 10:00 AM</div>
      <div className="mt-1.5 text-sm text-neutral-400">Maria Reyes · 30 min · Google Meet</div>
      <Badge variant="outline" className="mt-6 gap-2 border-white/10 bg-white/[0.03] py-1 font-normal text-neutral-300">
        <CalendarCheck className="size-3.5" />
        Added to Google Calendar
      </Badge>
    </Tile>
  );
}

function Usage() {
  return (
    <Tile label="Usage" meta="This month">
      <div className="flex items-end gap-3">
        <span className="font-mono text-5xl font-medium tracking-[-0.03em] tabular-nums text-neutral-50">6,214</span>
        <span className="mb-1.5 text-xs text-neutral-500">calling minutes</span>
      </div>
      <div className="mt-5">
        <Row k="Calls placed" v={<span className="font-mono tabular-nums">2,826</span>} />
        <Row k="Average call" v={<span className="font-mono tabular-nums">2.2 min</span>} />
        <Row k="Assistants" v={<span className="font-mono tabular-nums">4</span>} />
        <Row k="Seat licences" v={<span className="font-mono tabular-nums">0</span>} />
      </div>
    </Tile>
  );
}

export const HERO_TILES: ParallaxTile[] = [
  { title: 'Live call', content: <LiveCall /> },
  { title: 'Meetings booked', content: <Booked /> },
  { title: 'Leads', content: <Leads /> },
  { title: 'Calendar', content: <Calendar /> },
  { title: 'Transcript', content: <Transcript /> },
  { title: 'Lead source', content: <Campaign /> },
  { title: 'Call outcomes', content: <Outcomes /> },
  { title: 'Recording', content: <Recording /> },
  { title: 'Assistant', content: <Assistant /> },
  { title: 'Live feed', content: <Feed /> },
  { title: 'Answer rate', content: <AnswerRate /> },
  { title: 'Objection handled', content: <Objection /> },
  { title: 'Telephony', content: <Providers /> },
  { title: 'Booked', content: <Confirmation /> },
  { title: 'Usage', content: <Usage /> },
];
