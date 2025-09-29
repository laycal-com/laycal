'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import PublicNavbar from '@/components/PublicNavbar';
import Footer from '@/components/Footer';

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}


export default function PricingPage() {
  const [pricing, setPricing] = useState<PricingData | null>(null);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      } else {
        // Use default values if API fails
        setPricing({
          assistant_base_cost: 20,
          cost_per_minute_payg: 0.07,
          cost_per_minute_overage: 0.05,
          minimum_topup_amount: 5,
          initial_payg_charge: 25,
          payg_initial_credits: 5
        });
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Use default values if fetch fails
      setPricing({
        assistant_base_cost: 20,
        cost_per_minute_payg: 0.07,
        cost_per_minute_overage: 0.05,
        minimum_topup_amount: 5,
        initial_payg_charge: 25,
        payg_initial_credits: 5
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* FAQ Schema Markup for Pricing Questions */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does pay-as-you-go pricing work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You're only charged for the actual talk time during calls. We don't charge for dial time, busy signals, or unanswered calls. All plans include transparent per-minute rates with no hidden fees."
                }
              },
              {
                "@type": "Question", 
                "name": "Are there any setup fees or long-term contracts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No setup fees and no long-term contracts required. You can start with our free plan and upgrade or downgrade at any time. Enterprise customers can choose annual plans for additional discounts."
                }
              },
              {
                "@type": "Question",
                "name": "What happens if I exceed my plan's call volume?", 
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Professional plans include call credits, and any overage is billed at the standard per-minute rate. You'll receive notifications before reaching your limits, and there are no surprise fees."
                }
              },
              {
                "@type": "Question",
                "name": "Can I change plans at any time?",
                "acceptedAnswer": {
                  "@type": "Answer", 
                  "text": "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer discounts for nonprofits or educational institutions?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we offer special pricing for qualified nonprofits and educational institutions. Contact our sales team to discuss your specific needs and eligibility."
                }
              },
              {
                "@type": "Question", 
                "name": "What payment methods do you accept?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We accept all major credit cards, ACH transfers, and PayPal. Enterprise customers can also set up invoicing and wire transfers."
                }
              }
            ]
          })
        }}
      />
      <PublicNavbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white py-20 pt-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, <span className="text-yellow-400">Transparent</span> Pricing
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8">
            Pay only for what you use. No seat limits, no hidden fees, no long-term contracts.
          </p>
          <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
            <span className="text-lg font-medium">🎉 Start with free trial - 1 assistant + 5 calls included!</span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Free Trial Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-green-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">Start Here</span>
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Trial</h2>
                <p className="text-gray-600 mb-6">Test our platform risk-free</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-green-600">Free</span>
                  <span className="text-gray-600 ml-2">for 30 days</span>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  1 AI assistant + 5 calls<br/>
                  <strong>No credit card required</strong>
                </div>
                <Link 
                  href="/select-plan"
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors block text-center"
                >
                  Start Free Trial
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">1 AI assistant included</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">5 calls to test platform</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Call transcripts & analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Calendar integration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Email support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">30-day trial period</span>
                </div>
              </div>
            </div>

            {/* Pay-as-you-go Plan */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-500 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pay-as-you-go</h2>
                <p className="text-gray-600 mb-6">Start small and scale as you grow</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${pricing?.initial_payg_charge || 25}</span>
                  <span className="text-gray-600 ml-2">initial charge</span>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  ${pricing?.assistant_base_cost || 20} for your first assistant + ${pricing?.payg_initial_credits || 5} in credits<br/>
                  Then <strong>${pricing?.cost_per_minute_payg || 0.07}/minute</strong> for calls
                </div>
                <Link 
                  href="/select-plan"
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors block text-center"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">${pricing?.payg_initial_credits || 5} in calling credits included</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">AI conversation engine</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Call transcripts &amp; analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Calendar integration</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Email support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">No monthly commitments</span>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h2>
                <p className="text-gray-600 mb-6">Custom solutions for large organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <div className="text-sm text-gray-600 mb-6">
                  Volume discounts available
                </div>
                <Link 
                  href="/contact"
                  className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors block text-center"
                >
                  Contact Sales
                </Link>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unlimited calling minutes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Unlimited AI assistants</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Custom integrations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Dedicated account manager</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">24/7 phone support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">SLA guarantees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">See How Much You'll Save</h2>
            <p className="text-xl text-gray-600">Compare Laycal against traditional SDR costs</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-red-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-red-700 mb-4">Traditional SDR Team</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>2 SDRs @ $60K each</span>
                    <span className="font-medium">$120,000/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Benefits &amp; overhead (30%)</span>
                    <span className="font-medium">$36,000/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tools &amp; software</span>
                    <span className="font-medium">$12,000/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training &amp; management</span>
                    <span className="font-medium">$15,000/year</span>
                  </div>
                  <hr className="border-red-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Annual Cost</span>
                    <span className="text-red-600">$183,000</span>
                  </div>
                  <div className="text-sm text-red-600">
                    Limited to ~200 calls/day during business hours
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-green-700 mb-4">Laycal AI Pay-as-you-go</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Initial setup</span>
                    <span className="font-medium">${pricing?.initial_payg_charge || 25}/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Call costs (est. 1000 min/month)</span>
                    <span className="font-medium">${((pricing?.cost_per_minute_payg || 0.07) * 1000 * 12).toFixed(0)}/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setup &amp; training</span>
                    <span className="font-medium">$0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Management overhead</span>
                    <span className="font-medium">$0</span>
                  </div>
                  <hr className="border-green-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Annual Cost</span>
                    <span className="text-green-600">${((pricing?.cost_per_minute_payg || 0.07) * 1000 * 12 + (pricing?.initial_payg_charge || 25)).toFixed(0)}</span>
                  </div>
                  <div className="text-sm text-green-600">
                    Up to 500 simultaneous calls, 24/7 availability
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                Save ${(183000 - ((pricing?.cost_per_minute_payg || 0.07) * 1000 * 12 + (pricing?.initial_payg_charge || 25))).toLocaleString()} per year
              </div>
              <div className="text-lg text-purple-700">
                That's a {(((183000 - ((pricing?.cost_per_minute_payg || 0.07) * 1000 * 12 + (pricing?.initial_payg_charge || 25))) / 183000) * 100).toFixed(1)}% cost reduction with 25x the capacity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                question: "How does pay-as-you-go pricing work?",
                answer: "You're only charged for the actual talk time during calls. We don't charge for dial time, busy signals, or unanswered calls. All plans include transparent per-minute rates with no hidden fees."
              },
              {
                question: "Are there any setup fees or long-term contracts?",
                answer: "No setup fees and no long-term contracts required. You can start with our free plan and upgrade or downgrade at any time. Enterprise customers can choose annual plans for additional discounts."
              },
              {
                question: "What happens if I exceed my plan's call volume?",
                answer: "Professional plans include call credits, and any overage is billed at the standard per-minute rate. You'll receive notifications before reaching your limits, and there are no surprise fees."
              },
              {
                question: "Can I change plans at any time?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits."
              },
              {
                question: "Do you offer discounts for nonprofits or educational institutions?",
                answer: "Yes, we offer special pricing for qualified nonprofits and educational institutions. Contact our sales team to discuss your specific needs and eligibility."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, ACH transfers, and PayPal. Enterprise customers can also set up invoicing and wire transfers."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Saving?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join thousands of businesses that have cut their sales costs by 90% with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/select-plan"
              className="bg-yellow-400 text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/contact"
              className="border border-white/30 text-white px-8 py-4 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
          
          <p className="text-sm opacity-75">
            ✅ Free trial included ✅ No credit card required ✅ Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}