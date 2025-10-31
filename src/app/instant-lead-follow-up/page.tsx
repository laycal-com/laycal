'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, LazyMotion, domAnimation } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { AnimatedCounter } from '@/components/ui/animated-counter';

interface PricingData {
  assistant_base_cost: number;
  cost_per_minute_payg: number;
  cost_per_minute_overage: number;
  minimum_topup_amount: number;
  initial_payg_charge: number;
  payg_initial_credits: number;
}

export default function InstantLeadFollowUp() {
  const [isClient, setIsClient] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);

  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const solutionRef = useRef(null);
  const howItWorksRef = useRef(null);
  const socialProofRef = useRef(null);
  const comparisonRef = useRef(null);
  const pricingRef = useRef(null);
  const faqRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, threshold: 0.3 });
  const problemInView = useInView(problemRef, { once: true, threshold: 0.3 });
  const solutionInView = useInView(solutionRef, { once: true, threshold: 0.3 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, threshold: 0.3 });
  const socialProofInView = useInView(socialProofRef, { once: true, threshold: 0.3 });
  const comparisonInView = useInView(comparisonRef, { once: true, threshold: 0.3 });
  const pricingInView = useInView(pricingRef, { once: true, threshold: 0.3 });
  const faqInView = useInView(faqRef, { once: true, threshold: 0.3 });

  useEffect(() => {
    setIsClient(true);
    fetchPricing();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-white">
        <nav className={`${isScrolled ? 'fixed top-0' : 'relative'} w-full bg-white border-b border-gray-200 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Image
                  src="/assets/logo.png"
                  alt="Laycal"
                  width={100}
                  height={30}
                  className="h-8 w-auto"
                  priority
                />
              </div>

              <div className="hidden md:flex items-center space-x-8">
                <button onClick={() => scrollToSection(howItWorksRef)} className="text-gray-700 hover:text-[#3B82F6] transition-colors">
                  How It Works
                </button>
                <button onClick={() => scrollToSection(pricingRef)} className="text-gray-700 hover:text-[#3B82F6] transition-colors">
                  Pricing
                </button>
                <button onClick={() => scrollToSection(faqRef)} className="text-gray-700 hover:text-[#3B82F6] transition-colors">
                  FAQ
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <SignedOut>
                  <SignInButton>
                    <button className="text-gray-700 hover:text-[#3B82F6] transition-colors">
                      Login
                    </button>
                  </SignInButton>
                  <SignInButton>
                    <button className="bg-[#22C55E] text-white px-6 py-2 rounded-lg hover:bg-[#16A34A] transition-colors font-semibold">
                      Start Free Trial
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-[#22C55E] text-white px-6 py-2 rounded-lg hover:bg-[#16A34A] transition-colors font-semibold">
                      Go to Dashboard
                    </button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </nav>

        <motion.section
          ref={heroRef}
          className={`${isScrolled ? 'pt-24' : 'pt-10'} pb-20 bg-gradient-to-br from-white via-blue-50/30 to-white transition-all duration-300`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-5xl lg:text-6xl font-bold text-[#111827] leading-tight"
                >
                  Call Every Hot Lead in{' '}
                  <span className="text-[#3B82F6]">60 Seconds</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-2xl text-[#111827] font-bold leading-tight mb-6" style={{ lineHeight: '1.4' }}
                >
                  Your AI calls leads in 60 seconds. Competitors call tomorrow. One wins.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-xl text-[#64748b] leading-relaxed mb-6" style={{ lineHeight: '1.7' }}
                >
                  Call every lead within 60 seconds—before your competition even knows they exist. Appointments auto-book to your calendar. No developer needed.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="bg-[#F9FAFB] p-6 rounded-lg border border-gray-200"
                >
                  <p className="text-[#111827] font-semibold mb-3">
                    No hiring. No complexity. Just instant results.
                  </p>
                  <p className="text-[#64748b]">
                    From sign-up to first call in under 10 minutes. Zero technical knowledge required.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <SignedOut>
                    <SignInButton>
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(34, 197, 94, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#22C55E] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#16A34A] transition-all shadow-xl min-h-[60px]"
                      >
                        Try It For Free
                      </motion.button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link href="/dashboard">
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(34, 197, 94, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-[#22C55E] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#16A34A] transition-all shadow-xl min-h-[60px]"
                      >
                        Go to Dashboard
                      </motion.button>
                    </Link>
                  </SignedIn>

                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    href="https://calendly.com/ceo-laycal/demo-laycal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-[#3B82F6] text-[#3B82F6] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#3B82F6] hover:text-white transition-all inline-block text-center min-h-[60px] flex items-center justify-center"
                  >
                    Get a Free Demo
                  </motion.a>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-sm text-[#64748b]"
                >
                  ✓ No credit card required ✓ Setup in 10 minutes ✓ $50 in free calls
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-[#64748b]">Form Submitted</span>
                      <span className="text-sm font-semibold text-[#111827]">3:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#22C55E] to-transparent"></div>
                    </div>
                    <div className="text-center py-8">
                      <div className="text-6xl font-bold text-[#3B82F6] mb-2">
                        <AnimatedCounter end={60} duration={2000} />s
                      </div>
                      <p className="text-[#64748b]">AI calling lead...</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-pulse"></div>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#3B82F6] to-transparent"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#64748b]">Lead Called</span>
                      <span className="text-sm font-semibold text-[#22C55E]">3:01 PM</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        <motion.section
          ref={problemRef}
          className="py-24 bg-[#F9FAFB]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-12"
            >
              Sound Familiar?
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8"
            >
              <p className="text-lg text-[#111827] mb-4 leading-relaxed">
                Your sales team gets 50-100 leads per week from your landing page.
              </p>
              <p className="text-lg text-[#111827] mb-4 leading-relaxed">
                But they can only call 10-15 per day.
              </p>
              <p className="text-lg text-[#111827] mb-4 leading-relaxed">
                By the time they reach lead #20, 4 days have passed.
              </p>
              <p className="text-xl text-[#EF4444] font-bold mb-6">
                Lead is gone. Bought from a competitor.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mb-6">
                <p className="text-xl text-[#3B82F6] font-bold text-center">
                  This isn't a rep problem. It's a speed problem.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#22C55E]/5 p-6 rounded-xl border-2 border-[#22C55E]/20">
                  <div className="text-4xl font-bold text-[#22C55E] mb-3">40-60%</div>
                  <p className="text-base font-semibold text-[#111827] mb-1">Called within 5 minutes</p>
                  <p className="text-sm text-[#64748b]">Pickup rate</p>
                </div>
                <div className="bg-gradient-to-br from-[#F59E0B]/10 to-[#F59E0B]/5 p-6 rounded-xl border-2 border-[#F59E0B]/20">
                  <div className="text-4xl font-bold text-[#F59E0B] mb-3">20-30%</div>
                  <p className="text-base font-semibold text-[#111827] mb-1">Called within 2 hours</p>
                  <p className="text-sm text-[#64748b]">Pickup rate</p>
                </div>
                <div className="bg-gradient-to-br from-[#EF4444]/10 to-[#EF4444]/5 p-6 rounded-xl border-2 border-[#EF4444]/20">
                  <div className="text-4xl font-bold text-[#EF4444] mb-3">5-10%</div>
                  <p className="text-base font-semibold text-[#111827] mb-1">Called within 24 hours</p>
                  <p className="text-sm text-[#64748b]">Pickup rate</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-6 mt-6 border-2 border-red-200">
                <p className="text-2xl text-[#111827] font-bold text-center">
                  Every hour of delay = 50% fewer deals.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          ref={solutionRef}
          className="py-24 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={solutionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-4"
            >
              Meet Your Instant Follow-Up System
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={solutionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#64748b] text-center mb-16 max-w-3xl mx-auto"
            >
              Laycal solves the speed problem by calling EVERY lead instantly. No hiring needed.
            </motion.p>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "⚡",
                  title: "Call Leads in 60 Seconds",
                  description: "Lead submitted 3pm? Called by 3:01pm. Before competition knows they exist.",
                  stat: "3-5x higher pickup rates vs. next-day calls",
                  color: "#3B82F6"
                },
                {
                  icon: "📈",
                  title: "3x More Leads, Same Team",
                  description: "Hire 1 rep = $150k/year. Laycal = pay per call. Call 3-5x more leads without hiring.",
                  stat: "$12,500/month salary vs. pay-as-you-go = Easy choice",
                  color: "#22C55E"
                },
                {
                  icon: "🚀",
                  title: "Setup in 10 Minutes",
                  description: "Working in 10 minutes. No coding. No integrations. No developer needed.",
                  stat: "From sign-up to first call = 10 minutes",
                  color: "#F59E0B"
                }
              ].map((prop, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={solutionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:border-[#3B82F6] transition-all cursor-pointer"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-6"
                    style={{ backgroundColor: prop.color + '20' }}
                  >
                    {prop.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-[#111827] mb-4">{prop.title}</h3>
                  <p className="text-[#64748b] mb-4 leading-relaxed">{prop.description}</p>
                  <div
                    className="text-sm font-semibold px-4 py-2 rounded-lg inline-block"
                    style={{ backgroundColor: prop.color + '20', color: prop.color }}
                  >
                    {prop.stat}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          ref={howItWorksRef}
          className="py-24 bg-gradient-to-br from-[#F9FAFB] to-blue-50/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-16"
            >
              How It Works in 4 Steps
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "Connect Your Leads",
                  description: "Google Forms / CSV → Leads flow to Laycal",
                  icon: "📋",
                  color: "#3B82F6"
                },
                {
                  step: "2",
                  title: "Create Your AI (10 Minutes)",
                  description: "Tell us what to say → No coding required",
                  icon: "🤖",
                  color: "#22C55E"
                },
                {
                  step: "3",
                  title: "Instant Calls Start",
                  description: "Lead submits form 3:01pm → AI calls 3:01pm",
                  icon: "📞",
                  color: "#F59E0B"
                },
                {
                  step: "4",
                  title: "Appointments Auto-Book",
                  description: "Lead says \"Thursday 2pm\" → Calendar updated automatically",
                  icon: "📅",
                  color: "#8B5CF6"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: index * 0.15 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 text-center hover:shadow-2xl transition-all"
                >
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-6"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div
                    className="text-4xl font-bold mb-4"
                    style={{ color: item.color }}
                  >
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-[#111827] mb-3">{item.title}</h3>
                  <p className="text-[#64748b]">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          ref={socialProofRef}
          className="py-24 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={socialProofInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-16"
            >
              Trusted by 500+ Sales Teams
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {[
                { icon: "📞", value: "15,000+", label: "leads called", color: "#3B82F6" },
                { icon: "📅", value: "2,500+", label: "appointments booked", color: "#22C55E" },
                { icon: "⭐", value: "4.8/5", label: "star rating", color: "#F59E0B" },
                { icon: "💰", value: "$2M+", label: "saved in hiring costs", color: "#8B5CF6" }
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={socialProofInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="text-center bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all"
                >
                  <div className="text-5xl mb-4">{metric.icon}</div>
                  <div className="text-4xl font-bold mb-2" style={{ color: metric.color }}>{metric.value}</div>
                  <div className="text-[#64748b] font-medium">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={socialProofInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 shadow-lg border-2 border-green-200 max-w-4xl mx-auto mb-12"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">💼</div>
                <p className="text-2xl text-[#111827] font-bold mb-2">
                  Replaced Hiring for 150+ Sales Teams
                </p>
                <p className="text-lg text-[#64748b] leading-relaxed">
                  Our customers avoided $2M+ in annual salary costs by using Laycal instead of hiring additional inside sales reps. Average savings: $150,000 per rep not hired.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={socialProofInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg border-2 border-blue-200 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="text-5xl mb-4">💬</div>
                <p className="text-lg text-[#111827] italic mb-4 leading-relaxed font-medium">
                  "We went from 15 calls/day to 150/day without hiring anyone. Laycal replaced our need for another $150k rep. Appointments auto-booking saves us 2 hours daily."
                </p>
                <p className="text-[#3B82F6] font-bold">— Marcus Chen</p>
                <p className="text-[#64748b] text-sm">VP Sales, Skari</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 hover:scale-[1.02] transition-transform cursor-pointer">
                <div className="text-5xl mb-4">🚀</div>
                <p className="text-lg text-[#111827] italic mb-4 leading-relaxed font-medium">
                  "Setup took 8 minutes. We called 200 leads the same day and booked 23 appointments. This replaced our need to hire 2 SDRs. ROI was immediate."
                </p>
                <p className="text-[#8B5CF6] font-bold">— Sarah Williams</p>
                <p className="text-[#64748b] text-sm">Sales Director, SAASTer</p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          ref={comparisonRef}
          className="py-24 bg-[#F9FAFB]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-4"
            >
              Why Laycal vs. The Alternative?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#64748b] text-center mb-12"
            >
              Email is slow. Hiring is expensive. Laycal gives you speed + scale + affordability.
            </motion.p>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-900"></th>
                      <th className="px-6 py-4 text-center text-lg font-bold text-[#3B82F6]">
                        <div className="flex items-center justify-center space-x-2">
                          <span>✓ Laycal</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-lg font-bold text-gray-700">Email Auto</th>
                      <th className="px-6 py-4 text-center text-lg font-bold text-gray-700">Hire Sales Rep</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { feature: "Speed", laycal: { text: "60 seconds", win: true }, email: { text: "24+ hours", win: false }, hire: { text: "24+ hours", win: false } },
                      { feature: "Pickup Rate", laycal: { text: "40-60%", win: true }, email: { text: "2-5%", win: false }, hire: { text: "40-60%", win: true } },
                      { feature: "Setup Time", laycal: { text: "10 minutes", win: true }, email: { text: "1-2 weeks", win: false }, hire: { text: "2-3 months", win: false } },
                      { feature: "Annual Cost", laycal: { text: "$600-3,600", win: true }, email: { text: "$600-2,400", win: true }, hire: { text: "$150,000", win: false } },
                      { feature: "Monthly Cost", laycal: { text: "Pay per call", win: true }, email: { text: "$50-200", win: false }, hire: { text: "$12,500", win: false } },
                      { feature: "Hiring Needed", laycal: { text: "No", win: true }, email: { text: "No", win: true }, hire: { text: "YES", win: false } },
                      { feature: "Works 24/7", laycal: { text: "Yes", win: true }, email: { text: "No", win: false }, hire: { text: "No", win: false } }
                    ].map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -50 }}
                        animate={comparisonInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className="hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="px-6 py-6 font-semibold text-gray-900">{row.feature}</td>
                        <td className="px-6 py-6 text-center bg-gradient-to-r from-blue-50/50 to-blue-100/50">
                          <div className="flex items-center justify-center space-x-2">
                            {row.laycal.win && <span className="text-[#22C55E] text-xl font-bold">✓</span>}
                            <span className={`font-semibold ${row.laycal.win ? 'text-[#3B82F6]' : 'text-gray-600'}`}>
                              {row.laycal.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {row.email.win ? (
                              <span className="text-[#22C55E] text-xl font-bold">✓</span>
                            ) : (
                              <span className="text-[#EF4444] text-xl font-bold">✗</span>
                            )}
                            <span className="text-gray-600">{row.email.text}</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {row.hire.win ? (
                              <span className="text-[#22C55E] text-xl font-bold">✓</span>
                            ) : (
                              <span className="text-[#EF4444] text-xl font-bold">✗</span>
                            )}
                            <span className="text-gray-600">{row.hire.text}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          ref={pricingRef}
          className="py-24 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-4"
            >
              Simple Pricing
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#64748b] text-center mb-12"
            >
              Test free. Pay only for what you use. Scale as you grow. No monthly minimums. No lock-in.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-xl border-2 border-[#3B82F6]"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#111827] mb-4">TEST FREE</h3>
                  <div className="text-5xl font-bold text-[#3B82F6] mb-2">$50</div>
                  <p className="text-[#111827] font-semibold">in free calls (≈100-200 leads)</p>
                  <p className="text-[#64748b] text-sm mt-2">Full access • Zero risk</p>
                </div>

                <SignedOut>
                  <SignInButton>
                    <button className="w-full bg-[#22C55E] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#16A34A] transition-colors mb-4">
                      START FREE TRIAL
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="w-full bg-[#22C55E] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#16A34A] transition-colors mb-4">
                      Go to Dashboard
                    </button>
                  </Link>
                </SignedIn>

                <ul className="space-y-3 text-[#111827]">
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">No credit card required</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Full feature access during trial</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Test with 100-200 real leads</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Cancel anytime, risk-free</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-200"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#111827] mb-4">SCALE AS YOU GROW</h3>
                  <div className="text-5xl font-bold text-[#111827] mb-2">$0.10-0.30</div>
                  <p className="text-[#111827] font-semibold">per call (no minimums)</p>
                  <p className="text-[#64748b] text-sm mt-2">Or bundles: 100 calls=$25 • 500=$100 • 1,000=$150</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 mb-6 text-center">
                  <p className="text-[#111827] font-semibold">Most teams: $50-300/month</p>
                </div>

                <ul className="space-y-3 text-[#111827]">
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Only pay for calls made</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Scale up or down anytime</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">No monthly minimums or commitments</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#22C55E] text-xl mr-2 font-bold">✓</span>
                    <span className="font-medium">Bulk discounts automatically applied</span>
                  </li>
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={pricingInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                <p className="text-lg text-[#111827] font-semibold mb-2">
                  💡 Pay only for what you use
                </p>
                <p className="text-[#64748b]">
                  No monthly minimums. No surprise charges. Scale up or down anytime. Cancel with one click.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          ref={faqRef}
          className="py-24 bg-[#F9FAFB]"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl font-bold text-center text-[#111827] mb-16"
            >
              Common Questions
            </motion.h2>

            <div className="space-y-4">
              {[
                {
                  question: "Do I need a developer?",
                  answer: "No. Zero technical knowledge needed. Fill a simple form, connect your leads, calling starts."
                },
                {
                  question: "How fast will leads get called?",
                  answer: "60 seconds. If submitted 3pm, called by 3:01pm."
                },
                {
                  question: "What if a lead doesn't answer?",
                  answer: "We retry up to 3 times. Data is saved in your dashboard for manual follow-up."
                },
                {
                  question: "Can I customize what the AI says?",
                  answer: "Yes. You provide talking points. We build the script. Full control."
                },
                {
                  question: "How much does it actually cost?",
                  answer: "Start free ($50 in calls). Then pay per call ($0.10-0.30). Most teams: $50-300/month."
                },
                {
                  question: "Can I integrate with my CRM?",
                  answer: "Yes. Lead data flows to your dashboard. Native CRM integrations coming soon."
                },
                {
                  question: "What if I don't like it?",
                  answer: "Free trial is risk-free. Pay-as-you-go = cancel anytime."
                },
                {
                  question: "How many leads can I call?",
                  answer: "Unlimited. Call 100 or 10,000. Pay only for what you use."
                },
                {
                  question: "Will prospects know this is AI?",
                  answer: "No. Our AI uses natural conversation flow with human-like pauses, tone variations, and responses. It sounds like a real person. Prospects won't know unless you tell them."
                },
                {
                  question: "Can I customize the script completely?",
                  answer: "Yes. Complete control over everything: what the AI says, how it handles objections, tone of voice, conversation pacing, and appointment booking flow. Use our 10-step prompt wizard or write your own custom script."
                },
                {
                  question: "Does it work with my CRM?",
                  answer: "Yes. Lead data and call results sync to your dashboard automatically. Native integrations with HubSpot, Salesforce, and Pipedrive coming soon. API access available for custom integrations."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: index * 0.08 }}
                  className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#3B82F6] hover:shadow-lg transition-all"
                >
                  <button
                    onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-[#111827]">{faq.question}</span>
                    <span className="text-[#3B82F6] text-2xl font-bold">
                      {faqOpen === index ? '−' : '+'}
                    </span>
                  </button>
                  {faqOpen === index && (
                    <div className="px-6 pb-4 text-[#64748b] leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section className="py-24 bg-gradient-to-br from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] text-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-5xl font-bold mb-6"
            >
              Stop Losing Leads to Slow Follow-Up
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl mb-6 leading-relaxed font-semibold"
            >
              Your competition loses deals because they follow up in hours and days.<br />
              You can follow up in seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/10 backdrop-blur rounded-xl p-6 mb-8 max-w-2xl mx-auto"
            >
              <p className="text-lg text-white leading-relaxed">
                Try Laycal For Free. $50 in free calls. No credit card required.<br />
                <span className="font-bold">See what happens when you call while leads are hot.</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <SignedOut>
                <SignInButton>
                  <button className="bg-[#22C55E] text-white px-12 py-4 rounded-lg text-lg font-bold hover:bg-[#16A34A] transition-all transform hover:scale-105 shadow-2xl">
                    START FREE TRIAL
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-[#22C55E] text-white px-12 py-4 rounded-lg text-lg font-bold hover:bg-[#16A34A] transition-all transform hover:scale-105 shadow-2xl">
                    Go to Dashboard
                  </button>
                </Link>
              </SignedIn>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-sm text-blue-100 mt-6"
            >
              Questions? Chat with us.
            </motion.p>
          </div>
        </motion.section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
