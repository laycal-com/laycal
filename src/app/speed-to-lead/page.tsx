import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { Roi } from '@/components/landing/roi';
import { Integrations, SiteFooter, UseCases } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'Speed to lead is how long a new lead waits for your first call. Laycal brings it under a minute: an AI voice agent calls every new lead, qualifies them and books the meeting.';

export const metadata: Metadata = {
  title: 'Speed to Lead: Call Every New Lead Within a Minute',
  description,
  alternates: { canonical: '/speed-to-lead' },
  openGraph: {
    title: 'Speed to Lead: Call Every New Lead Within a Minute | Laycal',
    description,
    url: 'https://www.laycal.com/speed-to-lead',
    images: [OG_IMAGE],
  },
};

/** The category page: what speed to lead is, why it decides who wins the lead, and how Laycal gets it under a minute. */
export default function SpeedToLeadPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="speed-to-lead" />
      <Integrations />
      <Roi />
      <UseCases />
      <SolutionClose slug="speed-to-lead" />
      <ClosingCta />
      <SiteFooter />
    </LandingProviders>
  );
}
