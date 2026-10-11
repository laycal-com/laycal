import Link from 'next/link';
import { Building2, CalendarCheck, PhoneOutgoing, ShoppingBag, Webhook, Wrench } from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { Eyebrow, Reveal, Section, SectionHeader, Shell } from './primitives';
import { LogoMark } from '@/components/brand/logo-mark';

const surface = 'rounded-2xl border-white/[0.08] bg-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

/* ------------------------------ integrations ------------------------------ */

const INTEGRATIONS = ['Google Calendar', 'Google Forms', 'Twilio', 'Plivo', 'Vonage'];

export function Integrations() {
  return (
    <section aria-label="Integrations" className="border-y border-white/[0.08]">
      <Shell className="flex flex-col items-center gap-x-12 gap-y-5 py-8 md:flex-row md:justify-between">
        <Eyebrow className="shrink-0 text-neutral-600">Works with</Eyebrow>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 md:justify-end">
          {INTEGRATIONS.map((name) => (
            <li
              key={name}
              className="text-[15px] font-semibold tracking-tight text-neutral-500 transition-colors duration-200 hover:text-neutral-100"
            >
              {name}
            </li>
          ))}
        </ul>
      </Shell>
    </section>
  );
}

/* ------------------------------ how it works ------------------------------ */

const STEPS = [
  {
    n: '01',
    icon: Webhook,
    title: 'Connect your lead source',
    copy: 'Point anything that can send a webhook at your Laycal endpoint: site forms, Google Forms, your CRM. Or upload a CSV.',
  },
  {
    n: '02',
    icon: PhoneOutgoing,
    title: 'Laycal calls within seconds',
    copy: 'An AI agent phones the lead while they are still thinking about you, asks your qualifying questions and handles objections.',
  },
  {
    n: '03',
    icon: CalendarCheck,
    title: 'The meeting lands on your calendar',
    copy: 'It offers real open slots, books the one they pick, and hands you the recording, transcript and summary.',
  },
];

export function HowItWorks() {
  return (
    <Section id="how">
      <SectionHeader eyebrow="How it works" title="From form fill to booked meeting, with nobody chasing." />
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

/* -------------------------------- use cases ------------------------------- */

const USE_CASES = [
  {
    icon: Wrench,
    name: 'Home services',
    trades: 'HVAC, plumbing, roofing, electrical',
    rows: [
      ['Trigger', 'A homeowner requests a repair or a quote.'],
      ['The call', 'Asks what is wrong, how urgent it is and where, in the trade’s own terms.'],
      ['Outcome', 'A technician visit booked on your calendar.'],
    ],
  },
  {
    icon: ShoppingBag,
    name: 'E-commerce',
    trades: 'High-consideration and made-to-order products',
    rows: [
      ['Trigger', 'A shopper asks for a quote, a consultation or a callback.'],
      ['The call', 'Confirms what they need, answers the questions you scripted and checks budget.'],
      ['Outcome', 'A consultation booked while intent is still high.'],
    ],
  },
  {
    icon: Building2,
    name: 'B2B',
    trades: 'SaaS, agencies, professional services',
    rows: [
      ['Trigger', 'A prospect submits your demo or contact form.'],
      ['The call', 'Qualifies on your criteria: role, team size, timeline.'],
      ['Outcome', 'A demo on your calendar, with the answers attached.'],
    ],
  },
];

const ALSO = ['Real estate', 'Insurance', 'Solar', 'Automotive', 'Education', 'Legal intake'];

export function UseCases() {
  return (
    <Section id="use-cases">
      <SectionHeader
        eyebrow="Use cases"
        title="For any business where the first call wins."
        description="The lead source, the questions and the booking change by industry. The first-minute call does not."
      />

      <div className="mt-12 grid gap-5 md:mt-14 lg:grid-cols-3">
        {USE_CASES.map((u, i) => (
          <Reveal key={u.name} delay={i * 0.08}>
            <Card className={`${surface} group h-full p-7 transition-colors duration-200 hover:border-white/[0.16] md:p-8`}>
              <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-200 transition-colors duration-200 group-hover:border-primary/40 group-hover:text-brand-soft">
                <u.icon className="size-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-neutral-50">{u.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{u.trades}</p>
              <dl className="mt-6 border-t border-white/[0.08]">
                {u.rows.map(([k, v]) => (
                  <div key={k} className="border-b border-white/[0.06] py-3.5 last:border-b-0 last:pb-0">
                    <dt className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">{k}</dt>
                    <dd className="mt-1.5 text-[15px] leading-6 text-neutral-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <Eyebrow className="mr-1 text-neutral-600">Also a fit for</Eyebrow>
        {ALSO.map((name) => (
          <span key={name} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[13px] text-neutral-400">
            {name}
          </span>
        ))}
      </Reveal>
    </Section>
  );
}

/* ----------------------------------- FAQ ---------------------------------- */

export const FAQS = [
  {
    q: 'Does it sound like a robot?',
    a: 'No. You pick the voice, pace and personality, and the agent handles interruptions and objections mid-sentence. We play real recordings on the demo so you can judge for yourself.',
  },
  {
    q: 'How do I get access?',
    a: 'Laycal is invite-only right now. Book a demo, and if it is a fit we send an invitation to your email. That link creates your account and provisions your first assistant.',
  },
  {
    q: 'How fast does it call a new lead?',
    a: 'Within seconds of the form being submitted. There is no queue: every submission triggers its own call, day or night.',
  },
  {
    q: 'Which lead sources work?',
    a: 'Anything that can send a webhook: website forms, Google Forms, ad lead forms through an automation tool, or your CRM. You can also upload a CSV to call an existing list.',
  },
  {
    q: 'What does it actually cost at volume?',
    a: 'Usage-based per calling minute, with no seat licences. Use the calculator above with your own numbers to see cost against the meetings you would gain. Exact rates are confirmed on the demo.',
  },
  {
    q: 'Can it book meetings on my calendar?',
    a: 'Yes. Google Calendar is native. The agent offers real open slots and writes the event the moment the prospect agrees.',
  },
  {
    q: 'Will it work for my industry?',
    a: 'If a fast first call matters and the conversation can be scripted, yes. You set the qualifying questions, the objections to expect and what gets booked. Home services, e-commerce and B2B teams all run it the same way.',
  },
  {
    q: 'Do I need my own telephony provider?',
    a: 'You can bring your own, or use ours. Multi-provider routing means a provider outage reroutes rather than stopping calls.',
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <SectionHeader eyebrow="FAQ" title="Questions teams ask before the demo." />
        <Reveal delay={0.1}>
          <Accordion type="single" collapsible defaultValue="faq-0" className="border-t border-white/[0.08]">
            {FAQS.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`} className="border-white/[0.08] last:border-b">
                <AccordionTrigger className="py-6 text-[17px] font-medium tracking-[-0.01em] text-neutral-100 hover:text-white hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="max-w-[62ch] pb-6 text-[15px] leading-7 text-neutral-400">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}

/* --------------------------------- footer --------------------------------- */

const FOOTER: [string, [string, string][]][] = [
  ['Product', [['Features', '/#features'], ['Pricing', '/#pricing'], ['Calculator', '/#roi']]],
  ['Solutions', [['Speed to lead', '/speed-to-lead'], ['Instant lead follow-up', '/instant-lead-follow-up'], ['Lead reactivation', '/lead-reactivation']]],
  ['Compare', [['All comparisons', '/compare'], ['JustCall alternative', '/justcall-alternative'], ['Nooks alternative', '/nooks-alternative']]],
  ['Company', [['Blog', '/blogs'], ['Contact', '/contact']]],
];

const footLink =
  'rounded-sm text-sm text-neutral-400 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08]">
      <Shell className="grid gap-12 pb-12 pt-16 md:grid-cols-2 md:gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:pt-20">
        <div>
          <Link href="/" aria-label="Laycal home" className="inline-flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-tight text-white">Laycal</span>
          </Link>
          <p className="mt-5 max-w-[34ch] text-sm leading-6 text-neutral-500">
            AI voice agents that call every new lead within a minute, qualify them and book the meeting. For any
            business where speed to lead decides the deal.
          </p>
        </div>

        {FOOTER.map(([heading, links]) => (
          <nav key={heading} aria-label={heading} className="flex flex-col items-start gap-3.5">
            <Eyebrow className="mb-1 text-[11px] text-neutral-600">{heading}</Eyebrow>
            {links.map(([label, href]) =>
              href.includes('#') ? (
                <a key={label} href={href} className={footLink}>
                  {label}
                </a>
              ) : (
                <Link key={label} href={href} className={footLink}>
                  {label}
                </Link>
              )
            )}
          </nav>
        ))}
      </Shell>

      <Shell>
        <div className="flex flex-col gap-4 border-t border-white/[0.08] py-7 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Laycal</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-neutral-300">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-neutral-300">
              Terms
            </Link>
          </div>
        </div>
      </Shell>

      {/* Oversized wordmark, cropped by the footer edge. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none -mb-[0.2em] select-none bg-gradient-to-b from-white/[0.1] to-transparent bg-clip-text text-center text-[21vw] font-semibold leading-none tracking-[-0.06em] text-transparent"
      >
        Laycal
      </div>
    </footer>
  );
}
