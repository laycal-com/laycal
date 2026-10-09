'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';

const DEFAULT_RATE = 0.07;

const RateContext = createContext(DEFAULT_RATE);

/** Per-minute rate from /api/pricing, falling back to the default until it loads. */
export function useRate() {
  const rate = useContext(RateContext);
  return { rate, rateLabel: `$${rate.toFixed(2)}` };
}

export function LandingProviders({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState(DEFAULT_RATE);

  useEffect(() => {
    let alive = true;
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.cost_per_minute_payg) setRate(Number(d.cost_per_minute_payg));
      })
      .catch(() => {
        /* keep the default rate */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <RateContext.Provider value={rate}>{children}</RateContext.Provider>
    </MotionConfig>
  );
}

export function StructuredData() {
  const { rate, rateLabel } = useRate();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Laycal',
          description:
            'Invite-only AI speed-to-lead platform. Calls every new lead within a minute of the form being submitted, qualifies them, handles objections and books meetings straight into Google Calendar.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web-based',
          offers: {
            '@type': 'Offer',
            price: String(rate),
            priceCurrency: 'USD',
            description: `Usage-based pricing from ${rateLabel} per minute`,
          },
          author: { '@type': 'Organization', name: 'Laycal', url: 'https://laycal.com' },
          featureList: [
            'AI Voice Agents',
            '500+ Simultaneous Calls',
            'Usage-based Pricing',
            'Google Calendar Integration',
            'Lead Management',
            'Real-time Analytics',
            'Multiple Voice Providers',
          ],
        }),
      }}
    />
  );
}
