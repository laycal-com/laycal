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
import { OG_IMAGE } from '@/lib/seo';

const description =
  'Lead and database reactivation by phone. Upload the leads sitting in your CRM: Laycal’s AI voice agent calls every one, finds who is still interested and books them into your calendar.';

export const metadata: Metadata = {
  title: 'Lead & Database Reactivation: AI Calls Your Old Leads',
  description,
  alternates: { canonical: '/lead-reactivation' },
  openGraph: {
    title: 'Lead & Database Reactivation: AI Calls Your Old Leads | Laycal',
    description,
    url: 'https://www.laycal.com/lead-reactivation',
    images: [OG_IMAGE],
  },
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
