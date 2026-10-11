import type { Metadata } from 'next';
import { DEMO_URL } from '@/lib/links';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Nooks Alternative: Outbound Dialer vs AI Lead Response',
  description:
    'Nooks is a parallel dialer for outbound SDR teams. Laycal is AI speed-to-lead: every inbound lead gets called within a minute. Which one do you actually need?',
  alternates: {
    canonical: '/nooks-alternative',
  },
  openGraph: {
    title: 'Nooks Alternative: Outbound Dialer vs AI Lead Response | Laycal',
    description:
      'Nooks is a parallel dialer for outbound SDR teams. Laycal is AI speed-to-lead: every inbound lead gets called within a minute.',
    url: 'https://www.laycal.com/nooks-alternative',
    images: [OG_IMAGE],
  },
};

export default function NooksAlternativePage() {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      <header className="bg-primary text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-semibold mb-4">
            The Nooks Alternative for Inbound Lead Response
          </h1>
          <p className="text-xl opacity-90">
            Nooks helps SDR teams dial out faster. Laycal makes sure no inbound lead ever waits for
            a call. Different problems — here&apos;s how to tell which one you have.
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Category framing */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              Outbound dialer vs. inbound speed-to-lead
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Nooks is a parallel dialer and virtual salesfloor: it exists so a team of SDRs can
              work through outbound call lists faster. Laycal is the opposite motion: the leads come
              to you (forms, ads, referrals), and an AI voice agent calls each one within a minute,
              qualifies them and books the meeting. If you don&apos;t have — or don&apos;t want — an
              SDR team, a dialer solves a problem you don&apos;t have.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted/40 border border-border p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-card rounded flex items-center justify-center p-1">
                    <Image
                      src="/assets/nooks.avif"
                      alt="Nooks"
                      width={20}
                      height={20}
                      className="object-contain rounded-sm"
                    />
                  </div>
                  <span>Choose Nooks if…</span>
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>You run an outbound SDR or BDR team</li>
                  <li>Reps work through cold call lists every day</li>
                  <li>You want call coaching and a virtual salesfloor</li>
                  <li>You&apos;re comfortable with sales-led, enterprise-style buying</li>
                </ul>
              </div>

              <div className="bg-green-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-500 mb-4">Choose Laycal if…</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✅ Your leads come to you — website forms, ad lead forms, your CRM</li>
                  <li>✅ Leads go cold before anyone calls them back</li>
                  <li>✅ You want every lead called in under a minute, 24/7, without hiring</li>
                  <li>✅ You want qualification and calendar booking, not just connected calls</li>
                  <li>✅ You want to pay per calling minute, with no seat licenses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pricing — only verifiable claims */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              On pricing transparency
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted/40 border border-border p-8 rounded-xl text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-2">Nooks</h3>
                <p className="text-muted-foreground">
                  No public pricing page — pricing is quoted through sales after a demo, and the
                  product is aimed at funded sales teams with multiple seats.
                </p>
              </div>
              <div className="bg-green-500/10 p-8 rounded-xl text-center">
                <h3 className="text-2xl font-semibold text-green-500 mb-2">Laycal</h3>
                <p className="text-muted-foreground">
                  Pay as you go, per calling minute, with no seat licenses and no contracts. The
                  calculator on our homepage estimates cost against your own lead volume, and your
                  rate is confirmed on the demo.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Nooks pricing status checked at nooks.io in October 2026 — no published plans at the
              time of writing.
            </p>
          </section>

          {/* Honest fit section (replaces testimonials) */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              When Laycal is not the right tool
            </h2>
            <div className="bg-muted/40 border border-border p-8 rounded-lg">
              <ul className="space-y-3 text-muted-foreground text-lg">
                <li>
                  <strong className="text-foreground">You need a dialer for cold outbound.</strong>{' '}
                  Laycal is built for responding to leads who raised their hand, not for working
                  cold lists at scale. A parallel dialer like Nooks is the right category for that.
                </li>
                <li>
                  <strong className="text-foreground">You want reps to have live conversations
                  manually.</strong> Laycal&apos;s agent handles the first call itself and hands off
                  a booked meeting, not a warm transfer queue.
                </li>
                <li>
                  <strong className="text-foreground">Your volume is a handful of leads a
                  month.</strong> Speed-to-lead automation pays off when every missed or slow lead
                  is real lost revenue.
                </li>
              </ul>
            </div>
          </section>

          {/* Comparison table */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              Nooks vs Laycal at a glance
            </h2>

            <div className="overflow-x-auto bg-card rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold"></th>
                    <th className="px-6 py-4 text-center font-semibold text-red-500">Nooks</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-soft">Laycal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Primary job</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Outbound parallel dialing for SDR teams</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Instant AI follow-up on inbound leads</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Who it replaces/augments</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Augments SDR reps</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Replaces the manual first call entirely</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Pricing model</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Sales-quoted, per seat</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Pay per calling minute — estimate it with the homepage calculator</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Typical buyer</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">VP Sales at a company with an SDR org</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Owner or operator who pays for leads</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Time to first call</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">When a rep is available to dial</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Under a minute, 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center text-white p-12 rounded-2xl">
            <h2 className="text-3xl font-semibold mb-4">
              If your leads are inbound, try the tool built for that
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a demo and we&apos;ll call a test lead live — you judge the voice, the speed and
              the booking flow.
            </p>
            <div className="space-y-4">
              <Link
                href={DEMO_URL}
                className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Book a demo
              </Link>
              <p className="text-sm opacity-75">
                ✅ Pay per calling minute ✅ No seats, no contracts ✅ Invite-only, by demo
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
