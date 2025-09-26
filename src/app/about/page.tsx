import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "About Laycal - AI Voice Agent & Automated Calling System Company | Our Mission",
  description: "Learn about Laycal's mission to increase sales efficiency through AI powered phone calls. We democratize automated calling systems, AI appointment setters, and AI sales assistants for businesses worldwide.",
  keywords: "about Laycal, ai voice agent company, automated calling system company, ai powered phone calls, ai appointment setter, ai sales assistant, automated sales calls, increase sales efficiency, ai for cold calling",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Laycal - AI Voice Agent & Automated Calling System Company | Our Mission",
    description: "Learn about Laycal's mission to increase sales efficiency through AI powered phone calls. We democratize automated calling systems, AI appointment setters, and AI sales assistants.",
    url: "https://laycal.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Democratizing Sales <span className="text-yellow-400">Automation</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            We believe every business deserves access to enterprise-grade AI calling, 
            not just Fortune 500 companies.
          </p>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-lg font-medium">🚀 Founded in 2024, Serving 1000+ Businesses</span>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              We started Laycal because we saw a problem: powerful AI calling technology was locked behind 
              enterprise price tags, making it inaccessible to the startups and growing businesses that needed it most.
            </p>
            <p className="text-lg text-gray-600 mb-12">
              Our mission is simple: make enterprise-grade AI calling available to every business, 
              regardless of size or budget. We believe great technology should empower everyone, not just the biggest players.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">1000+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">50M+</div>
                <div className="text-gray-600">Calls Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">95%</div>
                <div className="text-gray-600">Cost Savings</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-xl text-gray-600">From frustration to innovation</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
            <div className="bg-gray-100 rounded-2xl p-6 h-96 flex items-center justify-center">
              <Image
                src="/assets/Founder Story Image Placeholder .webp"
                alt="Founder Story"
                width={600}
                height={400}
                className="rounded-lg shadow-sm object-cover w-full h-full"
              />
            </div>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Problem We Saw</h3>
                <p className="text-gray-600 leading-relaxed">
                  As founders ourselves, we experienced the pain firsthand. We needed to scale our sales outreach 
                  but couldn't afford the $75,000+ enterprise solutions. Manual calling wasn't scalable, 
                  and affordable alternatives were either low-quality or limited in functionality.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Solution We Built</h3>
                <p className="text-gray-600 leading-relaxed">
                  We decided to build what we wished existed: enterprise-grade AI calling that any business 
                  could afford. Starting with a simple pay-as-you-go model, we focused on delivering 
                  professional results without the enterprise price tag.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Where We Are Today</h3>
                <p className="text-gray-600 leading-relaxed">
                  Today, Laycal serves over 1,000 businesses worldwide, from solo entrepreneurs to growing 
                  teams. We've processed over 50 million calls and helped our customers save millions 
                  in sales costs while scaling their outreach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "Accessibility First",
                description: "Great technology shouldn't be limited to big budgets. We make enterprise tools accessible to everyone."
              },
              {
                icon: "🎯",
                title: "Results Driven",
                description: "We measure success by our customers' success. Every feature is designed to drive real business outcomes."
              },
              {
                icon: "🔍",
                title: "Transparency Always",
                description: "No hidden fees, no surprise charges. We believe in honest pricing and clear communication."
              },
              {
                icon: "⚡",
                title: "Speed & Simplicity",
                description: "Complex doesn't mean complicated. We build powerful tools that are simple to use and quick to deploy."
              },
              {
                icon: "🤝",
                title: "Customer Obsession",
                description: "Our customers' feedback drives our roadmap. We build what you need, not what we think you need."
              },
              {
                icon: "🛡️",
                title: "Trust & Security",
                description: "We handle your business data with the highest security standards and complete transparency."
              }
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Want to Learn More?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            We're always happy to share our story and discuss how we can help your business grow
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Get in Touch
            </Link>
            <Link 
              href="/sign-up"
              className="border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Try Laycal Free
            </Link>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            ✉️ contact@laycal.com | 📞 +1 (555) 123-CALL
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}