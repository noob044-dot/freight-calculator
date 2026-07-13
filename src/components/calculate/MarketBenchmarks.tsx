"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { TrendingDown, TrendingUp, Info } from "lucide-react";
import { QuoteResponse } from "@/lib/api/contracts";

interface MarketBenchmarksProps {
  results: QuoteResponse | null;
  activeMode: string;
}

interface CarrierBenchmark {
  id: string;
  name: string;
  factor: number;
  reliability: number;
  speed: string;
}

// Sparkline Canvas Component
const SparklineCanvas: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set display sizes
    const width = 60;
    const height = 20;
    
    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    data.forEach((val, idx) => {
      const x = (idx / (data.length - 1)) * (width - 4) + 2;
      // Invert Y axis
      const y = height - ((val - min) / range) * (height - 4) - 2;

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }, [data, color]);

  return <canvas ref={canvasRef} className="w-[60px] h-[20px]" style={{ width: "60px", height: "20px" }} />;
};

const CARRIERS: CarrierBenchmark[] = [
  { id: "bluedart", name: "Blue Dart Express", factor: 1.0, reliability: 97, speed: "Fast" },
  { id: "safexpress", name: "Safexpress B2B", factor: 0.9, reliability: 92, speed: "Standard" },
  { id: "gati", name: "Gati KWE Logistics", factor: 0.88, reliability: 89, speed: "Standard" },
  { id: "dhl", name: "DHL Global Forwarding", factor: 1.15, reliability: 98, speed: "Priority" }
];

export default function MarketBenchmarks({
  results,
  activeMode
}: MarketBenchmarksProps) {
  const [hoveredCarrier, setHoveredCarrier] = useState<string | null>(null);

  // Base price calculation helper
  const quote = results?.quotes[activeMode];
  const baseCost = quote && !("error" in quote) ? quote.total : 25000;

  // Generate deterministic sparkline data
  const sparkData = useMemo(() => {
    const data: Record<string, number[]> = {};
    CARRIERS.forEach((c) => {
      const seed = c.id.charCodeAt(0) + c.id.charCodeAt(2);
      data[c.id] = [
        Math.round(baseCost * c.factor * (0.95 + (seed % 5) * 0.01)),
        Math.round(baseCost * c.factor * (0.97 - (seed % 4) * 0.01)),
        Math.round(baseCost * c.factor * (0.94 + (seed % 3) * 0.01)),
        Math.round(baseCost * c.factor * (1.02 - (seed % 6) * 0.01)),
        Math.round(baseCost * c.factor * (0.99 + (seed % 4) * 0.01)),
        Math.round(baseCost * c.factor * (1.04 - (seed % 5) * 0.01)),
        Math.round(baseCost * c.factor * (1.0 - (seed % 3) * 0.01))
      ];
    });
    return data;
  }, [baseCost]);

  return (
    <div className="space-y-3 bg-neutral-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Market Rate Benchmarks
        </h3>
        <Info className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 transition-colors" />
      </div>

      <div className="space-y-2">
        {CARRIERS.map((c) => {
          const currentSpark = sparkData[c.id] || [];
          const currentPrice = currentSpark[currentSpark.length - 1] || Math.round(baseCost * c.factor);
          const previousPrice = currentSpark[currentSpark.length - 2] || currentPrice;
          const isDecreasing = currentPrice <= previousPrice;
          
          // Percentiles calculations
          const p50 = currentPrice;
          const p10 = Math.round(p50 * 0.9);
          const p25 = Math.round(p50 * 0.95);
          const p75 = Math.round(p50 * 1.08);
          const p90 = Math.round(p50 * 1.15);

          return (
            <div
              key={c.id}
              className="relative p-2.5 bg-white/[0.01] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.02] hover:border-white/10 transition-all group"
              onMouseEnter={() => setHoveredCarrier(c.id)}
              onMouseLeave={() => setHoveredCarrier(null)}
            >
              <div>
                <span className="text-[9px] font-bold text-white block">{c.name}</span>
                <span className="text-[8px] font-mono text-slate-500">Rel: {c.reliability}% | {c.speed}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Canvas sparkline */}
                <SparklineCanvas data={currentSpark} color={isDecreasing ? "#10b981" : "#ef4444"} />

                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold text-white block">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </span>
                  <span className={`text-[7px] font-mono flex items-center justify-end gap-0.5 ${
                    isDecreasing ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {isDecreasing ? <TrendingDown className="w-2 h-2" /> : <TrendingUp className="w-2 h-2" />}
                    {isDecreasing ? "Index Low" : "Index High"}
                  </span>
                </div>
              </div>

              {/* Hover popover Percentiles histogram */}
              {hoveredCarrier === c.id && (
                <div className="absolute right-0 bottom-full z-50 mb-2 w-56 bg-neutral-950/95 border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl space-y-2.5 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">{c.name}</span>
                    <span className="text-[8px] font-mono text-cyan-400">Percentiles</span>
                  </div>

                  {/* Histogram bars */}
                  <div className="space-y-1.5 font-mono text-[8px]">
                    {/* P10 */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500">
                        <span>P10 (LOW BUY)</span>
                        <span>₹{p10.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/80 w-[45%]" />
                      </div>
                    </div>

                    {/* P25 */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500">
                        <span>P25 (BEST OFFER)</span>
                        <span>₹{p25.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/40 w-[60%]" />
                      </div>
                    </div>

                    {/* P50 */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-cyan-400">
                        <span>P50 (MEDIAN)</span>
                        <span>₹{p50.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400 w-[75%]" />
                      </div>
                    </div>

                    {/* P75 */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500">
                        <span>P75 (MARKET MAX)</span>
                        <span>₹{p75.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500/40 w-[85%]" />
                      </div>
                    </div>

                    {/* P90 */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500">
                        <span>P90 (SPOT HIGH)</span>
                        <span>₹{p90.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500/80 w-[95%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
