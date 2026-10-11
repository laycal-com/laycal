import type { Metadata } from 'next';

import { ClosingCta } from '@/components/landing/cta';
import { ComparisonIndex } from '@/components/landing/comparison';
import { GhostLink } from '@/components/landing/primitives';
import { LandingProviders } from '@/components/landing/providers';
import { SiteFooter } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: { absolute: 'Compare Laycal | Speed to Lead vs Dialers and Phone Systems' },
  description:
    'How Laycal compares to dialers and phone systems — honest comparisons to help you pick the right tool for lead follow-up.',
  alternates: {
    canonical: '/compare',
  },
  openGraph: {
    title: 'Compare Laycal',
    description:
      'How Laycal compares to dialers and phone systems — honest comparisons to help you pick the right tool for lead follow-up.',
    url: 'https://www.laycal.com/compare',
    images: [OG_IMAGE],
  },
};

const COMPARISONS = [
  {
    slug: '/justcall-alternative',
    name: 'JustCall',
    category: 'Cloud phone system & dialer',
    summary:
      'JustCall is a per-seat cloud phone system for support and sales teams. Laycal is usage-based AI calling that follows up new leads automatically — different pricing model, different primary job.',
  },
  {
    slug: '/nooks-alternative',
    name: 'Nooks',
    category: 'Sales platform for SDR teams',
    summary:
      'Nooks is built for sales development teams: prospecting, dialing and coaching for reps. Laycal covers the leads that come to you: every new form submission gets an AI call within a minute, without a sales team behind it.',
  },
];

/** Index of the comparison pages, with a plain statement of which category Laycal is in. */
export default function ComparePage() {
  return (
    <LandingProviders>
      <SiteNav />
      <ComparisonIndex />
      <ClosingCta
        title="Want to see it on your own leads?"
        description="Book a demo and we will call a test lead live."
        secondary={<GhostLink href="/#roi">See what slow follow-up costs</GhostLink>}
      />
      <SiteFooter />
    </LandingProviders>
  );
}
