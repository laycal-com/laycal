import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { HERO_TILES } from '@/components/landing/product-tiles';
import { LogoMark } from '@/components/brand/logo-mark';

/**
 * Split-screen frame for the sign-in and invitation pages: our headline and
 * Clerk's form on the left, a quiet brand panel on the right.
 */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  // A real product fragment from the landing page, so the panel shows the product rather than decoration.
  const tile = HERO_TILES.find((t) => t.title === 'Live call') ?? HERO_TILES[0];

  return (
    <div className="dark grid min-h-screen bg-background font-sans text-foreground antialiased lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" />
            Back to site
          </Link>
          <Link href="/" aria-label="Laycal home" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-tight">Laycal</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{eyebrow}</div>
            <h1 className="mt-4 text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-neutral-50">{title}</h1>
            <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <p className="text-xs text-neutral-600">
          By continuing you agree to the{' '}
          <Link href="/terms" className="text-neutral-400 underline-offset-4 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-neutral-400 underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      <div aria-hidden="true" className="relative hidden overflow-hidden border-l border-white/[0.08] bg-neutral-950 lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black_20%,transparent_100%)]" />
        <div className="absolute left-1/2 top-[38%] size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[130px]" />

        <div className="relative flex h-full flex-col items-center justify-center gap-12 p-12">
          <div className="h-96 w-[30rem] max-w-full">{tile.content}</div>
          <figure className="max-w-md text-center">
            <blockquote className="text-pretty text-lg leading-[1.55] tracking-[-0.01em] text-neutral-200">
              &ldquo;The numbers got me on a demo; the recordings are what made me stay.&rdquo;
            </blockquote>
            <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-500">
              Don · Texas Roofing Lead Gen
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
