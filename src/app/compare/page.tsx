import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { DEMO_URL } from '@/lib/links';
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

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      <header className="bg-primary text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-semibold mb-4">Compare Laycal</h1>
          <p className="text-xl opacity-90">
            Honest comparisons with dialers and phone systems — including when Laycal is not the
            right tool.
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              First: is Laycal the right category?
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              Laycal is a speed-to-lead platform: when a new lead comes in, an AI voice agent calls
              them within a minute, qualifies them and books a meeting on your calendar. It is not a
              phone system for your team and not a parallel dialer for outbound SDRs.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              If your problem is &quot;we miss or follow up slowly on inbound leads&quot;, Laycal is
              built for that. If your problem is &quot;our reps need a better dialer&quot;, one of the
              tools below will fit better — we say so plainly on each page.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">Head-to-head comparisons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {COMPARISONS.map((c) => (
                <Link
                  key={c.slug}
                  href={c.slug}
                  className="block bg-muted/40 border border-border p-6 rounded-xl hover:border-primary transition-colors"
                >
                  <div className="text-sm text-muted-foreground mb-1">{c.category}</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Laycal vs {c.name}
                  </h3>
                  <p className="text-muted-foreground">{c.summary}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="text-center text-white p-12 rounded-2xl bg-primary/10">
            <h2 className="text-3xl font-semibold mb-4 text-foreground">
              Want to see it on your own leads?
            </h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Book a demo and we will call a test lead live.
            </p>
            <Link
              href={DEMO_URL}
              className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
            >
              Book a demo
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
