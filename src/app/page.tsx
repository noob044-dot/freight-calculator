"use client";

import React, { useState, useEffect } from 'react';
import { 
  Truck, Shield, Zap, Check, X, 
  Calculator, ChevronDown, 
  Globe, Play, Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PincodeAutocomplete } from '../components/PincodeAutocomplete';
import { ModeSelector, TransportMode } from '../components/ModeSelector';
import { QuoteResults } from '../components/QuoteResults';
import { SearchableCommodity } from '../components/SearchableCommodity';
import { QuoteResult, Benchmark } from '../lib/types';
import { BackgroundThree } from '../components/BackgroundThree';

const VEHICLES = [
  { code: 'auto', name: 'Auto-Select (Recommended)' },
  { code: '16T', name: '16 Ton Truck (2 Axle)' },
  { code: '25T', name: '25 Ton Truck (3 Axle)' },
  { code: '40T', name: '40 Ton Trailer (4-6 Axle)' },
];

const CONTAINER_TYPES = [
  { code: 'auto', name: 'Auto-Select Container' },
  { code: '20ft_GP', name: '20ft General Purpose' },
  { code: '40ft_GP', name: '40ft General Purpose' },
  { code: '40ft_HC', name: '40ft High Cube' },
  { code: '20ft_RF', name: '20ft Reefer' },
  { code: '40ft_RF', name: '40ft Reefer' },
];

const INCOTERMS = [
  { code: 'EXW', name: 'EXW (Ex Works)' },
  { code: 'FOB', name: 'FOB (Free on Board)' },
  { code: 'CIF', name: 'CIF (Cost, Insurance & Freight)' },
  { code: 'CFR', name: 'CFR (Cost & Freight)' },
];

// Spring physics
const springGentle = { type: 'spring' as const, stiffness: 220, damping: 20 };

export default function Home() {
  const [activeMode, setActiveMode] = useState<TransportMode>('all');
  const [origin, setOrigin] = useState('400001');
  const [dest, setDest] = useState('110001');
  const [weight, setWeight] = useState('10000');
  const [commodity, setCommodity] = useState('general');
  
  // Road parameters
  const [vehicle, setVehicle] = useState('auto');
  
  // Sea parameters
  const [containerType, setContainerType] = useState('auto');
  const [incoterm, setIncoterm] = useState('EXW');

  // Cargo value & dimensions
  const [cargoValue, setCargoValue] = useState('');
  const [dimUnit, setDimUnit] = useState<'cm' | 'm'>('cm');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });

  // Calculation Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // States to hold the dynamic responses
  const [allQuotes, setAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Record<string, Benchmark>>({});

  // Lead capture form
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', company: '', volume: '1-5' });
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Animated counters
  const [pincodeCount, setPincodeCount] = useState(0);
  const [accuracyCount, setAccuracyCount] = useState(0);
  const [savingsCount, setSavingsCount] = useState(0);

  useEffect(() => {
    // Simple mock counter increments on load
    const interval = setInterval(() => {
      setPincodeCount(prev => (prev < 19277 ? Math.min(prev + 511, 19277) : 19277));
      setAccuracyCount(prev => (prev < 97 ? Math.min(prev + 3, 97) : 97));
      setSavingsCount(prev => (prev < 200000 ? Math.min(prev + 6700, 200000) : 200000));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const payload = {
        originPincode: origin,
        destPincode: dest,
        weightKg: Number(weight),
        commodity,
        vehicleType: vehicle === 'auto' ? undefined : vehicle,
        valueInr: cargoValue ? Number(cargoValue) : undefined,
        dimensions: (dimensions.length || dimensions.width || dimensions.height) ? {
          length: dimUnit === 'cm' ? Number(dimensions.length || 0) / 100 : Number(dimensions.length || 0),
          width: dimUnit === 'cm' ? Number(dimensions.width || 0) / 100 : Number(dimensions.width || 0),
          height: dimUnit === 'cm' ? Number(dimensions.height || 0) / 100 : Number(dimensions.height || 0),
        } : undefined,
        containerType: containerType === 'auto' ? undefined : containerType,
        incoterm,
      };

      const res = await fetch(`/api/quote?mode=all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to calculate quote');
      }

      const data = await res.json();
      setAllQuotes(data.quotes || {});
      setAllBenchmarks(data.benchmarks || {});
      setShowResults(true);

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Calculation failed. Please verify inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadLoading(true);

    try {
      const chosenMode = activeMode === 'all'
        ? (Object.keys(allQuotes).find((k) => !allQuotes[k].error) || 'road')
        : activeMode;
      const activeQuote = allQuotes[chosenMode];

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: leadForm.name,
          phone: leadForm.phone,
          email: leadForm.email,
          company: leadForm.company,
          monthlyVolume: leadForm.volume,
          originPincode: origin,
          destPincode: dest,
          weightKg: Number(weight),
          commodity: commodity,
          mode: chosenMode,
          calculatedCost: activeQuote ? activeQuote.total : 0
        })
      });

      const data = await res.json();
      if (data.success) {
        setLeadSuccess(true);
        setLeadForm({ name: '', phone: '', email: '', company: '', volume: '1-5' });
      } else {
        alert(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-[#f8fafc] font-sans antialiased overflow-hidden select-none">
      
      {/* Three.js Hero Canvas background */}
      <BackgroundThree type="hero" />

      {/* 1. Header/Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/40 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Truck className="w-4 h-4 text-white animate-pulse" />
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
              <a href="#calculator" className="bg-gradient-accent text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-organic-1 hover:scale-105 transition-all shadow-lg shadow-cyan-500/10">
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

          {/* Big Satoshi title */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight leading-none text-white font-display select-text">
            Freight <br className="sm:hidden" />
            <span className="text-gradient-accent font-medium">Intelligence</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed select-text">
            Exact NHAI tolls. Real carrier rates. Multi-modal benchmarks. Calculated with pincode-level accuracy in a unified querying environment.
          </p>

          {/* CTA Cluster */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <a 
              href="#calculator"
              className="px-8 py-4 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-95 transition-all shadow-xl shadow-cyan-500/15"
            >
              Calculate rate
            </a>
            <a 
              href="#features"
              className="flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-organic-2 transition-all"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              API Docs
            </a>
            <a 
              href="#benefits"
              className="flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-organic-3 transition-all"
            >
              <Play className="w-4 h-4 text-violet-400" />
              Watch Demo
            </a>
          </div>

          {/* Trust Bar with load countup */}
          <div className="pt-16 max-w-4xl mx-auto border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {pincodeCount.toLocaleString('en-IN')}+
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Pincodes Enriched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {accuracyCount}%
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Toll Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                4 Modes
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Multi-Modal Hub</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                ₹{(savingsCount/100000).toFixed(1)}L/mo
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Client Savings</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Features Section - Asymmetric Editorial Flow */}
      <section id="features" className="relative py-28 px-6 border-t border-white/5 bg-[#020617]/80 z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-xl mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Precision Infrastructure</span>
            <h2 className="text-4xl font-light text-white tracking-tight leading-tight">
              Calculated without compromise.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We weave structural calculations, vehicle dimensions, and live toll plaza coordinates together into organic visual summaries.
            </p>
          </div>

          {/* Asymmetric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            
            {/* Feature 1 - Blob 1 (Span 7) */}
            <div className="md:col-span-7 bg-glass rounded-organic-1 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-2 bg-gradient-accent flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Exact Toll Plazas Breakdown</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  NHAI-verified plaza database mapped exactly to road route coordinates. Auto-calculates exact costs per vehicle axles, removing dispatcher arguments.
                </p>
              </div>
            </div>

            {/* Feature 2 - Blob 2 (Span 5) */}
            <div className="md:col-span-5 bg-glass rounded-organic-2 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-3 bg-gradient-accent flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">19,000+ Pincode Precision</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accurate database with lat/lon coordinates, state codes, and CGST/SGST matrices.
                </p>
              </div>
            </div>

            {/* Feature 3 - Blob 3 (Span 5) */}
            <div className="md:col-span-5 bg-glass rounded-organic-3 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-1 bg-gradient-accent flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">GST & Compliance Audit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated CGST, SGST, IGST, entry taxes, and cargo valuation audits to guarantee audit-ready invoicing outputs.
                </p>
              </div>
            </div>

            {/* Feature 4 - Blob 4 (Span 7) */}
            <div className="md:col-span-7 bg-glass rounded-organic-1 p-8 hover:scale-[1.015] hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col justify-between space-y-6">
              <div className="w-12 h-12 rounded-organic-2 bg-gradient-accent flex items-center justify-center text-white">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Instant Multi-Modal Estimation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compare road, express air, rail container, and ocean container rates in a single click, allowing your supply chain planner to optimize variables dynamically.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Calculator Form Panel - The Embedded Preview */}
      <section id="calculator" className="relative py-24 px-6 bg-[#020617]/90 z-10 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">Query Interface</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Run Rate Projections</h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Input your shipping variables to trigger instant quotes and NHAI toll calculations.</p>
          </div>

          <div className="bg-glass rounded-organic-2 p-8 sm:p-10 shadow-2xl">
            <form onSubmit={handleCalculate} className="space-y-8">
              
              {/* Pincodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PincodeAutocomplete
                  label="Origin Area Pincode"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="e.g. 400001 (Mumbai)"
                />
                <PincodeAutocomplete
                  label="Destination Area Pincode"
                  value={dest}
                  onChange={setDest}
                  placeholder="e.g. 110001 (Delhi)"
                />
              </div>

              {/* Weight & Commodity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-3.5 text-white text-xs focus:border-cyan-400 outline-none font-mono"
                    placeholder="e.g. 10000"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Commodity Class</label>
                  <SearchableCommodity
                    value={commodity}
                    onChange={setCommodity}
                    placeholder="Search commodity code..."
                  />
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="border-t border-white/5 pt-6 space-y-6">
                <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Engine Specific Overrides</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred Truck</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-3 text-white text-xs focus:border-cyan-400 outline-none"
                    >
                      {VEHICLES.map((v) => (
                        <option key={v.code} value={v.code}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ocean Container Type</label>
                    <select
                      value={containerType}
                      onChange={(e) => setContainerType(e.target.value)}
                      className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-3 text-white text-xs focus:border-cyan-400 outline-none"
                    >
                      {CONTAINER_TYPES.map((ct) => (
                        <option key={ct.code} value={ct.code}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Incoterm</label>
                    <select
                      value={incoterm}
                      onChange={(e) => setIncoterm(e.target.value)}
                      className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-3 text-white text-xs focus:border-cyan-400 outline-none"
                    >
                      {INCOTERMS.map((inc) => (
                        <option key={inc.code} value={inc.code}>{inc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cargo Value (INR for Insurance)</label>
                    <input
                      type="number"
                      value={cargoValue}
                      onChange={(e) => setCargoValue(e.target.value)}
                      className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-3 text-white text-xs focus:border-cyan-400 outline-none font-mono"
                      placeholder="Optional, e.g. 500000"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dimensions (L x W x H)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const d = dimensions;
                          if (dimUnit === 'cm') {
                            setDimensions({
                              length: d.length ? (Number(d.length) / 100).toFixed(2) : '',
                              width: d.width ? (Number(d.width) / 100).toFixed(2) : '',
                              height: d.height ? (Number(d.height) / 100).toFixed(2) : '',
                            });
                          } else {
                            setDimensions({
                              length: d.length ? (Number(d.length) * 100).toFixed(0) : '',
                              width: d.width ? (Number(d.width) * 100).toFixed(0) : '',
                              height: d.height ? (Number(d.height) * 100).toFixed(0) : '',
                            });
                          }
                          setDimUnit(dimUnit === 'cm' ? 'm' : 'cm');
                        }}
                        className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
                      >
                        Use {dimUnit === 'cm' ? 'meters' : 'cm'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step={dimUnit === 'cm' ? '1' : '0.01'}
                        value={dimensions.length}
                        onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                        placeholder={`L (${dimUnit})`}
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-2 py-3 text-white text-xs focus:border-cyan-400 outline-none text-center font-mono"
                      />
                      <input
                        type="number"
                        step={dimUnit === 'cm' ? '1' : '0.01'}
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                        placeholder={`W (${dimUnit})`}
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-2 py-3 text-white text-xs focus:border-cyan-400 outline-none text-center font-mono"
                      />
                      <input
                        type="number"
                        step={dimUnit === 'cm' ? '1' : '0.01'}
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                        placeholder={`H (${dimUnit})`}
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-2 py-3 text-white text-xs focus:border-cyan-400 outline-none text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-xs text-rose-400 font-medium">
                  <X className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-accent text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-98"
              >
                {loading ? (
                  <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Querying engine databases...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider">
                    <Calculator className="w-4 h-4" />
                    Evaluate Freight Rates
                  </span>
                )}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* 5. Results Section */}
      {showResults && (
        <section id="results-section" className="relative py-24 px-6 bg-[#020617] z-10 border-t border-white/5 scroll-mt-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">Engine Output Summary</h2>

            {/* Mode Tabs */}
            <ModeSelector activeMode={activeMode} onChangeMode={setActiveMode} />

            {/* Quote details */}
            {activeMode === 'all' ? (
              <QuoteResults
                mode="all"
                allQuotes={allQuotes}
                allBenchmarks={allBenchmarks}
              />
            ) : (
              <QuoteResults
                mode={activeMode as 'road' | 'air' | 'sea' | 'rail'}
                singleResult={allQuotes[activeMode]}
                singleBenchmark={allBenchmarks[activeMode]}
              />
            )}

            {/* Lead capture form */}
            <div className="bg-glass rounded-organic-3 p-8 sm:p-10 shadow-xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-2">Request Verified Forwarder Quotes</h3>
              <p className="text-xs text-slate-400 mb-6">
                Send this shipment requirement to matched logistics partners to receive competing bookings.
              </p>

              {leadSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-xl text-center text-emerald-400 space-y-3">
                  <Check className="w-10 h-10 mx-auto" />
                  <h4 className="font-bold text-md uppercase tracking-wider">Request Dispatched</h4>
                  <p className="text-xs text-emerald-400/80">Matched forwarders will respond in your dashboard within 2 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Name</label>
                      <input
                        type="text"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        required
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs focus:border-cyan-400 outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        required
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs focus:border-cyan-400 outline-none"
                        placeholder="+91 99999 99999"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Corporate Email</label>
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        required
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs focus:border-cyan-400 outline-none"
                        placeholder="john@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Tonnage</label>
                      <select
                        value={leadForm.volume}
                        onChange={(e) => setLeadForm({ ...leadForm, volume: e.target.value })}
                        className="w-full bg-[#020617] border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs focus:border-cyan-400 outline-none"
                      >
                        <option value="1-5">1-5 Tons</option>
                        <option value="5-20">5-20 Tons</option>
                        <option value="20-50">20-50 Tons</option>
                        <option value="50+">50+ Tons</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="px-6 py-3.5 bg-gradient-accent text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-102 transition-all cursor-pointer shadow-md"
                  >
                    {leadLoading ? 'Submitting...' : 'Dispatch Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. Editorial Comparison Table */}
      <section className="relative py-28 px-6 border-t border-white/5 bg-[#020617]/95 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-mono">Market Benchmarks</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Structured Performance Comparison</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Why enterprise supply chains transition their calculations to our logic.</p>
          </div>

          <div className="overflow-x-auto bg-glass rounded-organic-2 p-8">
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
          </div>
        </div>
      </section>

      {/* 7. Amorphous Pricing Blobs */}
      <section id="pricing" className="relative py-28 px-6 border-t border-white/5 bg-[#020617] z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Licensing Tiers</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Structured Subscriptions</h2>
            <p className="text-xs text-slate-400">Transparent packages fitted to shipper operational volume.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Free Blob */}
            <div className="bg-glass rounded-organic-1 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 relative">
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
              <a href="#calculator" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all">Get Started</a>
            </div>

            {/* Pro Blob */}
            <div className="bg-glass rounded-organic-2 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300 relative border border-cyan-500/30">
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
              <a href="#calculator" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-accent text-white hover:opacity-90 transition-all shadow-lg shadow-cyan-500/10">Upgrade to Pro</a>
            </div>

            {/* Enterprise Blob */}
            <div className="bg-glass rounded-organic-3 p-8 flex flex-col justify-between hover:scale-103 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 relative">
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
              <a href="#calculator" className="mt-8 w-full py-3 text-center text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 text-white hover:bg-white/5 transition-all">Contact Sales</a>
            </div>

          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="relative py-28 px-6 border-t border-white/5 bg-[#020617]/95 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 font-mono">Platform Documentation</span>
            <h2 className="text-3xl font-light text-white tracking-tight">Technical Explanations</h2>
            <p className="text-xs text-slate-400">Structural details of calculations and rates algorithms.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How accurate are the toll calculations?",
                a: "Our toll calculations query the official NHAI toll plaza coordinate matrix. Calculations are verified per vehicle class (2-axle, 3-axle, 4-6 axle) and updated quarterly. Accuracy averages 97%+ on primary national corridors."
              },
              {
                q: "What parameters govern Air Freight?",
                a: "Air freight estimates calculate chargeable weight (based on actual weight vs volumetric size at 167 kg/CBM), fuel indices, terminal fees, and ground handling clearances."
              },
              {
                q: "What ocean cargo dimensions are supported?",
                a: "We support 20ft GP, 40ft GP, 40ft HC (High Cube), and Reefer containers. Incoterms supported: EXW, FOB, CIF, CFR."
              },
              {
                q: "How are Rail wagon estimations built?",
                a: "Rail rates map directly to official IRCTC haulage tariffs for BCN, BOXN, and BTPN container classes, adding drayage and first/last mile transfers."
              }
            ].map((faq, index) => (
              <details key={index} className="bg-glass rounded-xl overflow-hidden transition-all group border border-white/5">
                <summary className="w-full flex items-center justify-between px-6 py-5 text-left font-bold text-xs uppercase tracking-wider text-white hover:text-cyan-400 transition-colors cursor-pointer list-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
                </summary>
                <div className="px-6 pb-5 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-4 select-text">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Minimal Footer */}
      <footer className="relative py-16 px-6 border-t border-white/5 bg-[#020617] z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white font-mono">FreightQuote.in</span>
          </div>
          <div className="flex gap-8">
            <a href="#calculator" className="hover:text-white transition-colors">Calculator</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Licensing</a>
            <a href="#faq" className="hover:text-white transition-colors">Documentation</a>
          </div>
          <span className="font-mono text-[9px] text-slate-600 tracking-tight select-text">
            &copy; 2026 FreightQuote India. Enriched supply chain logistics control system.
          </span>
        </div>
      </footer>
    </div>
  );
}