"use client";

import React from "react";
import { motion } from "framer-motion";
import { Truck, Plane, Ship, Train, HelpCircle } from "lucide-react";
import { springStandard } from "@/lib/animations/variants";
import { QuoteResponse } from "@/lib/api/contracts";

interface ModeComparisonProps {
  results: QuoteResponse;
  activeMode: string;
  setActiveMode: (mode: string) => void;
}

const ModeIcons: Record<string, React.ReactNode> = {
  road: <Truck className="w-4 h-4" />,
  air: <Plane className="w-4 h-4" />,
  sea: <Ship className="w-4 h-4" />,
  rail: <Train className="w-4 h-4" />
};

const ModeLabels: Record<string, string> = {
  road: "Road FTL",
  air: "Air Cargo",
  sea: "Ocean FCL",
  rail: "Rail Container"
};

export default function ModeComparison({
  results,
  activeMode,
  setActiveMode
}: ModeComparisonProps) {
  // Generate a mock sparkline path for visual design
  const generateSparklinePath = (mode: string) => {
    const seed = mode.charCodeAt(0) + mode.charCodeAt(1);
    const points = [
      18 - (seed % 7),
      14 - (seed % 5),
      16 - (seed % 6),
      10 - (seed % 4),
      15 - (seed % 5),
      8 - (seed % 3),
      12 - (seed % 6)
    ];
    
    // Map points to SVG coordinates inside a 60x20 container
    return points
      .map((val, idx) => {
        const x = (idx * 10).toFixed(0);
        const y = val.toFixed(0);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(results.quotes).map(([mode, quote]) => {
        const isSelected = activeMode === mode;
        const icon = ModeIcons[mode] || <HelpCircle className="w-4 h-4" />;
        const label = ModeLabels[mode] || mode;

        if ("error" in quote || !quote) return null;

        const totalCost = quote.total + Math.round(quote.total * 0.18);
        
        // Calculate cost per kilometer
        const costPerKm = quote.distanceKm > 0 ? Math.round(totalCost / quote.distanceKm) : 0;

        // Generate dynamic delta details (mock delta percentage compared to market benchmark index)
        const isSavings = (quote.total % 2) === 0;
        const deltaPct = (quote.total % 4) + 1.5;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveMode(mode)}
            className={`relative p-4 text-left rounded-2xl border transition-all duration-200 hover:border-cyan-400/40 relative overflow-hidden group cursor-pointer flex flex-col gap-3 ${
              isSelected
                ? "border-cyan-400 bg-cyan-400/[0.03] shadow-lg shadow-cyan-500/[0.03] scale-[1.02] z-10"
                : "border-white/5 bg-white/[0.01]"
            }`}
          >
            {/* layoutId for shared selection background glow */}
            {isSelected && (
              <motion.div
                layoutId="activeModeOutline"
                className="absolute inset-0 border border-cyan-400 rounded-2xl pointer-events-none"
                transition={springStandard}
              />
            )}

            {/* Header info */}
            <div className="flex justify-between items-start w-full">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${
                  isSelected ? "bg-cyan-400/10 text-cyan-400" : "bg-white/5 text-slate-400"
                }`}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-[10px] text-white uppercase tracking-wider">{label}</h3>
                  <span className="text-[9px] text-slate-500 font-mono">EST. {quote.transitDays} DAYS</span>
                </div>
              </div>

              {/* Delta Badge */}
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                isSavings 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "bg-rose-500/10 text-rose-400"
              }`}>
                {isSavings ? "▼" : "▲"}{deltaPct.toFixed(1)}%
              </span>
            </div>

            {/* Metric Pricing details */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Net Invoice Cost</span>
              <span className="font-mono text-base font-semibold text-white">
                ₹{totalCost.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Sparkline & details */}
            <div className="flex justify-between items-center w-full mt-1 border-t border-white/5 pt-2">
              <div className="font-mono text-[9px] text-slate-500">
                ₹{costPerKm}/km
              </div>
              
              {/* SVG Sparkline */}
              <svg width="60" height="20" className="overflow-visible">
                <path
                  d={generateSparklinePath(mode)}
                  fill="none"
                  stroke={isSavings ? "#10b981" : "#ef4444"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
