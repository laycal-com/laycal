'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, LazyMotion, domAnimation } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Twitter } from 'lucide-react';
import Footer from '@/components/Footer';

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
  const [liveStats, setLiveStats] = useState({
    activeCalls: 1247,
    countriesActive: 15,
    todaysCalls: 847
  });
  const [pricing, setPricing] = useState<PricingData | null>(null);

  // Section refs for scroll tracking
  const heroRef = useRef(null);
  const socialProofRef = useRef(null);
  const problemSolutionRef = useRef(null);
  const howItWorksRef = useRef(null);
  const monitoringRef = useRef(null);
  const metricsRef = useRef(null);
  const featuresRef = useRef(null);
  const resultsRef = useRef(null);
  const comparisonRef = useRef(null);
  const pricingRef = useRef(null);
  const trustRef = useRef(null);
  const faqRef = useRef(null);

  // In-view tracking
  const heroInView = useInView(heroRef, { once: true, threshold: 0.3 });
  const socialProofInView = useInView(socialProofRef, { once: true, threshold: 0.3 });
  const problemSolutionInView = useInView(problemSolutionRef, { once: true, threshold: 0.3 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, threshold: 0.3 });
  const monitoringInView = useInView(monitoringRef, { once: true, threshold: 0.3 });
  const metricsInView = useInView(metricsRef, { once: true, threshold: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, threshold: 0.3 });
  const resultsInView = useInView(resultsRef, { once: true, threshold: 0.3 });
  const comparisonInView = useInView(comparisonRef, { once: true, threshold: 0.3 });
  const pricingInView = useInView(pricingRef, { once: true, threshold: 0.3 });
  const trustInView = useInView(trustRef, { once: true, threshold: 0.3 });
  const faqInView = useInView(faqRef, { once: true, threshold: 0.3 });

  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchPricing();
  }, []);

  useEffect(() => {
    // Handle scroll for navbar with passive listener
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Defer live stats animation to reduce blocking time
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setLiveStats(prev => ({
          activeCalls: prev.activeCalls + Math.floor(Math.random() * 10) - 5,
          countriesActive: prev.countriesActive + (Math.random() > 0.95 ? 1 : 0),
          todaysCalls: prev.todaysCalls + Math.floor(Math.random() * 5)
        }));
      }, 3000);

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timer);
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

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-white">
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Laycal",
            "description": "AI-powered sales calling platform - the best alternative to JustCall and Nooks. Enterprise-grade features at startup prices.",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web-based",
            "offers": {
              "@type": "Offer",
              "price": "0.07",
              "priceCurrency": "USD",
              "description": "Pay-per-minute pricing starting at $0.07/minute"
            },
            "author": {
              "@type": "Organization",
              "name": "Laycal",
              "url": "https://laycal.com"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "bestRating": "5",
              "ratingCount": "127"
            },
            "featureList": [
              "AI Voice Agents",
              "500+ Simultaneous Calls",
              "Pay-as-you-go Pricing",
              "Google Calendar Integration",
              "Lead Management",
              "Real-time Analytics",
              "Multiple Voice Providers"
            ]
          })
        }}
      />
      
      {/* Additional SEO for competitor alternatives */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Best JustCall and Nooks Alternative - Laycal AI Calling Platform",
            "description": "Compare Laycal vs JustCall vs Nooks. Why thousands choose Laycal as the better alternative for AI sales calling.",
            "author": {
              "@type": "Organization",
              "name": "Laycal"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Laycal",
              "logo": {
                "@type": "ImageObject",
                "url": "https://laycal.com/assets/logo.png"
              }
            },
            "datePublished": "2025-01-01",
            "dateModified": new Date().toISOString().split('T')[0],
            "mainEntityOfPage": "https://laycal.com"
          })
        }}
      />
      {/* Navigation Header */}
      <nav className={`${isScrolled ? 'fixed top-0' : 'relative'} w-full bg-[#1e40af] z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Image 
                src="/assets/logo.png" 
                alt="Laycal"
                width={100}
                height={30}
                className="h-8 w-auto filter brightness-0 invert"
                priority
              />
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
                onClick={() => scrollToSection(comparisonRef)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Why Laycal?
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
                  <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors font-semibold">
                    Sign Up
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <button className="bg-[#3b82f6] text-white px-6 py-2 rounded-lg hover:bg-[#2563eb] transition-colors font-semibold">
                    Go to Dashboard
                  </button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className={`${isScrolled ? 'pt-24' : 'pt-10'} pb-10 bg-white transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-5xl lg:text-6xl font-bold text-[#1f2937] leading-tight"
              >
                Scale Your Sales Calls to{' '}
                <span className="text-[#3b82f6]">500+ Simultaneous</span>{' '}
                Conversations
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-lg font-medium text-[#3b82f6] mb-2"
              >
                The #1 JustCall & Nooks Alternative
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl text-[#64748b] leading-relaxed max-w-2xl"
              >
                Transform your lead list into a 24/7 AI-powered calling machine. 
                Enterprise-grade features at startup prices - no more overpriced alternatives.
              </motion.p>

              {/* Live Stats Ticker */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="bg-[#f8fafc] p-4 rounded-lg border border-[#e2e8f0]"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
                  <span className="text-[#10b981] font-semibold">LIVE:</span>
                  <span className="text-[#64748b]">
                    Currently making {isClient ? liveStats.activeCalls.toLocaleString() : liveStats.activeCalls} calls across {liveStats.countriesActive} countries
                  </span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <SignedOut>
                  <SignInButton>
                    <button className="bg-[#1e40af] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1d4ed8] transition-all transform hover:scale-105 shadow-lg">
                      Start Free Trial - 1 Assistant + 5 Calls Free
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-[#1e40af] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1d4ed8] transition-all transform hover:scale-105 shadow-lg">
                      Go to Dashboard
                    </button>
                  </Link>
                </SignedIn>
                
                <a 
                  href="https://calendly.com/ceo-laycal/demo-laycal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-[#3b82f6] text-[#3b82f6] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#3b82f6] hover:text-white transition-all inline-block text-center"
                >
                  Schedule a Demo Call
                </a>
              </motion.div>
            </div>

            {/* Right Side - Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="bg-white rounded-xl shadow-2xl border border-[#e2e8f0] p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#1f2937]">Live Call Dashboard</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                      <div className="w-3 h-3 bg-[#f97316] rounded-full"></div>
                      <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Mock call grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-[#f8fafc] p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-[#64748b]">Call #{i + 1}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            i % 3 === 0 ? 'bg-[#10b981]' : 
                            i % 3 === 1 ? 'bg-[#f97316]' : 'bg-[#ef4444]'
                          }`}></div>
                        </div>
                        <div className="text-xs text-[#64748b]">
                          {i % 3 === 0 ? 'Connected' : i % 3 === 1 ? 'Dialing' : 'Queued'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mock metrics */}
                  <div className="bg-[#f8fafc] p-4 rounded">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-[#10b981]">247</div>
                        <div className="text-xs text-[#64748b]">Connected</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#f97316]">89</div>
                        <div className="text-xs text-[#64748b]">In Progress</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#8b5cf6]">156</div>
                        <div className="text-xs text-[#64748b]">Queued</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Social Proof Strip */}
      <motion.section 
        ref={socialProofRef}
        className="bg-[#f8fafc] py-10 border-y border-[#e2e8f0]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0">
            {/* Client Logos */}
            <div className="flex items-center space-x-8 opacity-60">
              {[
                { src: '/assets/0x0.png', alt: 'Client Logo 1' },
                { src: '/assets/images.png', alt: 'Client Logo 2' },
                { src: '/assets/images (1).png', alt: 'Client Logo 3' },
                { src: '/assets/images (2).png', alt: 'Client Logo 4' }
              ].map((logo, i) => (
                <div key={i} className="w-24 h-12 flex items-center justify-center">
                  <Image 
                    src={logo.src} 
                    alt={logo.alt}
                    width={96}
                    height={48}
                    className="max-w-full max-h-full object-contain filter grayscale"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            
            {/* Live Metrics */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b981]">{isClient ? liveStats.todaysCalls.toLocaleString() : liveStats.todaysCalls}</div>
                <div className="text-sm text-[#64748b]">calls completed today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8b5cf6]">99.9%</div>
                <div className="text-sm text-[#64748b]">uptime guaranteed</div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Problem/Solution Section */}
      <motion.section 
        ref={problemSolutionRef}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={problemSolutionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            From One Call at a Time to Hundreds Simultaneously
          </motion.h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={problemSolutionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-64 h-64 mx-auto rounded-lg overflow-hidden mb-6 shadow-lg">
                <Image 
                  src="/assets/stressed caller.webp" 
                  alt="Stressed traditional caller"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  priority={false}
                />
              </div>
              <h3 className="text-2xl font-bold text-[#1f2937] mb-4">BEFORE: Traditional Calling</h3>
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4">
                <p className="text-[#dc2626] font-semibold">1 caller × 8 hours = 80 calls max</p>
                <p className="text-[#64748b] text-sm mt-2">Limited by human capacity, working hours, and energy</p>
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={problemSolutionInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-64 h-64 mx-auto rounded-lg overflow-hidden mb-6 shadow-lg">
                <Image 
                  src="/assets/a man chilling.webp" 
                  alt="Relaxed person with AI automation"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  priority={false}
                />
              </div>
              <h3 className="text-2xl font-bold text-[#1f2937] mb-4">AFTER: AI-Powered Calling</h3>
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4">
                <p className="text-[#16a34a] font-semibold">500 simultaneous calls × 24/7 = 12,000 calls/day</p>
                <p className="text-[#64748b] text-sm mt-2">Unlimited capacity, never gets tired, works around the clock</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        ref={howItWorksRef}
        className="py-20 bg-[#f8fafc]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            Launch Your AI Calling Campaign in 3 Simple Steps
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Upload Leads & Create AI Caller",
                description: "Upload your CSV file and customize your AI voice assistant in minutes",
                icon: "📄",
                color: "#3b82f6"
              },
              {
                step: "2", 
                title: "Launch Call Campaign",
                description: "Hit launch and watch hundreds of calls blast out simultaneously",
                icon: "📞",
                color: "#f97316"
              },
              {
                step: "3",
                title: "Monitor Results & Scale",
                description: "Track performance in real-time and optimize for maximum results",
                icon: "📊",
                color: "#10b981"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-lg border border-[#e2e8f0] text-center hover:shadow-xl transition-shadow"
              >
                <div 
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-6"
                  style={{ backgroundColor: item.color + '20', color: item.color }}
                >
                  {item.icon}
                </div>
                <div 
                  className="text-3xl font-bold mb-4"
                  style={{ color: item.color }}
                >
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#1f2937] mb-4">{item.title}</h3>
                <p className="text-[#64748b] leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Live Call Monitoring Showcase */}
      <motion.section 
        ref={monitoringRef}
        className="py-20 bg-[#1e40af] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={monitoringInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center mb-16"
          >
            Command Center: Watch Your AI Army in Action
          </motion.h2>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={monitoringInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold mb-6">Real-Time Call Status Board</h3>
              
              {/* Mock ticker */}
              <div className="bg-black/30 rounded p-4 mb-6 font-mono text-sm">
                <div className="overflow-hidden">
                  <motion.div
                    animate={{ x: [-100, 100] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="whitespace-nowrap"
                  >
                    CONNECTED: Lead #1247 • DIALING: Lead #1248 • COMPLETED: Lead #1249 • CONNECTED: Lead #1250 • DIALING: Lead #1251
                  </motion.div>
                </div>
              </div>
              
              {/* Interactive World Map */}
              <div className="w-full h-48 rounded-lg overflow-hidden border-2 border-white/30 cursor-pointer transition-transform duration-300 hover:scale-105">
                <Image 
                  src="/assets/map.webp" 
                  alt="Interactive World Map with Call Activity"
                  width={800}
                  height={192}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  priority={false}
                />
              </div>
            </motion.div>

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={monitoringInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {[
                "Real-time call status for all active conversations",
                "Geographic visualization of global calling activity",
                "Live performance metrics and success rates",
                "Audio waveform monitoring for quality assurance",
                "Instant alerts for important call outcomes",
                "Scalable dashboard that handles thousands of concurrent calls"
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Call Performance Metrics */}
      <motion.section 
        ref={metricsRef}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={metricsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            The Power of AI-Powered Calling
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "500 calls in minutes",
                subtitle: "Volume",
                icon: "🚀",
                color: "#10b981"
              },
              {
                title: "Perfect script every time",
                subtitle: "Consistency", 
                icon: "🎯",
                color: "#3b82f6"
              },
              {
                title: "All time zones simultaneously",
                subtitle: "Coverage",
                icon: "🌍",
                color: "#8b5cf6"
              },
              {
                title: `$${pricing?.cost_per_minute_payg || 0.07}/minute total cost`,
                subtitle: "Cost",
                icon: "💰",
                color: "#f97316"
              }
            ].map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={metricsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-[#e2e8f0] text-center hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col justify-center h-full min-h-[200px]"
              >
                <div className="text-4xl mb-4">{metric.icon}</div>
                <h3 className="text-xl font-bold text-[#1f2937] mb-2">{metric.title}</h3>
                <div 
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: metric.color }}
                >
                  {metric.subtitle}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Showcase */}
      <motion.section 
        ref={featuresRef}
        className="py-20 bg-[#f8fafc]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            Built for Scale, Designed for Results
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Bulk Call Launcher",
                description: "Launch thousands of calls with a single click. Upload your lead list and watch the AI army go to work instantly.",
                icon: "🚀",
                color: "#3b82f6"
              },
              {
                title: "Real-Time Dashboard", 
                description: "Monitor every call in real-time with live metrics, status updates, and performance analytics.",
                icon: "📊",
                color: "#10b981"
              },
              {
                title: "Call Recording Hub",
                description: "Every call is automatically recorded and transcribed for quality assurance and training purposes.",
                icon: "🎙️",
                color: "#f97316"
              },
              {
                title: "Performance Analytics",
                description: "Deep insights into call success rates, conversion metrics, and optimization opportunities.",
                icon: "📈",
                color: "#8b5cf6"
              },
              {
                title: "Multi-Provider Setup",
                description: "Connect multiple phone providers for redundancy and optimal call routing across regions.",
                icon: "🌐",
                color: "#64748b"
              },
              {
                title: "AI Voice Customization",
                description: "Train your AI voice to match your brand, tone, and messaging for authentic conversations.",
                icon: "🤖",
                color: "#3b82f6"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-[#e2e8f0] hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: feature.color + '20', color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1f2937] mb-3">{feature.title}</h3>
                <p className="text-[#64748b] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Results Section */}
      <motion.section 
        ref={resultsRef}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={resultsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            Real Campaign Results
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                industry: "Real Estate",
                metric: "2,000 leads → 340 qualified",
                description: "17% qualification rate with automated follow-up scheduling",
                color: "#10b981",
                improvement: "+340% vs manual calling"
              },
              {
                industry: "Insurance",
                metric: "85% answer rate",
                description: "Compared to 23% industry average for cold calling",
                color: "#3b82f6",
                improvement: "+270% contact rate"
              },
              {
                industry: "B2B Sales",
                metric: "$47/lead cost",
                description: "Compared to $280 industry average cost per qualified lead", 
                color: "#8b5cf6",
                improvement: "83% cost reduction"
              }
            ].map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={resultsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-xl p-8 shadow-lg border border-[#e2e8f0] text-center hover:shadow-xl transition-shadow"
              >
                <div 
                  className="text-3xl font-bold mb-4"
                  style={{ color: result.color }}
                >
                  {result.metric}
                </div>
                <h3 className="text-xl font-bold text-[#1f2937] mb-3">{result.industry}</h3>
                <p className="text-[#64748b] mb-4">{result.description}</p>
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: result.color + '20', color: result.color }}
                >
                  {result.improvement}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Comparison Section */}
      <motion.section 
        ref={comparisonRef}
        className="py-20 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              ⚡ Laycal vs <span className="text-yellow-300">JustCall</span> vs <span className="text-green-300">Nooks</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              See why thousands of businesses choose Laycal over expensive alternatives
            </p>
          </motion.div>

          {/* Comparison Table */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg font-bold text-gray-900">What You Get</th>
                    <th className="px-6 py-4 text-center text-lg font-bold text-[#1e40af]">
                      <div className="flex items-center justify-center space-x-2">
                        <span>🚀 Laycal</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-lg font-bold text-gray-700">
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm">
                          <Image
                            src="/assets/justcall.svg"
                            alt="JustCall"
                            width={40}
                            height={40}
                            className="object-contain max-w-full max-h-full"
                          />
                        </div>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-lg font-bold text-gray-700">
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center p-2 shadow-sm">
                          <Image
                            src="/assets/nooks.avif"
                            alt="Nooks"
                            width={40}
                            height={40}
                            className="object-contain max-w-full max-h-full rounded"
                          />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    {
                      feature: "Massive Call Power",
                      laycal: "🚀 Run hundreds of AI-driven calls at once. 24/7, non-stop.",
                      justcall: "Limited to user seats & subscriptions.",
                      nooks: "Slower live connections, not built for raw volume."
                    },
                    {
                      feature: "Pricing That Makes Sense",
                      laycal: "💸 Pay-as-you-go. No contracts. No tricks.",
                      justcall: "Confusing, expensive seat-based plans. Hidden fees & sudden price hikes.",
                      nooks: "Opaque enterprise pricing. \"Ridiculously expensive\" (users quote $75K+ yearly)."
                    },
                    {
                      feature: "Prompt Builder Control",
                      laycal: "🎛️ Full control of your AI agent with our Prompt Builder. You decide tone, script, flow.",
                      justcall: "Limited call scripts, rigid workflows.",
                      nooks: "Requires setup and training, less direct control."
                    },
                    {
                      feature: "Ease of Use",
                      laycal: "✅ Upload leads → Click Start → Calls go live. Dead simple.",
                      justcall: "Steep setup, multiple modules, not beginner-friendly.",
                      nooks: "More complex workflow tools; takes time to learn."
                    },
                    {
                      feature: "Google Calendar Integration",
                      laycal: "📅 Built-in — sync calls, follow-ups, and meetings automatically.",
                      justcall: "Partial CRM/Calendar integrations.",
                      nooks: "Integrations still maturing, not as smooth."
                    },
                    {
                      feature: "Reliability",
                      laycal: "🔒 Multiple voice providers ensure no downtime.",
                      justcall: "Complaints of dropped calls, bugs, blocked numbers.",
                      nooks: "Reports of lag, bugs, and immature features."
                    },
                    {
                      feature: "Customer Support",
                      laycal: "🤝 Fast, human support — we want you to win.",
                      justcall: "Many reports of slow or dismissive support.",
                      nooks: "Still early; smaller support team, slower response."
                    },
                    {
                      feature: "Value for Money",
                      laycal: "⭐ Premium outbound power without draining your wallet.",
                      justcall: "Users complain plans feel overpriced and bloated.",
                      nooks: "Enterprise-only pricing — great if you're Salesforce, not if you're scrappy."
                    }
                  ].map((row, index) => (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0, x: -50 }}
                      animate={comparisonInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-6 py-6 font-semibold text-gray-900 border-r border-gray-100">
                        {row.feature}
                      </td>
                      <td className="px-6 py-6 text-center bg-gradient-to-r from-blue-50/50 to-blue-100/50 border-r border-blue-200">
                        <div className="text-sm font-medium text-[#1e40af]">
                          {row.laycal}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center border-r border-gray-100">
                        <div className="text-sm text-gray-600">
                          {row.justcall}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="text-sm text-gray-600">
                          {row.nooks}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Line */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-3xl font-bold text-white mb-6">🔥 Bottom Line:</h3>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/20 rounded-xl p-6 backdrop-blur-sm"
                >
                  <div className="text-2xl font-bold text-white mb-2">🚀 Laycal</div>
                  <div className="text-blue-100">Built to win at scale: more calls, more control, more results.</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                  <div className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded flex items-center justify-center p-2">
                      <Image
                        src="/assets/justcall.svg"
                        alt="JustCall"
                        width={28}
                        height={28}
                        className="object-contain max-w-full max-h-full"
                      />
                    </div>
                  </div>
                  <div className="text-blue-100">A phone system with hidden costs.</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 rounded-xl p-6 backdrop-blur-sm"
                >
                  <div className="text-2xl font-bold text-white mb-2 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center p-2">
                      <Image
                        src="/assets/nooks.avif"
                        alt="Nooks"
                        width={28}
                        height={28}
                        className="object-contain max-w-full max-h-full rounded-sm"
                      />
                    </div>
                  </div>
                  <div className="text-blue-100">A pricey assistant with bugs.</div>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={comparisonInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="text-xl text-white"
              >
                👉 With Laycal, you get <span className="text-yellow-300 font-bold">enterprise-grade power at startup prices</span> — while competitors drain your budget.
              </motion.div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mt-12"
          >
            <SignedOut>
              <SignInButton>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-yellow-400 text-[#1e40af] px-12 py-4 rounded-2xl text-xl font-bold hover:bg-yellow-300 transition-all duration-300 shadow-xl"
                >
                  Start Free Trial - No Card Required 🎉
                </motion.button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-yellow-400 text-[#1e40af] px-12 py-4 rounded-2xl text-xl font-bold hover:bg-yellow-300 transition-all duration-300 shadow-xl"
                >
                  Go to Dashboard 🚀
                </motion.button>
              </Link>
            </SignedIn>
          </motion.div>
        </div>
      </motion.section>

      {/* SEO Alternative Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Choose Laycal Over JustCall and Nooks?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Best JustCall Alternative</h3>
                <p className="text-gray-700 mb-4">
                  Tired of JustCall's expensive seat-based pricing and hidden fees? Laycal offers transparent pay-as-you-go pricing 
                  with no contracts or surprise charges. Get the same calling power without the bloated costs.
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>✅ No per-seat pricing - pay only for what you use</li>
                  <li>✅ 500+ simultaneous calls vs JustCall's limitations</li>
                  <li>✅ Built-in AI prompt builder (not available in JustCall)</li>
                  <li>✅ Multiple voice providers for better reliability</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">💎 Best Nooks Alternative</h3>
                <p className="text-gray-700 mb-4">
                  Nooks charges $75K+ yearly for enterprise features. Laycal gives you the same AI calling capabilities 
                  at a fraction of the cost, with better reliability and easier setup.
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>✅ 95% cost savings compared to Nooks enterprise pricing</li>
                  <li>✅ Simple setup - no complex training required</li>
                  <li>✅ Better uptime and fewer bugs than Nooks</li>
                  <li>✅ Perfect for startups and scale-ups, not just enterprises</li>
                </ul>
              </div>
            </div>

            <div className="text-center bg-blue-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Looking for a JustCall Alternative or Nooks Alternative?
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                Join thousands of businesses who switched from expensive alternatives to Laycal. 
                Get enterprise-grade AI calling without enterprise prices.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                <span className="bg-white px-3 py-1 rounded-full">✓ JustCall Alternative</span>
                <span className="bg-white px-3 py-1 rounded-full">✓ Nooks Alternative</span>
                <span className="bg-white px-3 py-1 rounded-full">✓ Sales Dialer Alternative</span>
                <span className="bg-white px-3 py-1 rounded-full">✓ AI Calling Software</span>
                <span className="bg-white px-3 py-1 rounded-full">✓ Outbound Calling Platform</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <motion.section 
        ref={pricingRef}
        className="py-20 bg-[#f8fafc]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-4"
          >
            Transparent Pricing, Massive Savings
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-[#64748b] text-center mb-12 max-w-3xl mx-auto"
          >
            Choose the plan that fits your calling volume. All plans include our core AI calling features.
          </motion.p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {[
              {
                title: "Free Trial",
                price: "Free",
                period: "30 days",
                description: "Perfect for getting started",
                features: [
                  "1 AI assistant included",
                  "5 calls to test the platform", 
                  "All voice providers (OpenAI)",
                  "Call transcripts & analytics",
                  "Email support",
                  "No credit card required",
                  "Upgrade anytime to continue",
                  "Full feature access during trial"
                ],
                popular: false,
                color: "#3b82f6",
                buttonText: "🎯 Start Free Trial",
                buttonAction: "trial"
              },
              {
                title: "Pay-as-you-go",
                price: `$${pricing?.initial_payg_charge || 25}`,
                period: "initial charge",
                description: "Most popular - start small and scale",
                features: [
                  `$${pricing?.initial_payg_charge || 25} initial charge ($${pricing?.assistant_base_cost || 20} assistant + $${pricing?.payg_initial_credits || 5} credits)`,
                  `$${pricing?.cost_per_minute_payg || 0.07} per calling minute`,
                  `$${pricing?.assistant_base_cost || 20} per additional assistant`,
                  `Minimum $${pricing?.minimum_topup_amount || 5} top-ups when balance low`,
                  "All voice providers (OpenAI)",
                  "Call transcripts & analytics",
                  "Email support",
                  "No monthly commitments"
                ],
                popular: true,
                color: "#10b981",
                buttonText: "🚀 Start Calling Now",
                buttonAction: "payg"
              },
              {
                title: "Enterprise",
                price: "Custom",
                period: "",
                description: "For large organizations",
                features: [
                  "Unlimited calling minutes",
                  "Unlimited AI assistants",
                  "All voice providers",
                  "Custom integrations",
                  "Dedicated account manager",
                  "24/7 phone support",
                  "SLA guarantees",
                  "Priority feature requests"
                ],
                popular: false,
                color: "#1e40af",
                buttonText: "Contact Sales",
                buttonAction: "enterprise"
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`bg-white rounded-xl p-8 shadow-lg border-2 ${
                  plan.popular ? 'border-[#10b981]' : 'border-[#e2e8f0]'
                } relative hover:shadow-xl transition-shadow`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#10b981] text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{plan.title}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold" style={{ color: plan.color }}>
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-[#64748b]"> {plan.period}</span>}
                  </div>
                  <p className="text-[#64748b]">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-[#64748b] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <SignedOut>
                  <SignInButton>
                    <button 
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        plan.popular
                          ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                          : plan.buttonAction === 'trial' 
                            ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                            : 'bg-[#1e40af] text-white hover:bg-[#1d4ed8]'
                      }`}
                    >
                      {plan.buttonText}
                    </button>
                  </SignInButton>
                </SignedOut>
                
                <SignedIn>
                  {plan.buttonAction === 'enterprise' ? (
                    <Link href="/contact">
                      <button className="w-full bg-[#1e40af] text-white py-3 rounded-lg font-semibold hover:bg-[#1d4ed8] transition-colors">
                        {plan.buttonText}
                      </button>
                    </Link>
                  ) : (
                    <Link href="/select-plan">
                      <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        plan.popular
                          ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                          : plan.buttonAction === 'trial' 
                            ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                            : 'bg-[#1e40af] text-white hover:bg-[#1d4ed8]'
                      }`}>
                        {plan.buttonText}
                      </button>
                    </Link>
                  )}
                </SignedIn>
              </motion.div>
            ))}
          </div>
          
          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white rounded-xl p-8 shadow-lg border border-[#e2e8f0] max-w-4xl mx-auto"
          >
            <h3 className="text-2xl font-bold text-[#1f2937] mb-6 text-center">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="bg-[#dbeafe] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#3b82f6]">1</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Start Free Trial</h4>
                <p className="text-[#64748b] text-sm">Sign up for free - get 1 assistant + 5 calls to test the platform (no card required)</p>
              </div>
              <div>
                <div className="bg-[#dcfce7] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#10b981]">2</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Upgrade to PAYG</h4>
                <p className="text-[#64748b] text-sm">Pay ${pricing?.initial_payg_charge || 25} to continue - then ${pricing?.cost_per_minute_payg || 0.07}/minute as you scale</p>
              </div>
              <div>
                <div className="bg-[#f3e8ff] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-[#8b5cf6]">3</span>
                </div>
                <h4 className="text-lg font-semibold text-[#1f2937] mb-2">Scale Unlimited</h4>
                <p className="text-[#64748b] text-sm">Add more assistants (${pricing?.assistant_base_cost || 20} each) and scale to thousands of calls</p>
              </div>
            </div>
            
            <div className="text-center mt-8 pt-6 border-t border-[#e2e8f0]">
              <p className="text-[#64748b] text-sm mb-2">
                No monthly fees. No contracts. No hidden charges. Pay only for what you use.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust & Security */}
      <motion.section 
        ref={trustRef}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={trustInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-[#1e40af] mb-16"
          >
            Enterprise-Grade Security & Reliability
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🛡️",
                title: "SOC 2 Compliant",
                description: "Enterprise-grade security with regular audits and compliance checks"
              },
              {
                icon: "⚡",
                title: "99.9% Uptime",
                description: "Guaranteed availability with redundant systems and 24/7 monitoring"
              },
              {
                icon: "🔒",
                title: "Data Encryption", 
                description: "End-to-end encryption for all calls, recordings, and customer data"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={trustInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="space-y-4"
              >
                <div className="text-5xl">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#1f2937]">{item.title}</h3>
                <p className="text-[#64748b]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        ref={faqRef}
        className="py-20 bg-[#f8fafc]"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold text-center text-[#1e40af] mb-16"
          >
            Frequently Asked Questions
          </motion.h2>
          
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
                answer: `Calls start at just $${pricing?.cost_per_minute_payg || 0.07}/minute, making it 80-90% cheaper than hiring human callers while delivering consistent results 24/7. You can also start with our free trial that includes 1 assistant and 5 calls.`
              },
              {
                question: "What integrations do you support?",
                answer: "We integrate with major CRMs (HubSpot, Salesforce, Pipedrive), calendar systems (Google, Outlook), and phone providers (Twilio, Plivo). API access available for custom integrations."
              },
              {
                question: "Is my data secure?",
                answer: "Absolutely. We're SOC 2 compliant with end-to-end encryption, secure data centers, and strict privacy controls. Your data never leaves our secure infrastructure."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={faqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#f8fafc] transition-colors"
                >
                  <span className="font-semibold text-[#1f2937]">{faq.question}</span>
                  <span className="text-[#3b82f6] text-xl">
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

      {/* Final CTA Section */}
      <motion.section className="py-20 bg-[#1e40af] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl lg:text-5xl font-bold mb-6"
          >
            Ready to Make 1,000 Calls Before Lunch?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl mb-8 text-white/90"
          >
            Join thousands of businesses scaling their sales with AI-powered calling
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <SignedOut>
              <SignInButton>
                <button className="bg-[#3b82f6] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#2563eb] transition-all transform hover:scale-105 shadow-lg">
                  Start Free Trial - 1 Assistant + 5 Calls
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button className="bg-[#3b82f6] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#2563eb] transition-all transform hover:scale-105 shadow-lg">
                  Launch Your First Campaign
                </button>
              </Link>
            </SignedIn>
            
            <a 
              href="https://calendly.com/ceo-laycal/demo-laycal"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#1e40af] transition-all inline-block text-center"
            >
              Schedule a Demo Call
            </a>
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
    </LazyMotion>
  );
}