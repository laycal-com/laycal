import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { SolutionClose, SolutionIntro } from '@/components/landing/solution';
import { OG_IMAGE } from '@/lib/seo';

const description =
  'AI appointment setting services: Laycal calls every new lead within a minute, qualifies them and books the appointment into your Google Calendar. No agency, no retainer, pay per calling minute.';

export const metadata: Metadata = {
  title: 'Appointment Setting Services Run by an AI Voice Agent',
  description,
  alternates: { canonical: '/appointment-setting-services' },
  openGraph: {
    title: 'Appointment Setting Services Run by an AI Voice Agent | Laycal',
    description,
    url: 'https://www.laycal.com/appointment-setting-services',
    images: [OG_IMAGE],
  },
};

/** For buyers comparing outsourced appointment setting companies. */
export default function AppointmentSettingServicesPage() {
  return (
    <LandingProviders>
      <SiteNav />
      <SolutionIntro slug="appointment-setting-services" />
      <SolutionClose slug="appointment-setting-services" />
      <ClosingCta
        title="Every lead called. Every fit booked."
        description="Laycal is invite-only. Book 15 minutes, hear real call recordings, and we'll send an invite if it's a fit."
        secondary={null}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
