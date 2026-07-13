"use client";

import React from "react";
import MarketBenchmarks from "./MarketBenchmarks";
import LaneIntel from "./LaneIntel";
import QuickActions from "./QuickActions";
import DataCitations from "./DataCitations";
import { QuoteResponse } from "@/lib/api/contracts";

interface ContextIntelligenceProps {
  results: QuoteResponse | null;
  activeMode: string;
  weight: string;
  commodityCode: string;
  originPincode: string;
  destPincode: string;
}

export default function ContextIntelligence({
  results,
  activeMode,
  weight,
  commodityCode,
  originPincode,
  destPincode
}: ContextIntelligenceProps) {
  return (
    <div className="space-y-6 h-fit sticky top-20">
      {/* 1. Market Benchmarks Sparklines */}
      <MarketBenchmarks results={results} activeMode={activeMode} />

      {/* 2. Lane Intel weather/curfews */}
      <LaneIntel results={results} />

      {/* 3. Quick Actions */}
      <QuickActions
        results={results}
        activeMode={activeMode}
        weight={weight}
        commodityCode={commodityCode}
        originPincode={originPincode}
        destPincode={destPincode}
      />

      {/* 4. Data citations */}
      <DataCitations />
    </div>
  );
}
