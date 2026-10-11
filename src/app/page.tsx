import { ClosingCta } from '@/components/landing/cta';
import { Features } from '@/components/landing/features';
import { Hero } from '@/components/landing/hero';
import { Pricing } from '@/components/landing/pricing';
import { ProductReveal } from '@/components/landing/product-reveal';
import { LandingProviders } from '@/components/landing/providers';
import { FaqPageJsonLd, SoftwareApplicationJsonLd } from '@/components/landing/structured-data';
import { Roi } from '@/components/landing/roi';
import { Scale } from '@/components/landing/scale';
import { Faq, HowItWorks, Integrations, SiteFooter, UseCases } from '@/components/landing/sections';
import { SiteNav } from '@/components/landing/site-nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

/**
 * Landing page. The `dark` root opts this page into the dark tokens in
 * globals.css; everything below is Tailwind utilities over shadcn and
 * Aceternity components (see Design.md).
 */
export default function Home() {
  return (
    <div className="dark relative bg-background font-sans text-foreground antialiased">
      <LandingProviders>
        <SoftwareApplicationJsonLd />
        <FaqPageJsonLd />
        <SiteNav />
        <main>
          <Hero />
          <Integrations />
          <HowItWorks />
          <ProductReveal />
          <UseCases />
          <Scale />
          <Features />
          <Roi />
          <Pricing />
          <Faq />
          <ClosingCta />
        </main>
        <SiteFooter />
      </LandingProviders>
    </div>
  );
}
