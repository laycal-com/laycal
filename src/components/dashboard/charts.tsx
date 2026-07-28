'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Hand-rolled SVG charts.
 *
 * The app already ships framer-motion and nothing else needed a charting
 * library, so these are ~300 lines of SVG rather than another ~100kB
 * dependency. They also inherit the dashboard's exact palette and easing,
 * which is most of what made the old page feel stitched together.
 *
 * Everything measures its own width instead of leaning on a viewBox, because
 * `preserveAspectRatio="none"` stretches stroke widths and text along with the
 * geometry.
 */

/** Container width, tracked so charts can lay out in real pixels. */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

interface Point {
  x: number;
  y: number;
}

/**
 * Monotone cubic interpolation — smooth, but provably never overshoots the
 * data. A plain cardinal spline dips below zero between two low points, which
 * on an area chart paints fill underneath the baseline.
 */
function smoothPath(pts: Point[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    slope[i] = (pts[i + 1].y - pts[i].y) / (dx[i] || 1);
  }

  const tangent = new Array<number>(n);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      tangent[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      tangent[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${pts[i].x + h} ${pts[i].y + tangent[i] * h} ${pts[i + 1].x - h} ${
      pts[i + 1].y - tangent[i + 1] * h
    } ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return d;
}

/* -------------------------------------------------------------------------- */
/* Trend chart                                                                */
/* -------------------------------------------------------------------------- */

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: Array<Record<string, any> & { date: string }>;
  series: TrendSeries[];
  height?: number;
  /** Formats the x-axis tick and tooltip heading. */
  formatDate?: (iso: string) => string;
}

const PAD = { top: 16, right: 12, bottom: 26, left: 34 };

export function TrendChart({ data, series, height = 260, formatDate }: TrendChartProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const fmt =
    formatDate ??
    ((iso: string) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

  const plotW = Math.max(width - PAD.left - PAD.right, 10);
  const plotH = height - PAD.top - PAD.bottom;

  const max = useMemo(() => {
    const peak = Math.max(
      1,
      ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0))
    );
    // Round up to something a human would pick for the axis.
    const step = Math.pow(10, Math.floor(Math.log10(peak)));
    return Math.ceil(peak / step) * step;
  }, [data, series]);

  const xAt = useCallback(
    (i: number) => PAD.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    [data.length, plotW]
  );
  const yAt = useCallback((v: number) => PAD.top + plotH - (v / max) * plotH, [max, plotH]);

  const paths = useMemo(
    () =>
      series.map((s) => {
        const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(Number(d[s.key]) || 0) }));
        const line = smoothPath(pts);
        const area = pts.length
          ? `${line} L ${pts[pts.length - 1].x} ${PAD.top + plotH} L ${pts[0].x} ${
              PAD.top + plotH
            } Z`
          : '';
        return { ...s, line, area, pts };
      }),
    [series, data, xAt, yAt, plotH]
  );

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - box.left;
    const i = Math.round((rel / Math.max(box.width, 1)) * (data.length - 1));
    setHover(Math.min(Math.max(i, 0), data.length - 1));
  };

  // Tick every Nth label, so a 90-day range doesn't turn the axis into a smear.
  // The last day always gets a tick; if the preceding regular tick would sit on
  // top of it, that one is dropped rather than letting the two labels collide.
  const tickIndices = useMemo(() => {
    const every = Math.max(1, Math.ceil(data.length / (width > 640 ? 8 : 4)));
    const last = data.length - 1;
    const ticks: number[] = [];
    for (let i = 0; i <= last; i += every) ticks.push(i);
    if (ticks[ticks.length - 1] !== last) {
      if (last - ticks[ticks.length - 1] < every * 0.6) ticks.pop();
      ticks.push(last);
    }
    return new Set(ticks);
  }, [data.length, width]);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            {paths.map((p) => (
              <linearGradient key={p.key} id={`trend-fill-${p.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={p.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {gridLines.map((g) => {
            const y = PAD.top + plotH * g;
            const value = Math.round(max * (1 - g));
            return (
              <g key={g}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                  strokeDasharray={g === 1 ? undefined : '3 4'}
                />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                  {value}
                </text>
              </g>
            );
          })}

          {data.map((d, i) =>
            tickIndices.has(i) ? (
              <text
                key={d.date}
                x={xAt(i)}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {fmt(d.date)}
              </text>
            ) : null
          )}

          {paths.map((p, idx) => (
            <g key={p.key}>
              <motion.path
                d={p.area}
                fill={`url(#trend-fill-${p.key})`}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 + idx * 0.08 }}
              />
              <motion.path
                d={p.line}
                fill="none"
                stroke={p.color}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: idx * 0.08 }}
              />
            </g>
          ))}

          {hover !== null && (
            <g pointerEvents="none">
              <line
                x1={xAt(hover)}
                x2={xAt(hover)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              {paths.map((p) => (
                <circle
                  key={p.key}
                  cx={p.pts[hover]?.x}
                  cy={p.pts[hover]?.y}
                  r={4.5}
                  fill="#fff"
                  stroke={p.color}
                  strokeWidth={2.5}
                />
              ))}
            </g>
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {hover !== null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
          style={{
            top: PAD.top,
            // Flip to the left half once the cursor passes the midpoint, so the
            // card never hangs off the panel.
            left: hover > data.length / 2 ? undefined : Math.min(xAt(hover) + 14, width - 20),
            right: hover > data.length / 2 ? Math.max(width - xAt(hover) + 14, 8) : undefined,
          }}
        >
          <p className="mb-1.5 text-xs font-medium text-slate-500">{fmt(data[hover].date)}</p>
          {series.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold text-slate-900">{data[hover][s.key] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Donut                                                                      */
/* -------------------------------------------------------------------------- */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  size = 168,
  thickness = 16,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const reduceMotion = useReducedMotion();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments.map((s) => {
    const fraction = total > 0 ? s.value / total : 0;
    const arc = { ...s, fraction, start: offset };
    offset += fraction;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {total > 0 &&
            arcs.map((a, i) => (
              <motion.circle
                key={a.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={a.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                // A 2px gap keeps adjacent segments legible without a separate
                // stroke; the rounded cap already eats about that much.
                strokeDasharray={`${Math.max(a.fraction * circumference - 2, 0)} ${circumference}`}
                strokeDashoffset={-a.start * circumference}
                initial={reduceMotion ? false : { opacity: 0, strokeDasharray: `0 ${circumference}` }}
                animate={{
                  opacity: 1,
                  strokeDasharray: `${Math.max(a.fraction * circumference - 2, 0)} ${circumference}`,
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.1 }}
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-slate-900">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-slate-500">{centerLabel}</span>}
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="flex-none tabular-nums font-medium text-slate-900">
              {s.value}
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                {total > 0 ? Math.round((s.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bar list                                                                   */
/* -------------------------------------------------------------------------- */

export interface BarRow {
  label: string;
  sublabel?: string;
  value: number;
  secondary?: number;
  color?: string;
}

export function BarList({ rows, valueSuffix = '' }: { rows: BarRow[]; valueSuffix?: string }) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <ul className="space-y-4">
      {rows.map((row, i) => (
        <li key={row.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-slate-700">{row.label}</span>
            <span className="flex-none text-sm tabular-nums text-slate-900">
              {row.value}
              {valueSuffix}
              {row.sublabel && <span className="ml-2 text-xs text-slate-400">{row.sublabel}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: row.color || '#2563eb' }}
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.07 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Sparkline                                                                  */
/* -------------------------------------------------------------------------- */

export function Sparkline({
  values,
  color = '#2563eb',
  width = 96,
  height = 30,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (values.length < 2) return <div style={{ width, height }} />;

  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * (width - 2) + 1,
    y: height - 3 - (v / max) * (height - 6),
  }));

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={smoothPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Counter                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Counts up on mount and re-runs whenever the value changes, so switching the
 * date range re-animates. The shared `ui/animated-counter` only fires once on
 * intersection, which leaves stale numbers when the range switches.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 900,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(value);
      return;
    }
    const from = fromRef.current;
    let raf = 0;
    let start: number | null = null;

    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduceMotion]);

  return (
    <span className="tabular-nums">
      {prefix}
      {shown.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
