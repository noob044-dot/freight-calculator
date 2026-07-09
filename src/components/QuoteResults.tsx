"use client";

import React, { useState } from 'react';
import { Download, FileText, Calendar, Navigation, Info } from 'lucide-react';
import { QuoteResult, Benchmark } from '../lib/types';
import { exportToPDF, exportToCSV, exportToJSON, exportToExcel } from '../lib/utils/export';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface QuoteResultsProps {
  mode: 'road' | 'air' | 'sea' | 'rail' | 'all';
  singleResult?: QuoteResult;
  singleBenchmark?: Benchmark;
  allQuotes?: Record<string, QuoteResult & { error?: string }>;
  allBenchmarks?: Record<string, Benchmark>;
}

export const QuoteResults: React.FC<QuoteResultsProps> = ({
  mode,
  singleResult,
  singleBenchmark,
  allQuotes,
  allBenchmarks
}) => {
  const [selectedSubMode, setSelectedSubMode] = useState<'road' | 'air' | 'sea' | 'rail'>('road');

  const formatINR = (n: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(n);
  };

  // If "all" mode, render the comparison dashboard
  if (mode === 'all' && allQuotes) {
    // Transform data for Recharts comparison
    const chartData = Object.entries(allQuotes)
      .filter(([, q]) => !q.error)
      .map(([key, q]) => ({
        name: key === 'road' ? 'Road FTL' : key === 'air' ? 'Air Freight' : key === 'sea' ? 'Sea FCL' : 'Rail Haulage',
        key,
        Cost: q.total,
        Transit: q.transitDays,
      }));

    // Find the active selected result for the detail view
    const activeQuote = allQuotes[selectedSubMode];
    const activeBenchmark = allBenchmarks?.[selectedSubMode];

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Comparison Overview Deck */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-fg">Multi-Modal Cost & Speed Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['road', 'air', 'sea', 'rail'] as const).map((m) => {
              const quote = allQuotes[m];
              const isSelected = selectedSubMode === m;
              
              if (!quote) return null;

              if (quote.error) {
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedSubMode(m)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all bg-bg-elevated cursor-pointer ${
                      isSelected ? 'border-error/40 ring-1 ring-error/40' : 'border-border opacity-60'
                    }`}
                  >
                    <span className="text-xs uppercase font-bold text-fg-muted tracking-wider">
                      {m === 'road' ? 'Road FTL' : m === 'air' ? 'Air Freight' : m === 'sea' ? 'Sea FCL' : 'Rail Haulage'}
                    </span>
                    <span className="text-sm font-semibold text-error mt-2">Unavailable</span>
                    <span className="text-xs text-fg-muted mt-1 truncate">{quote.error}</span>
                  </button>
                );
              }

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedSubMode(m)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all bg-bg-elevated cursor-pointer ${
                    isSelected ? 'border-accent ring-1 ring-accent' : 'border-border hover:border-accent-soft'
                  }`}
                >
                  <span className="text-xs uppercase font-bold text-fg-muted tracking-wider">
                    {m === 'road' ? 'Road FTL' : m === 'air' ? 'Air Freight' : m === 'sea' ? 'Sea FCL' : 'Rail Haulage'}
                  </span>
                  <span className="text-2xl font-bold text-fg mt-2">{formatINR(quote.total)}</span>
                  <span className="text-xs text-accent mt-1">{quote.transitDays} Days Transit</span>
                  <span className="text-xs text-fg-muted mt-1">{quote.distanceKm} km</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Bar Chart comparing cost */}
        {chartData.length > 0 && (
          <div className="bg-bg-elevated border border-border p-6 rounded-xl">
            <h4 className="text-sm font-bold text-fg-muted mb-4 uppercase tracking-wider">Cost Comparison Chart</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(tick) => `₹${tick / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                    itemStyle={{ color: '#38bdf8' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Cost']}
                  />
                  <Bar dataKey="Cost" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.key === selectedSubMode ? 'var(--accent)' : 'var(--accent-soft)'}
                        stroke={entry.key === selectedSubMode ? 'var(--accent-hover)' : 'var(--border)'}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed result of selected sub-mode */}
        {activeQuote && !activeQuote.error ? (
          <div>
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                Detailed Breakdown: <span className="text-accent">{activeQuote.vehicle}</span>
              </h3>
              <RenderSingleResult quote={activeQuote} benchmark={activeBenchmark} formatINR={formatINR} />
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-bg-elevated border border-border rounded-xl">
            <span className="text-fg-muted">Selected mode has routing errors or is unavailable on this corridor.</span>
          </div>
        )}
      </div>
    );
  }

  // If single mode, render single result card
  if (singleResult) {
    return (
      <div className="animate-fade-in">
        <RenderSingleResult quote={singleResult} benchmark={singleBenchmark} formatINR={formatINR} />
      </div>
    );
  }

  return null;
};

// Helper sub-component to render a single detailed freight quote
interface RenderSingleResultProps {
  quote: QuoteResult;
  benchmark: Benchmark | null | undefined;
  formatINR: (n: number) => string;
}

const RenderSingleResult: React.FC<RenderSingleResultProps> = ({ quote, benchmark, formatINR }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = (format: 'pdf' | 'csv' | 'json' | 'excel') => {
    setExporting(true);
    setTimeout(() => {
      try {
        if (format === 'pdf') exportToPDF(quote, benchmark);
        if (format === 'csv') exportToCSV(quote);
        if (format === 'json') exportToJSON(quote);
        if (format === 'excel') exportToExcel(quote);
      } catch (err) {
        console.error('Export failed:', err);
      } finally {
        setExporting(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-elevated border border-border p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent">
            <span className="text-lg font-bold">₹</span>
          </div>
          <div>
            <span className="text-xs text-fg-muted font-medium uppercase tracking-wider block">Estimated Cost</span>
            <span className="text-2xl font-bold text-fg">{formatINR(quote.total)}</span>
          </div>
        </div>

        <div className="bg-bg-elevated border border-border p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-fg-muted font-medium uppercase tracking-wider block">Transit Duration</span>
            <span className="text-2xl font-bold text-fg">{quote.transitDays} Days</span>
            <span className="text-xs text-fg-muted block">~{quote.durationHrs} hours</span>
          </div>
        </div>

        <div className="bg-bg-elevated border border-border p-5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center text-accent">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-fg-muted font-medium uppercase tracking-wider block">Est. Route Distance</span>
            <span className="text-2xl font-bold text-fg">{quote.distanceKm} km</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Table (Left 2 cols) */}
        <div className="lg:col-span-2 bg-bg-elevated border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg/50">
            <h4 className="text-sm font-bold text-fg uppercase tracking-wider">Itemized Cost Breakdown</h4>
          </div>
          <div className="divide-y divide-border">
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Base Freight Tariff</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.baseFreight)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Fuel Surcharge (FSC)</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.fuelSurcharge)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Commodity Risk Adjustment</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.commodityAdjustment)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">NHAI Toll Charges</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.tolls)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">First-Mile Pickup Feeder Leg</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.pickupLastMile)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Last-Mile Delivery Feeder Leg</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.deliveryLastMile)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">State Entry Permits / Transit Taxes</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.entryTax)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Marine / Transit Cargo Insurance</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.insurance)}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-fg-muted">Documentation, Waybills & Port Fees</span>
              <span className="font-mono text-fg font-medium">{formatINR(quote.breakdown.documentation)}</span>
            </div>
            <div className="flex justify-between px-6 py-4 bg-accent-soft/20 text-sm font-semibold">
              <span className="text-fg">Estimated Invoice Total (Excl. GST)</span>
              <span className="font-mono text-accent text-lg">{formatINR(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Benchmark & Actions (Right 1 col) */}
        <div className="space-y-6">
          {/* Competitor Sourcing Benchmarks */}
          {benchmark && (
            <div className="bg-bg-elevated border border-border p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span className="text-xs uppercase font-bold text-fg-muted tracking-wider">Market Benchmarking</span>
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between text-fg-muted">
                    <span>Market Average Rate:</span>
                    <span className="font-mono">{formatINR(benchmark.average)}</span>
                  </div>
                  {/* Progress comparisons */}
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-fg-muted h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex justify-between text-accent font-semibold">
                    <span>Our Quote:</span>
                    <span className="font-mono">{formatINR(quote.total)}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-accent h-1.5 rounded-full"
                      style={{ width: `${(quote.total / benchmark.average) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-success/10 border border-success/20 p-3 rounded-lg text-xs text-success font-medium text-center">
                Estimated Savings: {formatINR(benchmark.savingsVsAverage)} ({Math.round((benchmark.savingsVsAverage / benchmark.average) * 100)}% lower)
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="bg-bg-elevated border border-border p-5 rounded-xl space-y-3">
            <span className="text-xs uppercase font-bold text-fg-muted tracking-wider block mb-2">Export Formats</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer text-fg"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF Report
              </button>
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer text-fg"
              >
                <Download className="w-3.5 h-3.5" />
                Excel (.xls)
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer text-fg"
              >
                <Download className="w-3.5 h-3.5" />
                CSV Table
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer text-fg"
              >
                <Download className="w-3.5 h-3.5" />
                JSON Raw
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toll Plazas lists (Road FTL only) */}
      {quote.mode === 'road' && quote.tollPlazas && quote.tollPlazas.length > 0 && (
        <div className="bg-bg-elevated border border-border rounded-xl overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-border bg-bg/50">
            <h4 className="text-sm font-bold text-fg uppercase tracking-wider">NHAI Route Toll Plazas ({quote.tollPlazas.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-border">
              <thead className="bg-bg/20 text-xs text-fg-muted font-bold uppercase">
                <tr>
                  <th className="px-6 py-3">Plaza Name</th>
                  <th className="px-6 py-3">National Highway</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3 text-right">Toll Tariff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {quote.tollPlazas.map((p, idx) => (
                  <tr key={idx} className="hover:bg-bg/10 text-fg-muted hover:text-fg">
                    <td className="px-6 py-3 font-sans font-medium">{p.name}</td>
                    <td className="px-6 py-3">{p.nhNumber}</td>
                    <td className="px-6 py-3">{p.state}</td>
                    <td className="px-6 py-3 text-right text-fg">{formatINR(p.tollAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
