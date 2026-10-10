import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

import { MiniMap, type MapPin } from '@/components/landing/mini-map';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { DEMO_URL } from '@/lib/links';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: "Contact Laycal | Questions, Support and Access",
  description: "Get in touch with Laycal about your account, support or getting access. Send a message or book a 15-minute demo.",
  keywords: "contact support, ai voice agent support, automated calling system help, ai powered phone calls support, ai appointment setter help, ai sales assistant support, increase sales efficiency support",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Laycal | Questions, Support and Access",
    description: "Get in touch with Laycal about your account, support or getting access. Send a message or book a 15-minute demo.",
    url: "https://laycal.com/contact",
  },
};

/**
 * Where the pin sits on the map. Change these three values to move it.
 */
const LOCATION: MapPin = { label: 'We are here', lat: 33.57, lng: -7.59 };

export default function ContactPage() {
  return (
    <>
      <SiteNav />
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[40rem]">
          <div className="absolute -top-48 left-1/4 size-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px]" />
        </div>

        {/* Both columns stretch to the same height: the card starts level with the icon and ends level with the map. */}
        <div className="relative mx-auto grid w-full max-w-[1200px] items-stretch gap-12 px-4 pb-24 pt-36 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:pb-32 lg:pt-44">
          <div className="flex flex-col">
            <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_30px_-10px_rgba(45,106,255,0.6)]">
              <Mail className="size-5 text-brand-soft" strokeWidth={1.75} />
            </span>
            <h1 className="mt-8 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-transparent sm:text-5xl">
              Contact us
            </h1>
            <p className="mt-6 max-w-[44ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg">
              Questions about Laycal, your account or getting access? Send a message and a person will reply.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-neutral-300">
              <a
                href="mailto:contact@laycal.com"
                className="rounded-sm underline-offset-4 outline-none transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                contact@laycal.com
              </a>
              <span aria-hidden="true" className="size-1 rounded-full bg-neutral-600" />
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm underline-offset-4 outline-none transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                Book a 15-minute demo
              </a>
            </div>

            <MiniMap pin={LOCATION} className="mt-auto w-full max-w-lg pt-20" />
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-neutral-950 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_70%_60%_at_100%_0%,black_0%,transparent_75%)]"
            />
            <div className="relative h-full">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
