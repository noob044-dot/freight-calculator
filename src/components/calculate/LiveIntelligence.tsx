"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2, Globe, Server, Zap, AlertCircle } from "lucide-react";
import PrimaryQuoteCard from "./PrimaryQuoteCard";
import ModeComparison from "./ModeComparison";
import ExportDropdown from "./ExportDropdown";
import { QuoteResponse } from "@/lib/api/contracts";

const RouteGlobe = dynamic(() => import("./RouteGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01]">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
      <span className="text-[10px] text-slate-500 font-mono">Initializing 3D spatial globe...</span>
    </div>
  )
});

interface LiveIntelligenceProps {
  loadingStage: "idle" | "calculating_tolls" | "fetching_rates" | "benchmarking";
  results: QuoteResponse | null;
  error: string | null;
  activeMode: string;
  setActiveMode: (mode: string) => void;
  
  // Shared state references for export options
  originPincode: string;
  destPincode: string;
  weight: string;
  weightUnit: string;
  commodityCode: string;
  vehicleAxles: "2" | "3" | "4-6" | "Auto";
  containerType: "20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto";
  incoterm: string;

  originName?: string;
  destName?: string;
  originCoords?: { lat: number; lon: number } | null;
  destCoords?: { lat: number; lon: number } | null;
}

export default function LiveIntelligence({
  loadingStage,
  results,
  error,
  activeMode,
  setActiveMode,
  originPincode,
  destPincode,
  weight,
  weightUnit,
  commodityCode,
  vehicleAxles,
  containerType,
  incoterm,
  originName,
  destName,
  originCoords,
  destCoords
}: LiveIntelligenceProps) {

  // Loader texts matching stages
  const loaderStageText = {
    idle: "",
    calculating_tolls: "Calculating NHAI Toll Plaza gates...",
    fetching_rates: "Fetching real-time carrier spot rates...",
    benchmarking: "Cross-referencing market index percentiles..."
  };

  const loaderProgress = {
    idle: 0,
    calculating_tolls: 33,
    fetching_rates: 66,
    benchmarking: 100
  };

  // 1. Loading state with visual progress bar and skeleton layout matcher
  if (loadingStage !== "idle") {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Loading status bar */}
        <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl space-y-4">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {loaderStageText[loadingStage]}
            </span>
            <span>{loaderProgress[loadingStage]}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-cyan transition-all duration-500 ease-out"
              style={{ width: `${loaderProgress[loadingStage]}%` }}
            />
          </div>
        </div>

        {/* Skeleton Quote Card */}
        <div className="h-72 bg-neutral-900/20 border border-white/5 rounded-3xl" />

        {/* Skeleton Grid Comparison */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-neutral-900/20 border border-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // 2. Error state
  if (error) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Failed</h3>
        <p className="text-xs text-rose-400 max-w-sm font-mono leading-relaxed">{error}</p>
      </div>
    );
  }

  // 3. Results state
  if (results) {
    return (
      <div className="space-y-6">
        {/* Results title & export row */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-light text-white tracking-tight">Active Lane Intelligence</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">COMPILING LIVE CARRIER SPOT BENCHMARKS</p>
          </div>
          <ExportDropdown
            results={results}
            originPincode={originPincode}
            destPincode={destPincode}
            weight={weight}
            weightUnit={weightUnit}
            commodityCode={commodityCode}
            vehicleAxles={vehicleAxles}
            containerType={containerType}
            incoterm={incoterm}
            activeMode={activeMode}
          />
        </div>

        {/* RouteGlobe visualizer */}
        <div className="h-[320px] bg-neutral-900/20 border border-white/5 rounded-3xl overflow-hidden relative">
          <RouteGlobe
            originCoords={originCoords}
            destCoords={destCoords}
            originName={originName || originPincode}
            destName={destName || destPincode}
          />
        </div>

        {/* Primary costing details */}
        <PrimaryQuoteCard
          results={results}
          activeMode={activeMode}
          originPincode={originPincode}
          destPincode={destPincode}
        />

        {/* Mode pricing cards comparison */}
        <ModeComparison
          results={results}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
        />
      </div>
    );
  }

  // 4. Empty state (globe wireframe + telemetry stats)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-light text-white tracking-tight">System Telemetry Online</h2>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">COMPILING NATIONAL LOGISTICS DATA NODES</p>
      </div>

      <div className="h-[320px] bg-neutral-900/20 border border-white/5 rounded-3xl overflow-hidden relative">
        <RouteGlobe />
      </div>

      {/* Telemetry indices grids */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-cyan-400/10 rounded-xl text-cyan-400">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Geocoded Nodes</span>
            <span className="font-mono text-sm font-semibold text-white">19,277 Pincodes</span>
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-emerald-400/10 rounded-xl text-emerald-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">NHAI Highway Plazas</span>
            <span className="font-mono text-sm font-semibold text-white">NH48, NH44, NH47 Mapped</span>
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-amber-400/10 rounded-xl text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Compile Speed</span>
            <span className="font-mono text-sm font-semibold text-white">&lt; 2.5s Sequencer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
