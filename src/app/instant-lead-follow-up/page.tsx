import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'When someone fills in your form, Laycal’s AI voice agent calls them within a minute, asks your qualifying questions, handles objections and books the meeting on your calendar.';

export const metadata: Metadata = {
  title: 'Instant Lead Follow-Up: AI That Calls Web Leads Within a Minute',
  description,
  alternates: { canonical: '/instant-lead-follow-up' },
  openGraph: {
    title: 'Instant Lead Follow-Up: AI That Calls Web Leads Within a Minute | Laycal',
    description,
    url: 'https://www.laycal.com/instant-lead-follow-up',
    images: [OG_IMAGE],
  },
};

/** What the agent does on the call, for buyers searching for an AI that phones and qualifies their web leads. */
export default function InstantLeadFollowUpPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="instant-lead-follow-up" />
      <SolutionClose slug="instant-lead-follow-up" />
      <ClosingCta
        title="Every form fill gets a call."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
