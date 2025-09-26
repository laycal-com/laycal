import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';
import AnimatedTimeline from '@/components/AnimatedTimeline';

export const metadata: Metadata = {
  title: "AI Appointment Setter | Automated Sales Calls & AI Voice Agent - Laycal",
  description: "Increase sales efficiency with our AI appointment setter and automated calling system. AI powered phone calls, AI outbound calls, and AI sales assistant that works 24/7. Advanced AI voice agent for cold calling automation.",
  keywords: "ai appointment setter, automated sales calls, ai powered phone calls, ai outbound calls, ai voice agent, ai sales assistant, automated calling system, ai for cold calling, ai lead generation, increase sales efficiency",
  alternates: {
    canonical: "/sdr",
  },
  openGraph: {
    title: "AI Appointment Setter | Automated Sales Calls & AI Voice Agent - Laycal",
    description: "Increase sales efficiency with our AI appointment setter and automated calling system. AI powered phone calls, AI outbound calls, and AI sales assistant that works 24/7.",
    url: "https://laycal.com/sdr",
  },
};

export default function SDRLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 text-white relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] opacity-10 bg-cover bg-center"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <span className="text-sm font-medium">✨ Laycal AI SDR</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your New SDR Works <span className="text-yellow-400">24/7</span><br />
              and Books Meetings
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
              Go from missed calls to revenue opportunities with AI SDR. 
              Automated outbound calling, lead qualification, and meeting booking that never sleeps.
            </p>
            
            {/* Demo Call Widget */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-purple-900 font-bold">AI</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Book a demo with our AI SDR</p>
                  <p className="text-sm opacity-75">Available 24/7, responds instantly</p>
                </div>
                <button className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors">
                  Call Now
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/sign-up"
                className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
              >
                Start Your AI SDR Today
              </Link>
              <button className="border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Opportunities Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Go from missed calls to revenue opportunities with AI SDR
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Before Column */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                Tedious
              </h3>
              
              <div className="space-y-4">
                {[
                  "Manually dial 50-100 prospects each day",
                  "Spend hours qualifying leads manually",
                  "Miss follow-ups due to time constraints", 
                  "Struggle with consistent messaging",
                  "Limited to business hours only",
                  "High cost per qualified lead",
                  "Burnout from repetitive tasks"
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After Column */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                With JustCall AI SDR
              </h3>
              
              <div className="space-y-4">
                {[
                  "AI calls 500+ prospects automatically",
                  "Smart qualification with custom criteria",
                  "Never miss a follow-up opportunity",
                  "Consistent, personalized conversations",
                  "Works 24/7 across all time zones",
                  "90% lower cost per qualified lead",
                  "SDRs focus on high-value activities"
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Here's exactly how your new 24/7 AI SDR works
            </h2>
            <p className="text-xl text-gray-600">
              Set up your automated sales development process in minutes, not months. 
              Your AI SDR handles prospecting, calling, qualifying, and booking while you focus on closing deals.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
            <AnimatedTimeline 
              steps={[
                {
                  icon: "🎯",
                  title: "Upload your lead list with targeted criteria",
                  description: "AI analyzes and prioritizes prospects based on your ideal customer profile"
                },
                {
                  icon: "🤖", 
                  title: "AI SDR calls prospects automatically",
                  description: "Natural conversations that qualify leads and handle objections professionally"
                },
                {
                  icon: "📅",
                  title: "Books qualified meetings on your calendar",
                  description: "Seamless scheduling integration with your existing workflow"
                },
                {
                  icon: "📊",
                  title: "Real-time insights about every conversation",
                  description: "Detailed analytics on prospect interest, objections, and next steps"
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why revenue teams love Laycal AI SDR
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📞",
                title: "Human-like conversations",
                description: "Advanced AI that handles objections, asks qualifying questions, and builds rapport naturally"
              },
              {
                icon: "⚡",
                title: "Lightning-fast deployment", 
                description: "Get your AI SDR up and running in under 5 minutes. No technical setup required"
              },
              {
                icon: "🎯",
                title: "Precision targeting",
                description: "AI identifies the best prospects and optimal calling times for maximum conversion"
              },
              {
                icon: "📈",
                title: "Predictable pipeline growth",
                description: "Consistent lead flow with detailed analytics on every interaction and outcome"
              },
              {
                icon: "💰",
                title: "90% cost reduction",
                description: "Replace expensive SDR teams with AI that works 24/7 at a fraction of the cost"
              },
              {
                icon: "🔄",
                title: "Seamless integrations",
                description: "Works with your existing CRM, calendar, and sales tools out of the box"
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 relative z-20">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 bg-white py-4">
              Built for busy revenue teams
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="bg-blue-50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    SC
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">Sarah Chen</p>
                    <p className="text-gray-600">VP of Sales, TechStart Inc.</p>
                  </div>
                </div>
                <blockquote className="text-lg text-gray-700 mb-4">
                  "Our AI SDR books more qualified meetings in a week than our entire SDR team used to book in a month. 
                  The ROI is incredible - we're seeing 300% more pipeline at 70% less cost."
                </blockquote>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    300% more pipeline
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    70% cost reduction
                  </div>
                </div>
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Calls per day</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <div className="text-sm text-gray-600">Always working</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">90%</div>
                  <div className="text-sm text-gray-600">Cost savings</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/Success Story Image Placeholder.png"
                  alt="Customer Success Story"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-sm object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-purple-600 mb-6">
                Build your own AI SDR personality
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Customize your AI SDR's conversation style, qualification criteria, and objection handling 
                to perfectly match your sales process and brand voice.
              </p>
              
              <div className="space-y-4">
                {[
                  "Custom conversation scripts and talking points",
                  "Intelligent qualification criteria setup", 
                  "Brand voice and personality customization",
                  "Industry-specific objection handling"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">AI SDR Personality Settings</h3>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 mb-1">Conversation Style</div>
                      <div className="text-purple-900 font-medium">Professional & Friendly</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Qualification Criteria</div>
                      <div className="text-blue-900 font-medium">Budget &gt; $10K, Decision Maker</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Success Rate</div>
                      <div className="text-green-900 font-medium">34% meeting booking rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                    🔒
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure and compliant</h3>
                  <p className="text-gray-600">
                    Enterprise-grade security with GDPR compliance, call recording permissions, 
                    and industry-standard data protection.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Tailored for your industry
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Pre-built templates and conversation flows designed specifically for your industry, 
                with compliance features and best practices built in.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                {[
                  "SaaS & Technology",
                  "Financial Services", 
                  "Healthcare & Medical",
                  "Real Estate",
                  "Insurance",
                  "Manufacturing"
                ].map((industry, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700">{industry}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Understand AI SDR before you decide
          </h2>
          
          <div className="space-y-6">
            {[
              {
                question: "What is an AI SDR and how does it work?",
                answer: "An AI SDR is an artificial intelligence system that performs sales development representative tasks like prospecting, calling leads, qualifying prospects, and booking meetings. It uses advanced natural language processing to have human-like conversations with your prospects."
              },
              {
                question: "How does AI SDR benefit businesses?",
                answer: "AI SDRs provide 24/7 availability, consistent messaging, cost efficiency (90% less than human SDRs), scalability to handle hundreds of calls simultaneously, and detailed analytics on every interaction."
              },
              {
                question: "How does it integrate with my existing workflow?",
                answer: "Our AI SDR integrates seamlessly with popular CRMs like Salesforce, HubSpot, and Pipedrive. It also connects with calendar systems for automatic meeting booking and provides real-time updates to your sales pipeline."
              },
              {
                question: "Is the AI SDR compliant with calling regulations?",
                answer: "Yes, our AI SDR is fully compliant with TCPA, GDPR, and other relevant regulations. It includes automatic consent tracking, do-not-call list management, and proper call recording disclosures."
              },
              {
                question: "Can I customize the AI SDR's conversation style?",
                answer: "Absolutely! You can customize the AI's personality, conversation flow, qualification criteria, objection handling responses, and even industry-specific talking points to match your brand and sales process."
              },
              {
                question: "How quickly can I see results with AI SDR?",
                answer: "Most customers see qualified meetings booked within the first week of deployment. The AI SDR can start making calls immediately after a 5-minute setup process."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Less busywork. Better conversations. More selling.
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of revenue teams who've automated their prospecting with AI SDR
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/sign-up"
              className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Start Your AI SDR Today
            </Link>
            <button className="border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors">
              Book a Demo Call
            </button>
          </div>
          
          <p className="text-sm opacity-75">
            ✅ 5-minute setup ✅ No credit card required ✅ 24/7 support
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}