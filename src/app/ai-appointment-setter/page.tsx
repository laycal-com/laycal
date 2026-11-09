import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'Laycal is an AI appointment setter that calls every new lead within a minute, qualifies them and books the appointment straight into your Google Calendar during the call.';

export const metadata: Metadata = {
  title: 'AI Appointment Setter: Calls Your Leads, Books the Meeting',
  description,
  alternates: { canonical: '/ai-appointment-setter' },
  openGraph: {
    title: 'AI Appointment Setter: Calls Your Leads, Books the Meeting | Laycal',
    description,
    url: 'https://www.laycal.com/ai-appointment-setter',
    images: [OG_IMAGE],
  },
};

/** For buyers searching for an AI that books appointments with their leads. */
export default function AiAppointmentSetterPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="ai-appointment-setter" />
      <SolutionClose slug="ai-appointment-setter" />
      <ClosingCta
        title="Every lead called. Every fit booked."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
