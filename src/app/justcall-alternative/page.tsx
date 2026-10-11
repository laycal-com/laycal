import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { ComparisonPage } from '@/components/landing/comparison';
import { GhostLink } from '@/components/landing/primitives';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'JustCall Alternative for AI Lead Follow-Up',
  description:
    'JustCall is a per-seat phone system for teams. Laycal is usage-based AI that calls every new lead within a minute and books the meeting. An honest comparison.',
  alternates: {
    canonical: '/justcall-alternative',
  },
  openGraph: {
    title: 'JustCall Alternative for AI Lead Follow-Up | Laycal',
    description:
      'JustCall is a per-seat phone system for teams. Laycal is usage-based AI that calls every new lead within a minute and books the meeting.',
    url: 'https://www.laycal.com/justcall-alternative',
    images: [OG_IMAGE],
  },
};

/** JustCall next to Laycal: a per-seat phone system against usage-based AI calling. */
export default function JustCallAlternativePage() {
  return (
    <LandingProviders>
      <SiteNav />
      <ComparisonPage slug="justcall" />
      <ClosingCta
        title="See it on one of your own leads."
        description="Book a demo and we'll call a test lead live, so you can judge the voice and the speed yourself."
        secondary={<GhostLink href="/compare">All comparisons</GhostLink>}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
