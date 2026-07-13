"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, Shield, Zap, Check, ChevronDown, 
  Globe, Play, Terminal, LucideIcon
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { HeroScene } from '@/components/three/HeroScene';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { 
  springGentle, springStandard, springMagnetic, 
  staggerContainer, fadeUp, counterVariants, pageTransition,
  fadeUpMagnetic
} from '@/lib/animations/variants';

export default function Home() {
  // Animated counters using counterVariants
  const [counts, setCounts] = useState({ pincodes: 0, accuracy: 0, savings: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!statsInView) return;

    const animateCount = (target: number, key: 'pincodes' | 'accuracy' | 'savings', duration = 2000) => {
      const start = Date.now();
      const frame = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const value = Math.floor(target * eased);
        setCounts(prev => ({ ...prev, [key]: value }));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    animateCount(19277, 'pincodes');
    animateCount(97, 'accuracy');
    animateCount(200000, 'savings');
  }, [statsInView]);

  return (
    <div className="relative min-h-screen bg-black text-[#f8fafc] font-sans antialiased overflow-hidden select-none">
      
      {/* Small Globe SVG - Top Left (Not Three.js) */}
      <div className="fixed top-6 left-6 z-50 opacity-60 pointer-events-none">
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#22d3ee" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="animate-pulse-slow"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      </div>

      {/* Scroll progress indicator */}
      <ScrollProgress />
      
      {/* Three.js Hero Canvas background */}
      <HeroScene className="fixed inset-0 -z-10 w-full h-full" />

      {/* 1. Header/Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/45 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-cyan-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <span className="font-bold tracking-tight text-sm uppercase">Freight Intelligence</span>
            </div>
            <div className="hidden md:flex items-center gap-10 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#benefits" className="hover:text-white transition-colors">Manifesto</a>
              <a href="#pricing" className="hover:text-white transition-colors">Licensing</a>
              <a href="#faq" className="hover:text-white transition-colors">Docs & FAQ</a>
            </div>
            <div className="flex items-center gap-6">
              <a href="/login" className="text-xs uppercase font-bold text-slate-400 hover:text-white tracking-wider transition-colors">
                Portal Sign In
              </a>
              <a href="/calculate" className="bg-gradient-accent text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-organic-1 hover:scale-105 transition-all shadow-lg shadow-cyan-500/10">
                Open Instrument
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section - The Manifesto */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center text-center px-6 pt-32 pb-16 z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-400"
          >
            <Shield className="w-3.5 h-3.5" />
            Zero-Compromise Logistics Infrastructure
          </motion.div>

          {/* Big Satoshi title - font-display maps to Satoshi via globals.css */}
          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={pageTransition}
            className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight leading-none text-white select-text"
          >
            Freight <br className="sm:hidden" />
            <span className="text-gradient-accent font-medium">Intelligence</span>
          </motion.h1>

          <motion.p 
            variants={fadeUp}
            className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed select-text"
          >
            Exact NHAI tolls. Real carrier rates. Multi-modal benchmarks. Calculated with pincode-level accuracy in a unified querying environment.
          </motion.p>

          {/* CTA Cluster */}
          <motion.div variants={staggerContainer} className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <motion.a 
              href="/calculate"
              variants={fadeUpMagnetic}
              className="px-8 py-4 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-95 transition-all shadow-xl shadow-cyan-500/15"
            >
              Calculate rate
            </motion.a>
            <motion.a 
              href="#features"
              variants={fadeUpMagnetic}
              className="flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-organic-2 transition-all"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              API Docs
            </motion.a>
            <motion.a 
              href="#benefits"
              variants={fadeUpMagnetic}
              className="flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-organic-3 transition-all"
            >
              <Play className="w-4 h-4 text-violet-400" />
              Watch Demo
            </motion.a>
          </motion.div>

          {/* Trust Bar with animated counters */}
          <motion.div 
            ref={statsRef}
            variants={counterVariants.container}
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            className="pt-16 max-w-4xl mx-auto border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <motion.div variants={counterVariants.item} className="text-center">
              <motion.div className="text-2xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                {counts.pincodes.toLocaleString('en-IN')}+
              </motion.div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Pincodes Enriched</div>
            </motion.div>
            <motion.div variants={counterVariants.item} className="text-center">
              <motion.div className="text-2xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                {counts.accuracy}%
              </motion.div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Toll Accuracy</div>
            </motion.div>
            <motion.div variants={counterVariants.item} className="text-center">
              <motion.div className="text-2xl sm:text-4xl font-bold font-mono text-white tracking-tight">
                4 Modes
              </motion.div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Multi-Modal Hub</div>
            </motion.div>
            <motion.div variants={counterVariants.item} className="text-center">
              <motion.div className="text-2xl sm:text-4xl font-bold font-mono text-emerald-400 tracking-tight">
                ₹{(counts.savings / 100000).toFixed(1)}L/mo
              </motion.div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Client Savings</div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* 3. Features Section - Asymmetric Editorial Flow */}
      <section id="features" className="relative py-28 px-6 border-t border-white/5 bg-black/80 z-10">
        <div className="max-w-7xl mx-auto">
          
          <motion.div variants={fadeUp} className="max-w-xl mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Precision Infrastructure</span>
            <h2 className="text-4xl font-light text-white tracking-tight leading-tight">
              Calculated without compromise.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We weave structural calculations, vehicle dimensions, and live toll plaza coordinates together into organic visual summaries.
            </p>
          </motion.div>

          {/* Asymmetric Grid */}
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Feature 1 - Blob 1 (Span 7) */}
            <motion.div variants={fadeUp} className="md:col-span-7 bg-glass rounded-organic-1 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-2 bg-gradient-accent flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Exact Toll Plazas Breakdown</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  NHAI-verified plaza database mapped exactly to road route coordinates. Auto-calculates exact costs per vehicle axles, removing dispatcher arguments.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Blob 2 (Span 5) */}
            <motion.div variants={fadeUp} className="md:col-span-5 bg-glass rounded-organic-2 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-3 bg-gradient-accent flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">19,000+ Pincode Precision</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accurate database with lat/lon coordinates, state codes, and CGST/SGST matrices.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Blob 3 (Span 5) */}
            <motion.div variants={fadeUp} className="md:col-span-5 bg-glass rounded-organic-3 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-1 bg-gradient-accent flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">GST & Compliance Audit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated CGST, SGST, IGST, entry taxes, and cargo valuation audits to guarantee audit-ready invoicing outputs.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 - Blob 4 (Span 7) */}
            <motion.div variants={fadeUp} className="md:col-span-7 bg-glass rounded-organic-1 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-2 bg-gradient-accent flex items-center justify-center text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Multi-Modal Estimation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare road, express air, rail container, and ocean container rates in a single click, allowing your supply chain planner to optimize variables dynamically.
                </p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* 4. Benefits / Manifesto Section */}
      <section id="benefits" className="relative py-28 px-6 border-t border-white/5 bg-[#020617]/95 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-mono">Design Manifesto</span>
            <h2 className="text-4xl font-light text-white tracking-tight">Why we built it differently.</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Every decision optimizes for shipper velocity, not broker convenience.</p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Zero Dispatcher Arguments', desc: 'Exact toll plaza math removes the #1 friction point in Indian road logistics.' },
              { icon: Zap, title: 'Single Source of Truth', desc: 'Road, air, sea, rail in one query. No more tabs, calls, or spreadsheets.' },
              { icon: Globe, title: 'Pincode-Level Intelligence', desc: '19,277 enriched pincodes with industrial flags, ports, ICDs, and airports.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-glass rounded-organic-2 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300">
                <div className="w-10 h-10 rounded-organic-3 bg-gradient-accent flex items-center justify-center text-white mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 5. Comparison Table */}
      <section className="relative py-28 px-6 border-t border-white/5 bg-black z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Market Benchmarks</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Structured Performance Comparison</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Why enterprise supply chains transition their calculations to our logic.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="overflow-x-auto bg-glass rounded-organic-2 p-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Capability</th>
                  <th className="px-6 py-4 text-cyan-400">Freight Intelligence</th>
                  <th className="px-6 py-4">Traditional Broker</th>
                  <th className="px-6 py-4">Digital Marketplaces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono text-slate-300">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">19k+ Pincode Matrix</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Full Enriched</td>
                  <td className="px-6 py-4">Zone-level estimates</td>
                  <td className="px-6 py-4">Partial lookup</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Exact NHAI Toll Plazas</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> GPS Verified</td>
                  <td className="px-6 py-4">Estimated average</td>
                  <td className="px-6 py-4">Excluded</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Modes Supported</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Road, Air, Sea, Rail</td>
                  <td className="px-6 py-4">Road Only</td>
                  <td className="px-6 py-4">Road Only</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Competitor Benchmarks</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Real-time feed</td>
                  <td className="px-6 py-4">No visibility</td>
                  <td className="px-6 py-4">No transparency</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Structured API Logs</td>
                  <td className="px-6 py-4 text-cyan-400 font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> JSON Out-of-box</td>
                  <td className="px-6 py-4">Emails / PDF only</td>
                  <td className="px-6 py-4">Web view only</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* 6. Pricing */}
      <section id="pricing" className="relative py-28 px-6 border-t border-white/5 bg-black z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Licensing Tiers</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Structured Subscriptions</h2>
            <p className="text-xs text-slate-400">Transparent packages fitted to shipper operational volume.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            <motion.div variants={fadeUp} className="bg-glass rounded-organic-1 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 relative">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Free Access</h3>
                <p className="text-xs text-slate-400">Essential querying for basic freight estimations.</p>
                <div className="py-4">
                  <span className="text-4xl font-extrabold text-white font-mono">₹0</span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited Road FTL quotes</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Pincode autocompletion</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> PDF reports export</li>
                </ul>
              </div>
              <a href="/calculate" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all">Get Started</a>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-glass rounded-organic-2 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300 relative border border-cyan-500/30">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow animate-bounce">Most Popular</span>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Professional</h3>
                <p className="text-xs text-slate-400">For logistics managers and growing trade operations.</p>
                <div className="py-4">
                  <span className="text-4xl font-extrabold text-white font-mono">₹999</span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Competitor price benchmarks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Excel & JSON export formats</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Advanced toll coordinates</li>
                </ul>
              </div>
              <a href="/calculate" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-accent text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/10">Upgrade to Pro</a>
            </motion.div>
            <motion.div variants={fadeUp} className="bg-glass rounded-organic-3 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 relative">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Enterprise</h3>
                <p className="text-xs text-slate-400">For active freight forwarders and ERP workflows.</p>
                <div className="py-4">
                  <span className="text-4xl font-extrabold text-white font-mono">₹2,999</span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Air, Sea & Rail engines</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Incoterms & custom containers</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Dedicated SLA support</li>
                </ul>
              </div>
              <a href="/calculate" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all">Contact Sales</a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section id="faq" className="relative py-28 px-6 border-t border-white/5 bg-black/95 z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">Platform Documentation</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Technical Explanations</h2>
            <p className="text-xs text-slate-400">Structural details of calculations and rates algorithms.</p>
          </motion.div>
          <motion.div variants={staggerContainer} className="space-y-4">
            {[
              { q: 'How accurate are the toll calculations?', a: 'Our toll calculations query the official NHAI toll plaza coordinate matrix. Calculations are verified per vehicle class (2-axle, 3-axle, 4-6 axle) and updated quarterly. Accuracy averages 97%+ on primary national corridors.' },
              { q: 'What parameters govern Air Freight?', a: 'Air freight estimates calculate chargeable weight (based on actual weight vs volumetric size at 167 kg/CBM), fuel indices, terminal fees, and ground handling clearances.' },
              { q: 'What ocean cargo dimensions are supported?', a: 'We support 20ft GP, 40ft GP, 40ft HC (High Cube), and Reefer containers. Incoterms supported: EXW, FOB, CIF, CFR.' },
              { q: 'How are Rail wagon estimations built?', a: 'Rail rates map directly to official IRCTC haulage tariffs for BCN, BOXN, and BTPN container classes, adding drayage and first/last mile transfers.' },
            ].map((item, i) => (
              <motion.details key={i} variants={fadeUp} className="bg-glass rounded-xl overflow-hidden transition-all group border border-white/5">
                <summary className="w-full flex items-center justify-between px-6 py-5 text-left font-bold text-xs uppercase tracking-wider text-white hover:text-cyan-400 transition-colors cursor-pointer list-none">
                  {item.q}
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                </summary>
                <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-4 select-text">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/5 bg-black z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white font-mono">FreightQuote.in</span>
          </div>
          <div className="flex gap-8">
            <a href="/calculate" className="hover:text-white transition-colors">Calculator</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Licensing</a>
            <a href="#faq" className="hover:text-white transition-colors">Documentation</a>
          </div>
          <span className="font-mono text-[9px] text-slate-600 tracking-tight select-text">© 2026 FreightQuote India. Enriched supply chain logistics control system.</span>
        </div>
      </footer>

    </div>
  );
}