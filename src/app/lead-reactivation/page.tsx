import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import {
  ReactivationConsent,
  ReactivationFaq,
  ReactivationHero,
  ReactivationProduct,
  ReactivationSteps,
} from '@/components/landing/reactivation';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';

export const metadata: Metadata = {
  title: { absolute: 'Lead Reactivation | Call Your Old Leads and Book the Interested Ones - Laycal' },
  description:
    'Upload the leads sitting in your CRM. Laycal calls every one, finds who is still interested and books them straight into your calendar.',
  alternates: { canonical: '/lead-reactivation' },
};

/** Second public page: the same product, sold to teams with a list rather than a live lead flow. */
export default function LeadReactivationPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <ReactivationHero />
      <ReactivationSteps />
      <ReactivationProduct />
      <ReactivationConsent />
      <ReactivationFaq />
      <ClosingCta
        title="Find the meetings hiding in your old leads."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
