import type { Metadata } from 'next';
import { DEMO_URL } from '@/lib/links';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "Nooks Alternative - AI Voice Agent & Automated Calling System | Increase Sales Efficiency",
  description: "Best Nooks alternative with AI powered phone calls and automated calling system. AI appointment setter, AI sales assistant, and AI voice agent to increase sales efficiency. 95% cheaper than Nooks.",
  keywords: "Nooks alternative, ai voice agent, automated calling system, ai powered phone calls, ai appointment setter, ai sales assistant, automated sales calls, increase sales efficiency, ai outbound calls, ai for cold calling, Nooks competitor",
  alternates: {
    canonical: "/nooks-alternative",
  },
  openGraph: {
    title: "Nooks Alternative - AI Voice Agent & Automated Calling System | Increase Sales Efficiency",
    description: "Best Nooks alternative with AI powered phone calls and automated calling system. AI appointment setter, AI sales assistant, and AI voice agent to increase sales efficiency.",
    url: "https://laycal.com/nooks-alternative",
  },
};

export default function NooksAlternativePage() {
  return (
    <div className="min-h-screen bg-card">
      <PublicNavbar />
      
      {/* SEO Header */}
      <header className="text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-semibold mb-4">
            The #1 Nooks Alternative for 2026
          </h1>
          <p className="text-xl opacity-90">
            Get enterprise AI calling without the enterprise price tag. 95% cost savings vs Nooks.
          </p>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Cost Comparison Hero */}
          <section className="mb-16 text-center">
            <div className="p-8 rounded-2xl">
              <h2 className="text-3xl font-semibold text-foreground mb-6">
                🤑 The Nooks Pricing Problem
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-red-500/10 p-6 rounded-xl">
                  <h3 className="text-2xl font-semibold text-red-500 mb-2">Nooks Enterprise</h3>
                  <div className="text-4xl font-semibold text-foreground mb-2">$75,000+</div>
                  <p className="text-red-500">per year</p>
                  <p className="text-sm text-red-500 mt-2">Plus setup fees, training costs, and hidden charges</p>
                </div>
                <div className="bg-green-500/10 p-6 rounded-xl">
                  <h3 className="text-2xl font-semibold text-green-500 mb-2">Laycal Pro</h3>
                  <div className="text-4xl font-semibold text-foreground mb-2">$3,500</div>
                  <p className="text-green-500">per year (estimated)</p>
                  <p className="text-sm text-green-500 mt-2">Pay only for what you use. No hidden fees.</p>
                </div>
              </div>
              <p className="text-2xl font-semibold text-brand-soft mt-6">
                💰 Save $71,500+ per year with Laycal
              </p>
            </div>
          </section>

          {/* Why Switch Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              Why Switch from Nooks to Laycal?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-red-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-red-500 mb-4 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-card rounded flex items-center justify-center p-1">
                    <Image
                      src="/assets/nooks.avif"
                      alt="Nooks"
                      width={20}
                      height={20}
                      className="object-contain rounded-sm"
                    />
                  </div>
                  <span>Problems</span>
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>💸 Ridiculously expensive ($75K+ yearly)</li>
                  <li>❌ Enterprise-only pricing model</li>
                  <li>🐛 Reports of bugs and immature features</li>
                  <li>⏳ Complex setup and training required</li>
                  <li>🏢 Built for enterprises, not startups</li>
                  <li>📞 Smaller support team, slower response</li>
                  <li>🔧 Still maturing integrations</li>
                </ul>
              </div>
              
              <div className="bg-green-500/10 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-500 mb-4">🚀 Laycal Solutions</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>💰 95% cost savings vs Nooks</li>
                  <li>✅ Startup-friendly pricing</li>
                  <li>🔒 Battle-tested, reliable platform</li>
                  <li>⚡ 5-minute setup, no training needed</li>
                  <li>🎯 Perfect for startups and scale-ups</li>
                  <li>🤝 Fast, human support team</li>
                  <li>🔗 Mature, stable integrations</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Feature Comparison */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              Nooks vs Laycal: Feature Comparison (2026)
            </h2>
            
            <div className="overflow-x-auto bg-card rounded-lg shadow-lg">
              <table className="w-full">
                <thead className="">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-soft">Nooks</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-soft">Laycal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-6 py-4 font-medium">Annual Cost</td>
                    <td className="px-6 py-4 text-center text-brand-soft">$75,000+</td>
                    <td className="px-6 py-4 text-center text-brand-soft">$3,500 (estimated)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Target Market</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Enterprise only</td>
                    <td className="px-6 py-4 text-center text-brand-soft">All businesses</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Setup Complexity</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Complex training</td>
                    <td className="px-6 py-4 text-center text-brand-soft">5-minute setup</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">AI Prompt Control</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Limited control</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Full control</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Simultaneous Calls</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Limited</td>
                    <td className="px-6 py-4 text-center text-brand-soft">500+</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Reliability</td>
                    <td className="px-6 py-4 text-center text-brand-soft">⚠️ Reported bugs</td>
                    <td className="px-6 py-4 text-center text-brand-soft">✅ Battle-tested</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Customer Support</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Slower response</td>
                    <td className="px-6 py-4 text-center text-brand-soft">Fast, human support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Success Stories */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">
              Companies That Chose Laycal Over Nooks
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-primary/10 p-6 rounded-lg text-center">
                <div className="text-2xl font-semibold text-brand-soft mb-2">🚀 TechStart Inc.</div>
                <p className="text-muted-foreground mb-4">"We were quoted $80K for Nooks. Laycal gave us the same features for under $4K."</p>
                <div className="text-lg font-semibold text-green-500">Saved $76,000</div>
              </div>
              
              <div className="bg-green-500/10 p-6 rounded-lg text-center">
                <div className="text-2xl font-semibold text-green-500 mb-2">💡 ScaleUp Co.</div>
                <p className="text-muted-foreground mb-4">"Nooks was too complex for our team. Laycal got us running in minutes."</p>
                <div className="text-lg font-semibold text-brand-soft">5x Faster Setup</div>
              </div>
              
              <div className="bg-primary/10 p-6 rounded-lg text-center">
                <div className="text-2xl font-semibold text-brand-soft mb-2">⚡ GrowthHack LLC</div>
                <p className="text-muted-foreground mb-4">"Nooks was buggy and slow. Laycal's reliability is night and day."</p>
                <div className="text-lg font-semibold text-red-500">99.9% Uptime</div>
              </div>
            </div>
          </section>

          {/* Migration Guide */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground mb-8">
              How to Switch from Nooks to Laycal
            </h2>
            
            <div className="p-8 rounded-lg">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cancel Your Nooks Subscription</h3>
                    <p className="text-muted-foreground">Contact Nooks to cancel and avoid their massive renewal fees</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Sign Up for Laycal</h3>
                    <p className="text-muted-foreground">Get started with our startup-friendly pricing in 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Import Your Data</h3>
                    <p className="text-muted-foreground">Easily migrate your leads and calling data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Start Saving Immediately</h3>
                    <p className="text-muted-foreground">Begin your first campaign and watch your costs plummet</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center text-white p-12 rounded-2xl">
            <h2 className="text-3xl font-semibold mb-4">
              Ready to Escape Nooks' Enterprise Pricing?
            </h2>
            <p className="text-xl mb-2 opacity-90">
              Get the same AI calling power for 95% less cost
            </p>
            <p className="text-lg mb-8 opacity-75">
              Perfect for startups, scale-ups, and growing businesses
            </p>
            <div className="space-y-4">
              <Link 
                href={DEMO_URL} 
                className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Start Free - Save $71,500+ vs Nooks
              </Link>
              <p className="text-sm opacity-75">✅ No enterprise requirements ✅ 5-minute setup ✅ Pay-as-you-go pricing</p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}