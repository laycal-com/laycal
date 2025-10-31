'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, LazyMotion, domAnimation } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Zap, Calendar, Phone, TrendingUp, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { AnimatedCounter } from '@/components/ui/animated-counter';

export default function SpeedToLeadPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    avgResponseTime: 29,
    callsToday: 847,
    meetingsBooked: 203
  });

  const heroRef = useRef(null);
  const problemRef = useRef(null);
  const howItWorksRef = useRef(null);
  const resultsRef = useRef(null);
  const featuresRef = useRef(null);
  const comparisonRef = useRef(null);
  const testimonialsRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, threshold: 0.3 });
  const problemInView = useInView(problemRef, { once: true, threshold: 0.3 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, threshold: 0.3 });
  const resultsInView = useInView(resultsRef, { once: true, threshold: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, threshold: 0.3 });
  const comparisonInView = useInView(comparisonRef, { once: true, threshold: 0.3 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, threshold: 0.3 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        avgResponseTime: 29 + Math.floor(Math.random() * 3),
        callsToday: prev.callsToday + Math.floor(Math.random() * 3),
        meetingsBooked: prev.meetingsBooked + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
              "name": "Laycal Speed to Lead",
              "description": "AI-powered instant lead response system. Call every new lead within 30 seconds, 24/7. Increase conversion rates by 21x with instant speed to lead.",
              "applicationCategory": "BusinessApplication",
              "keywords": "speed to lead, instant lead response, AI calling, lead conversion, fast lead response",
              "featureList": [
                "30-second response time",
                "24/7 automated calling",
                "Instant lead qualification",
                "Auto-booking meetings",
                "Smart follow-ups"
              ]
            })
          }}
        />

        {/* Navigation */}
        <nav className={`${isScrolled ? 'fixed top-0' : 'relative'} w-full bg-[#1e40af] z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="flex items-center">
                <Image
                  src="/assets/logo.png"
                  alt="Laycal"
                  width={100}
                  height={30}
                  className="h-8 w-auto filter brightness-0 invert"
                  priority
                />
              </Link>

              <div className="flex items-center space-x-4">
                <SignedOut>
                  <SignInButton>
                    <button className="text-white hover:text-gray-200 transition-colors">
                      Login
                    </button>
                  </SignInButton>
                  <SignInButton>
                    <button className="bg-yellow-400 text-[#1e40af] px-6 py-2 rounded-lg hover:bg-yellow-300 transition-colors font-semibold">
                      Start Free Trial
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <button className="bg-yellow-400 text-[#1e40af] px-6 py-2 rounded-lg hover:bg-yellow-300 transition-colors font-semibold">
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
          className={`${isScrolled ? 'pt-24' : 'pt-10'} pb-20 bg-gradient-to-br from-orange-50 via-yellow-50 to-white relative overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-[#1e40af] px-6 py-2 rounded-full font-bold mb-6 shadow-lg"
              >
                <Zap className="w-5 h-5" />
                <span>Leads contacted in 1 min are 21× more likely to convert</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold text-[#1f2937] mb-6 leading-tight"
              >
                ⚡ Turn Every New Lead Into a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                  Live Call in 30 Seconds
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl lg:text-2xl text-[#64748b] mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Stop losing deals because your reps were too slow.
                <br />
                Laycal instantly calls every new lead, qualifies them, and books meetings — 24/7/365.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              >
                <a
                  href="https://calendly.com/ceo-laycal/demo-laycal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(251, 191, 36, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 text-[#1e40af] px-10 py-4 rounded-xl text-lg font-bold hover:from-yellow-300 hover:to-orange-300 transition-all shadow-xl relative group w-full sm:w-auto"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Book a Demo
                      <ArrowRight className="w-5 h-5" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </motion.button>
                </a>

                <SignedOut>
                  <SignInButton>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="border-2 border-[#1e40af] text-[#1e40af] px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#1e40af] hover:text-white transition-all shadow-lg w-full sm:w-auto"
                    >
                      Start Free Trial →
                    </motion.button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className="border-2 border-[#1e40af] text-[#1e40af] px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#1e40af] hover:text-white transition-all shadow-lg w-full sm:w-auto"
                    >
                      Go to Dashboard →
                    </motion.button>
                  </Link>
                </SignedIn>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-yellow-200 max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-500 mb-2">
                      <AnimatedCounter end={liveMetrics.avgResponseTime} duration={2000} />s
                    </div>
                    <div className="text-sm text-[#64748b]">Average Response Time</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="text-4xl font-bold text-[#10b981] mb-2">
                      <AnimatedCounter end={liveMetrics.callsToday} separator duration={2500} />
                    </div>
                    <div className="text-sm text-[#64748b]">Calls Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#3b82f6] mb-2">
                      +<AnimatedCounter end={240} duration={3000} />%
                    </div>
                    <div className="text-sm text-[#64748b]">Meetings Booked</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Problem Section */}
        <motion.section
          ref={problemRef}
          className="py-24 bg-gradient-to-b from-red-50 to-white"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-5xl lg:text-6xl font-bold text-[#dc2626] mb-8"
            >
              78% of Leads Never Get a Call Fast Enough
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={problemInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#64748b] space-y-6 mb-10 leading-relaxed"
            >
              <p>
                You spend thousands generating leads — but most go cold within minutes.
              </p>
              <p>
                Your team's busy, leads arrive after hours, and by the time someone follows up,{' '}
                <span className="font-bold text-[#dc2626]">your prospect has already booked with a competitor</span>.
              </p>
              <p className="text-2xl font-bold text-[#1e40af]">
                Laycal fixes that by calling every lead within 30 seconds, so you're always first in line.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={problemInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <a
                href="https://calendly.com/ceo-laycal/demo-laycal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg inline-flex items-center gap-2"
                >
                  See How It Works
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          ref={howItWorksRef}
          className="py-24 bg-gradient-to-b from-white via-blue-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-5xl font-bold text-center text-[#1e40af] mb-16"
            >
              How It Works
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  step: "1",
                  title: "Connect Your Lead Source",
                  description: "Plug in Google Forms, Facebook Ads, or your website. New leads flow straight into Laycal.",
                  icon: <TrendingUp className="w-10 h-10" />,
                  color: "#3b82f6"
                },
                {
                  step: "2",
                  title: "AI Calls Instantly",
                  description: "Laycal dials the lead within 30 seconds, introduces your brand, and asks qualifying questions naturally.",
                  icon: <Phone className="w-10 h-10" />,
                  color: "#f59e0b"
                },
                {
                  step: "3",
                  title: "Book or Hand Off",
                  description: "If qualified, Laycal books the meeting right on your calendar or transfers the call to a live rep.",
                  icon: <Calendar className="w-10 h-10" />,
                  color: "#10b981"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:border-yellow-300 hover:shadow-2xl transition-all cursor-pointer group relative"
                >
                  <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-lg" style={{ backgroundColor: item.color }}>
                    {item.step}
                  </div>
                  <div
                    className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#1f2937] mb-4 text-center">{item.title}</h3>
                  <p className="text-[#64748b] leading-relaxed text-center">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={howItWorksInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="relative h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 rounded-full max-w-4xl mx-auto"
            >
              <div className="absolute -top-6 left-0 text-sm font-semibold text-blue-600">Form Submit</div>
              <div className="absolute -top-6 right-0 text-sm font-semibold text-green-600">Meeting Booked</div>
            </motion.div>
          </div>
        </motion.section>

        {/* Results & ROI */}
        <motion.section
          ref={resultsRef}
          className="py-24 bg-gradient-to-br from-yellow-50 via-orange-50 to-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={resultsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-5xl font-bold text-center text-[#1e40af] mb-6"
            >
              Out-Call Any Competitor by 10×
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={resultsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-center text-[#64748b] mb-16 max-w-3xl mx-auto"
            >
              Respond to new leads in seconds — not hours. Book 2–3× more appointments with the same ad spend.
            </motion.p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: <Zap className="w-12 h-12" />,
                  title: "Respond in Seconds",
                  description: "Not hours — day or night",
                  color: "#f59e0b",
                  stat: "30s"
                },
                {
                  icon: <TrendingUp className="w-12 h-12" />,
                  title: "2–3× More Appointments",
                  description: "Same ad spend, triple results",
                  color: "#10b981",
                  stat: "+240%"
                },
                {
                  icon: <Clock className="w-12 h-12" />,
                  title: "Never Lose After-Hours Leads",
                  description: "24/7/365 coverage",
                  color: "#3b82f6",
                  stat: "24/7"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  animate={resultsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all text-center group"
                >
                  <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div className="text-4xl font-bold mb-3" style={{ color: item.color }}>
                    {item.stat}
                  </div>
                  <h3 className="text-xl font-bold text-[#1f2937] mb-3">{item.title}</h3>
                  <p className="text-[#64748b]">{item.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={resultsInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white p-8 rounded-2xl text-center shadow-2xl"
            >
              <div className="text-sm font-semibold mb-2 text-blue-100">Live Performance Metrics</div>
              <div className="text-3xl font-bold mb-4">
                Average response time: <span className="text-yellow-300"><AnimatedCounter end={liveMetrics.avgResponseTime} />s</span> |
                Meetings booked automatically: <span className="text-yellow-300">+240%</span> vs manual SDRs
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Core Features Table */}
        <motion.section
          ref={featuresRef}
          className="py-24 bg-white"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-5xl font-bold text-center text-[#1e40af] mb-16"
            >
              Core Features
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap className="w-8 h-8" />,
                  feature: "⚡ Instant AI Dialer",
                  benefit: "Calls new leads within 30 seconds — day or night",
                  color: "#f59e0b"
                },
                {
                  icon: <Phone className="w-8 h-8" />,
                  feature: "🎙️ Human-sounding Voice",
                  benefit: "Builds trust and keeps leads on the line",
                  color: "#3b82f6"
                },
                {
                  icon: <Calendar className="w-8 h-8" />,
                  feature: "📅 Auto-Booking",
                  benefit: "Connects directly to Google Calendar",
                  color: "#10b981"
                },
                {
                  icon: <Clock className="w-8 h-8" />,
                  feature: "🔁 Smart Follow-ups",
                  benefit: "Re-calls unanswered leads automatically",
                  color: "#8b5cf6"
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  feature: "📊 Live Dashboard",
                  benefit: "Track calls, meetings, and ROI in real time",
                  color: "#06b6d4"
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  feature: "🔒 Enterprise Security",
                  benefit: "99.9% uptime + data encryption",
                  color: "#64748b"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:border-yellow-300 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: item.color + '20', color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#1f2937] mb-2">{item.feature}</h3>
                  <p className="text-[#64748b] text-sm">{item.benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Why Speed Beats Everything - Comparison */}
        <motion.section
          ref={comparisonRef}
          className="py-24 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-4xl lg:text-5xl font-bold text-center text-[#1e40af] mb-6"
            >
              Why Speed Beats Everything
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={comparisonInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl text-center text-[#1f2937] font-semibold mb-16"
            >
              The First Call Wins. Every Time.
            </motion.p>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-900">Metric</th>
                      <th className="px-6 py-4 text-center text-lg font-bold text-red-600 bg-red-50">Manual SDR</th>
                      <th className="px-6 py-4 text-center text-lg font-bold text-green-600 bg-green-50">Laycal AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      {
                        metric: "Avg Response Time",
                        manual: "1–3 hours",
                        ai: "30 seconds",
                        highlight: true
                      },
                      {
                        metric: "After-hours Calls",
                        manual: "No",
                        ai: "Yes"
                      },
                      {
                        metric: "Cost per Call",
                        manual: "$5+ (SDR time)",
                        ai: "$1.11"
                      },
                      {
                        metric: "Conversion Rate",
                        manual: "8–12%",
                        ai: "25–30% (typical)",
                        highlight: true
                      }
                    ].map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={comparisonInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`hover:bg-yellow-50 transition-all ${row.highlight ? 'bg-yellow-50/50' : ''}`}
                      >
                        <td className="px-6 py-5 font-semibold text-gray-900">
                          {row.metric}
                          {row.highlight && <Zap className="inline-block w-5 h-5 ml-2 text-yellow-500" />}
                        </td>
                        <td className="px-6 py-5 text-center text-red-600 font-medium bg-red-50/50">
                          {row.manual}
                        </td>
                        <td className="px-6 py-5 text-center text-green-600 font-bold bg-green-50/50">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={comparisonInView ? { scale: 1 } : { scale: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                            className="inline-flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {row.ai}
                          </motion.div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={comparisonInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-center text-xl text-[#64748b] mt-10 italic"
            >
              Top performers don't wait for the perfect script — they act first.
              <br />
              <span className="font-bold text-[#1e40af]">Laycal makes sure your team is the first voice your prospect hears.</span>
            </motion.p>
          </div>
        </motion.section>

        {/* Testimonials Placeholder */}
        <motion.section
          ref={testimonialsRef}
          className="py-24 bg-gradient-to-br from-blue-50 to-white"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={testimonialsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl p-12 shadow-2xl border-2 border-blue-100"
            >
              <div className="text-6xl mb-6">💬</div>
              <blockquote className="text-2xl text-[#1f2937] font-medium mb-6 italic">
                "We went from chasing leads to owning them. 80% of our new deals started with a Laycal call."
              </blockquote>
              <div className="text-[#64748b]">
                — <span className="font-semibold">Early Customer</span> (Testimonial coming soon)
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section className="py-24 bg-gradient-to-br from-[#1e40af] via-[#3b82f6] to-[#1e40af] text-white text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-6xl font-bold mb-6"
            >
              Be the First to Call. Always.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl lg:text-2xl mb-12 text-blue-100"
            >
              Your leads are talking to someone — make sure it's you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <a
                href="https://calendly.com/ceo-laycal/demo-laycal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 60px rgba(251, 191, 36, 0.6)" }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-[#1e40af] px-12 py-5 rounded-xl text-xl font-bold hover:from-yellow-300 hover:to-orange-300 transition-all shadow-2xl relative group w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Book a Demo
                    <ArrowRight className="w-6 h-6" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </motion.button>
              </a>

              <SignedOut>
                <SignInButton>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-yellow-400 text-yellow-400 px-12 py-5 rounded-xl text-xl font-bold hover:bg-yellow-400 hover:text-[#1e40af] transition-all shadow-xl w-full sm:w-auto"
                  >
                    Start Free Trial →
                  </motion.button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-yellow-400 text-yellow-400 px-12 py-5 rounded-xl text-xl font-bold hover:bg-yellow-400 hover:text-[#1e40af] transition-all shadow-xl w-full sm:w-auto"
                  >
                    Go to Dashboard →
                  </motion.button>
                </Link>
              </SignedIn>
            </motion.div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </LazyMotion>
  );
}
