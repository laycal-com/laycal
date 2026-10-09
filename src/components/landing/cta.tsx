'use client';

import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { DemoCta, GhostLink, Reveal } from './primitives';

export function ClosingCta({
  title = 'Be the first call every lead gets.',
  description = "Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit.",
  secondary = <GhostLink href="#roi">See what slow follow-up costs</GhostLink>,
}: {
  title?: string;
  description?: string;
  secondary?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="cta-title" className="border-t border-white/[0.08]">
      <BackgroundBeamsWithCollision className="h-[34rem] md:h-[40rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]"
        />
        <Reveal className="relative z-20 mx-auto max-w-3xl px-4 text-center">
          <h2
            id="cta-title"
            className="text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-transparent sm:text-5xl md:text-6xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-[44ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg">
            {description}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <DemoCta label="Schedule a demo call" signedInLabel="Go to dashboard" />
            {secondary}
          </div>
        </Reveal>
      </BackgroundBeamsWithCollision>
    </section>
  );
}
