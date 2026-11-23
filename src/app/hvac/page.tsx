import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro, TradeCall } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'Laycal calls every HVAC lead within a minute, asks what the system is doing and books the service visit into your Google Calendar on the call. Pay per calling minute.';

export const metadata: Metadata = {
  title: 'HVAC Leads Called Within a Minute by an AI Agent',
  description,
  alternates: { canonical: '/hvac' },
  openGraph: {
    title: 'HVAC Leads Called Within a Minute by an AI Agent | Laycal',
    description,
    url: 'https://www.laycal.com/hvac',
    images: [OG_IMAGE],
  },
};

/** For HVAC companies that already get leads and lose them to slow call-backs. */
export default function HvacPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="hvac" />
      <TradeCall vertical="hvac" trade="HVAC" />
      <SolutionClose slug="hvac" />
      <ClosingCta
        title="Every HVAC lead called. Every visit booked."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
