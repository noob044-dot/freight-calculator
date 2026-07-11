/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, TrendingUp, DollarSign, Activity, 
  Map, Calendar, BarChart3, FileSpreadsheet, AlertCircle, 
  ArrowRight, ShieldAlert, Check, HelpCircle, Loader2, ArrowLeftRight
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';

interface HeatmapLane {
  originState: string;
  destState: string;
  volume: number;
  avgRate: number;
  competitorAvg: number;
}

interface MonthlyTrend {
  month: string;
  road: number;
  air: number;
  rail: number;
  sea: number;
  volume: number;
  avgRate: number;
  competitorRate: number;
}

interface WaterfallItem {
  name: string;
  value: number;
  display: number;
}

interface ShareTrend {
  month: string;
  forwarderShare: number;
  platformShare: number;
}

interface CommodityProfitability {
  commodity: string;
  shipments: number;
  revenue: number;
  cost: number;
  marginAmount: number;
  marginPercent: number;
}

interface ForwarderStat {
  id: string;
  name: string;
  totalBids: number;
  wins: number;
  winRate: number;
  avgSlaMins: number;
  rating: number;
}

interface SystemAlert {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

interface SummaryStats {
  totalShipments: number;
  totalFreightCosts: number;
  platformCommissionRevenue: number;
  platformLeadGenRevenue: number;
  platformTotalIncome: number;
  totalSavings: number;
}

const STATES = ['MAHARASHTRA', 'DELHI', 'GUJARAT', 'KARNATAKA', 'TAMIL NADU', 'WEST BENGAL'];
const MODES = [
  { value: 'road', label: 'Road Freight' },
  { value: 'air', label: 'Air Freight' },
  { value: 'rail', label: 'Rail Freight' },
  { value: 'sea', label: 'Sea Freight' }
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'lanes' | 'margins' | 'predict' | 'internal'>('lanes');
  const [loading, setLoading] = useState(true);

  // States for API Data
  const [laneData, setLaneData] = useState<{ heatmap: HeatmapLane[]; trends: MonthlyTrend[] } | null>(null);
  const [marginData, setMarginData] = useState<{ waterfall: WaterfallItem[]; shareTrends: ShareTrend[]; commodityProfitability: CommodityProfitability[] } | null>(null);
  const [internalData, setInternalData] = useState<{ summary: SummaryStats; forwarderStats: ForwarderStat[]; alerts: SystemAlert[] } | null>(null);

  // Interactive Scenario Slider Parameters (updates prediction instantly)
  const [originState, setOriginState] = useState('MAHARASHTRA');
  const [destState, setDestState] = useState('DELHI');
  const [mode, setMode] = useState('road');
  const [weightKg, setWeightKg] = useState(5000);
  const [month, setMonth] = useState(6);

  const [predLoading, setPredLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{
    prediction: {
      lane: string;
      mode: string;
      weightKg: number;
      predictedPrice: number;
      confidenceLower: number;
      confidenceUpper: number;
      standardError: number;
      laneMatched: boolean;
      monthName: string;
      seasonMultiplier: number;
    };
    recommendation: {
      bestMonth: string;
      bestPrice: number;
      potentialSavingsPercent: number;
      message: string;
    };
    projection: { month: string; rate: number; lower: number; upper: number }[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeader = 'Basic ' + btoa('admin:admin123');
      const [lanesRes, marginsRes, internalRes] = await Promise.all([
        fetch('/api/analytics/lanes', { headers: { Authorization: authHeader } }),
        fetch('/api/analytics/margins', { headers: { Authorization: authHeader } }),
        fetch('/api/analytics/internal', { headers: { Authorization: authHeader } })
      ]);

      const lanes = await lanesRes.json();
      const margins = await marginsRes.json();
      const internal = await internalRes.json();

      if (lanes.success) setLaneData(lanes);
      if (margins.success) setMarginData(margins);
      if (internal.success) setInternalData(internal);
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update linear regression pricing output on slider / parameters shift
  useEffect(() => {
    const fetchPrediction = async () => {
      setPredLoading(true);
      try {
        const authHeader = 'Basic ' + btoa('admin:admin123');
        const query = new URLSearchParams({
          originState,
          destState,
          mode,
          weightKg: weightKg.toString(),
          month: month.toString()
        }).toString();

        const res = await fetch(`/api/analytics/predict?${query}`, { headers: { Authorization: authHeader } });
        const data = await res.json();
        if (data.success) {
          setPredictionResult(data);
        }
      } catch (err) {
        console.error('Prediction failed', err);
      } finally {
        setPredLoading(false);
      }
    };

    fetchPrediction();
  }, [originState, destState, mode, weightKg, month]);

  // Excel multi-sheet download helper
  const handleExcelExport = () => {
    if (!internalData || !laneData || !marginData) return;

    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ['Freight Analytics Platform - Executive Summary'],
      [],
      ['Metric', 'Value'],
      ['Total Shipments Managed', internalData.summary.totalShipments],
      ['Total Freight Cost Payout (INR)', internalData.summary.totalFreightCosts],
      ['Platform Commission Revenue (INR)', internalData.summary.platformCommissionRevenue],
      ['Platform LeadGen Invoice Revenue (INR)', internalData.summary.platformLeadGenRevenue],
      ['Total Platform Gross Income (INR)', internalData.summary.platformTotalIncome],
      ['Total Shipper Cost Savings vs Market (INR)', internalData.summary.totalSavings]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    const laneHeaders = ['Origin State', 'Destination State', 'Volume (Shipments)', 'Avg Rate (INR)', 'Market Benchmark (INR)'];
    const laneRows = laneData.heatmap.map(l => [
      l.originState,
      l.destState,
      l.volume,
      l.avgRate,
      l.competitorAvg
    ]);
    const wsLanes = XLSX.utils.aoa_to_sheet([laneHeaders, ...laneRows]);
    XLSX.utils.book_append_sheet(wb, wsLanes, 'Lane Volume Heatmap');

    const marginHeaders = ['Commodity Type', 'Shipments Count', 'Total Cost (INR)', 'Total Revenue (INR)', 'Platform Markup (INR)', 'Margin %'];
    const marginRows = marginData.commodityProfitability.map(c => [
      c.commodity,
      c.shipments,
      c.cost,
      c.revenue,
      c.marginAmount,
      c.marginPercent
    ]);
    const wsMargins = XLSX.utils.aoa_to_sheet([marginHeaders, ...marginRows]);
    XLSX.utils.book_append_sheet(wb, wsMargins, 'Margin Analysis');

    const fwdHeaders = ['Forwarder Name', 'Total Bids Placed', 'Wins (Accepted)', 'Bid Win Rate %', 'Response SLA (mins)', 'Rating'];
    const fwdRows = internalData.forwarderStats.map(f => [
      f.name,
      f.totalBids,
      f.wins,
      f.winRate,
      f.avgSlaMins,
      f.rating
    ]);
    const wsFwd = XLSX.utils.aoa_to_sheet([fwdHeaders, ...fwdRows]);
    XLSX.utils.book_append_sheet(wb, wsFwd, 'Forwarder Performance');

    XLSX.writeFile(wb, 'Freight_Marketplace_Analytics.xlsx');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Loading Analytics ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-12 overflow-hidden">
      
      {/* Top Navbar Header */}
      <nav className="border-b border-white/5 bg-[#030712]/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-xs uppercase text-white">Marketplace Portal</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
                Marketplace Dashboard
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 border-b-2 border-cyan-400 py-5">
                Analytics & BI
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-8">
        
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Analytics & Business Intelligence</h1>
            <p className="text-xs text-slate-400">OLS linear regression modeling, corridor volume heatmaps, and margins waterfalls.</p>
          </div>
          {activeTab === 'internal' && (
            <button
              onClick={handleExcelExport}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel (SheetJS)
            </button>
          )}
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-white/5 mb-8 overflow-x-auto gap-2">
          {[
            { id: 'lanes', label: 'Corridor Heatmap', icon: Map },
            { id: 'margins', label: 'Margin Waterfall', icon: DollarSign },
            { id: 'predict', label: 'Predictive Projections', icon: TrendingUp },
            { id: 'internal', label: 'Platform Summary', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'lanes' | 'margins' | 'predict' | 'internal')}
                className={`flex items-center gap-2 pb-3 px-4 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  isActive ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Corridor Heatmap */}
        {activeTab === 'lanes' && laneData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Heatmap Grid */}
              <div className="bg-glass rounded-organic-1 p-6 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Trade Volume Heatmap (Top Lanes)</h3>
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {laneData.heatmap.map((l, idx) => {
                    const volumeIntensity = l.volume > 15 ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : l.volume > 5 ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-white/[0.01] border-white/5 text-slate-400';
                    return (
                      <div key={idx} className={`flex items-center justify-between p-3 border rounded-xl ${volumeIntensity} transition-all`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider font-mono">{l.originState}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                          <span className="text-[10px] font-bold tracking-wider font-mono">{l.destState}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono">
                          <span>Volume: <strong className="text-white">{l.volume} loads</strong></span>
                          <span>Avg Rate: <strong className="text-white">₹{l.avgRate.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mode Rate Trends */}
              <div className="bg-glass rounded-organic-2 p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Mode Pricing Trends (Monthly Average)</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={laneData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="road" name="Road" stroke="#22d3ee" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="air" name="Air" stroke="#ec4899" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="rail" name="Rail" stroke="#10b981" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="sea" name="Sea" stroke="#f59e0b" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Benchmarks vs Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="bg-glass rounded-organic-3 p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform vs Competitor Benchmark</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={laneData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                      />
                      <Legend />
                      <Bar dataKey="avgRate" name="Platform Cost (INR)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="competitorRate" name="Competitor Benchmark (INR)" fill="#dc2626" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-glass rounded-organic-1 p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Seasonal Volumes (Total Shipments)</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={laneData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }} />
                      <Legend />
                      <Area type="monotone" dataKey="volume" name="Shipments" stroke="#10b981" fill="rgba(16,185,129,0.08)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Margin Waterfall */}
        {activeTab === 'margins' && marginData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Waterfall chart */}
              <div className="bg-glass rounded-organic-2 p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Quote Waterfall Analysis (Average Build-up)</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginData.waterfall} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                      />
                      <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]}>
                        {marginData.waterfall.map((entry, index) => {
                          const colors = ['#10b981', '#6366f1', '#22d3ee'];
                          return <Bar key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Commission Share stacked bar */}
              <div className="bg-glass rounded-organic-3 p-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Margin Contribution Share</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginData.shareTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                      <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                      />
                      <Legend />
                      <Bar dataKey="forwarderShare" name="Forwarder Payout" fill="#6366f1" stackId="a" />
                      <Bar dataKey="platformShare" name="Platform Margin" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Commodity Profitability Table */}
            <div className="bg-glass rounded-organic-1 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Commodity Margin Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Commodity Class</th>
                      <th className="py-3 px-4 text-center">Shipments</th>
                      <th className="py-3 px-4 text-right">Carrier Payout</th>
                      <th className="py-3 px-4 text-right">Gross revenue</th>
                      <th className="py-3 px-4 text-right">Platform margin</th>
                      <th className="py-3 px-4 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marginData.commodityProfitability.map((c, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-bold text-white">{c.commodity}</td>
                        <td className="py-3 px-4 text-center font-mono">{c.shipments}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{c.cost.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{c.revenue.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">+₹{c.marginAmount.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px]">
                            {c.marginPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Predictive Pricing (Scenario Sliders) */}
        {activeTab === 'predict' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* LEFT (1 col): Interactive Scenario Sliders */}
            <div className="lg:col-span-1 bg-glass rounded-organic-2 p-6 space-y-6 h-fit">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Model parameters</h3>
                <p className="text-[10px] text-slate-400">OLS regression scenario adjustments</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Origin State</label>
                  <select
                    value={originState}
                    onChange={(e) => setOriginState(e.target.value)}
                    className="w-full bg-[#020617] border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-cyan-400"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Destination State</label>
                  <select
                    value={destState}
                    onChange={(e) => setDestState(e.target.value)}
                    className="w-full bg-[#020617] border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-cyan-400"
                  >
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Transport Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-[#020617] border border-white/5 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-cyan-400"
                  >
                    {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>

                {/* Weight slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Cargo Weight</span>
                    <span className="font-mono text-cyan-400 font-bold">{weightKg.toLocaleString('en-IN')} kg</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="40000"
                    step="500"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Month slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Shipping Month</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

              </div>
            </div>

            {/* RIGHT (2 cols): Regression Plots & Recommendations */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
              
              {predictionResult && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Prediction Output */}
                    <div className="bg-glass rounded-organic-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">
                          <Activity className="w-4 h-4" />
                          OLS regression rate
                        </div>
                        <h2 className="text-3xl font-extrabold text-white font-mono leading-none">
                          INR {predictionResult.prediction.predictedPrice.toLocaleString('en-IN')}
                        </h2>
                        <div className="text-[10px] text-slate-500 font-mono mt-2">
                          95% Confidence Bounds: <span className="text-slate-300">INR {predictionResult.prediction.confidenceLower.toLocaleString('en-IN')} - {predictionResult.prediction.confidenceUpper.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono flex flex-col gap-1">
                        <div>Standard error: <strong className="text-slate-400">INR {predictionResult.prediction.standardError.toLocaleString('en-IN')}</strong></div>
                        <div>Lane parameter fit: <strong className="text-slate-400">{predictionResult.prediction.laneMatched ? 'Matched rate-card parameters' : 'Estimated OLS average'}</strong></div>
                      </div>
                    </div>

                    {/* recommendation Strategy */}
                    <div className="bg-glass rounded-organic-3 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">
                          <Check className="w-4 h-4" />
                          Off-Peak Strategy
                        </div>
                        <h2 className="text-xl font-bold text-white leading-tight">
                          Ship in {predictionResult.recommendation.bestMonth}
                        </h2>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {predictionResult.recommendation.message}
                        </p>
                      </div>

                      {predictionResult.recommendation.potentialSavingsPercent > 0 && (
                        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-center py-2 rounded-xl text-[9px] uppercase tracking-wider">
                          Saves up to {predictionResult.recommendation.potentialSavingsPercent}% cost
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 12-Month pricing projection chart */}
                  <div className="bg-glass rounded-organic-2 p-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">12-Month pricing projection (with 95% Confidence Bounds)</h3>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={predictionResult.projection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                          <YAxis stroke="#475569" fontSize={10} tickFormatter={(v) => `₹${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.05)', color: '#f8fafc' }}
                            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="lower" stroke="none" fill="rgba(34,165,233,0.06)" connectNulls />
                          <Area type="monotone" dataKey="upper" name="95% Confidence Bounds" stroke="none" fill="rgba(34,165,233,0.06)" />
                          <Line type="monotone" dataKey="rate" name="Projected Rate (INR)" stroke="#22d3ee" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        )}

        {/* Tab 4: Platform Summary (Uncle's Dashboard) */}
        {activeTab === 'internal' && internalData && (
          <div className="space-y-8">
            
            {/* System Alerts */}
            <div className="space-y-3">
              {internalData.alerts.map((alert, idx) => {
                const typeStyles = alert.type === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : alert.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                
                return (
                  <div key={idx} className={`flex items-start gap-3 p-4 border rounded-xl ${typeStyles} transition-all`}>
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-[10px] uppercase tracking-widest">{alert.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform summary counters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-glass rounded-organic-1 p-6">
                <div className="flex items-center justify-between text-slate-500 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Shipments</span>
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-white font-mono mb-1">{internalData.summary.totalShipments}</h2>
                <div className="text-[9px] text-slate-500 font-mono">Managed shipments overall</div>
              </div>

              <div className="bg-glass rounded-organic-2 p-6">
                <div className="flex items-center justify-between text-slate-500 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Freight Payout</span>
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-white font-mono mb-1">
                  ₹{internalData.summary.totalFreightCosts.toLocaleString('en-IN')}
                </h2>
                <div className="text-[9px] text-slate-500 font-mono">Carrier payout transactions</div>
              </div>

              <div className="bg-glass rounded-organic-3 p-6">
                <div className="flex items-center justify-between text-slate-500 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Platform Revenue</span>
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-white font-mono mb-1">
                  ₹{internalData.summary.platformTotalIncome.toLocaleString('en-IN')}
                </h2>
                <div className="text-[9px] text-slate-500 font-mono">Commission markup + Invoices</div>
              </div>

              <div className="bg-glass rounded-organic-1 p-6">
                <div className="flex items-center justify-between text-slate-500 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Shipper Savings</span>
                  <Check className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-400 font-mono mb-1">
                  ₹{internalData.summary.totalSavings.toLocaleString('en-IN')}
                </h2>
                <div className="text-[9px] text-slate-500 font-mono">Saved vs competitor benchmarks</div>
              </div>

            </div>

            {/* Forwarder Leaderboard */}
            <div className="bg-glass rounded-organic-2 p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Logistics Partner Rankings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Partner</th>
                      <th className="py-3 px-4 text-center">Bids Placed</th>
                      <th className="py-3 px-4 text-center">Wins</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">Avg Response SLA</th>
                      <th className="py-3 px-4 text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalData.forwarderStats.map((f, idx) => (
                      <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <span className="bg-white/5 text-slate-400 w-5 h-5 flex items-center justify-center rounded font-mono font-bold text-[9px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-white">{f.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{f.totalBids}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{f.wins}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-white/5 h-1.5 rounded overflow-hidden">
                              <div className="bg-gradient-accent h-full" style={{ width: `${f.winRate}%` }}></div>
                            </div>
                            <span className="font-mono text-[9px] font-bold">{f.winRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{f.avgSlaMins} mins</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-500">★ {f.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
