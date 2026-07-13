"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Globe, Calculator, ChevronDown, CheckSquare, 
  Copy, HelpCircle, X, Search, RefreshCw, Loader2, 
  ArrowRight, Layers, Truck, Plane, Ship, Train,
  Scale, MapPin, Package, Settings, Download, FileSpreadsheet, Code, Link2, AlertCircle
} from 'lucide-react';
import { springStandard, springMagnetic } from '@/lib/animations/variants';
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

const AnimatedCounter = ({ value, prefix = '₹', suffix = '', duration = 1.2 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = 0;
    const end = value;
    if (start === end) { setCount(end); return; }
    const totalMs = duration * 1000;
    const startTime = performance.now();
    let frameId: number;
    const update = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= totalMs) { setCount(end); return; }
      const progress = elapsed / totalMs;
      const eased = progress * (2 - progress);
      setCount(Math.floor(eased * (end - start) + start));
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, inView, duration]);

  return <span ref={ref} className="font-mono">{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

const ModeIcons: Record<TransportMode, React.ReactNode> = {
  road: <Truck className="w-4 h-4" />,
  air: <Plane className="w-4 h-4" />,
  sea: <Ship className="w-4 h-4" />,
  rail: <Train className="w-4 h-4" />,
  all: <Layers className="w-4 h-4" />,
};

const ModeLabels: Record<TransportMode, string> = {
  road: 'Road FTL',
  air: 'Air Cargo',
  sea: 'Ocean FCL',
  rail: 'Rail Container',
  all: 'All Modes',
};

const groupedCommodities = COMMODITY_FACTORS.reduce<Record<string, CommodityFactor[]>>((acc, curr) => {
  const cat = curr.category || 'General';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(curr);
  return acc;
}, {});

export default function CalculatePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('auth='));
    if (!hasCookie) router.push('/login');
    else setIsAuthenticated(true);
  }, [router]);

  const handleSignOut = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  // ── Calculator Input States ───────────────────────────────
  const [activeMode, setActiveMode] = useState<TransportMode>('all');
  
  const [originSearch, setOriginSearch] = useState('400001');
  const [destSearch, setDestSearch] = useState('110001');
  const [originResults, setOriginResults] = useState<PincodeResult[]>([]);
  const [destResults, setDestResults] = useState<PincodeResult[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [recentPins, setRecentPins] = useState<string[]>([]);
  
  const [weight, setWeight] = useState('10000');
  const [commodityQuery, setCommodityQuery] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityFactor>(
    COMMODITY_FACTORS.find(c => c.code === 'general') || COMMODITY_FACTORS[0]
  );
  const [showCommodityDropdown, setShowCommodityDropdown] = useState(false);

  const [vehicle, setVehicle] = useState('auto');
  const [containerType, setContainerType] = useState('auto');
  const [incoterm, setIncoterm] = useState('EXW');
  const [cargoValue, setCalcCargoValue] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [allQuotes, setAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Record<string, Benchmark>>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTollsAccordion, setShowTollsAccordion] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('recent_pins');
    if (saved) setRecentPins(JSON.parse(saved));
  }, []);

  const addRecentPin = useCallback((pincode: string) => {
    setRecentPins((prev) => {
      const updated = [pincode, ...prev.filter(p => p !== pincode)].slice(0, 5);
      localStorage.setItem('recent_pins', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    if (originSearch.length < 3) { setOriginResults([]); return; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincodes?q=${originSearch}`);
        const data = await res.json();
        if (data.success) setOriginResults(data.pincodes);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(h);
  }, [originSearch]);

  useEffect(() => {
    if (destSearch.length < 3) { setDestResults([]); return; }
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincodes?q=${destSearch}`);
        const data = await res.json();
        if (data.success) setDestResults(data.pincodes);
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(h);
  }, [destSearch]);

  const filteredGroupedCommodities = Object.keys(groupedCommodities).reduce<Record<string, CommodityFactor[]>>((acc, cat) => {
    const matches = groupedCommodities[cat].filter((c) =>
      c.name.toLowerCase().includes(commodityQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(commodityQuery.toLowerCase())
    );
    if (matches.length > 0) acc[cat] = matches;
    return acc;
  }, {});

  const handleCalculate = useCallback(async () => {
    if (!originSearch || !destSearch) { setError('Origin and destination pincodes are required.'); return; }
    setLoading(true); setError(null); setShowResults(false);
    try {
      const payload = {
        originPincode: originSearch,
        destPincode: destSearch,
        weightKg: Number(weight),
        commodity: selectedCommodity.code,
        valueInr: cargoValue ? Number(cargoValue) : undefined,
        dimensions: (dimensions.length && dimensions.width && dimensions.height) ? {
          length: Number(dimensions.length), width: Number(dimensions.width), height: Number(dimensions.height)
        } : undefined,
        vehicleType: vehicle === 'auto' ? undefined : vehicle,
        containerType: containerType === 'auto' ? undefined : containerType,
        incoterm,
      };
      const res = await fetch(`/api/quote?mode=all`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to calculate quote'); }
      const data = await res.json();
      setAllQuotes(data.quotes || {});
      setAllBenchmarks(data.benchmarks || {});
      setShowResults(true);
      addRecentPin(originSearch); addRecentPin(destSearch);
    } catch (err) { setError(err instanceof Error ? err.message : 'Calculation error.'); }
    finally { setLoading(false); }
  }, [originSearch, destSearch, weight, selectedCommodity, cargoValue, dimensions, vehicle, containerType, incoterm, addRecentPin]);

  const handleClear = useCallback(() => {
    setOriginSearch(''); setDestSearch(''); setWeight('10000');
    setCommodityQuery(''); setSelectedCommodity(COMMODITY_FACTORS[0]);
    setCalcCargoValue(''); setDimensions({ length: '', width: '', height: '' });
    setError(null); setShowResults(false);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleCalculate(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') { e.preventDefault(); handleClear(); return; }
      if (e.key === 'Escape') { setShowAdvanced(false); setShowHelpModal(false); return; }
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (['1','2','3','4'].includes(e.key)) {
        const map: Record<string, TransportMode> = { '1':'all', '2':'road', '3':'air', '4':'sea' };
        setActiveMode(map[e.key]);
      }
      if (e.key === '?' || e.key.toLowerCase() === 'h') { e.preventDefault(); setShowHelpModal(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCalculate, handleClear]);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Verifying credentials...</p>
    </div>
  );

  const activeQuote = allQuotes[activeMode === 'all' ? 'road' : activeMode];
  const activeBenchmark = allBenchmarks[activeMode === 'all' ? 'road' : activeMode];

  return (
    <motion.div
      initial="initial" animate="enter" exit="exit"
      variants={{
        initial: { opacity: 0, y: 15 },
        enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
        exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
      }}
      className="relative min-h-screen bg-[#000000] text-white overflow-x-hidden flex flex-col font-sans select-none"
    >
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-tight text-xs uppercase text-white font-display">Freight Intelligence</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowHelpModal(true)} className="text-xs uppercase font-bold text-slate-400 hover:text-white tracking-wider transition-colors cursor-pointer flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> Shortcuts
          </button>
          <a href="/dashboard" className="text-xs uppercase font-bold text-slate-400 hover:text-white transition-colors">Dashboard</a>
          <button onClick={handleSignOut} className="text-xs uppercase font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer">Sign Out</button>
        </div>
      </header>

      {/* 3-Zone Layout Wrapper */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[35%_40%_25%] items-stretch relative overflow-hidden h-[calc(100vh-64px)]">
        
        {/* ────────── ZONE 1 (LEFT 35%): Input Form ────────── */}
        <aside className="border-r border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-6 sm:p-8 space-y-6 flex flex-col justify-between lg:sticky lg:top-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-white font-display">Calculator Parameters</h2>
              <button onClick={handleClear} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors cursor-pointer">Reset Override</button>
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
                        <button key={pin} type="button" onMouseDown={() => setOriginSearch(pin)} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 font-mono">{pin}</button>
                      ))}
                      {originResults.map(r => (
                        <button key={r.pincode} type="button" onMouseDown={() => setOriginSearch(r.pincode)} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 flex justify-between">
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
                        <button key={pin} type="button" onMouseDown={() => setDestSearch(pin)} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 font-mono">{pin}</button>
                      ))}
                      {destResults.map(r => (
                        <button key={r.pincode} type="button" onMouseDown={() => setDestSearch(r.pincode)} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors text-slate-300 flex justify-between">
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
              <input type="range" min="100" max="30000" step="100" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-mono" />
            </div>

            {/* Commodity Search */}
            <div className="relative">
              <AnimatedInput
                label="Commodity Type"
                type="text"
                placeholder="Search commodity..."
                value={commodityQuery || selectedCommodity.name}
                onChange={(e) => { setCommodityQuery(e.target.value); setShowCommodityDropdown(true); }}
                onFocus={() => setShowCommodityDropdown(true)}
                onBlur={() => setTimeout(() => setShowCommodityDropdown(false), 200)}
                readOnly
              />
              <AnimatePresence>
                {showCommodityDropdown && Object.keys(filteredGroupedCommodities).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-1 bg-black border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl max-h-[220px] overflow-y-auto"
                  >
                    {Object.entries(filteredGroupedCommodities).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-500 bg-white/[0.02]">{cat}</div>
                        {items.map(item => (
                          <button key={item.code} type="button" onMouseDown={() => { setSelectedCommodity(item); setCommodityQuery(''); setShowCommodityDropdown(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex justify-between ${selectedCommodity.code === item.code ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-300'}`}>
                            <span>{item.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono ml-2">{item.code}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Toggle */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between text-xs uppercase font-bold tracking-wider text-slate-400 hover:text-cyan-400 transition-colors py-2">
              <span>{showAdvanced ? 'Hide Advanced' : 'Show Advanced'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {/* Advanced Fields */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                  <div className="grid grid-cols-2 gap-3">
                    <AnimatedInput label="Vehicle Type" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Auto / 2-axle / 3-axle / 4-6 axle" />
                    <AnimatedInput label="Container Type" value={containerType} onChange={(e) => setContainerType(e.target.value)} placeholder="Auto / 20ft GP / 40ft HC / Reefer" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AnimatedInput label="Incoterm" value={incoterm} onChange={(e) => setIncoterm(e.target.value)} placeholder="EXW / FOB / CIF / CFR" />
                    <AnimatedInput label="Cargo Value (INR)" type="number" value={cargoValue} onChange={(e) => setCalcCargoValue(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <AnimatedInput label="Length (cm)" type="number" value={dimensions.length} onChange={(e) => setDimensions({...dimensions, length: e.target.value})} placeholder="L" />
                    <AnimatedInput label="Width (cm)" type="number" value={dimensions.width} onChange={(e) => setDimensions({...dimensions, width: e.target.value})} placeholder="W" />
                    <AnimatedInput label="Height (cm)" type="number" value={dimensions.height} onChange={(e) => setDimensions({...dimensions, height: e.target.value})} placeholder="H" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calculate Button */}
            <MagneticButton
              type="button"
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </MagneticButton>

            {/* Error Display */}
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium animate-shake">
                {error}
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="pt-4 border-t border-white/5 space-y-2 text-[9px] text-slate-500 font-mono">
              <div className="flex justify-between"><span>Cmd/Ctrl + Enter</span><span>Calculate</span></div>
              <div className="flex justify-between"><span>Cmd/Ctrl + Shift + C</span><span>Clear Form</span></div>
              <div className="flex justify-between"><span>1-4</span><span>Mode Switch</span></div>
              <div className="flex justify-between"><span>? / H</span><span>Shortcuts Help</span></div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><div className="text-xl font-bold font-mono text-white">19,277+</div><div className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">Pincodes</div></div>
              <div><div className="text-xl font-bold font-mono text-white">97%+</div><div className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">Toll Accuracy</div></div>
              <div><div className="text-xl font-bold font-mono text-white">4 Modes</div><div className="text-[8px] text-slate-500 uppercase tracking-wider mt-1">Road/Air/Sea/Rail</div></div>
            </div>
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">Powered by NHAI Verified Toll Plaza Matrix</p>
          </div>
        </aside>

        {/* ────────── ZONE 2 (CENTER 40%): Live Result ────────── */}
        <section className="relative bg-black/70 backdrop-blur-3xl overflow-y-auto p-6 sm:p-8 flex flex-col">
          <div className="flex flex-col flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-accent/10 border border-cyan-400/20 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Sourcing Analysis</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{originSearch} → {destSearch} • {Number(weight).toLocaleString()} kg • {selectedCommodity.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyLink} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer">
                  <Copy className="w-3 h-3" /> {copiedLink ? 'Copied' : 'Copy Link'}
                </button>
                <button onClick={() => setShowHelpModal(true)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center gap-6"
                >
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-white">Analyzing multi-modal routes...</p>
                    <p className="text-xs text-slate-400">Querying NHAI toll matrix + carrier benchmarks</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="w-full h-full bg-gradient-accent" animate={{ scaleX: [0, 1] }} transition={{ duration: 2, ease: "easeInOut" }} style={{ transformOrigin: "left" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Content */}
            <AnimatePresence mode="wait">
              {!loading && showResults && activeQuote && !activeQuote.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 space-y-6 overflow-y-auto"
                >
                  {/* Primary Quote Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={springMagnetic}
                    className="bg-glass border border-cyan-400/20 rounded-organic-1 p-6 space-y-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-accent" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                          {ModeIcons[activeMode as TransportMode]}
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Primary Mode</p>
                          <p className="font-bold text-white">{ModeLabels[activeMode as TransportMode]}</p>
                        </div>
                      </div>
                      {activeBenchmark && (
                        <div className="text-right">
                          <p className="text-[9px] text-slate-500 uppercase tracking-wider">Market Benchmark</p>
                          <p className="font-mono font-bold text-white">₹{activeBenchmark.avgRatePerKm?.toLocaleString('en-IN') || '—'}/km</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total Cost</p>
                        <p className="text-2xl font-bold font-mono text-cyan-400">₹{activeQuote.totalCost.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Rate / km</p>
                        <p className="text-2xl font-bold font-mono text-white">₹{activeQuote.ratePerKm.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Transit Time</p>
                        <p className="text-2xl font-bold font-mono text-white">{activeQuote.transitDays} Days</p>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Cost / kg</p>
                        <p className="text-2xl font-bold font-mono text-white">₹{activeQuote.costPerKg.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Cost Breakdown Accordion */}
                    <div className="border-t border-white/5 pt-4">
                      <button onClick={() => setShowTollsAccordion(!showTollsAccordion)} className="w-full flex items-center justify-between text-sm font-medium text-white hover:text-cyan-400 transition-colors py-2">
                        <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Cost Breakdown</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showTollsAccordion ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showTollsAccordion && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 space-y-2">
                            {activeQuote.breakdown && (
                              <>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">Base Freight</span><span className="font-mono text-white">₹{activeQuote.breakdown.baseFreight?.toLocaleString('en-IN') || 0}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">NHAI Tolls ({activeQuote.breakdown.tollPlazas?.length || 0} plazas)</span><span className="font-mono text-white">₹{activeQuote.breakdown.tolls?.toLocaleString('en-IN') || 0}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">GST ({activeQuote.breakdown.gstBreakdown?.totalGstRate || 0}%)</span><span className="font-mono text-white">₹{activeQuote.breakdown.gstBreakdown?.totalGst?.toLocaleString('en-IN') || 0}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-slate-400">Fuel Surcharge</span><span className="font-mono text-white">₹{activeQuote.breakdown.fuelSurcharge?.toLocaleString('en-IN') || 0}</span></div>
                                <div className="flex justify-between text-xs border-t border-white/5 pt-2"><span className="font-medium text-white">Total</span><span className="font-mono font-bold text-cyan-400">₹{activeQuote.totalCost.toLocaleString('en-IN')}</span></div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Mode Comparison Cards */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mode Comparison</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['road', 'air', 'sea', 'rail'] as TransportMode[]).map((mode) => {
                        const q = allQuotes[mode];
                        const b = allBenchmarks[mode];
                        if (!q || q.error) return null;
                        const isActive = mode === activeMode;
                        return (
                          <motion.button
                            key={mode}
                            onClick={() => setActiveMode(mode)}
                            className={`relative p-4 rounded-organic-2 transition-all flex flex-col gap-2 border ${
                              isActive 
                                ? 'border-cyan-400/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/5' 
                                : 'border-white/5 hover:border-cyan-400/20 hover:bg-white/[0.02]'
                            }`}
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-gradient-accent' : 'bg-white/5'}`}>
                                  {ModeIcons[mode]}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-sm">{ModeLabels[mode]}</p>
                                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">{q.transitDays} days • {q.breakdown?.tollPlazas?.length || 0} tolls</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-lg text-cyan-400">₹{q.totalCost.toLocaleString('en-IN')}</p>
                                <p className="text-[9px] text-slate-500">₹{q.ratePerKm.toLocaleString('en-IN')}/km</p>
                              </div>
                            </div>
                            {b && (
                              <div className="pt-2 border-t border-white/5 flex justify-between text-[10px]">
                                <span className="text-slate-500">Market avg: ₹{b.avgRatePerKm?.toLocaleString('en-IN')}/km</span>
                                <span className={q.ratePerKm < (b.avgRatePerKm || 0) ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                                  {q.ratePerKm < (b.avgRatePerKm || 0) ? 'Below' : 'Above'} market
                                </span>
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                    <MagneticButton className="flex-1 sm:flex-none py-3 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Export PDF
                    </MagneticButton>
                    <MagneticButton className="flex-1 sm:flex-none py-3 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </MagneticButton>
                    <MagneticButton className="flex-1 sm:flex-none py-3 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2">
                      <Code className="w-4 h-4" /> JSON
                    </MagneticButton>
                    <MagneticButton className="flex-1 sm:flex-none py-3 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2" onClick={handleCopyLink}>
                      <Link2 className="w-4 h-4" /> Share Link
                    </MagneticButton>
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!loading && !showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <Calculator className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-2">Ready to Analyze</h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-6">Configure your lane parameters on the left, then hit <span className="font-mono text-cyan-400">Run Analysis</span> to generate multi-modal freight intelligence.</p>
                  <div className="flex flex-wrap justify-center gap-3 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    <span className="px-2 py-1 bg-white/5 rounded-lg">19,277 pincodes</span>
                    <span className="px-2 py-1 bg-white/5 rounded-lg">NHAI verified tolls</span>
                    <span className="px-2 py-1 bg-white/5 rounded-lg">4 transport modes</span>
                    <span className="px-2 py-1 bg-white/5 rounded-lg">GST audit ready</span>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {!loading && showResults && activeQuote?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-8"
                >
                  <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-2">Calculation Failed</h3>
                  <p className="text-sm text-rose-400 mb-6 max-w-sm">{activeQuote.error}</p>
                  <MagneticButton onClick={handleClear} className="px-6 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:bg-rose-500/20 transition-all">
                    Reset & Retry
                  </MagneticButton>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ────────── ZONE 3 (RIGHT 25%): Benchmarks & Intelligence ────────── */}
        <aside className="border-l border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-6 sm:p-8 space-y-6 hidden lg:block">
          
          {/* Market Benchmark Card */}
          <div className="bg-glass border border-white/5 rounded-organic-1 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
                <BarChart2 className="w-3.5 h-3.5 text-white" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Market Benchmarks</h4>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-400">Road FTL avg</span><span className="font-mono font-bold text-white">₹{allBenchmarks.road?.avgRatePerKm?.toLocaleString('en-IN') || '—'}/km</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Air Cargo avg</span><span className="font-mono font-bold text-white">₹{allBenchmarks.air?.avgRatePerKm?.toLocaleString('en-IN') || '—'}/kg</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ocean FCL avg</span><span className="font-mono font-bold text-white">₹{allBenchmarks.sea?.avgRatePerKm?.toLocaleString('en-IN') || '—'}/CBM</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Rail Container avg</span><span className="font-mono font-bold text-white">₹{allBenchmarks.rail?.avgRatePerKm?.toLocaleString('en-IN') || '—'}/km</span></div>
            </div>
          </div>

          {/* Lane Intelligence */}
          <div className="bg-glass border border-white/5 rounded-organic-1 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Lane Intelligence</h4>
            </div>
            <div className="space-y-3 text-[11px]">
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex justify-between mb-1"><span className="text-slate-400">Distance</span><span className="font-mono font-bold text-white">~1,420 km</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Toll Plazas</span><span className="font-mono font-bold text-white">{activeQuote?.breakdown?.tollPlazas?.length || '—'}</span></div>
              </div>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex justify-between mb-1"><span className="text-slate-400">State Crossings</span><span className="font-mono font-bold text-white">MH → GJ → RJ → HR → DL</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Permit</span><span className="font-mono font-bold text-white">Inter-state</span></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-glass border border-white/5 rounded-organic-1 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Actions</h4>
            </div>
            <button className="w-full text-left p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 rounded-xl transition-all flex items-center gap-3 cursor-pointer">
              <Package className="w-4 h-4 text-cyan-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Create Shipment</p>
                <p className="text-[9px] text-slate-500">Convert to live order</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
            <button className="w-full text-left p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 rounded-xl transition-all flex items-center gap-3 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-violet-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Compare Forwarders</p>
                <p className="text-[9px] text-slate-500">View bidding marketplace</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
            <button className="w-full text-left p-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 rounded-xl transition-all flex items-center gap-3 cursor-pointer">
              <Settings className="w-4 h-4 text-amber-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Advanced Config</p>
                <p className="text-[9px] text-slate-500">Vehicle, container, incoterm</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Data Sources */}
          <div className="pt-4 border-t border-white/5 space-y-2 text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            <p>NHAI Toll Plaza Database (Q3 2024)</p>
            <p>India Post Pincode Directory (19,277)</p>
            <p>Carrier Rate Cards (Validated)</p>
            <p>IRCTC Haulage Tariffs</p>
            <p>DGCA Air Cargo Indices</p>
            <p>INSA/MPEDA Sea Freight Benchmarks</p>
          </div>
        </aside>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={springStandard}
              className="bg-black border border-white/10 rounded-organic-1 p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowHelpModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-white mb-6">Keyboard Shortcuts</h3>
              <div className="space-y-3 text-sm">
                {[
                  ['Cmd/Ctrl + Enter', 'Calculate quote'],
                  ['Cmd/Ctrl + Shift + C', 'Clear form'],
                  ['Escape', 'Close panels / modal'],
                  ['1', 'All modes view'],
                  ['2', 'Road FTL only'],
                  ['3', 'Air cargo only'],
                  ['4', 'Ocean FCL only'],
                  ['? or H', 'Open this help'],
                ].map(([key, desc], i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/5">
                    <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs font-mono text-cyan-400">{key}</kbd>
                    <span className="text-slate-300">{desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}