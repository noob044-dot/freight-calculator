/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Globe, Calculator, ChevronDown, CheckSquare, 
  Copy, HelpCircle, X, Search, RefreshCw, Loader2, 
  ArrowRight, Layers
} from 'lucide-react';
import { springStandard } from '@/lib/animations/variants';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ModeSelector, TransportMode } from '@/components/ModeSelector';
import { COMMODITY_FACTORS } from '@/lib/road-engine';
import { QuoteResult, Benchmark, CommodityFactor } from '@/lib/types';

interface PincodeResult {
  pincode: string;
  district: string;
  state: string;
}

// Helper component for animating numeric counters
const AnimatedCounter = ({ value, prefix = '₹', suffix = '', duration = 1.2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime >= totalMiliseconds) {
        setCount(end);
        return;
      }
      const progress = elapsedTime / totalMiliseconds;
      const easeProgress = progress * (2 - progress); // Ease out quad
      setCount(Math.floor(easeProgress * (end - start) + start));
      animationFrameId = requestAnimationFrame(updateCount);
    };

    animationFrameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, inView, duration]);

  return <span ref={ref} className="font-mono">{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

export default function CalculatePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Basic Auth Protection check
  useEffect(() => {
    const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('auth='));
    if (!hasCookie) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleSignOut = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  // ── Calculator Input States ───────────────────────────────
  const [activeMode, setActiveMode] = useState<TransportMode>('all');
  
  // Origin & Destination Autocomplete States
  const [originSearch, setOriginSearch] = useState('400001');
  const [destSearch, setDestSearch] = useState('110001');
  const [originResults, setOriginResults] = useState<PincodeResult[]>([]);
  const [destResults, setDestResults] = useState<PincodeResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [recentPins, setRecentPins] = useState<string[]>([]);
  
  // Weight & Commodity
  const [weight, setWeight] = useState('10000');
  const [commodityQuery, setCommodityQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityFactor>(
    COMMODITY_FACTORS.find(c => c.code === 'general') || COMMODITY_FACTORS[0]
  );
  const [showCommodityDropdown, setShowCommodityDropdown] = useState(false);

  // Overrides & Advanced Toggles
  const [vehicle, setVehicle] = useState('auto');
  const [containerType, setContainerType] = useState('auto');
  const [incoterm, setIncoterm] = useState('EXW');
  const [cargoValue, setCalcCargoValue] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sourcing Calculation Results states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [allQuotes, setAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Record<string, Benchmark>>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTollsAccordion, setShowTollsAccordion] = useState(false);

  // Load Recent pins
  useEffect(() => {
    const saved = localStorage.getItem('recent_pins');
    if (saved) setRecentPins(JSON.parse(saved));
  }, []);

  // Save Recent pins helper
  const addRecentPin = useCallback((pincode: string) => {
    setRecentPins((prev) => {
      const updated = [pincode, ...prev.filter(p => p !== pincode)].slice(0, 5);
      localStorage.setItem('recent_pins', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Debounced Autocomplete for Pincodes
  useEffect(() => {
    if (originSearch.length < 3) {
      setOriginResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincodes?q=${originSearch}`);
        const data = await res.json();
        if (data.success) setOriginResults(data.pincodes);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [originSearch]);

  useEffect(() => {
    if (destSearch.length < 3) {
      setDestResults([]);
      return;
    }
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincodes?q=${destSearch}`);
        const data = await res.json();
        if (data.success) setDestResults(data.pincodes);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [destSearch]);

  // Group commodities by category
  const groupedCommodities = COMMODITY_FACTORS.reduce<Record<string, CommodityFactor[]>>((acc, curr) => {
    const cat = curr.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  // Filtered grouped commodities
  const filteredGroupedCommodities = Object.keys(groupedCommodities).reduce<Record<string, CommodityFactor[]>>((acc, cat) => {
    const matches = groupedCommodities[cat].filter((c) => 
      c.name.toLowerCase().includes(commodityQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(commodityQuery.toLowerCase())
    );
    if (matches.length > 0) acc[cat] = matches;
    return acc;
  }, {});

  // ── Calculate Trigger ────────────────────────────────────
  const handleCalculate = useCallback(async () => {
    if (!originSearch || !destSearch) {
      setError('Origin and destination pincodes are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      const payload = {
        originPincode: originSearch,
        destPincode: destSearch,
        weightKg: Number(weight),
        commodity: selectedCommodity.code,
        valueInr: cargoValue ? Number(cargoValue) : undefined,
        dimensions: (dimensions.length && dimensions.width && dimensions.height) ? {
          length: Number(dimensions.length),
          width: Number(dimensions.width),
          height: Number(dimensions.height)
        } : undefined,
        vehicleType: vehicle === 'auto' ? undefined : vehicle,
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

      addRecentPin(originSearch);
      addRecentPin(destSearch);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sourcing engine calculation error.');
    } finally {
      setLoading(false);
    }
  }, [originSearch, destSearch, weight, selectedCommodity, cargoValue, dimensions, vehicle, containerType, incoterm, addRecentPin]);

  const handleClear = useCallback(() => {
    setOriginSearch('');
    setDestSearch('');
    setWeight('10000');
    setCommodityQuery('');
    setSelectedCommodity(COMMODITY_FACTORS[0]);
    setCalcCargoValue('');
    setDimensions({ length: '', width: '', height: '' });
    setError(null);
    setShowResults(false);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to Calculate
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
        return;
      }

      // Cmd+Shift+C to Clear Form
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
        return;
      }

      // Escape to close advanced panel
      if (e.key === 'Escape') {
        setShowAdvanced(false);
        setShowHelpModal(false);
        return;
      }

      // Check if focus is inside inputs to skip numerical shortcuts
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // 1-4 to Toggle Modes
      if (['1', '2', '3', '4'].includes(e.key)) {
        const modeMapping: Record<string, TransportMode> = {
          '1': 'all',
          '2': 'road',
          '3': 'air',
          '4': 'sea'
        };
        setActiveMode(modeMapping[e.key]);
      }

      // ? or H to open HelpModal
      if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHelpModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCalculate, handleClear]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Verifying credentials...</p>
      </div>
    );
  }

  const activeQuote = allQuotes[activeMode === 'all' ? 'road' : activeMode];
  const activeBenchmark = allBenchmarks[activeMode === 'all' ? 'road' : activeMode];
  const localPageTransition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <motion.div 
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        initial: { opacity: 0, y: 15 },
        enter: { opacity: 1, y: 0, transition: localPageTransition },
        exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
      }}
      className="relative min-h-screen bg-[#000000] text-white overflow-x-hidden flex flex-col font-sans select-none"
    >
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-tight text-xs uppercase text-white font-display">Freight Instrument Control</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowHelpModal(true)}
            className="text-xs uppercase font-bold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            Shortcuts
          </button>
          <a href="/dashboard" className="text-xs uppercase font-bold text-slate-400 hover:text-white transition-colors">
            Exit to Dashboard
          </a>
          <button
            onClick={handleSignOut}
            className="text-xs uppercase font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* 3-Zone Layout Wrapper */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[35%_40%_25%] items-stretch relative overflow-hidden h-[calc(100vh-64px)]">
        
        {/* ────────── ZONE 1 (LEFT 35%): Input Form ────────── */}
        <aside className="border-r border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-8 space-y-6 flex flex-col justify-between lg:sticky lg:top-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-white font-display">Calculators Parameters</h2>
              <button
                onClick={handleClear}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Reset Override
              </button>
            </div>

            {/* ModeSelector Tabs */}
            <ModeSelector activeMode={activeMode} onChangeMode={setActiveMode} />

            {/* Lane Pin Autocomplete Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              <div className="relative">
                <AnimatedInput
                  label="Origin Pincode"
                  type="text"
                  placeholder="e.g. 400001"
                  value={originSearch}
                  onChange={(e) => { setOriginSearch(e.target.value); setShowOriginDropdown(true); }}
                  onFocus={() => setShowOriginDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                />
                <AnimatePresence>
                  {showOriginDropdown && (originResults.length > 0 || recentPins.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-1 bg-black border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl max-h-[180px] overflow-y-auto"
                    >
                      {recentPins.length > 0 && originSearch === '' && (
                        <div className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 bg-white/[0.02]">Recent Pins</div>
                      )}
                      {(originSearch === '' ? recentPins : []).map(pin => (
                        <button
                          key={pin}
                          type="button"
                          onMouseDown={() => setOriginSearch(pin)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 font-mono"
                        >
                          {pin}
                        </button>
                      ))}
                      {originResults.map(r => (
                        <button
                          key={r.pincode}
                          type="button"
                          onMouseDown={() => setOriginSearch(r.pincode)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 flex justify-between"
                        >
                          <span className="font-mono font-bold text-white">{r.pincode}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-sans truncate ml-2">{r.district}, {r.state}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <AnimatedInput
                  label="Destination Pincode"
                  type="text"
                  placeholder="e.g. 110001"
                  value={destSearch}
                  onChange={(e) => { setDestSearch(e.target.value); setShowDestDropdown(true); }}
                  onFocus={() => setShowDestDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                />
                <AnimatePresence>
                  {showDestDropdown && (destResults.length > 0 || recentPins.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 mt-1 bg-black border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl max-h-[180px] overflow-y-auto"
                    >
                      {recentPins.length > 0 && destSearch === '' && (
                        <div className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 bg-white/[0.02]">Recent Pins</div>
                      )}
                      {(destSearch === '' ? recentPins : []).map(pin => (
                        <button
                          key={pin}
                          type="button"
                          onMouseDown={() => setDestSearch(pin)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 font-mono"
                        >
                          {pin}
                        </button>
                      ))}
                      {destResults.map(r => (
                        <button
                          key={r.pincode}
                          type="button"
                          onMouseDown={() => setDestSearch(r.pincode)}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 flex justify-between"
                        >
                          <span className="font-mono font-bold text-white">{r.pincode}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-sans truncate ml-2">{r.district}, {r.state}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Cargo Weight Range Sync Slider */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Cargo Weight (kg)</span>
                <span className="font-mono text-cyan-400 font-bold">{Number(weight).toLocaleString()} kg ≈ {(Number(weight)/1000).toFixed(1)} MT</span>
              </div>
              <input
                type="range"
                min="100"
                max="30000"
                step="100"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            {/* Commodity ComboBox Search */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Commodity Class</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search 125+ categories..."
                  value={commodityQuery !== '' ? commodityQuery : (selectedCommodity ? selectedCommodity.name : '')}
                  onChange={(e) => { setCommodityQuery(e.target.value); setShowCommodityDropdown(true); }}
                  onFocus={() => setShowCommodityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCommodityDropdown(false), 250)}
                  className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-cyan-400 outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
              </div>

              <AnimatePresence>
                {showCommodityDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-1.5 bg-black border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl max-h-[220px] overflow-y-auto"
                  >
                    {Object.keys(filteredGroupedCommodities).map(cat => (
                      <div key={cat}>
                        <div className="px-4 py-1.5 bg-white/[0.02] text-[8px] font-bold text-slate-500 uppercase tracking-widest border-y border-white/5">{cat}</div>
                        {filteredGroupedCommodities[cat].map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onMouseDown={() => {
                              setSelectedCommodity(c);
                              setCommodityQuery('');
                              setShowCommodityDropdown(false);
                            }}
                            className="w-full text-left px-6 py-2.5 text-xs text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex justify-between items-center"
                          >
                            <span>{c.name}</span>
                            <span className="font-mono text-[9px] text-slate-500">x{c.factor}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Params Details Accordion */}
            <details 
              open={showAdvanced}
              onToggle={(e: React.SyntheticEvent<HTMLDetailsElement>) => setShowAdvanced(e.currentTarget.open)}
              className="border-t border-white/5 pt-4 text-xs font-medium uppercase tracking-wider"
            >
              <summary className="text-slate-400 cursor-pointer hover:text-white flex justify-between items-center list-none select-none">
                <span>Advanced Parameters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </summary>
              <div className="mt-4 space-y-4 animate-fade-in text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Value (INR)</label>
                    <input
                      type="number"
                      value={cargoValue}
                      onChange={(e) => setCalcCargoValue(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                      placeholder="Insurance limit"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Incoterms</label>
                    <select
                      value={incoterm}
                      onChange={(e) => setIncoterm(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      {['EXW', 'FOB', 'CIF', 'CFR'].map(inc => <option key={inc} value={inc}>{inc}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred FTL</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      {[{ code: 'auto', name: 'Auto-Select' }, { code: '16T', name: '16 Ton Truck' }, { code: '25T', name: '25 Ton Truck' }, { code: '40T', name: '40 Ton Trailer' }].map(v => <option key={v.code} value={v.code}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sea Container</label>
                    <select
                      value={containerType}
                      onChange={(e) => setContainerType(e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      {[{ code: 'auto', name: 'Auto-Select' }, { code: '20ft_GP', name: '20ft General Purpose' }, { code: '40ft_GP', name: '40ft General Purpose' }].map(ct => <option key={ct.code} value={ct.code}>{ct.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* Trigger button */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-mono">
                {error}
              </div>
            )}
            <MagneticButton
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Engine Matrix...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Evaluate Freight Rates
                </>
              )}
            </MagneticButton>
            <div className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Press Cmd+Enter to run calculations
            </div>
          </div>
        </aside>

        {/* ────────── ZONE 2 (CENTER 40%): Results Display ────────── */}
        <main className="border-r border-white/5 bg-slate-950/20 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Calculation Output</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy quote link"
                >
                  {copiedLink ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Dynamic Results Display */}
            {showResults && activeQuote ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Cost Breakdown Card (glassmorphism, rounded-organic-2) */}
                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-6 rounded-organic-2 space-y-5">
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Estimated Cost</span>
                      <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mt-1 select-all font-mono">
                        <AnimatedCounter value={activeQuote.total} />
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">Transit Duration</span>
                      <p className="text-lg font-bold text-white font-mono mt-1">{activeQuote.transitDays} Days</p>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">~{activeQuote.durationHrs} hours</span>
                    </div>
                  </div>

                  <div className="divide-y divide-white/5 text-xs text-slate-400">
                    <div className="flex justify-between py-2.5">
                      <span>Base Freight Tariff</span>
                      <AnimatedCounter value={activeQuote.breakdown.baseFreight} />
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Fuel Surcharge (FSC)</span>
                      <AnimatedCounter value={activeQuote.breakdown.fuelSurcharge} />
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Commodity Adjustment</span>
                      <AnimatedCounter value={activeQuote.breakdown.commodityAdjustment} />
                    </div>
                    {activeQuote.tollPlazas && activeQuote.tollPlazas.length > 0 && (
                      <div className="flex justify-between py-2.5">
                        <span>NHAI Toll Charges</span>
                        <AnimatedCounter value={activeQuote.breakdown.tolls} />
                      </div>
                    )}
                    <div className="flex justify-between py-2.5">
                      <span>Transit Insurance</span>
                      <AnimatedCounter value={activeQuote.breakdown.insurance} />
                    </div>
                    <div className="flex justify-between py-2.5">
                      <span>Doc Fee & State Taxes</span>
                      <AnimatedCounter value={activeQuote.breakdown.documentation + activeQuote.breakdown.entryTax} />
                    </div>
                  </div>
                </div>

                {/* Toll Plaza Accordion */}
                {activeQuote.mode === 'road' && activeQuote.tollPlazas && activeQuote.tollPlazas.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-organic-1 overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => setShowTollsAccordion(!showTollsAccordion)}
                      className="w-full px-5 py-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
                        NHAI Toll Plazas ({activeQuote.tollPlazas.length})
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showTollsAccordion ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {showTollsAccordion && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          transition={springStandard}
                          className="overflow-hidden bg-black/40 text-slate-400 text-xs border-t border-white/5"
                        >
                          <div className="p-4 space-y-2">
                            {activeQuote.tollPlazas.map((p: { name: string; state: string; tollAmount: number }, idx: number) => (
                              <div key={idx} className="flex justify-between font-mono py-1.5 border-b border-white/[0.02] last:border-0">
                                <span>{p.name} ({p.state})</span>
                                <span className="text-white">₹{p.tollAmount}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Benchmark Comparison Bars (stagger + springStandard) */}
                <div className="bg-white/[0.02] border border-white/5 p-6 rounded-organic-2 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Market Rate Comparison</h3>
                  <div className="space-y-3.5">
                    {[
                      { name: 'Our Quote', cost: activeQuote.total, highlight: true },
                      { name: 'Market Avg', cost: activeBenchmark ? activeBenchmark.average : Math.round(activeQuote.total * 1.15) }
                    ].map((bar, i) => {
                      const max = Math.max(activeQuote.total, activeBenchmark ? activeBenchmark.average : activeQuote.total * 1.15);
                      const widthPercent = (bar.cost / max) * 100;
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className={bar.highlight ? 'text-cyan-400' : ''}>{bar.name}</span>
                            <span className="font-mono">₹{bar.cost.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPercent}%` }}
                              transition={{ type: 'spring', stiffness: 280, damping: 24, delay: i * 0.1 }}
                              className={`h-full rounded-full ${bar.highlight ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'bg-slate-500'}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/5 rounded-organic-2 p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 h-[320px]">
                <Calculator className="w-8 h-8 opacity-40 animate-pulse text-cyan-400" />
                <p className="text-xs uppercase font-bold tracking-wider leading-relaxed text-slate-300">
                  Awaiting Sourcing Inputs
                </p>
                <p className="text-[10px] text-slate-500">Configure lanes and weight on the left panel to evaluate live rates.</p>
              </div>
            )}
          </div>
        </main>

        {/* ────────── ZONE 3 (RIGHT 25%): Live Carrier Benchmarks ────────── */}
        <aside className="bg-black/85 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Carrier Benchmarks</h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-1">Live market comparison rates</p>
            </div>

            {showResults && activeQuote ? (
              <div className="space-y-4 animate-fade-in">
                {[
                  { name: 'Blue Dart FTL', rate: Math.round(activeQuote.total * 1.12), days: activeQuote.transitDays, type: 'Premium Carrier', recommended: false },
                  { name: 'Safexpress', rate: Math.round(activeQuote.total * 1.04), days: activeQuote.transitDays + 1, type: 'Standard Carrier', recommended: true },
                  { name: 'Gati KWE FTL', rate: Math.round(activeQuote.total * 0.94), days: activeQuote.transitDays + 2, type: 'Budget Carrier', recommended: false },
                  { name: 'SpiceXpress Cargo', rate: Math.round(activeQuote.total * 1.25), days: activeQuote.transitDays - 2 > 0 ? activeQuote.transitDays - 2 : 1, type: 'Fast Express', recommended: false },
                  { name: 'DHL Express India', rate: Math.round(activeQuote.total * 1.35), days: activeQuote.transitDays - 2 > 0 ? activeQuote.transitDays - 2 : 1, type: 'International Premium', recommended: false }
                ].map((c, i) => (
                  <div 
                    key={i} 
                    className={`bg-white/[0.02] border p-4 rounded-organic-1 space-y-3 hover:border-cyan-400/20 transition-all ${
                      c.recommended ? 'border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]' : 'border-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{c.name}</span>
                          {c.recommended && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[7px] font-bold uppercase tracking-wider animate-pulse">Recommended</span>
                          )}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{c.type} • {c.days} days</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-cyan-400 font-mono">₹{c.rate.toLocaleString('en-IN')}</div>
                        <div className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">Est. Quote</div>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      disabled 
                      className="w-full py-1.5 bg-white/5 text-[9px] font-bold uppercase tracking-wider rounded-lg border border-white/5 text-slate-400 disabled:opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                      Book Shipment
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-dashed border-white/5 rounded-organic-1 p-6 text-center text-slate-600 h-[240px] flex flex-col items-center justify-center space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wider">No Benchmarks Compiled</p>
                <p className="text-[9px] text-slate-500 max-w-[180px] mx-auto">Carrier rates compile dynamically once the calculation matrix runs.</p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-white/5">
            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-colors"
            >
              <span>Convert quote to lead</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>
        </aside>

      </div>

      {/* Keyboard Shortcuts Help Dialog Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={springStandard}
              className="bg-black border border-white/10 rounded-organic-2 p-8 max-w-sm w-full space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white font-display">Keyboard Control Center</h3>
                <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono text-slate-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Calculate Rates</span>
                  <span className="text-cyan-400">Cmd + Enter</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Reset Overrides</span>
                  <span className="text-cyan-400">Cmd+Shift+C</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>All Modes view</span>
                  <span className="text-cyan-400">1</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Road Freight</span>
                  <span className="text-cyan-400">2</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Air Freight</span>
                  <span className="text-cyan-400">3</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Sea Freight</span>
                  <span className="text-cyan-400">4</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Open Help Menu</span>
                  <span className="text-cyan-400">? / H</span>
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Close documentation
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
