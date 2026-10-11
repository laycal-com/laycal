import { DEFAULT_RATE as RATE } from '@/components/landing/rate';
import { FAQS } from '@/components/landing/sections';

const SITE_URL = 'https://www.laycal.com';

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Laycal',
        url: SITE_URL,
        logo: `${SITE_URL}/assets/logo.png`,
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Laycal',
        description:
          'Invite-only AI speed-to-lead platform. Calls every new lead within a minute of the form being submitted, qualifies them, handles objections and books meetings straight into Google Calendar.',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web-based',
        offers: {
          '@type': 'Offer',
          price: String(RATE),
          priceCurrency: 'USD',
          description: `Usage-based pricing from $${RATE.toFixed(2)} per minute`,
        },
        author: { '@type': 'Organization', name: 'Laycal', url: SITE_URL },
        featureList: [
          'AI Voice Agents',
          '500+ Simultaneous Calls',
          'Usage-based Pricing',
          'Google Calendar Integration',
          'Lead Management',
          'Real-time Analytics',
          'Multiple Voice Providers',
        ],
      }}
    />
  );
}

export function FaqPageJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }}
    />
  );
}
