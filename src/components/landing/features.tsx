import { Play } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { cn } from '@/lib/utils';
import { Reveal, Section, SectionHeader } from './primitives';
import { ConcurrencyGrid, ProviderRows, RateBars, Waveform } from './product-tiles';

/** Frame for the small product fragment at the top of each bento cell. */
function Fragment({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative flex min-h-[7.5rem] flex-1 flex-col justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-black p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

const FEATURES: { title: string; copy: string; span?: boolean; header: React.ReactNode }[] = [
  {
    title: 'An instant call on every lead',
    copy: 'Each new lead triggers its own call straight away. Bursts run in parallel, with retry rules for no-answers.',
    span: true,
    header: (
      <Fragment>
        <div className="mb-3 flex items-baseline justify-between font-mono text-[11px] text-neutral-500">
          <span>CONCURRENT CALLS</span>
          <span className="tabular-nums text-neutral-300">372 / 500</span>
        </div>
        <ConcurrencyGrid />
      </Fragment>
    ),
  },
  {
    title: 'Real-time dashboard',
    copy: 'Campaign health, live call states and outcomes without refreshing anything.',
    header: (
      <Fragment>
        <div className="font-mono text-[11px] text-neutral-500">MEETINGS BOOKED</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-medium tabular-nums tracking-tight text-neutral-50">128</span>
          <span className="font-mono text-[11px] text-green-500">+18.2%</span>
        </div>
        <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="mt-3 h-8 w-full">
          <path
            d="M0 32 C20 30 30 22 50 24 S80 14 100 16 S140 8 160 9 S190 3 200 2"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Fragment>
    ),
  },
  {
    title: 'Call recording hub',
    copy: 'Every conversation stored, searchable and shareable with the team.',
    header: (
      <Fragment>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
            <Play className="ml-0.5 size-3.5 fill-current" />
          </span>
          <Waveform bars={28} played={0.45} className="h-10 flex-1" />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[11px] tabular-nums text-neutral-600">
          <span>lead #1247</span>
          <span>1:24 / 3:42</span>
        </div>
      </Fragment>
    ),
  },
  {
    title: 'Performance analytics',
    copy: 'Answer rate, booking rate and cost per booked meeting, per assistant.',
    span: true,
    header: (
      <Fragment className="flex-row items-stretch justify-start gap-6">
        <div className="flex shrink-0 flex-col justify-center">
          <div className="font-mono text-[11px] text-neutral-500">ANSWER RATE</div>
          <div className="mt-1 font-mono text-3xl font-medium tabular-nums tracking-tight text-neutral-50">62%</div>
          <div className="mt-1 text-xs text-neutral-500">script v3</div>
        </div>
        <RateBars className="min-h-0 flex-1" />
      </Fragment>
    ),
  },
  {
    title: 'Multi-provider setup',
    copy: 'Bring your own telephony and voice providers, switch without rebuilding assistants.',
    span: true,
    header: (
      <Fragment className="justify-start py-1">
        <ProviderRows />
      </Fragment>
    ),
  },
  {
    title: 'AI voice customisation',
    copy: 'Voice, pace and personality tuned per assistant, then held consistent on every call.',
    header: (
      <Fragment className="gap-3">
        {[
          ['Pace', 'w-[58%]'],
          ['Warmth', 'w-[76%]'],
          ['Formality', 'w-[34%]'],
        ].map(([label, width]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-16 text-xs text-neutral-500">{label}</span>
            <div className="h-1 flex-1 rounded-full bg-white/10">
              <div className={cn('relative h-full rounded-full bg-white', width)}>
                <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-primary bg-white" />
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-1.5 pt-1">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 font-normal text-brand-soft">
            Natural
          </Badge>
          <Badge variant="outline" className="border-white/10 font-normal text-neutral-500">
            Sharp
          </Badge>
        </div>
      </Fragment>
    ),
  },
];

export function Features() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Platform"
        title="Everything between the form fill and the booked meeting."
        className="max-w-3xl"
      />
      <Reveal delay={0.1} className="mt-12 md:mt-14">
        <BentoGrid className="max-w-none md:auto-rows-[21rem]">
          {FEATURES.map((f) => (
            <BentoGridItem
              key={f.title}
              title={f.title}
              description={f.copy}
              header={f.header}
              className={f.span ? 'md:col-span-2' : undefined}
            />
          ))}
        </BentoGrid>
      </Reveal>
    </Section>
  );
}
