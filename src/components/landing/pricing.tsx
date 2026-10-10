'use client';

import { ArrowRight, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DEMO_URL } from '@/lib/links';
import { cn } from '@/lib/utils';
import { useRate } from './providers';
import { Eyebrow, Reveal, Section, SectionHeader } from './primitives';

function FeatureList({ items, strong = false }: { items: string[]; strong?: boolean }) {
  return (
    <ul className="mt-7 space-y-3 text-sm">
      {items.map((f) => (
        <li key={f} className={cn('flex items-start gap-3', strong ? 'text-neutral-200' : 'text-neutral-400')}>
          <Check className={cn('mt-0.5 size-4 shrink-0', strong ? 'text-brand-soft' : 'text-neutral-600')} />
          {f}
        </li>
      ))}
    </ul>
  );
}

function TextCta({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-neutral-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      {children}
      <ArrowRight className="size-4 transition-transform duration-200 group-hover/link:translate-x-0.5" />
    </a>
  );
}

const plan = 'flex h-full flex-col rounded-2xl border-white/[0.08] bg-neutral-950 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-8';

export function Pricing() {
  const { rateLabel, assistantFee } = useRate();

  return (
    <Section id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="Pay for the calls. Nothing else."
        description="One pay-as-you-go model. No plans, no seats and no monthly minimum."
      />

      <div className="mt-12 grid items-stretch gap-5 md:mt-14 lg:grid-cols-3">
        <Reveal>
          <Card className={cn(plan, 'relative border-primary/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_100px_-30px_rgba(45,106,255,0.45)]')}>
            <Eyebrow className="text-brand-soft">Calls</Eyebrow>
            <div className="mt-5 flex items-baseline gap-2 text-neutral-50">
              <span className="text-sm text-neutral-400">from</span>
              <span className="text-5xl font-semibold tabular-nums tracking-[-0.03em]">{rateLabel}</span>
              <span className="text-lg text-neutral-400">/ min</span>
            </div>
            <div className="mt-2 text-sm text-neutral-400">billed per second of talk time</div>
            <FeatureList
              strong
              items={[
                'Your rate is agreed on the demo',
                'Prepaid credits, top up any time',
                'No seats and no monthly minimum',
                'Up to 500 calls at the same time',
              ]}
            />
            <div className="mt-auto pt-8">
              <Button asChild className="group/cta h-11 w-full gap-2 rounded-full text-[15px] transition-[transform,background-color] duration-200 active:scale-[0.98]">
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Book a demo
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </a>
              </Button>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className={plan}>
            <Eyebrow>Assistants</Eyebrow>
            <div className="mt-5 text-5xl font-semibold leading-none tracking-[-0.03em] text-neutral-50">
              First one free
            </div>
            <div className="mt-3 text-sm text-neutral-500">then ${assistantFee} each, one time</div>
            <FeatureList
              items={[
                'One assistant per use case or brand',
                'Your script, questions and objections',
                'Voice and pace set per assistant',
                'No monthly fee per assistant',
              ]}
            />
          </Card>
        </Reveal>

        <Reveal delay={0.16}>
          <Card className={plan}>
            <Eyebrow>Included</Eyebrow>
            <div className="mt-5 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-neutral-50">
              Everything in the product
            </div>
            <div className="mt-2 text-sm text-neutral-500">on every account</div>
            <FeatureList
              items={[
                'Google Calendar booking',
                'Recordings, transcripts and summaries',
                'Bring your own Twilio, Plivo or Vonage',
                'Dashboard and analytics',
              ]}
            />
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8 grid gap-6 border-t border-white/[0.08] pt-8 text-sm leading-6 text-neutral-500 md:grid-cols-3 md:gap-12">
        <p>
          <span className="text-neutral-200">Invite-only.</span> Accounts are provisioned by us after the demo. There is
          no open signup.
        </p>
        <p>
          <span className="text-neutral-200">Prepaid.</span> Calls stop when your balance reaches zero, so there are no
          surprise bills.
        </p>
        <p>
          <span className="text-neutral-200">See it per assistant.</span> Cost per booked meeting on the dashboard.
        </p>
      </Reveal>
    </Section>
  );
}
