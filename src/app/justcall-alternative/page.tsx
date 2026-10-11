import type { Metadata } from 'next';
import { DEMO_URL } from '@/lib/links';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import { OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'JustCall Alternative for AI Lead Follow-Up',
  description:
    'JustCall is a per-seat phone system for teams. Laycal is usage-based AI that calls every new lead within a minute and books the meeting. An honest comparison.',
  alternates: {
    canonical: '/justcall-alternative',
  },
  openGraph: {
    title: 'JustCall Alternative for AI Lead Follow-Up | Laycal',
    description:
      'JustCall is a per-seat phone system for teams. Laycal is usage-based AI that calls every new lead within a minute and books the meeting.',
    url: 'https://www.laycal.com/justcall-alternative',
    images: [OG_IMAGE],
  },
};

export default function JustCallAlternativePage() {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />

      <header className="bg-primary text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-semibold mb-4">
            The JustCall Alternative for Automated Lead Follow-Up
          </h1>
          <p className="text-xl opacity-90">
            Pay per calling minute, not per seat. An AI agent calls every new lead within a minute —
            no reps required.
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Category framing */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              First, an honest point: these are different tools
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              JustCall is a cloud phone system: your team gets numbers, a dialer, SMS and CRM
              integrations, and your reps make and take the calls. Laycal is a speed-to-lead
              platform: when a new lead submits a form, an AI voice agent calls them within a
              minute, qualifies them and books the meeting on your calendar. Many businesses use
              one, the other, or both.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted/40 border border-border p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-card rounded flex items-center justify-center p-1">
                    <Image
                      src="/assets/justcall.svg"
                      alt="JustCall"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span>Choose JustCall if…</span>
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Your reps need a business phone system with their own numbers</li>
                  <li>You want SMS, call recording and IVR for a support or sales team</li>
                  <li>Per-seat pricing fits how your team works</li>
                  <li>You need deep CRM integrations for manual calling workflows</li>
                </ul>
              </div>

              <div className="bg-green-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-500 mb-4">Choose Laycal if…</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✅ Inbound leads wait hours (or days) for a first call</li>
                  <li>✅ You want every new lead called in under a minute, 24/7</li>
                  <li>✅ You don&apos;t have reps available to dial every form fill</li>
                  <li>✅ You want AI to qualify and book meetings, not just connect calls</li>
                  <li>✅ You prefer usage-based pricing with no seat licenses</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Pricing comparison — verifiable figures only */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              Pricing models compared
            </h2>

            <div className="overflow-x-auto bg-card rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold"></th>
                    <th className="px-6 py-4 text-center font-semibold text-red-500">JustCall</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-soft">Laycal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Pricing model</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      Per-seat subscription: $29–$89 per user/month billed annually, 2-seat minimum
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      Usage-based: per calling minute, no seat licenses
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">AI voice agent</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      Available as a paid add-on
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      The core product — every account is AI calling
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Who makes the calls</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">Your team, manually or via dialer</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      The AI agent, automatically, the moment a lead arrives
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Contracts</td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      Monthly or annual billing (annual is discounted)
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">No contracts</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              JustCall plan details from justcall.io/pricing, checked October 2026. Laycal is pay
              as you go, per calling minute — see the calculator on our homepage.
            </p>
          </section>

          {/* How Laycal works */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              What switching to Laycal looks like
            </h2>

            <div className="bg-primary/10 p-8 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Connect a lead source</h3>
                    <p className="text-muted-foreground">
                      Website forms, ad lead forms via webhook, your CRM, or a CSV upload of an
                      existing list.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Set the script</h3>
                    <p className="text-muted-foreground">
                      Qualifying questions, objections to expect, and what gets booked — you control
                      the prompt.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Every lead gets called</h3>
                    <p className="text-muted-foreground">
                      Within a minute of submission, day or night. Qualified leads land on your
                      Google Calendar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center text-white p-12 rounded-2xl">
            <h2 className="text-3xl font-semibold mb-4">
              See it on one of your own leads
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Book a demo and we&apos;ll call a test lead live, so you can judge the voice and the
              speed yourself.
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
