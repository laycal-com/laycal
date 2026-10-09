'use client';

import { BarChart3, CalendarDays, LayoutDashboard, Mic, Settings, Users } from 'lucide-react';

import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { cn } from '@/lib/utils';
import { Dot, Eyebrow } from './primitives';
import { LiveFeed } from './product-tiles';

const KPIS: [string, string, string][] = [
  ['Leads in', '1,412', '+12.4%'],
  ['Answer rate', '62%', '+4.1%'],
  ['Qualified', '340', '+22.0%'],
  ['Meetings booked', '128', '+18.2%'],
];

const CALLS: [string, string, 'success' | 'brand' | 'neutral' | 'dim', string, string][] = [
  ['Maria Reyes', 'Booked', 'success', '4:12', 'Thu 10:00'],
  ['James Okafor', 'Calling', 'brand', '0:48', '—'],
  ['Priya Nair', 'Qualified', 'neutral', '3:05', 'Follow-up'],
  ['Tom Becker', 'Voicemail', 'dim', '0:21', 'Retry queued'],
];

const RAIL = [LayoutDashboard, Users, Mic, CalendarDays, BarChart3, Settings];

/** A dashboard built from real DOM so it stays sharp at any size. Figures are illustrative. */
function DashboardPreview() {
  return (
    <div className="flex h-full text-left">
      <div className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-white/[0.06] py-4 md:flex">
        <span className="mb-4 flex size-7 items-center justify-center rounded-md bg-primary">
          <span className="size-2 rounded-full bg-white" />
        </span>
        {RAIL.map((Icon, i) => (
          <span
            key={i}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg',
              i === 0 ? 'bg-white/[0.08] text-white' : 'text-neutral-600'
            )}
          >
            <Icon className="size-4" />
          </span>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 md:gap-4 md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-neutral-50 md:text-base">Dashboard</div>
            <div className="hidden text-xs text-neutral-500 md:block">Website quote form · last 30 days</div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] p-0.5 font-mono text-[10px] text-neutral-500">
            {['7d', '30d', '90d'].map((r) => (
              <span key={r} className={cn('rounded-full px-2.5 py-1', r === '30d' && 'bg-white/10 text-white')}>
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {KPIS.map(([label, value, delta]) => (
            <div key={label} className="rounded-xl border border-white/[0.08] bg-neutral-950 p-3 md:p-4">
              <div className="truncate text-[11px] text-neutral-500">{label}</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-lg font-medium tabular-nums tracking-tight text-neutral-50 md:text-2xl">
                  {value}
                </span>
                <span className="font-mono text-[10px] text-green-500">{delta}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex min-h-0 flex-col rounded-xl border border-white/[0.08] bg-neutral-950 p-3 md:col-span-2 md:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-300">Activity</span>
              <span className="flex items-center gap-4 text-[10px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-primary" /> Calls
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-white/70" /> Answered
                </span>
              </span>
            </div>
            <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="mt-3 min-h-0 w-full flex-1" aria-hidden="true">
              <defs>
                <linearGradient id="reveal-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--brand)" stopOpacity="0.3" />
                  <stop offset="1" stopColor="var(--brand)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[40, 90, 140, 190].map((y) => (
                <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="white" strokeOpacity="0.06" vectorEffect="non-scaling-stroke" />
              ))}
              <path
                d="M0 150 C50 140 80 118 130 122 S210 84 260 90 S340 58 400 62 S500 30 600 22 L600 200 L0 200 Z"
                fill="url(#reveal-area)"
              />
              <path
                d="M0 150 C50 140 80 118 130 122 S210 84 260 90 S340 58 400 62 S500 30 600 22"
                fill="none"
                stroke="var(--brand)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 172 C50 166 80 150 130 154 S210 128 260 132 S340 108 400 112 S500 88 600 80"
                fill="none"
                stroke="white"
                strokeOpacity="0.7"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="hidden min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-950 p-4 md:flex">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-neutral-300">Live feed</span>
              <span className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
                <Dot tone="brand" pulse /> 372 active
              </span>
            </div>
            <LiveFeed rows={6} />
          </div>
        </div>

        <div className="hidden rounded-xl border border-white/[0.08] bg-neutral-950 md:block">
          {CALLS.map(([name, status, tone, time, next]) => (
            <div
              key={name}
              className="grid grid-cols-[1.4fr_1fr_0.6fr_1fr] items-center gap-4 border-b border-white/[0.05] px-4 py-2.5 text-[13px] last:border-b-0"
            >
              <span className="text-neutral-100">{name}</span>
              <span className="flex items-center gap-2 text-neutral-300">
                <Dot tone={tone} pulse={status === 'Calling'} />
                {status}
              </span>
              <span className="font-mono text-xs tabular-nums text-neutral-500">{time}</span>
              <span className="text-right text-neutral-500">{next}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductReveal() {
  return (
    <section aria-labelledby="reveal-title" className="relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="mx-auto max-w-4xl px-2 pb-6 md:pb-10">
            <Eyebrow>Command center</Eyebrow>
            <h2
              id="reveal-title"
              className="mt-4 text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-50 md:text-[2.75rem]"
            >
              Every call, visible while it happens.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-neutral-400 md:text-lg">
              No black box. Watch each lead get called, read the transcript, pull the recording the second the call ends.
            </p>
          </div>
        }
      >
        <DashboardPreview />
      </ContainerScroll>
    </section>
  );
}
