"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, ArrowRight, Truck, Plane, Ship } from 'lucide-react';
import { springStandard } from '@/lib/animations/variants';

export const CalculatorWidget: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [weight, setWeight] = useState('');
  const [mode, setMode] = useState<'road' | 'air' | 'sea'>('road');
  const [result, setResult] = useState<{ cost: number; transit: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !dest || !weight) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/quote?origin=${origin}&dest=${dest}&weight=${weight}&mode=${mode}`);
      const data = await res.json();
      if (data.success) {
        setResult({
          cost: data.cost,
          transit: data.transitTime
        });
      } else {
        // Fallback to static estimation
        const baseCost = mode === 'air' ? 5000 : mode === 'sea' ? 8000 : 2500;
        const perKg = mode === 'air' ? 45 : mode === 'sea' ? 12 : 6;
        const total = baseCost + Number(weight) * perKg;
        setResult({
          cost: total,
          transit: mode === 'air' ? '1-2 Days' : mode === 'sea' ? '12-15 Days' : '3-5 Days'
        });
      }
    } catch {
      const baseCost = mode === 'air' ? 5000 : mode === 'sea' ? 8000 : 2500;
      const perKg = mode === 'air' ? 45 : mode === 'sea' ? 12 : 6;
      const total = baseCost + Number(weight) * perKg;
      setResult({
        cost: total,
        transit: mode === 'air' ? '1-2 Days' : mode === 'sea' ? '12-15 Days' : '3-5 Days'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-glass border border-white/5 rounded-organic-1 p-6 relative overflow-hidden flex flex-col space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
        <div className="w-6 h-6 rounded-lg bg-gradient-accent flex items-center justify-center">
          <Calculator className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Instant Lane Calculator</h3>
      </div>

      <form onSubmit={handleQuickCalculate} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Origin State</label>
            <input
              type="text"
              placeholder="e.g. MAHARASHTRA"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:bg-cyan-500/[0.01] outline-none"
              required
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Dest State</label>
            <input
              type="text"
              placeholder="e.g. DELHI"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:bg-cyan-500/[0.01] outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Weight (kg)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:bg-cyan-500/[0.01] outline-none"
              required
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Mode</label>
            <div className="flex bg-black/40 border border-white/5 rounded-xl p-0.5">
              {(['road', 'air', 'sea'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${
                    mode === m ? 'bg-gradient-accent text-white shadow-sm' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {m === 'road' && <Truck className="w-3.5 h-3.5" />}
                  {m === 'air' && <Plane className="w-3.5 h-3.5" />}
                  {m === 'sea' && <Ship className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-gradient-accent hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/10 cursor-pointer"
        >
          {loading ? 'Processing...' : 'Run Analysis'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springStandard}
            className="pt-4 border-t border-white/5 space-y-2 overflow-hidden"
          >
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Estimated Cost</span>
                <p className="text-sm font-mono font-bold text-cyan-400">INR {result.cost.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Transit Window</span>
                <p className="text-xs font-mono font-bold text-white">{result.transit}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
