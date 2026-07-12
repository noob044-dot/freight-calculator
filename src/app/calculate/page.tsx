"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Calculator, ChevronDown, 
  ArrowRight, HelpCircle, Copy, CheckSquare, 
  RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PincodeAutocomplete } from '@/components/PincodeAutocomplete';
import { TransportMode } from '@/components/ModeSelector';
import { QuoteResults } from '@/components/QuoteResults';
import { SearchableCommodity } from '@/components/SearchableCommodity';
import { QuoteResult, Benchmark } from '@/lib/types';
import { CalculatorScene } from '@/components/three/CalculatorScene';

const springGentle = { type: 'spring' as const, stiffness: 220, damping: 20 };

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

export default function CalculatePage() {
  const [activeMode, setActiveMode] = useState<TransportMode>('all');
  const [origin, setOrigin] = useState('400001');
  const [dest, setDest] = useState('110001');
  const [weight, setWeight] = useState('10000');
  const [commodity, setCommodity] = useState('general');
  
  // Overrides
  const [vehicle, setVehicle] = useState('auto');
  const [containerType, setContainerType] = useState('auto');
  const [incoterm, setIncoterm] = useState('EXW');

  // Cargo value & dimensions
  const [cargoValue, setCargoValue] = useState('');
  const dimUnit = 'cm';
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });

  // Map Toggles
  const [showTolls, setShowTolls] = useState(true);
  const [showPorts, setShowPorts] = useState(true);
  const [showAirports, setShowAirports] = useState(true);

  // Advanced toggled state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculation Results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [allQuotes, setAllQuotes] = useState<Record<string, QuoteResult & { error?: string }>>({});
  const [allBenchmarks, setAllBenchmarks] = useState<Record<string, Benchmark>>({});

  // Help Dialog modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Autocomplete coordinates mapping for live canvas route
  const getCoordinates = (pincode: string) => {
    // Simple mock projection coordinates on India's canvas grid
    if (pincode === '400001' || pincode.startsWith('40')) return { x: 120, y: 220, name: 'Mumbai' };
    if (pincode === '110001' || pincode.startsWith('11')) return { x: 140, y: 90, name: 'Delhi' };
    if (pincode === '380001' || pincode.startsWith('38')) return { x: 90, y: 170, name: 'Gujarat' };
    if (pincode === '560001' || pincode.startsWith('56')) return { x: 160, y: 280, name: 'Bengaluru' };
    if (pincode === '600001' || pincode.startsWith('60')) return { x: 180, y: 290, name: 'Chennai' };
    if (pincode === '700001' || pincode.startsWith('70')) return { x: 260, y: 180, name: 'Kolkata' };
    // Fallback coordinates
    return { x: 150, y: 180, name: 'Central Hub' };
  };

  const handleCalculate = useCallback(async () => {
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
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Calculation failed. Please verify inputs.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [origin, dest, weight, commodity, vehicle, cargoValue, dimensions, dimUnit, containerType, incoterm]);

  const handleClear = useCallback(() => {
    setOrigin('');
    setDest('');
    setWeight('10000');
    setCargoValue('');
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
      // Cmd/Ctrl + Enter to Calculate (allowed even when input focused)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
        return;
      }

      // Check if user is typing inside an input/textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Cmd+Shift+C to Clear
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }

      // 1-4 for Mode Switcher
      if (['1', '2', '3', '4'].includes(e.key)) {
        const modesMap: Record<string, TransportMode> = {
          '1': 'all',
          '2': 'road',
          '3': 'air',
          '4': 'sea'
        };
        setActiveMode(modesMap[e.key]);
      }

      // ? or h for Help Modal
      if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHelpModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCalculate, handleClear]);

  // Coordinates values
  const startCoords = getCoordinates(origin);
  const endCoords = getCoordinates(dest);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col font-sans select-none">

      {/* Top Navbar */}
      <header className="h-16 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Calculator className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">Freight Instrument Control</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-xs uppercase font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            Shortcuts
          </button>
          <a href="/dashboard" className="text-xs uppercase font-bold text-slate-400 hover:text-white transition-colors">
            Exit to Dashboard
          </a>
        </div>
      </header>

      {/* Three-Zone Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch z-10 relative overflow-hidden h-[calc(100vh-64px)]">
        
        {/* ZONE 1 (LEFT 35%): Sticky Input Panel */}
        <div className="lg:w-[35%] border-r border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-8 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-white font-display">Calculators Parameters</h2>
              <button
                onClick={handleClear}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Reset Override
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PincodeAutocomplete
                  label="Origin Pincode"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="e.g. 400001 (Mumbai)"
                />
                <PincodeAutocomplete
                  label="Destination Pincode"
                  value={dest}
                  onChange={setDest}
                  placeholder="e.g. 110001 (Delhi)"
                />
              </div>

              {/* Weight Slider widget */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Cargo Weight (kg)</span>
                  <span className="font-mono text-white">{(Number(weight)/1000).toFixed(1)} Tons</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="50000"
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

              {/* Commodity Search dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Commodity Class</label>
                <SearchableCommodity
                  value={commodity}
                  onChange={setCommodity}
                  placeholder="Search class..."
                />
              </div>

              {/* Advanced collapsibles */}
              <div className="border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white"
                >
                  <span>Advanced Parameters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cargo Value (INR)</label>
                        <input
                          type="number"
                          value={cargoValue}
                          onChange={(e) => setCargoValue(e.target.value)}
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
                          {INCOTERMS.map(inc => <option key={inc.code} value={inc.code}>{inc.name}</option>)}
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
                          {VEHICLES.map(v => <option key={v.code} value={v.code}>{v.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sea Container</label>
                        <select
                          value={containerType}
                          onChange={(e) => setContainerType(e.target.value)}
                          className="w-full bg-black border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                        >
                          {CONTAINER_TYPES.map(ct => <option key={ct.code} value={ct.code}>{ct.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Trigger button */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}
            
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full py-4 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Engine Matrix...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Evaluate Freight Rates
                </span>
              )}
            </button>
            <div className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              Press Cmd+Enter to run calculations
            </div>
          </div>

        </div>

        {/* ZONE 2 (CENTER 40%): Live Interactive Canvas Map */}
        <div className="flex-1 min-h-[30vh] lg:h-full bg-slate-950/60 relative flex flex-col justify-between p-6 overflow-hidden">
          <CalculatorScene />
          
          {/* Layer toggles overlay */}
          <div className="absolute top-6 left-6 z-20 bg-glass p-3.5 rounded-xl flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-4 h-4 text-cyan-400" />
              Layers:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showTolls}
                onChange={() => setShowTolls(!showTolls)}
                className="rounded border-white/20 accent-cyan-400"
              />
              Tolls
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPorts}
                onChange={() => setShowPorts(!showPorts)}
                className="rounded border-white/20 accent-cyan-400"
              />
              Ports
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showAirports}
                onChange={() => setShowAirports(!showAirports)}
                className="rounded border-white/20 accent-cyan-400"
              />
              Airports
            </label>
          </div>

          {/* Interactive Canvas Rendering */}
          <div className="flex-1 w-full flex items-center justify-center relative">
            
            {/* SVG Interactive Map representation of India */}
            <svg viewBox="0 0 350 400" className="w-full max-w-[340px] h-[380px] text-slate-800 z-10">
              {/* Outer boundary geometry simulation */}
              <path
                d="M 120,40 L 150,50 L 190,40 L 220,80 L 230,120 L 280,180 L 270,220 L 240,240 L 210,260 L 190,320 L 180,360 L 175,380 L 165,360 L 150,320 L 125,290 L 110,270 L 115,240 L 95,210 L 80,180 L 60,170 L 50,150 L 70,120 L 95,90 Z"
                fill="rgba(255,255,255,0.01)"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1.5"
              />

              {/* Major grid lines */}
              <line x1="0" y1="100" x2="350" y2="100" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />
              <line x1="0" y1="200" x2="350" y2="200" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />
              <line x1="0" y1="300" x2="350" y2="300" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />
              <line x1="100" y1="0" x2="100" y2="400" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />
              <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />
              <line x1="300" y1="0" x2="300" y2="400" stroke="rgba(255,255,255,0.01)" strokeDasharray="3 3" />

              {/* Draw static layers */}
              {showPorts && (
                <>
                  <circle cx="120" cy="225" r="3" fill="#6366f1" opacity="0.6" /> {/* Mumbai Port */}
                  <circle cx="180" cy="295" r="3" fill="#6366f1" opacity="0.6" /> {/* Chennai Port */}
                  <circle cx="260" cy="185" r="3" fill="#6366f1" opacity="0.6" /> {/* Kolkata Port */}
                </>
              )}
              {showAirports && (
                <>
                  <circle cx="140" cy="95" r="3" fill="#ec4899" opacity="0.6" /> {/* Delhi Airport */}
                  <circle cx="120" cy="215" r="3" fill="#ec4899" opacity="0.6" /> {/* Mumbai Airport */}
                  <circle cx="160" cy="275" r="3" fill="#ec4899" opacity="0.6" /> {/* Bengaluru Airport */}
                </>
              )}

              {/* Dynamic route path display */}
              {origin && dest && (
                <>
                  {/* Projected connecting line */}
                  <motion.path
                    d={`M ${startCoords.x},${startCoords.y} Q ${(startCoords.x + endCoords.x)/2 - 20},${(startCoords.y + endCoords.y)/2 - 20} ${endCoords.x},${endCoords.y}`}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />

                  {/* Pulsing toll plazas along the highway route */}
                  {showTolls && (
                    <>
                      <circle cx={(startCoords.x + endCoords.x)/2 - 5} cy={(startCoords.y + endCoords.y)/2 - 5} r="3" fill="#f59e0b">
                        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={(startCoords.x + endCoords.x)/2 + 20} cy={(startCoords.y + endCoords.y)/2 + 10} r="3" fill="#f59e0b">
                        <animate attributeName="r" values="3;6;3" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}

                  {/* Origin Marker */}
                  <g transform={`translate(${startCoords.x},${startCoords.y})`}>
                    <circle cx="0" cy="0" r="6" fill="#22d3ee" />
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* Destination Marker */}
                  <g transform={`translate(${endCoords.x},${endCoords.y})`}>
                    <circle cx="0" cy="0" r="6" fill="#8b5cf6" />
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </>
              )}

              {/* Define gradients */}
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Float values popup overlays */}
            {origin && dest && (
              <div className="absolute bottom-6 right-6 z-20 bg-glass p-4 rounded-xl space-y-1 font-mono text-[10px] text-slate-400">
                <div>Route: <strong className="text-white">{startCoords.name} &rarr; {endCoords.name}</strong></div>
                <div>Distance: <strong className="text-white">Calculating GPS...</strong></div>
              </div>
            )}

          </div>

        </div>

        {/* ZONE 3 (RIGHT 25%): Results Panel */}
        <div className="lg:w-[25%] border-l border-white/5 bg-black/85 backdrop-blur-3xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Calculation Output</h2>
              <button
                onClick={handleCopyLink}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedLink ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Mode switch for detailed results */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {(['all', 'road', 'air'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setActiveMode(m)}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activeMode === m ? 'bg-gradient-accent text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Dynamic Results Display */}
            {showResults ? (
              <div className="space-y-6 animate-fade-in">
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
              </div>
            ) : (
              <div className="bg-glass rounded-xl p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 h-[240px]">
                <Calculator className="w-8 h-8 opacity-40 animate-pulse text-cyan-400" />
                <p className="text-xs uppercase font-bold tracking-wider leading-relaxed">
                  Awaiting input parameters...
                </p>
                <p className="text-[10px] text-slate-500/80">Configure lanes and weight to evaluate transit quotes.</p>
              </div>
            )}
          </div>

          {/* Platform Actions */}
          <div className="pt-6 border-t border-white/5 space-y-4">
            <a
              href="/login"
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <span>Convert quote to lead</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </a>
          </div>

        </div>

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
              transition={springGentle}
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

    </div>
  );
}
