'use client';

import { CalendarCheck, FileSpreadsheet, PhoneOutgoing, ShieldCheck } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { useRate } from './providers';
import { DemoCta, Dot, Eyebrow, GhostLink, Reveal, Section, SectionHeader, Shell } from './primitives';
import { HERO_TILES } from './product-tiles';

const surface = 'rounded-2xl border-white/[0.08] bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
const tile = (title: string) => HERO_TILES.find((t) => t.title === title)?.content;

/* ---------------------------------- hero ---------------------------------- */

export function ReactivationHero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[56rem]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_100%)]" />
        <div className="absolute -top-40 left-1/2 size-[24rem] -translate-x-1/4 rounded-full bg-primary/20 blur-[100px] md:-top-64 md:size-[44rem] md:bg-primary/25 md:blur-[140px]" />
      </div>

      <Shell className="relative grid min-h-[100svh] items-center gap-12 pb-16 pt-32 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-300 backdrop-blur">
              <Dot tone="brand" pulse />
              Lead reactivation
            </div>
            <h1 className="mt-7 max-w-[16ch] text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl">
              Turn the leads you already paid for into <span className="text-brand-soft">booked meetings.</span>
            </h1>
            <p className="mt-7 max-w-[52ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]">
              Upload the list sitting in your CRM. Laycal calls every lead, finds the ones who are still interested and
              books them straight into your calendar.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center gap-3">
            <DemoCta />
            <GhostLink href="#how">See how it works</GhostLink>
          </Reveal>
        </div>

        {/* Two real product fragments: the list being worked, and a booking that came out of it. */}
        <Reveal delay={0.15} className="relative hidden h-[31rem] lg:block">
          <div aria-hidden="true" className="group/tile absolute right-0 top-0 h-96 w-[30rem] max-w-full">
            {tile('Leads')}
          </div>
          <div aria-hidden="true" className="group/tile absolute bottom-0 left-0 h-72 w-[21rem] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)]">
            {tile('Booked')}
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}

/* ------------------------------ how it works ------------------------------ */

const STEPS = [
  {
    n: '01',
    icon: FileSpreadsheet,
    title: 'Upload your list',
    copy: 'A CSV with a name and a phone number per lead. Email, company and notes are optional and the agent can use them.',
  },
  {
    n: '02',
    icon: PhoneOutgoing,
    title: 'Laycal calls every lead',
    copy: 'Calls run in parallel, up to 500 at a time, so a list that would take a rep weeks is worked in an afternoon.',
  },
  {
    n: '03',
    icon: CalendarCheck,
    title: 'Interested leads get booked',
    copy: 'The agent offers real open slots and books the meeting. Everyone else is logged with the outcome and a summary.',
  },
];

export function ReactivationSteps() {
  return (
    <Section id="how">
      <SectionHeader eyebrow="How it works" title="From a cold list to a full calendar." />
      <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <Card className={`${surface} group h-full p-7 transition-colors duration-200 hover:border-white/[0.16] md:p-8`}>
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-brand-soft">
                  <s.icon className="size-5" strokeWidth={1.5} />
                </span>
                <span className="font-mono text-xs tracking-[0.12em] text-neutral-600">{s.n}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-neutral-50">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-neutral-400">{s.copy}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------- what you get ------------------------------ */

export function ReactivationProduct() {
  return (
    <Section>
      <SectionHeader
        eyebrow="What you get back"
        title="Every call accounted for."
        description="You see who answered, who booked and who said no, with the recording and a written summary for each call."
      />
      <div aria-hidden="true" className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-3">
        {['Call outcomes', 'Recording', 'Live feed'].map((name, i) => (
          <Reveal key={name} delay={i * 0.08} className="group/tile h-96">
            {tile(name)}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* --------------------------------- consent -------------------------------- */

export function ReactivationConsent() {
  const { rateLabel } = useRate();
  return (
    <Section className="!py-0">
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className={`${surface} h-full p-7 md:p-9`}>
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200">
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </span>
            <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-neutral-50">For leads who asked to hear from you</h3>
            <p className="mt-3 text-[15px] leading-7 text-neutral-400">
              Reactivation is for people who gave you their number and agreed to be contacted. Consent and do-not-call
              rules where you operate remain your responsibility. We go through this with you on the demo before any
              list is called.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className={`${surface} flex h-full flex-col p-7 md:p-9`}>
            <Eyebrow>Pricing</Eyebrow>
            <div className="mt-5 flex items-baseline gap-2 text-neutral-50">
              <span className="text-sm text-neutral-400">from</span>
              <span className="text-5xl font-semibold tabular-nums tracking-[-0.03em]">{rateLabel}</span>
              <span className="text-lg text-neutral-400">/ min</span>
            </div>
            <p className="mt-4 text-[15px] leading-7 text-neutral-400">
              You pay for the minutes the agent spends on calls. No seats and no monthly minimum, so a one-off list costs
              what it takes to call it.
            </p>
            <a
              href="/#pricing"
              className="mt-auto inline-flex w-fit pt-6 text-sm font-medium text-neutral-200 underline-offset-4 outline-none transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              See full pricing
            </a>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

/* ----------------------------------- FAQ ---------------------------------- */

const FAQS = [
  {
    q: 'What does the file need to contain?',
    a: 'A name and a phone number for each lead. Email, company and notes are optional. Column names are flexible.',
  },
  {
    q: 'How old can the leads be?',
    a: 'There is no limit. How well an old list performs depends on how the leads were collected and how long ago, so start with a small batch and look at the outcomes before calling the rest.',
  },
  {
    q: 'What does the agent say?',
    a: 'You decide. You set who is calling, why you are getting back in touch, the questions to ask and how to respond to objections. We play real recordings on the demo so you can judge how it sounds.',
  },
  {
    q: 'What happens with people who are not interested?',
    a: 'The call is logged with its outcome, recording and summary, so you can see who declined and leave them out next time.',
  },
  {
    q: 'Can it book straight into my calendar?',
    a: 'Yes. Google Calendar is native. The agent offers real open slots and creates the event when the lead agrees.',
  },
];

export function ReactivationFaq() {
  return (
    <Section id="faq">
      <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeader eyebrow="FAQ" title="Before you upload a list." />
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible defaultValue="faq-0" className="border-t border-white/[0.08]">
            {FAQS.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-white/[0.08] last:border-b">
                <AccordionTrigger className="py-6 text-[17px] font-medium tracking-[-0.01em] text-neutral-100 hover:text-white hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[62ch] pb-6 text-[15px] leading-7 text-neutral-400">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
