'use client';

import { Area, AreaChart, CartesianGrid, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

/**
 * Dashboard charts on shadcn's chart primitives. Colours come from the
 * --chart-* tokens: the accent for the series that matters, neutrals for the
 * rest, so no chart introduces a hue of its own.
 */

/* -------------------------------- activity -------------------------------- */

export const ACTIVITY_CONFIG = {
  booked: { label: 'Booked', color: 'var(--chart-1)' },
  calls: { label: 'Calls', color: 'var(--chart-2)' },
  leads: { label: 'Leads', color: 'var(--chart-4)' },
} satisfies ChartConfig;

type ActivityPoint = { date: string; leads: number; calls: number; booked: number };

/** Day keys are YYYY-MM-DD in the viewer's zone; parse at noon so no offset can shift the date. */
const dayLabel = (key: string, long = false) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, long ? { weekday: 'short', month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });

export function ActivityChart({ data, className }: { data: ActivityPoint[]; className?: string }) {
  const total = data.reduce(
    (acc, d) => ({ leads: acc.leads + d.leads, calls: acc.calls + d.calls, booked: acc.booked + d.booked }),
    { leads: 0, calls: 0, booked: 0 }
  );

  return (
    <ChartContainer
      config={ACTIVITY_CONFIG}
      className={cn('aspect-auto h-[340px] w-full', className)}
      role="img"
      aria-label={`Daily activity over ${data.length} days: ${total.leads} leads, ${total.calls} calls, ${total.booked} visits booked.`}
    >
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-booked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-booked)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-booked)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.6} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={40}
          tickFormatter={(v) => dayLabel(v)}
          className="font-mono text-[11px]"
        />
        <YAxis
          width={32}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          allowDecimals={false}
          tickCount={4}
          className="font-mono text-[11px]"
        />
        <ChartTooltip
          cursor={{ strokeOpacity: 0.4 }}
          content={<ChartTooltipContent indicator="line" labelFormatter={(v) => dayLabel(String(v), true)} />}
        />
        <Area dataKey="leads" type="monotone" stroke="var(--color-leads)" strokeWidth={1.5} fill="none" dot={false} animationDuration={500} />
        <Area dataKey="calls" type="monotone" stroke="var(--color-calls)" strokeOpacity={0.75} strokeWidth={1.5} fill="none" dot={false} animationDuration={500} />
        <Area dataKey="booked" type="monotone" stroke="var(--color-booked)" strokeWidth={2} fill="url(#fill-booked)" dot={false} animationDuration={500} />
      </AreaChart>
    </ChartContainer>
  );
}

export function ActivityLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {Object.values(ACTIVITY_CONFIG).map((s) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* --------------------------------- outcomes -------------------------------- */

export type OutcomeSegment = { key: string; label: string; value: number; color: string };

export function OutcomesDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: OutcomeSegment[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const config = Object.fromEntries(segments.map((s) => [s.key, { label: s.label, color: s.color }])) satisfies ChartConfig;
  const data = segments.map((s) => ({ name: s.key, value: s.value, fill: s.color }));

  return (
    <div>
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-[184px]"
        role="img"
        aria-label={`Lead status: ${segments.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(', ')}.`}
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="name" />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={84}
            paddingAngle={segments.length > 1 ? 2 : 0}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
            animationDuration={500}
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null;
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={cx} y={cy - 4} className="fill-foreground font-mono text-2xl font-medium">
                      {centerValue}
                    </tspan>
                    <tspan x={cx} y={cy + 18} className="fill-muted-foreground text-xs">
                      {centerLabel}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="mt-5">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 border-b border-border py-2 text-sm last:border-b-0">
            <span className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.label}</span>
            <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
              {s.value.toLocaleString()}
              <span className="ml-2 inline-block w-9 text-right">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- assistants ------------------------------- */

export type AssistantRow = { id: string; label: string; sublabel: string; value: number; active: boolean };

export function AssistantBars({ rows }: { rows: AssistantRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-4">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
              <span className={cn('size-1.5 shrink-0 rounded-full', r.active ? 'bg-green-500' : 'bg-muted-foreground/40')} />
              <span className="truncate">{r.label}</span>
              {!r.active && <span className="shrink-0 text-xs text-muted-foreground">paused</span>}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {r.sublabel}
              <span className="ml-3 font-mono text-sm tabular-nums text-foreground">{r.value}</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-[width] duration-500 ease-out', i === 0 ? 'bg-primary' : 'bg-foreground/70')}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
