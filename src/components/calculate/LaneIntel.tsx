"use client";

import React from "react";
import { 
  CloudSun, ShieldAlert, Compass, AlertTriangle 
} from "lucide-react";
import { QuoteResponse } from "@/lib/api/contracts";

interface LaneIntelProps {
  results: QuoteResponse | null;
}

export default function LaneIntel({ results }: LaneIntelProps) {
  const roadQuote = results?.quotes?.road;
  const hasRoad = roadQuote && !("error" in roadQuote);
  const distance = hasRoad ? roadQuote.distanceKm : 0;
  
  const tollPlazas = hasRoad ? (roadQuote.tollPlazas || []) : [];

  // Extract unique states crossed
  const statesCrossed = results && hasRoad
    ? Array.from(new Set(tollPlazas.map((t) => t.state))).filter(Boolean) as string[]
    : ["Maharashtra", "Gujarat", "Rajasthan", "Delhi"];

  return (
    <div className="space-y-3 bg-neutral-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Lane Intelligence
      </h3>

      {/* Basic Metrics row */}
      {results && (
        <div className="grid grid-cols-2 gap-2 border-b border-white/5 pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">Gross Distance</span>
            <span className="text-xs font-mono text-white font-bold">{distance} KM</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider block">State Nodes</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {statesCrossed.map((st) => (
                <span 
                  key={st}
                  className="px-1.5 py-0.5 bg-white/5 text-[7px] font-mono text-slate-400 rounded border border-white/5"
                >
                  {st.substring(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weather Module */}
      <div className="space-y-2 border-b border-white/5 pb-2.5">
        <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <CloudSun className="w-3.5 h-3.5 text-cyan-400" />
            Route Weather Forecast
          </span>
          <span className="text-[8px] font-mono text-emerald-400">FAVORABLE</span>
        </div>
        <div className="flex justify-between gap-1 text-[8px] font-mono text-slate-400">
          <div className="text-center bg-white/[0.01] border border-white/5 p-1 rounded-lg flex-1">
            <p className="text-slate-500">MUM</p>
            <p className="text-white font-bold mt-0.5">29°C</p>
          </div>
          <div className="text-center bg-white/[0.01] border border-white/5 p-1 rounded-lg flex-1">
            <p className="text-slate-500">SUR</p>
            <p className="text-white font-bold mt-0.5">31°C</p>
          </div>
          <div className="text-center bg-white/[0.01] border border-white/5 p-1 rounded-lg flex-1">
            <p className="text-slate-500">KIP</p>
            <p className="text-white font-bold mt-0.5">28°C</p>
          </div>
          <div className="text-center bg-white/[0.01] border border-white/5 p-1 rounded-lg flex-1">
            <p className="text-slate-500">DEL</p>
            <p className="text-white font-bold mt-0.5">30°C</p>
          </div>
        </div>
      </div>

      {/* Restrictions Module */}
      <div className="space-y-2 border-b border-white/5 pb-2.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          Highway Regulations & Curfews
        </span>
        <div className="space-y-1.5 font-mono text-[8px] text-slate-400">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Load limits: Max 49T gross axle constraint on NH48.</span>
          </div>
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Curfew: Commercial vehicles restricted in Delhi NCR (07:00-11:00 & 17:00-23:00).</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Node coordinates */}
      <div className="space-y-1.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          NHAI Infrastructure Hubs
        </span>
        <div className="space-y-1.5 text-[8px] font-mono text-slate-400">
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-2 py-1 rounded-lg">
            <span className="text-slate-300">Rest Stop / Food Court</span>
            <span className="text-[8px] text-slate-500 font-bold">KM 148 (NH48)</span>
          </div>
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-2 py-1 rounded-lg">
            <span className="text-slate-300">Emergency Repair hub</span>
            <span className="text-[8px] text-slate-500 font-bold">KM 312 (NH48)</span>
          </div>
          <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 px-2 py-1 rounded-lg">
            <span className="text-slate-300">NHAI Weighbridge</span>
            <span className="text-[8px] text-emerald-400 font-bold">KM 554 (NH48)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
