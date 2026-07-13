"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Plane, Ship, Train, Copy, Check, 
  Layers, Landmark 
} from "lucide-react";
import { springGentle } from "@/lib/animations/variants";
import { QuoteResponse } from "@/lib/api/contracts";

interface PrimaryQuoteCardProps {
  results: QuoteResponse;
  activeMode: string;
  originPincode: string;
  destPincode: string;
}

const ModeIcons: Record<string, React.ReactNode> = {
  road: <Truck className="w-5 h-5 text-cyan-400" />,
  air: <Plane className="w-5 h-5 text-cyan-400" />,
  sea: <Ship className="w-5 h-5 text-cyan-400" />,
  rail: <Train className="w-5 h-5 text-cyan-400" />
};

const ModeLabels: Record<string, string> = {
  road: "Road Freight FTL",
  air: "Air Cargo Service",
  sea: "Ocean Cargo FCL",
  rail: "Rail Freight Carrier"
};

// Clean cubic ease-out counter
function AnimatedCounter({ 
  value, 
  prefix = "₹", 
  suffix = "", 
  duration = 1.0 
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string; 
  duration?: number 
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();
    let frameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setCount(Math.floor(ease * (end - start) + start));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className="font-mono">{prefix}{count.toLocaleString("en-IN")}{suffix}</span>;
}

export default function PrimaryQuoteCard({
  results,
  activeMode,
  originPincode,
  destPincode
}: PrimaryQuoteCardProps) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [copiedPlaza, setCopiedPlaza] = useState<string | null>(null);

  const quote = results.quotes[activeMode];
  if (!quote || "error" in quote) {
    return (
      <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
        <span className="text-xs text-rose-400">Calculation is not available for this mode config.</span>
      </div>
    );
  }

  const totalCost = quote.total + Math.round(quote.total * 0.18);
  const costPerKm = quote.distanceKm > 0 ? Math.round(totalCost / quote.distanceKm) : 0;
  const costPerKg = quote.perKg + Math.round(quote.perKg * 0.18);

  const handleCopyCoords = (plazaName: string) => {
    navigator.clipboard.writeText(plazaName);
    setCopiedPlaza(plazaName);
    setTimeout(() => setCopiedPlaza(null), 1500);
  };

  const tollPlazas = quote.tollPlazas || [];

  // Summarize tolls
  const totalBaseTolls = tollPlazas.reduce((acc, curr) => acc + (curr.tollAmount || 0), 0);
  const totalGstTolls = Math.round(totalBaseTolls * 0.18);
  const finalTollSum = totalBaseTolls + totalGstTolls;

  return (
    <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden space-y-6 shadow-2xl">
      {/* Visual pulse indicator top corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-400/10 rounded-2xl">
            {ModeIcons[activeMode] || <Layers className="w-5 h-5 text-cyan-400" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {ModeLabels[activeMode] || activeMode}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">LANE SUMMARY: {originPincode} ➔ {destPincode}</p>
          </div>
        </div>

        <span className="text-[9px] font-mono font-bold bg-cyan-400/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-400/10">
          INDEX STABLE
        </span>
      </div>

      {/* KPI Tiles 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cost */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Freight Cost</span>
          <span className="text-xl font-bold text-white">
            <AnimatedCounter value={totalCost} />
          </span>
          <span className="text-[8px] font-mono text-slate-600 leading-tight">INCLUDES SURCHARGES & TOLLS</span>
        </div>

        {/* Cost per km */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Unit Rate Per KM</span>
          <span className="text-xl font-bold text-white">
            <AnimatedCounter value={costPerKm} />
          </span>
          <span className="text-[8px] font-mono text-slate-600 leading-tight">TOTAL COST / DISTANCE</span>
        </div>

        {/* Transit days */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Estimated Transit</span>
          <span className="text-xl font-bold text-white font-mono">
            {quote.transitDays} Days
          </span>
          <span className="text-[8px] font-mono text-slate-600 leading-tight">SUBJECT TO HIGHWAY RESTRICTIONS</span>
        </div>

        {/* Unit Cost per kg */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col gap-1.5">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Distance Unit index</span>
          <span className="text-xl font-bold text-white">
            <AnimatedCounter value={Math.round(costPerKg)} prefix="₹" suffix="/km" />
          </span>
          <span className="text-[8px] font-mono text-slate-600 leading-tight">MAPPED RATE DISTRIBUTION</span>
        </div>
      </div>

      {/* TollBreakdownAccordion (only for Road) */}
      {activeMode === "road" && tollPlazas.length > 0 && (
        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
          <button
            type="button"
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full flex items-center justify-between p-4 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest cursor-pointer select-none bg-white/[0.01]"
          >
            <span className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-cyan-400" />
              NHAI Toll Plaza Audit ({tollPlazas.length} Plazas)
            </span>
            <motion.span
              animate={{ rotate: accordionOpen ? 180 : 0 }}
              transition={springGentle}
              className="text-cyan-400"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {accordionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springGentle}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 overflow-x-auto">
                  <table className="w-full text-left text-[10px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500">
                        <th className="py-2 font-bold uppercase">Plaza</th>
                        <th className="py-2 font-bold uppercase text-center">State</th>
                        <th className="py-2 font-bold uppercase text-right">Base</th>
                        <th className="py-2 font-bold uppercase text-right">GST (18%)</th>
                        <th className="py-2 font-bold uppercase text-right">Total</th>
                        <th className="py-2 font-bold uppercase text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {tollPlazas.map((t) => {
                        const base = t.tollAmount || 0;
                        const gst = Math.round(base * 0.18);
                        const total = base + gst;
                        const isCopied = copiedPlaza === t.name;

                        return (
                          <tr key={t.name} className="hover:bg-white/[0.01] group">
                            <td className="py-2 font-bold text-white max-w-[120px] truncate">{t.name}</td>
                            <td className="py-2 text-center text-slate-500">{t.state}</td>
                            <td className="py-2 text-right">₹{base}</td>
                            <td className="py-2 text-right text-slate-500">₹{gst}</td>
                            <td className="py-2 text-right text-cyan-400 font-semibold">₹{total}</td>
                            <td className="py-2 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyCoords(t.name)}
                                  className="p-1 hover:text-white text-slate-500 transition-colors cursor-pointer"
                                  title="Copy plaza name"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Sticky total summary row */}
                      <tr className="bg-white/[0.02] border-t border-cyan-500/20 font-bold text-white">
                        <td className="py-2.5 pl-2">SUBTOTALS</td>
                        <td className="py-2.5"></td>
                        <td className="py-2.5 text-right">₹{totalBaseTolls}</td>
                        <td className="py-2.5 text-right text-slate-500">₹{totalGstTolls}</td>
                        <td className="py-2.5 text-right text-cyan-400 font-bold text-[11px] shadow-sm">
                          ₹{finalTollSum}
                        </td>
                        <td className="py-2.5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
