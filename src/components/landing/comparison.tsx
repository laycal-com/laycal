'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  ListChecks,
  ListX,
  Minus,
  PhoneOutgoing,
  TrendingDown,
  Users,
  Webhook,
} from 'lucide-react';

import { LogoMark } from '@/components/brand/logo-mark';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DemoCta, Dot, Eyebrow, GhostLink, Reveal, Section, SectionHeader, Shell } from './primitives';
import { CardGrid, surface, type Item } from './solution';

type Comparison = {
  name: string;
  /** A wordmark, wider than tall. `light` says which chip it reads on: dark artwork needs the light one. */
  logo: { src: string; width: number; height: number; chip: 'light' | 'dark' };
  /** One line under the name on the /compare index. */
  category: string;
  summary: string;
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  fit: { title: string; description: string; them: string[]; laycal: string[] };
  table: { title: string; rows: [string, string, string][]; source: string };
  /** A section of three cards after the table: the steps to start, or where Laycal does not fit. */
  cards: { eyebrow: string; title: string; numbered: boolean; items: Item[] };
};

/**
 * Content for the comparison pages. Claims about the other product are limited
 * to what its own site states, with the date checked in `table.source`.
 */
const COMPARISONS = {
  justcall: {
    name: 'JustCall',
    logo: { src: '/assets/justcall.svg', width: 532, height: 135, chip: 'light' },
    category: 'Cloud phone system and dialer',
    summary:
      'JustCall is a per-seat cloud phone system for support and sales teams. Laycal is usage-based AI calling that follows up new leads automatically. Different pricing model, different primary job.',
    eyebrow: 'Laycal vs JustCall',
    title: 'The JustCall alternative for',
    accent: 'automated lead follow-up.',
    intro:
      'Pay per calling minute, not per seat. An AI agent calls every new lead within a minute, with no reps required.',
    fit: {
      title: 'First, an honest point: these are different tools.',
      description:
        'JustCall is a cloud phone system: your team gets numbers, a dialer, SMS and CRM integrations, and your reps make and take the calls. Laycal is a speed-to-lead platform: when a new lead submits a form, an AI voice agent calls them within a minute, qualifies them and books the meeting on your calendar. Many businesses use one, the other, or both.',
      them: [
        'Your reps need a business phone system with their own numbers',
        'You want SMS, call recording and IVR for a support or sales team',
        'Per-seat pricing fits how your team works',
        'You need deep CRM integrations for manual calling workflows',
      ],
      laycal: [
        'Inbound leads wait hours, or days, for a first call',
        'You want every new lead called in under a minute, 24/7',
        'You don’t have reps available to dial every form fill',
        'You want AI to qualify and book meetings, not just connect calls',
        'You prefer usage-based pricing with no seat licenses',
      ],
    },
    table: {
      title: 'Pricing models compared.',
      rows: [
        [
          'Pricing model',
          'Per-seat subscription: $29–$89 per user/month billed annually, 2-seat minimum',
          'Usage-based: per calling minute, no seat licenses',
        ],
        ['AI voice agent', 'Available as a paid add-on', 'The core product: every account is AI calling'],
        [
          'Who makes the calls',
          'Your team, manually or via dialer',
          'The AI agent, automatically, the moment a lead arrives',
        ],
        ['Contracts', 'Monthly or annual billing (annual is discounted)', 'No contracts'],
      ],
      source:
        'JustCall plan details from justcall.io/pricing, checked October 2026. Laycal is pay as you go, per calling minute.',
    },
    cards: {
      eyebrow: 'Getting started',
      title: 'What switching to Laycal looks like.',
      numbered: true,
      items: [
        {
          icon: Webhook,
          title: 'Connect a lead source',
          copy: 'Website forms, ad lead forms via webhook, your CRM, or a CSV upload of an existing list.',
        },
        {
          icon: ListChecks,
          title: 'Set the script',
          copy: 'Qualifying questions, objections to expect, and what gets booked. You control the prompt.',
        },
        {
          icon: CalendarCheck,
          title: 'Every lead gets called',
          copy: 'Within a minute of submission, day or night. Qualified leads land on your Google Calendar.',
        },
      ],
    },
  },
  nooks: {
    name: 'Nooks',
    logo: { src: '/assets/nooks.avif', width: 229, height: 62, chip: 'dark' },
    category: 'Sales platform for SDR teams',
    summary:
      'Nooks is built for sales development teams: prospecting, dialing and coaching for reps. Laycal covers the leads that come to you: every new form submission gets an AI call within a minute, without a sales team behind it.',
    eyebrow: 'Laycal vs Nooks',
    title: 'The Nooks alternative for',
    accent: 'inbound lead response.',
    intro:
      'Nooks helps SDR teams dial out faster. Laycal makes sure no inbound lead ever waits for a call. Different problems. Here’s how to tell which one you have.',
    fit: {
      title: 'Outbound dialer vs. inbound speed to lead.',
      description:
        'Nooks describes itself as an agent platform for go-to-market teams: AI prospecting, dialing and sequencing for reps, with coaching and revenue intelligence for their managers. It is built around a sales development team. Laycal does one job: when a lead comes to you through a form or an ad, an AI voice agent calls them within a minute, qualifies them and books the meeting. If you don’t have, or don’t want, an SDR team, a tool for SDRs solves a problem you don’t have.',
      them: [
        'You run an outbound SDR or BDR team',
        'Reps work through cold call lists every day',
        'You want call coaching and a virtual salesfloor',
        'You’re comfortable with sales-led, enterprise-style buying',
      ],
      laycal: [
        'Your leads come to you: website forms, ad lead forms, your CRM',
        'Leads go cold before anyone calls them back',
        'You want every lead called in under a minute, 24/7, without hiring',
        'You want qualification and calendar booking, not just connected calls',
        'You want to pay per calling minute, with no seat licenses',
      ],
    },
    table: {
      title: 'Nooks vs Laycal at a glance.',
      rows: [
        ['Primary job', 'Prospecting, dialing and coaching for SDR teams', 'Instant AI follow-up on inbound leads'],
        ['Who it replaces or augments', 'Augments SDR reps', 'Replaces the manual first call entirely'],
        [
          'Pricing model',
          'No published prices. Its pricing page offers a custom quote after you talk to the team',
          'Pay as you go, per calling minute, with no seat licenses and no contracts. Your rate is confirmed on the demo',
        ],
        ['Typical buyer', 'VP Sales at a company with an SDR org', 'Owner or operator who pays for leads'],
        ['Time to first call', 'When a rep is available to dial', 'Under a minute, 24/7'],
      ],
      source: 'Nooks details checked on nooks.ai in October 2026.',
    },
    cards: {
      eyebrow: 'An honest fit check',
      title: 'When Laycal is not the right tool.',
      numbered: false,
      items: [
        {
          icon: PhoneOutgoing,
          title: 'You need a dialer for cold outbound',
          copy: 'Laycal is built for responding to leads who raised their hand, not for working cold lists at scale. A tool built for sales development teams, like Nooks, is the right category for that.',
        },
        {
          icon: Users,
          title: 'You want reps on live calls',
          copy: 'Laycal’s agent handles the first call itself and hands off a booked meeting, not a warm transfer queue.',
        },
        {
          icon: TrendingDown,
          title: 'You get a handful of leads a month',
          copy: 'Speed-to-lead automation pays off when every missed or slow lead is real lost revenue.',
        },
      ],
    },
  },
} satisfies Record<string, Comparison>;

export type ComparisonSlug = keyof typeof COMPARISONS;

/* --------------------------------- pieces --------------------------------- */

function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_100%)]" />
      <div className="absolute -top-40 left-1/2 size-[24rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px] md:-top-64 md:size-[44rem] md:blur-[140px]" />
    </div>
  );
}

const headline =
  'text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl';
const lede = 'text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]';
const badge =
  'inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-300 backdrop-blur';

/** The other product's wordmark on a chip that suits its artwork. */
function TheirLogo({ c, className }: { c: Comparison; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 shrink-0 items-center justify-center rounded-lg px-2.5',
        c.logo.chip === 'light' ? 'bg-white' : 'border border-white/10 bg-white/[0.04]',
        className
      )}
    >
      <Image src={c.logo.src} alt="" width={c.logo.width} height={c.logo.height} className="h-4 w-auto" />
    </span>
  );
}

function OurLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]',
        className
      )}
    >
      <LogoMark className="h-5" />
    </span>
  );
}

function Hero({ c }: { c: Comparison }) {
  return (
    <section className="relative overflow-hidden">
      <Backdrop />
      <Shell className="relative pb-12 pt-36 text-center md:pb-16 md:pt-44">
        <Reveal>
          <div className={badge}>
            <Dot tone="brand" pulse />
            {c.eyebrow}
          </div>
          <h1 className={cn(headline, 'mx-auto mt-7 max-w-[18ch]')}>
            {c.title} <span className="text-brand-soft">{c.accent}</span>
          </h1>
          <p className={cn(lede, 'mx-auto mt-7 max-w-[56ch]')}>{c.intro}</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <DemoCta />
          <GhostLink href="#compare">See the comparison</GhostLink>
        </Reveal>
      </Shell>
    </section>
  );
}

function FitList({ items, ours = false }: { items: string[]; ours?: boolean }) {
  const Icon = ours ? Check : Minus;
  return (
    <ul className="mt-6 space-y-3.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-6 text-neutral-300">
          <Icon
            aria-hidden="true"
            className={cn('mt-1 size-4 shrink-0', ours ? 'text-brand-soft' : 'text-neutral-600')}
            strokeWidth={2}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Fit({ c }: { c: Comparison }) {
  return (
    <Section>
      <SectionHeader eyebrow="Which one fits" title={c.fit.title} description={c.fit.description} className="max-w-3xl" />
      <div className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-2">
        <Reveal>
          <Card className={`${surface} h-full gap-0 p-7 md:p-9`}>
            <div className="flex items-center gap-3">
              <TheirLogo c={c} />
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-neutral-50">Choose {c.name} if</h3>
            </div>
            <FitList items={c.fit.them} />
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full gap-0 rounded-2xl border-primary/25 bg-primary/[0.06] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:p-9">
            <div className="flex items-center gap-3">
              <OurLogo />
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-neutral-50">Choose Laycal if</h3>
            </div>
            <FitList items={c.fit.laycal} ours />
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

const cell = 'whitespace-normal px-5 py-5 align-top text-[15px] leading-6 md:px-7';

function CompareTable({ c }: { c: Comparison }) {
  return (
    <Section id="compare" className="!pt-0">
      <SectionHeader eyebrow="Side by side" title={c.table.title} />
      <Reveal delay={0.1} className="mt-12 md:mt-14">
        <Card className={`${surface} gap-0 overflow-hidden p-0`}>
          <Table className="min-w-[640px] table-fixed">
            <TableHeader>
              <TableRow className="border-white/[0.08] hover:bg-transparent">
                <TableHead className="h-auto w-[24%] px-5 py-5 md:px-7" />
                <TableHead className="h-auto px-5 py-5 md:px-7">
                  <span className="flex items-center">
                    <TheirLogo c={c} className="h-7 rounded-md px-2" />
                    <span className="sr-only">{c.name}</span>
                  </span>
                </TableHead>
                <TableHead className="h-auto bg-primary/[0.06] px-5 py-5 md:px-7">
                  <span className="flex items-center gap-3 text-base font-semibold text-neutral-100">
                    <OurLogo className="size-7 rounded-md" />
                    Laycal
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.table.rows.map(([label, them, us]) => (
                <TableRow key={label} className="border-white/[0.08] hover:bg-transparent">
                  <TableCell className={cn(cell, 'font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500')}>
                    {label}
                  </TableCell>
                  <TableCell className={cn(cell, 'text-neutral-400')}>{them}</TableCell>
                  <TableCell className={cn(cell, 'bg-primary/[0.06] text-neutral-100')}>{us}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <p className="mt-5 text-sm leading-6 text-neutral-500">
          {c.table.source}{' '}
          <Link
            href="/#pricing"
            className="font-medium text-neutral-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
          >
            See Laycal pricing
          </Link>
        </p>
      </Reveal>
    </Section>
  );
}

/* ---------------------------------- pages ---------------------------------- */

/** One comparison page, from the hero to the last content section. Pages add `ClosingCta` after it. */
export function ComparisonPage({ slug }: { slug: ComparisonSlug }) {
  const c: Comparison = COMPARISONS[slug];
  return (
    <>
      <Hero c={c} />
      <Fit c={c} />
      <CompareTable c={c} />
      <Section className="!pt-0">
        <SectionHeader eyebrow={c.cards.eyebrow} title={c.cards.title} />
        <CardGrid items={c.cards.items} numbered={c.cards.numbered} />
      </Section>
    </>
  );
}

const SLUGS: [ComparisonSlug, string][] = [
  ['justcall', '/justcall-alternative'],
  ['nooks', '/nooks-alternative'],
];

/** The /compare index: what category Laycal is in, then a card per comparison. */
export function ComparisonIndex() {
  return (
    <>
      <section className="relative overflow-hidden">
        <Backdrop />
        <Shell className="relative pb-12 pt-36 text-center md:pb-16 md:pt-44">
          <Reveal>
            <div className={badge}>
              <Dot tone="brand" pulse />
              Compare
            </div>
            <h1 className={cn(headline, 'mx-auto mt-7 max-w-[20ch]')}>
              Compare Laycal with <span className="text-brand-soft">dialers and phone systems.</span>
            </h1>
            <p className={cn(lede, 'mx-auto mt-7 max-w-[54ch]')}>
              Honest comparisons with dialers and phone systems, including when Laycal is not the right tool.
            </p>
          </Reveal>
        </Shell>
      </section>

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeader eyebrow="Start here" title="First: is Laycal the right category?" />
          <Reveal delay={0.1} className="space-y-5">
            <p className={lede}>
              Laycal is a speed-to-lead platform: when a new lead comes in, an AI voice agent calls them within a
              minute, qualifies them and books a meeting on your calendar. It is not a phone system for your team and
              not a parallel dialer for outbound SDRs.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="gap-0 rounded-2xl border-primary/25 bg-primary/[0.06] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <ListChecks className="size-5 text-brand-soft" strokeWidth={1.5} />
                <Eyebrow className="mt-5 text-brand-soft">Laycal fits</Eyebrow>
                <p className="mt-2 text-[15px] leading-6 text-neutral-200">
                  “We miss or follow up slowly on inbound leads.” Laycal is built for that.
                </p>
              </Card>
              <Card className={`${surface} gap-0 p-6`}>
                <ListX className="size-5 text-neutral-500" strokeWidth={1.5} />
                <Eyebrow className="mt-5">Another tool fits</Eyebrow>
                <p className="mt-2 text-[15px] leading-6 text-neutral-400">
                  “Our reps need a better dialer.” One of the tools below will fit better, and we say so plainly on
                  each page.
                </p>
              </Card>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeader eyebrow="Head to head" title="Laycal next to the tools you’re weighing." />
        <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-2">
          {SLUGS.map(([slug, href], i) => {
            const c: Comparison = COMPARISONS[slug];
            return (
              <Reveal key={slug} delay={i * 0.08}>
                <Link
                  href={href}
                  className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card
                    className={`${surface} h-full gap-0 p-7 transition-colors duration-200 group-hover:border-white/[0.16] md:p-9`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <OurLogo />
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-600">vs</span>
                        <TheirLogo c={c} />
                      </div>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 text-neutral-600 transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-soft"
                        strokeWidth={1.5}
                      />
                    </div>
                    <Eyebrow className="mt-8">{c.category}</Eyebrow>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-neutral-50">
                      Laycal vs {c.name}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-neutral-400">{c.summary}</p>
                  </Card>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </>
  );
}
