'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [liveStats, setLiveStats] = useState({
    activeCalls: 487,
    countriesActive: 23,
    todaysCalls: 12847
  });

  // Refs for smooth scrolling
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchPricing();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      } else {
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

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isClient) {
    return <div className="min-h-screen bg-gradient-to-br from-[#1e40af] to-[#3b82f6] flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className={`${isScrolled ? 'fixed top-0' : 'relative'} w-full bg-[#1e40af] z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-white">
                Laycal
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(pricingRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection(resultsRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Results
              </button>
              <button 
                onClick={() => scrollToSection(faqRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                FAQ
              </button>
              <Link href="/contact" className="text-white hover:text-gray-200 transition-colors">
                Contact
              </Link>
            </div>

            {/* CTA Button */}
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton>
                  <button className="text-white hover:text-gray-200 transition-colors">
                    Login
                  </button>
                </SignInButton>
                <SignInButton>
                  <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors">
                    Start Free Trial
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors">
                    Go to Dashboard
                  </button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1e40af] to-[#3b82f6] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Scale Your Sales with
              <span className="text-[#60a5fa] block mt-2">AI Voice Agents</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed">
              Make 500+ simultaneous calls 24/7. Get 15-30% higher contact rates than human callers 
              at just <strong>${pricing?.cost_per_minute_payg || 0.07}/minute</strong>.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <SignedOut>
                <SignInButton>
                  <button className="bg-white text-[#1e40af] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg w-full sm:w-auto">
                    Start Calling Now - $25
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-white text-[#1e40af] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg w-full sm:w-auto">
                    Go to Dashboard
                  </button>
                </Link>
              </SignedIn>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#1e40af] transition-colors w-full sm:w-auto"
              >
                See How It Works
              </button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60a5fa]">{liveStats.activeCalls.toLocaleString()}</div>
                <div className="text-sm opacity-80">Active Calls Right Now</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60a5fa]">{liveStats.countriesActive}</div>
                <div className="text-sm opacity-80">Countries Calling</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#60a5fa]">{liveStats.todaysCalls.toLocaleString()}</div>
                <div className="text-sm opacity-80">Calls Completed Today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1f2937] mb-6">Everything You Need to Scale</h2>
            <p className="text-xl text-[#64748b] max-w-3xl mx-auto">
              Built for sales teams who want to 10x their outreach without hiring more staff
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-[#e2e8f0] hover:shadow-lg transition-shadow">
              <div className="text-[#3b82f6] text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-[#1f2937] mb-3">AI Voice Agents</h3>
              <p className="text-[#64748b]">Natural-sounding AI that handles objections, books appointments, and transfers to humans when needed.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-[#e2e8f0] hover:shadow-lg transition-shadow">
              <div className="text-[#3b82f6] text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-[#1f2937] mb-3">Real-Time Analytics</h3>
              <p className="text-[#64748b]">Live dashboard showing call results, conversion rates, and performance metrics as they happen.</p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-[#e2e8f0] hover:shadow-lg transition-shadow">
              <div className="text-[#3b82f6] text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-[#1f2937] mb-3">CRM Integration</h3>
              <p className="text-[#64748b]">Seamlessly connects with HubSpot, Salesforce, Pipedrive, and major calendar systems.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1e40af] mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-[#64748b]">Pay only for successful calls. No setup fees, no monthly minimums.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 border border-[#e2e8f0] relative">
              <h3 className="text-2xl font-bold text-[#1f2937] mb-4">Pay As You Go</h3>
              <div className="text-4xl font-bold text-[#3b82f6] mb-2">
                ${pricing?.cost_per_minute_payg || 0.07}<span className="text-lg text-[#64748b]">/minute</span>
              </div>
              <p className="text-[#64748b] mb-6">${pricing?.cost_per_minute_payg || 0.07}/minute total cost</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Volume Discounts Available
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Consistency in Performance
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Coverage Across Time Zones
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Cost Effective at Scale
                </li>
              </ul>
              
              <SignedOut>
                <SignInButton>
                  <button className="w-full bg-[#3b82f6] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#2563eb] transition-colors">
                    Start Now
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="w-full bg-[#3b82f6] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#2563eb] transition-colors">
                    Start Now
                  </button>
                </Link>
              </SignedIn>
            </div>

            <div className="bg-white rounded-xl p-8 border-2 border-[#3b82f6] relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#3b82f6] text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-[#1f2937] mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-[#3b82f6] mb-2">Custom</div>
              <p className="text-[#64748b] mb-6">Volume pricing available</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Everything in Pay As You Go
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Priority Support
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Custom Integrations
                </li>
                <li className="flex items-center">
                  <span className="text-[#10b981] mr-2">✓</span>
                  Dedicated Account Manager
                </li>
              </ul>
              
              <Link href="/contact">
                <button className="w-full bg-[#1f2937] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#374151] transition-colors">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-[#1e40af] mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {[
              {
                question: "How quickly can I start making calls?",
                answer: "You can have your first AI calling campaign live within 10 minutes. Simply upload your leads, customize your AI agent, and launch your campaign."
              },
              {
                question: "What's the success rate compared to human callers?",
                answer: "Our AI agents typically achieve 15-30% higher contact rates than human callers due to perfect consistency, optimal timing, and never getting tired or discouraged."
              },
              {
                question: "Can the AI handle complex conversations?",
                answer: "Yes, our AI is trained to handle objections, answer questions, and have natural conversations. It can also seamlessly transfer to human agents when needed."
              },
              {
                question: "How much does it cost per call?",
                answer: "Calls start at just $0.07/minute, making it 80-90% cheaper than hiring human callers while delivering consistent results 24/7."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="font-semibold text-[#1f2937]">{faq.question}</span>
                  <span className="text-[#3b82f6] text-2xl">
                    {faqOpen === index ? '−' : '+'}
                  </span>
                </button>
                {faqOpen === index && (
                  <div className="px-6 pb-4 text-[#64748b]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1f2937]">Laycal</h3>
              <p className="text-[#64748b]">
                Scale your sales calls with AI agents that work 24/7 to connect with more prospects than ever before.
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[#1f2937]">Product</h4>
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-[#64748b] hover:text-[#3b82f6] transition-colors text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection(pricingRef)}
                  className="text-[#64748b] hover:text-[#3b82f6] transition-colors text-left"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="text-[#64748b] hover:text-[#3b82f6] transition-colors text-left"
                >
                  How It Works
                </button>
              </div>
            </div>

            {/* Support Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[#1f2937]">Support</h4>
              <div className="flex flex-col space-y-2">
                <Link href="/contact" className="text-[#64748b] hover:text-[#3b82f6] transition-colors">
                  Contact Us
                </Link>
                <Link href="/status" className="text-[#64748b] hover:text-[#3b82f6] transition-colors">
                  System Status
                </Link>
                <Link href="/privacy" className="text-[#64748b] hover:text-[#3b82f6] transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[#1f2937]">Connect</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-[#64748b] hover:text-[#3b82f6] transition-colors p-2 border border-[#e2e8f0] rounded hover:border-[#3b82f6]">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#64748b] hover:text-[#3b82f6] transition-colors p-2 border border-[#e2e8f0] rounded hover:border-[#3b82f6]">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#64748b] hover:text-[#3b82f6] transition-colors p-2 border border-[#e2e8f0] rounded hover:border-[#3b82f6]">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#64748b] hover:text-[#3b82f6] transition-colors p-2 border border-[#e2e8f0] rounded hover:border-[#3b82f6]">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-[#e2e8f0] pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#64748b]">© 2024 Laycal. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/terms" className="text-[#64748b] hover:text-[#3b82f6] transition-colors text-sm">Terms</Link>
              <Link href="/privacy" className="text-[#64748b] hover:text-[#3b82f6] transition-colors text-sm">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}