'use client';

import { ArrowRight, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
  const { rateLabel } = useRate();

  return (
    <Section id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="Pricing that tracks usage, not headcount."
        description="No seats and no monthly minimum. Exact rates are confirmed on your demo."
      />

      <div className="mt-12 grid items-stretch gap-5 md:mt-14 lg:grid-cols-3">
        <Reveal>
          <Card className={plan}>
            <Eyebrow>Free trial</Eyebrow>
            <div className="mt-5 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-neutral-50">
              Included with your invite
            </div>
            <div className="mt-2 text-sm text-neutral-500">1 assistant · 5 calls · no card</div>
            <FeatureList items={['Full dashboard access', 'Recordings and transcripts', 'Prompt builder', 'Google Calendar booking']} />
            <div className="mt-auto pt-8">
              <TextCta>Start free trial</TextCta>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className={cn(plan, 'relative border-primary/60 bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_100px_-30px_rgba(45,106,255,0.45)]')}>
            <Badge className="absolute -top-3 left-7 border-transparent bg-primary px-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white hover:bg-primary">
              Most teams
            </Badge>
            <Eyebrow className="text-brand-soft">Usage-based</Eyebrow>
            <div className="mt-5 flex items-baseline gap-2 text-neutral-50">
              <span className="text-sm text-neutral-400">from</span>
              <span className="text-5xl font-semibold tabular-nums tracking-[-0.03em]">{rateLabel}</span>
              <span className="text-lg text-neutral-400">/ min</span>
            </div>
            <div className="mt-2 text-sm text-neutral-400">no seats, no monthly minimum</div>
            <FeatureList
              strong
              items={[
                'Unlimited assistants',
                'Up to 500 concurrent calls',
                'Multi-provider routing',
                'Analytics and recording hub',
                'Google Calendar booking',
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

        <Reveal delay={0.16}>
          <Card className={plan}>
            <Eyebrow>Enterprise</Eyebrow>
            <div className="mt-5 text-5xl font-semibold leading-none tracking-[-0.03em] text-neutral-50">Custom</div>
            <div className="mt-2 text-sm text-neutral-500">volume rates · agencies</div>
            <FeatureList items={['Committed-volume pricing', 'Dedicated provider capacity', 'Sub-accounts for clients', 'Priority support and SLA']} />
            <div className="mt-auto pt-8">
              <TextCta>Talk to sales</TextCta>
            </div>
          </Card>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-8 grid gap-6 border-t border-white/[0.08] pt-8 text-sm leading-6 text-neutral-500 md:grid-cols-3 md:gap-12">
        <p>
          <span className="text-neutral-200">Invite-only.</span> Accounts are provisioned by us after the demo. There is
          no open signup.
        </p>
        <p>
          <span className="text-neutral-200">Spend per minute.</span> Billing is call minutes plus provider
          pass-through.
        </p>
        <p>
          <span className="text-neutral-200">See it per assistant.</span> Cost per booked meeting on the dashboard.
        </p>
      </Reveal>
    </Section>
  );
}
