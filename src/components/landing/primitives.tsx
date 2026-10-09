'use client';

import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DEMO_URL } from '@/lib/links';
import { cn } from '@/lib/utils';

/** Content column shared by every section. */
export function Shell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6', className)}>{children}</div>;
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-16 md:py-24 lg:py-32', className)}>
      <Shell>{children}</Shell>
    </section>
  );
}

/** Fades content up once, the first time it scrolls into view. */
export function Reveal({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('font-mono text-xs font-medium uppercase tracking-[0.08em] text-neutral-500', className)}>
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <Reveal className={cn(align === 'center' && 'mx-auto text-center', 'max-w-2xl', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          'text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-50 md:text-[2.5rem]',
          eyebrow && 'mt-4'
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('mt-5 text-pretty text-base leading-7 text-neutral-400 md:text-lg md:leading-[1.7]', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
    </Reveal>
  );
}

const pill = 'h-11 rounded-full px-6 text-[15px] active:scale-[0.98] transition-[transform,background-color,border-color,color] duration-200';

/**
 * The primary acquisition CTA. Access is invite-only, so this always goes to
 * the demo calendar; signed-in visitors get a way back to the product instead.
 */
export function DemoCta({
  label = 'Book a demo',
  signedInLabel = 'Go to dashboard',
  className,
}: {
  label?: string;
  signedInLabel?: string;
  className?: string;
}) {
  return (
    <>
      <SignedOut>
        <Button asChild className={cn(pill, 'group/cta gap-2', className)}>
          <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
            {label}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </a>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button asChild className={cn(pill, 'group/cta gap-2', className)}>
          <Link href="/dashboard">
            {signedInLabel}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
          </Link>
        </Button>
      </SignedIn>
    </>
  );
}

export function GhostLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(pill, 'border-white/12 bg-white/[0.03] text-neutral-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-white', className)}
    >
      <a href={href}>{children}</a>
    </Button>
  );
}

/** A status dot that never stands alone: always pair it with a label. */
export function Dot({ tone = 'neutral', pulse = false }: { tone?: 'brand' | 'success' | 'neutral' | 'dim'; pulse?: boolean }) {
  const color = {
    brand: 'bg-primary',
    success: 'bg-green-500',
    neutral: 'bg-neutral-400',
    dim: 'bg-neutral-700',
  }[tone];
  return (
    <span className="relative flex size-1.5 shrink-0">
      {pulse && <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-70', color)} />}
      <span className={cn('relative inline-flex size-1.5 rounded-full', color)} />
    </span>
  );
}
