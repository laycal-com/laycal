'use client';

import { useMemo, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useRate } from './providers';
import { Reveal, Section, SectionHeader } from './primitives';

const MINUTES_PER_CALL = 2.2;

const money = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

function Control({
  title,
  display,
  value,
  min,
  max,
  step,
  onChange,
}: {
  title: string;
  display: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-neutral-300">{title}</span>
        <span className="font-mono text-sm tabular-nums text-neutral-50">{display}</span>
      </div>
      <Slider
        aria-label={title}
        className="mt-4"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function Roi() {
  const { rate, rateLabel } = useRate();
  const [leads, setLeads] = useState(400);
  const [reachedNow, setReachedNow] = useState(35);
  const [reachedFast, setReachedFast] = useState(60);
  const [bookRate, setBookRate] = useState(25);
  const [value, setValue] = useState(400);

  // Every figure is the visitor's own assumption. Nothing here is a benchmark.
  const { extraMeetings, extraValue, laycalCost } = useMemo(() => {
    const gain = Math.max(0, reachedFast - reachedNow) / 100;
    const meetings = leads * gain * (bookRate / 100);
    return {
      extraMeetings: meetings,
      extraValue: meetings * value,
      laycalCost: leads * MINUTES_PER_CALL * rate,
    };
  }, [leads, reachedNow, reachedFast, bookRate, value, rate]);

  const results: [string, string, boolean][] = [
    ['Extra meetings', `${Math.round(extraMeetings).toLocaleString('en-US')}/mo`, false],
    ['Laycal cost', `${money(laycalCost)}/mo`, false],
    ['Extra value', `${money(extraValue)}/mo`, true],
  ];

  return (
    <Section id="roi">
      <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <SectionHeader
          eyebrow="Calculator"
          title="What slow follow-up costs you."
          description="Put in your own numbers: how many leads you get, how many you reach today, and how many you think you would reach if every one were called in the first minute."
        />

        <Reveal delay={0.1}>
          <Card className="rounded-2xl border-white/[0.08] bg-neutral-950 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-8">
            <div className="space-y-7">
              <Control title="New leads per month" display={leads.toLocaleString('en-US')} value={leads} min={50} max={5000} step={50} onChange={setLeads} />
              <Control title="Leads you reach today" display={`${reachedNow}%`} value={reachedNow} min={5} max={90} step={5} onChange={setReachedNow} />
              <Control
                title="Leads you would reach calling within a minute"
                display={`${reachedFast}%`}
                value={reachedFast}
                min={10}
                max={95}
                step={5}
                onChange={setReachedFast}
              />
              <Control title="Reached leads that book" display={`${bookRate}%`} value={bookRate} min={5} max={60} step={5} onChange={setBookRate} />
              <Control title="Value of a booked meeting" display={money(value)} value={value} min={50} max={5000} step={50} onChange={setValue} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/[0.08] pt-7 sm:grid-cols-3">
              {results.map(([label, v, highlight]) => (
                <div key={label}>
                  <div className={cn('font-mono text-[11px] uppercase tracking-[0.08em]', highlight ? 'text-brand-soft' : 'text-neutral-500')}>
                    {label}
                  </div>
                  <div
                    className={cn(
                      'mt-2 font-mono text-[1.75rem] font-medium leading-none tabular-nums tracking-[-0.02em]',
                      highlight ? 'text-brand-soft' : 'text-neutral-50'
                    )}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs leading-5 text-neutral-600">
              Uses your own estimates above. Laycal cost assumes one {MINUTES_PER_CALL}-minute call per lead at{' '}
              {rateLabel}/min. Indicative only. Your rates are confirmed on the demo.
            </p>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
