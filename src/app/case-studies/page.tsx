import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "AI Voice Agent Case Studies | Automated Calling System Success Stories - Coming Soon",
  description: "AI voice agent and automated calling system case studies coming soon! See how businesses increase sales efficiency with AI powered phone calls and AI appointment setters.",
  keywords: "ai voice agent case studies, automated calling system success stories, ai powered phone calls results, ai appointment setter case studies, increase sales efficiency examples, ai sales assistant results, automated sales calls success",
  alternates: {
    canonical: "/case-studies",
  },
  openGraph: {
    title: "Coming Soon - Laycal Case Studies | Customer Success Stories",
    description: "Case studies and customer success stories are coming soon! Learn how businesses are scaling with AI calling.",
    url: "https://laycal.com/case-studies",
  },
};

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="flex items-center justify-center pt-20" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">📊</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Coming Soon
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            We're collecting amazing success stories from our customers! 
            Case studies showcasing real results will be available soon.
          </p>
          
          <div className="bg-green-50 rounded-xl p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Success Stories We're Documenting</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="text-2xl font-bold text-green-600 mb-1">300%</div>
                <div className="text-sm text-gray-600">Pipeline Increase</div>
                <div className="text-xs text-gray-500 mt-2">TechStart Inc.</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="text-2xl font-bold text-green-600 mb-1">$180K</div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-xs text-gray-500 mt-2">GrowthCorp</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                <div className="text-sm text-gray-600">Time Reduction</div>
                <div className="text-xs text-gray-500 mt-2">ScaleUp Solutions</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="text-2xl font-bold text-green-600 mb-1">24/7</div>
                <div className="text-sm text-gray-600">Lead Coverage</div>
                <div className="text-xs text-gray-500 mt-2">GlobalReach LLC</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What Our Case Studies Will Cover</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">Before & After Metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">Implementation Process</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">ROI Analysis</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">Customer Testimonials</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">Best Practices Learned</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700">Industry-Specific Results</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/contact"
              className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            >
              Share Your Success Story
            </Link>
            <Link 
              href="/sign-up"
              className="border border-green-600 text-green-600 px-8 py-4 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Start Your Success Story
            </Link>
          </div>
          
          <p className="text-gray-500 text-sm">
            Are you a Laycal customer with great results? We'd love to feature your story! 
            <Link href="/contact" className="text-green-600 hover:underline ml-1">Contact us</Link> to participate.
          </p>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}