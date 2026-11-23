import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro, TradeCall } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'Laycal calls every roofing lead within a minute, asks about the leak, the storm and the roof, and books the inspection into your Google Calendar on the call. Pay per calling minute.';

export const metadata: Metadata = {
  title: 'Roofing Leads Called Within a Minute by an AI Agent',
  description,
  alternates: { canonical: '/roofing' },
  openGraph: {
    title: 'Roofing Leads Called Within a Minute by an AI Agent | Laycal',
    description,
    url: 'https://www.laycal.com/roofing',
    images: [OG_IMAGE],
  },
};

/** For roofing companies that already get leads and lose them to slow call-backs. */
export default function RoofingPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="roofing" />
      <TradeCall vertical="roofing" trade="roofing" />
      <SolutionClose slug="roofing" />
      <ClosingCta
        title="Every roofing lead called. Every inspection booked."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
