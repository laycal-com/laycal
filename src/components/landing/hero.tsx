'use client';

import { motion } from 'motion/react';

import { HeroParallax } from '@/components/ui/hero-parallax';
import { DemoCta, Dot, GhostLink, Shell } from './primitives';
import { HERO_TILES } from './product-tiles';

const EASE = [0.16, 1, 0.3, 1] as const;

function rise(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  };
}

function HeroHeader() {
  // Centred in the first screen: the parallax container adds 10rem above, so
  // the same amount below keeps the block on the viewport's midline.
  return (
    <Shell className="flex min-h-[calc(100svh-10rem)] flex-col items-start justify-center pb-40">
      <motion.div
        {...rise(0)}
        className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-neutral-300 backdrop-blur"
      >
        <Dot tone="brand" pulse />
        Invite-only · AI speed to lead
      </motion.div>

      {/* The headline is the LCP element, so it renders visible and only eases upward. */}
      <motion.h1
        initial={{ y: 14 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="mt-7 max-w-[14ch] text-balance bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.04em] text-transparent sm:text-6xl lg:text-7xl"
      >
        Call every new lead in <span className="text-brand-soft">under a minute.</span>
      </motion.h1>

      <motion.p {...rise(0.1)} className="mt-7 max-w-[54ch] text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]">
        The moment a form is submitted, Laycal phones the lead, qualifies them, handles objections and books straight
        into your calendar. HVAC, e-commerce, B2B: any business where the first call wins.
      </motion.p>

      <motion.div {...rise(0.2)} className="mt-9 flex flex-wrap items-center gap-3">
        <DemoCta />
        <GhostLink href="#how">See how it works</GhostLink>
        <span className="ml-1 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-600">
          15 min · access by invitation
        </span>
      </motion.div>
    </Shell>
  );
}

export function Hero() {
  return (
    <div className="relative">
      {/* Backdrop: a masked grid and a single accent glow, both decorative. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[60rem] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black_30%,transparent_100%)]" />
        <div className="absolute -top-40 left-1/2 size-[24rem] -translate-x-1/4 rounded-full bg-primary/20 blur-[100px] md:-top-64 md:size-[44rem] md:bg-primary/25 md:blur-[140px]" />
      </div>
      <HeroParallax tiles={HERO_TILES} header={<HeroHeader />} />
    </div>
  );
}
