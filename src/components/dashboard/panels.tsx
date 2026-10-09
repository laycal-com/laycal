'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp, Sparkline } from './charts';

/**
 * The dashboard's only two container shapes.
 *
 * The previous page mixed shadcn `Card` (shadow-lg, border-2), raw divs
 * (shadow-sm, border-gray-200) and gradient tiles on the same screen, which is
 * what made it read as unfinished. Everything here goes through `Panel`.
 */

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}

/** Percentage change against the previous window of equal length. */
export function DeltaBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">no prior data</span>;
  }

  const flat = Math.abs(value) < 0.05;
  const good = invert ? value < 0 : value > 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono text-xs font-medium tabular-nums',
        flat
          ? 'text-muted-foreground'
          : good
            ? 'text-green-600 dark:text-green-500'
            : 'text-red-600 dark:text-red-500'
      )}
    >
      <Icon className="h-3 w-3" />
      {flat ? '0%' : `${Math.abs(value)}%`}
    </span>
  );
}

export function StatCard({
  label,
  value,
  decimals = 0,
  prefix,
  suffix,
  delta,
  invertDelta,
  spark,
  color = 'var(--muted-foreground)',
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delta?: number | null;
  invertDelta?: boolean;
  spark?: number[];
  color?: string;
  icon: React.ComponentType<{ className?: string }>;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
    >
      <Panel className="h-full p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="font-mono text-[2rem] font-medium leading-none tracking-[-0.02em] text-foreground">
            <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          </p>
          {spark && spark.length > 1 && (
            <div className="hidden flex-none pb-0.5 sm:block">
              <Sparkline values={spark} color={color} width={88} height={28} />
            </div>
          )}
        </div>
        {delta !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <DeltaBadge value={delta} invert={invertDelta} />
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">vs previous period</span>
          </div>
        )}
      </Panel>
    </motion.div>
  );
}

/** Wraps a section so it fades in with the rest of the page rather than popping. */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
