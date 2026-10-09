import type { Metadata } from 'next';
import { DEMO_URL } from '@/lib/links';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "JustCall Alternative - AI Voice Agent & Automated Calling System | Increase Sales Efficiency",
  description: "Best JustCall alternative with AI powered phone calls and automated calling system. AI appointment setter, AI sales assistant, and AI voice agent to increase sales efficiency. Switch from JustCall today.",
  keywords: "JustCall alternative, ai voice agent, automated calling system, ai powered phone calls, ai appointment setter, ai sales assistant, automated sales calls, increase sales efficiency, ai outbound calls, ai for cold calling, JustCall competitor",
  alternates: {
    canonical: "/justcall-alternative",
  },
  openGraph: {
    title: "JustCall Alternative - AI Voice Agent & Automated Calling System | Increase Sales Efficiency",
    description: "Best JustCall alternative with AI powered phone calls and automated calling system. AI appointment setter, AI sales assistant, and AI voice agent to increase sales efficiency.",
    url: "https://laycal.com/justcall-alternative",
  },
};

export default function JustCallAlternativePage() {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />
      
      {/* SEO Header */}
      <header className="bg-primary text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-semibold mb-4">
            The #1 JustCall Alternative for 2026
          </h1>
          <p className="text-xl opacity-90">
            Save 95% on calling costs. No per-seat pricing. Enterprise AI calling at startup prices.
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Why Switch Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              Why Switch from JustCall to Laycal?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-red-500 mb-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-card rounded flex items-center justify-center p-1">
                    <Image
                      src="/assets/justcall.svg"
                      alt="JustCall"
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span>Problems</span>
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>❌ Expensive per-seat pricing</li>
                  <li>❌ Limited simultaneous calls</li>
                  <li>❌ Hidden fees and sudden price hikes</li>
                  <li>❌ Complex setup process</li>
                  <li>❌ Reports of dropped calls and bugs</li>
                  <li>❌ Rigid workflows and limited customization</li>
                  <li>❌ Poor customer support response</li>
                </ul>
              </div>
              
              <div className="bg-green-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-500 mb-4">🚀 Laycal Solutions</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✅ Pay-as-you-go pricing (no per-seat fees)</li>
                  <li>✅ 500+ simultaneous calls</li>
                  <li>✅ Transparent pricing, no hidden costs</li>
                  <li>✅ 5-minute setup process</li>
                  <li>✅ Multiple voice providers ensure uptime</li>
                  <li>✅ Full AI prompt builder control</li>
                  <li>✅ Fast, human customer support</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Detailed Comparison */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              JustCall vs Laycal: Detailed Comparison (2026)
            </h2>
            
            <div className="overflow-x-auto bg-card rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-red-500">JustCall</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-soft">Laycal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Pricing Model</td>
                    <td className="px-6 py-4 text-center text-red-500">Per-seat + usage fees</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Pay-as-you-go only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Simultaneous Calls</td>
                    <td className="px-6 py-4 text-center text-red-500">Limited by seats</td>
                    <td className="px-6 py-4 text-center text-brand-soft">500+ calls</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">AI Prompt Builder</td>
                    <td className="px-6 py-4 text-center text-red-500">❌ Not available</td>
                    <td className="px-6 py-4 text-center text-brand-soft">✅ Full control</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Setup Time</td>
                    <td className="px-6 py-4 text-center text-red-500">Hours to days</td>
                    <td className="px-6 py-4 text-center text-brand-soft">5 minutes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Contract Requirements</td>
                    <td className="px-6 py-4 text-center text-red-500">Annual contracts</td>
                    <td className="px-6 py-4 text-center text-brand-soft">No contracts</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Hidden Fees</td>
                    <td className="px-6 py-4 text-center text-red-500">❌ Many reported</td>
                    <td className="px-6 py-4 text-center text-brand-soft">✅ 100% transparent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Migration Guide */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              How to Migrate from JustCall to Laycal
            </h2>
            
            <div className="bg-primary/10 p-8 rounded-lg">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Export Your JustCall Data</h3>
                    <p className="text-muted-foreground">Download your lead lists and call history from JustCall</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Sign Up for Laycal</h3>
                    <p className="text-muted-foreground">Create your account in under 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Upload Your Leads</h3>
                    <p className="text-muted-foreground">Bulk upload your CSV files with drag-and-drop</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Start Calling</h3>
                    <p className="text-muted-foreground">Launch your first AI calling campaign immediately</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center text-white p-12 rounded-2xl">
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Switch from JustCall?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands who made the switch and saved 95% on calling costs
            </p>
            <div className="space-y-4">
              <Link 
                href={DEMO_URL} 
                className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Start Free Trial - No Credit Card Required
              </Link>
              <p className="text-sm opacity-75">✅ Import JustCall data ✅ 5-minute setup ✅ Cancel anytime</p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}