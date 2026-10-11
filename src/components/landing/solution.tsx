'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Clock,
  Hourglass,
  ListChecks,
  MessageSquareQuote,
  MoonStar,
  PhoneCall,
  PhoneOutgoing,
  Sparkles,
  Timer,
  Users,
  Webhook,
  type LucideIcon,
} from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { useRate } from './providers';
import { DemoCta, Dot, Eyebrow, GhostLink, Reveal, Section, SectionHeader, Shell } from './primitives';
import { HERO_TILES } from './product-tiles';

export const surface = 'rounded-2xl border-white/[0.08] bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';
export const iconBox =
  'flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-brand-soft';
const tile = (title: string) => HERO_TILES.find((t) => t.title === title)?.content;

export type Item = { icon: LucideIcon; title: string; copy: string };

type Solution = {
  eyebrow: string;
  title: string;
  accent: string;
  intro: string;
  heroTiles: [string, string];
  problem: { eyebrow: string; title: string; description: string; items: Item[] };
  steps: { title: string; items: Item[] };
  proof: { eyebrow: string; title: string; description: string; tiles: string[] };
  note: { icon: LucideIcon; title: string; body: React.ReactNode };
  pricing: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
};

const inline =
  'font-medium text-neutral-200 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60';

/**
 * Content for the two search-facing solution pages. Both describe the same
 * product; each answers a different question a buyer types into a search box.
 */
const SOLUTIONS = {
  'speed-to-lead': {
    eyebrow: 'Speed to lead',
    title: 'Speed to lead: be the first call',
    accent: 'every new lead gets.',
    intro:
      'Speed to lead is the time between someone asking to be contacted and your first call. Laycal brings it under a minute: an AI voice agent phones each new lead as soon as the form is submitted, qualifies them and books the meeting.',
    heroTiles: ['Live call', 'Booked'],
    problem: {
      eyebrow: 'Why it matters',
      title: 'A lead is most interested the moment they ask.',
      description:
        'Speed to lead is not a sales metric for its own sake. It decides whether you are the business they speak to first, or the one that calls after they have already chosen.',
      items: [
        {
          icon: Users,
          title: 'They rarely ask only you',
          copy: 'Someone who needs a quote, a repair or a demo often fills in several forms in one sitting. The first business to call sets the terms of the conversation.',
        },
        {
          icon: Hourglass,
          title: 'Call-backs slip by hours',
          copy: 'Staff are on a job, in a meeting or off for the day. Nobody is watching the inbox, so the first call goes out that evening or the next morning.',
        },
        {
          icon: Clock,
          title: 'The lead you paid for goes quiet',
          copy: 'By the time you ring, they have spoken to someone else or stopped answering unknown numbers. The ad spend is gone either way.',
        },
      ],
    },
    steps: {
      title: 'Under a minute, without anyone watching the inbox.',
      items: [
        {
          icon: Webhook,
          title: 'Connect your lead source',
          copy: 'A website form, a Google Form, an ad lead form or your CRM sends each new lead to Laycal as it arrives.',
        },
        {
          icon: PhoneOutgoing,
          title: 'Laycal calls within seconds',
          copy: 'Every submission triggers its own call. There is no queue, so a busy hour does not push anyone to the back.',
        },
        {
          icon: CalendarCheck,
          title: 'The meeting lands on your calendar',
          copy: 'The agent asks your qualifying questions, offers real open slots and creates the event while the lead is still on the phone.',
        },
      ],
    },
    proof: {
      eyebrow: 'What you see afterwards',
      title: 'Every call accounted for.',
      description:
        'Each call leaves an outcome, a recording and a written summary, so you can check how fast leads were reached and what was said.',
      tiles: ['Call outcomes', 'Recording', 'Live feed'],
    },
    note: {
      icon: Timer,
      title: 'How to measure your own speed to lead',
      body: (
        <>
          Take last month&apos;s leads. For each one, compare the time the form was submitted with the time of the first
          call attempt. The middle value is your speed to lead. Then count the leads that were never called at all:
          that number is usually the more useful one. The{' '}
          <Link href="/#roi" className={inline}>
            calculator on the homepage
          </Link>{' '}
          turns your own figures into what slow follow-up costs.
        </>
      ),
    },
    pricing:
      'You pay for the minutes the agent spends on calls. No seats and no monthly minimum, so the cost follows the number of leads you get.',
    faqTitle: 'Speed to lead, answered.',
    faqs: [
      {
        q: 'What is speed to lead?',
        a: 'It is how long a new lead waits between asking to be contacted and getting your first call. It is also called lead response time. The shorter it is, the more likely you are the first business the lead speaks to.',
      },
      {
        q: 'How fast does Laycal call a new lead?',
        a: 'The call is placed within seconds of the lead reaching Laycal, so the phone rings inside a minute of the form being submitted. It works the same way at night and at weekends.',
      },
      {
        q: 'Which lead sources can trigger a call?',
        a: 'Website forms, Google Forms, ad lead forms and CRMs. Anything that can send a new lead to a web address as it arrives will work. You can also upload a CSV for a list you already have.',
      },
      {
        q: 'What does the agent say on the call?',
        a: 'It introduces itself as calling from your business, asks the qualifying questions you set and responds to the objections you expect. You answer a few questions about your trade, hours and services, and Laycal writes the script.',
      },
      {
        q: 'Does it book the meeting or just pass on a message?',
        a: 'It books. Google Calendar is built in, so the agent only offers times that are free and creates the event during the call.',
      },
      {
        q: 'How is it priced?',
        a: 'Pay as you go, per calling minute. There are no seats, plans or monthly minimums. Your rate is confirmed on the demo.',
      },
    ],
  },
  'instant-lead-follow-up': {
    eyebrow: 'Instant lead follow-up',
    title: 'An AI agent that calls your web leads',
    accent: 'within a minute.',
    intro:
      'When someone fills in your form, Laycal phones them straight away. The agent asks your qualifying questions, handles objections and books the meeting on your calendar. Nobody on your team has to be free.',
    heroTiles: ['Leads', 'Objection handled'],
    problem: {
      eyebrow: 'On the call',
      title: 'It does the first call the way you would.',
      description:
        'The agent works from a script built around your business, and it holds a real conversation: it listens, answers and adapts when the lead pushes back.',
      items: [
        {
          icon: PhoneCall,
          title: 'Calls as your business',
          copy: 'It introduces itself as calling from you, about the request the lead just made. You choose the voice, from several male and female options.',
        },
        {
          icon: ListChecks,
          title: 'Asks your qualifying questions',
          copy: 'Role, budget, timeline, the job and the address: whatever tells you this lead is worth a meeting. The answers are captured with the call.',
        },
        {
          icon: MessageSquareQuote,
          title: 'Handles the objections you expect',
          copy: 'You list the pushback you usually hear and how you answer it. The agent uses those answers mid-conversation.',
        },
      ],
    },
    steps: {
      title: 'Set up once. Every form fill gets a call.',
      items: [
        {
          icon: Webhook,
          title: 'Connect your form',
          copy: 'Point your website form, Google Form, ad lead form or CRM at Laycal. Each new lead triggers its own call.',
        },
        {
          icon: Sparkles,
          title: 'Build the assistant',
          copy: 'Answer a few questions about your trade, hours and services. Laycal writes the agent’s script. There is no prompt to write.',
        },
        {
          icon: CalendarClock,
          title: 'Connect your calendar',
          copy: 'Link Google Calendar. The agent offers only the times that are free and books the one the lead picks.',
        },
      ],
    },
    proof: {
      eyebrow: 'After each call',
      title: 'The answers, the recording and the booking.',
      description:
        'You get the outcome, a recording, a written summary and the details the agent captured: name, email and appointment time.',
      tiles: ['Transcript', 'Recording', 'Meetings booked'],
    },
    note: {
      icon: ClipboardList,
      title: 'If you are looking for an “AI SDR”',
      body: (
        <>
          Laycal does the part of that job that happens on the phone with a new lead: the first call, the qualifying
          questions and the booking. It does not source leads, send cold outreach or work through purchased lists. If
          leads already come to you and wait too long for a call, that is the gap it fills. If you have a list of
          people who asked to hear from you and nobody called, see{' '}
          <Link href="/lead-reactivation" className={inline}>
            lead reactivation
          </Link>
          .
        </>
      ),
    },
    pricing:
      'You pay for the minutes the agent spends on calls. No seats and no monthly minimum, and many calls can run at the same time when leads arrive together.',
    faqTitle: 'Before you connect a form.',
    faqs: [
      {
        q: 'Can it qualify leads with my own questions?',
        a: 'Yes. You set the questions and what counts as a fit. The agent asks them in conversation and the answers are saved with the call summary.',
      },
      {
        q: 'Does it book directly on my calendar?',
        a: 'Yes. Google Calendar is built in. The agent offers real open slots and creates the event while the lead is still on the phone.',
      },
      {
        q: 'Will it work with my CRM or form tool?',
        a: 'If your CRM or form tool can send each new lead to a web address as it arrives, it can trigger a call. Website forms, Google Forms and ad lead forms work the same way. We check your setup on the demo.',
      },
      {
        q: 'What happens when several leads arrive at once?',
        a: 'Each one gets its own call. Many calls can run at the same time, so a busy hour does not create a backlog.',
      },
      {
        q: 'Which languages does it speak?',
        a: 'English, Spanish, French and German.',
      },
      {
        q: 'Does it answer inbound calls or do cold calling?',
        a: 'No. Laycal places outbound calls to people who asked to be contacted. It is not a receptionist for incoming calls and it is not a tool for calling people who never asked to hear from you.',
      },
    ],
  },
} satisfies Record<string, Solution>;

export type SolutionSlug = keyof typeof SOLUTIONS;

/* ---------------------------------- hero ---------------------------------- */

function SolutionHero({ s }: { s: Solution }) {
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
              {s.eyebrow}
            </div>
            <h1 className="mt-7 max-w-[17ch] text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.04em] text-transparent sm:text-5xl lg:text-6xl">
              {s.title} <span className="text-brand-soft">{s.accent}</span>
            </h1>
            <p className="mt-7 max-w-[54ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]">
              {s.intro}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-9 flex flex-wrap items-center gap-3">
            <DemoCta />
            <GhostLink href="#how">See how it works</GhostLink>
          </Reveal>
        </div>

        {/* Two real product fragments, as on the other landing pages. */}
        <Reveal delay={0.15} className="relative hidden h-[31rem] lg:block">
          <div aria-hidden="true" className="group/tile absolute right-0 top-0 h-96 w-[30rem] max-w-full">
            {tile(s.heroTiles[0])}
          </div>
          <div
            aria-hidden="true"
            className="group/tile absolute bottom-0 left-0 h-[21rem] w-[21rem] shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)]"
          >
            {tile(s.heroTiles[1])}
          </div>
        </Reveal>
      </Shell>
    </section>
  );
}

/* ------------------------------ card sections ------------------------------ */

export function CardGrid({ items, numbered = false }: { items: Item[]; numbered?: boolean }) {
  return (
    <div className="mt-12 grid gap-5 md:mt-14 md:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.title} delay={i * 0.08}>
          <Card className={`${surface} group h-full p-7 transition-colors duration-200 hover:border-white/[0.16] md:p-8`}>
            <div className="flex items-center justify-between">
              <span className={iconBox}>
                <item.icon className="size-5" strokeWidth={1.5} />
              </span>
              {numbered && (
                <span className="font-mono text-xs tracking-[0.12em] text-neutral-600">{`0${i + 1}`}</span>
              )}
            </div>
            <h3 className="mt-8 text-xl font-semibold tracking-[-0.02em] text-neutral-50">{item.title}</h3>
            <p className="mt-3 text-[15px] leading-6 text-neutral-400">{item.copy}</p>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}

function SolutionNote({ s }: { s: Solution }) {
  const { rateLabel } = useRate();
  return (
    <Section className="!py-0">
      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <Card className={`${surface} group h-full p-7 md:p-9`}>
            <span className={iconBox}>
              <s.note.icon className="size-5" strokeWidth={1.5} />
            </span>
            <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-neutral-50">{s.note.title}</h2>
            <p className="mt-3 text-[15px] leading-7 text-neutral-400">{s.note.body}</p>
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
            <p className="mt-4 text-[15px] leading-7 text-neutral-400">{s.pricing}</p>
            <div className="mt-auto flex items-center gap-2 pt-6 text-sm text-neutral-500">
              <MoonStar className="size-4" strokeWidth={1.5} />
              Calls go out day or night.
              <a
                href="/#pricing"
                className="ml-auto font-medium text-neutral-200 underline-offset-4 outline-none transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                See full pricing
              </a>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

function SolutionFaq({ s }: { s: Solution }) {
  return (
    <Section id="faq">
      <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeader eyebrow="FAQ" title={s.faqTitle} />
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible defaultValue="faq-0" className="border-t border-white/[0.08]">
            {s.faqs.map((item, i) => (
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

/* ---------------------------------- page ---------------------------------- */

/** Hero through product proof. Pages add their own sections after it, then `SolutionClose`. */
export function SolutionIntro({ slug }: { slug: SolutionSlug }) {
  const s: Solution = SOLUTIONS[slug];
  return (
    <>
      <SolutionHero s={s} />
      <Section>
        <SectionHeader eyebrow={s.problem.eyebrow} title={s.problem.title} description={s.problem.description} />
        <CardGrid items={s.problem.items} />
      </Section>
      <Section id="how" className="!pt-0">
        <SectionHeader eyebrow="How it works" title={s.steps.title} />
        <CardGrid items={s.steps.items} numbered />
      </Section>
      <Section className="!pt-0">
        <SectionHeader eyebrow={s.proof.eyebrow} title={s.proof.title} description={s.proof.description} />
        <div aria-hidden="true" className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-3">
          {s.proof.tiles.map((name, i) => (
            <Reveal key={name} delay={i * 0.08} className="group/tile h-96">
              {tile(name)}
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}

/** The note and pricing cards, then the FAQ. */
export function SolutionClose({ slug }: { slug: SolutionSlug }) {
  const s: Solution = SOLUTIONS[slug];
  return (
    <>
      <SolutionNote s={s} />
      <SolutionFaq s={s} />
    </>
  );
}
