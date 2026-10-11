import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { ComparisonPage } from '@/components/landing/comparison';
import { GhostLink } from '@/components/landing/primitives';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Nooks Alternative: Outbound Dialer vs AI Lead Response',
  description:
    'Nooks is a sales platform for SDR teams. Laycal is AI speed-to-lead: every inbound lead gets called within a minute. Which one do you actually need?',
  alternates: {
    canonical: '/nooks-alternative',
  },
  openGraph: {
    title: 'Nooks Alternative: Outbound Dialer vs AI Lead Response | Laycal',
    description:
      'Nooks is a sales platform for SDR teams. Laycal is AI speed-to-lead: every inbound lead gets called within a minute.',
    url: 'https://www.laycal.com/nooks-alternative',
    images: [OG_IMAGE],
  },
};

/** Nooks next to Laycal: an outbound platform for SDR teams against inbound lead response. */
export default function NooksAlternativePage() {
  return (
    <LandingProviders>
      <SiteNav />
      <ComparisonPage slug="nooks" />
      <ClosingCta
        title="If your leads are inbound, use the tool built for that."
        description="Book a demo and we'll call a test lead live. You judge the voice, the speed and the booking flow."
        secondary={<GhostLink href="/compare">All comparisons</GhostLink>}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
