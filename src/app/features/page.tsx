import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "AI Voice Agent Features | Automated Calling System & AI Sales Assistant",
  description: "Powerful AI voice agent features to increase sales efficiency. Advanced automated calling system with AI powered phone calls, AI for cold calling, AI lead generation, and AI appointment setter capabilities.",
  keywords: "ai voice agent, automated calling system, ai sales assistant, ai powered phone calls, ai for cold calling, ai lead generation, ai appointment setter, automated sales calls, ai outbound calls, increase sales efficiency",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "AI Voice Agent Features | Automated Calling System & AI Sales Assistant",
    description: "Powerful AI voice agent features to increase sales efficiency. Advanced automated calling system with AI powered phone calls, AI for cold calling, AI lead generation.",
    url: "https://laycal.com/features",
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white py-20 pt-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Powerful Features for <span className="text-yellow-400">Modern Sales Teams</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            Everything you need to automate your sales calls and grow your pipeline with AI
          </p>
          <Link 
            href="/sign-up"
            className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Core AI Calling Features</h2>
            <p className="text-xl text-gray-600">Built for scale, designed for results</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <div className="inline-flex items-center bg-purple-100 rounded-full px-4 py-2 mb-6">
                <span className="text-purple-600 font-medium">🤖 AI Conversation Engine</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Human-like AI Conversations
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Advanced natural language processing that handles objections, asks qualifying questions, 
                and maintains natural conversation flow. Your prospects won't know they're talking to AI.
              </p>
              <div className="space-y-4">
                {[
                  "Natural conversation flow with proper pacing",
                  "Dynamic objection handling and responses", 
                  "Context-aware follow-up questions",
                  "Customizable personality and tone",
                  "Multi-language support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <Image
                src="/assets/AI Conversation Demo Placeholder .png"
                alt="AI Conversation Demo"
                width={600}
                height={400}
                className="rounded-lg shadow-sm object-cover"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="lg:order-2">
              <div className="inline-flex items-center bg-blue-100 rounded-full px-4 py-2 mb-6">
                <span className="text-blue-600 font-medium">⚡ Scale & Performance</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                500+ Simultaneous Calls
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Scale your outreach like never before. Our AI can handle hundreds of calls simultaneously, 
                ensuring you never miss an opportunity while maintaining conversation quality.
              </p>
              <div className="space-y-4">
                {[
                  "500+ concurrent calls without quality loss",
                  "Global phone number provisioning",
                  "Advanced call routing and failover", 
                  "Real-time performance monitoring",
                  "99.9% uptime guarantee"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:order-1 bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <Image
                src="/assets/Performance Dashboard Placeholder.png"
                alt="Performance Dashboard"
                width={600}
                height={400}
                className="rounded-lg shadow-sm object-cover"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center bg-green-100 rounded-full px-4 py-2 mb-6">
                <span className="text-green-600 font-medium">🎯 Smart Qualification</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Intelligent Lead Qualification
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                AI automatically qualifies leads based on your custom criteria, ensuring only 
                high-quality prospects reach your sales team.
              </p>
              <div className="space-y-4">
                {[
                  "Custom qualification criteria setup",
                  "Dynamic scoring and prioritization",
                  "Automated lead routing and assignment",
                  "Integration with CRM systems",
                  "Real-time qualification updates"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <Image
                src="/assets/Lead Qualification Dashboard Placeholder.png"
                alt="Lead Qualification Dashboard"
                width={600}
                height={400}
                className="rounded-lg shadow-sm object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Advanced Features</h2>
            <p className="text-xl text-gray-600">Everything you need for professional sales automation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📅",
                title: "Calendar Integration",
                description: "Seamless booking with Google Calendar, Outlook, and Calendly. AI schedules meetings based on availability."
              },
              {
                icon: "📊",
                title: "Real-time Analytics",
                description: "Detailed insights on call performance, conversion rates, and prospect engagement metrics."
              },
              {
                icon: "🔄",
                title: "CRM Sync",
                description: "Automatic data sync with Salesforce, HubSpot, Pipedrive, and 50+ other CRM platforms."
              },
              {
                icon: "🎨",
                title: "Custom Branding",
                description: "White-label solution with custom caller ID, voice selection, and brand-aligned messaging."
              },
              {
                icon: "📝",
                title: "Call Transcription",
                description: "Automatic transcription and summarization of every call with key insights extraction."
              },
              {
                icon: "🔒",
                title: "Enterprise Security",
                description: "GDPR compliant with end-to-end encryption, call recording permissions, and data protection."
              },
              {
                icon: "🌍",
                title: "Global Reach",
                description: "Make calls worldwide with local phone numbers in 50+ countries and regions."
              },
              {
                icon: "⚡",
                title: "API Integration",
                description: "Powerful REST API for custom integrations and workflow automation."
              },
              {
                icon: "📱",
                title: "Mobile Dashboard",
                description: "Manage campaigns and monitor performance from any device with our mobile app."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Start automating your calls and growing your pipeline with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/contact"
              className="border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
          
          <p className="text-sm opacity-75 mt-6">
            ✅ 5-minute setup ✅ No credit card required ✅ 24/7 support
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}