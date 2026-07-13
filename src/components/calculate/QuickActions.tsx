"use client";

import React, { useState } from "react";
import { 
  Send, Bookmark, Clock, Network, X, Check, Loader2, Sparkles, Bell 
} from "lucide-react";
import { mockDb } from "@/mock/db";
import { useStore } from "@/lib/store";
import { QuoteResponse } from "@/lib/api/contracts";

interface QuickActionsProps {
  results: QuoteResponse | null;
  activeMode: string;
  weight: string;
  commodityCode: string;
  originPincode: string;
  destPincode: string;
}

export default function QuickActions({
  results,
  activeMode,
  weight,
  commodityCode,
  originPincode,
  destPincode
}: QuickActionsProps) {
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  // Form states for shipment creation
  const [shipperName, setShipperName] = useState("");
  const [shipperEmail, setShipperEmail] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [shipperCompany, setShipperCompany] = useState("");
  const [urgency, setUrgency] = useState<"high" | "medium" | "low">("medium");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Scheduler states
  const [cronInterval, setCronInterval] = useState("daily");
  const [alertThreshold, setAlertThreshold] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!results) return;

    setSubmitting(true);
    setSuccessMsg(null);

    try {
      const quote = results.quotes[activeMode];
      const calculatedCost = quote && !("error" in quote) ? (quote.total + Math.round(quote.total * 0.18)) : 0;

      // Extract road quote details for state lookups
      const roadQuote = results.quotes.road;
      const hasRoad = roadQuote && !("error" in roadQuote);
      const tollPlazas = hasRoad ? (roadQuote.tollPlazas || []) : [];

      const originState = tollPlazas[0]?.state || "Maharashtra";
      const destState = tollPlazas[tollPlazas.length - 1]?.state || "Delhi";

      // Write to mockDb
      const newLead = mockDb.leads.create({
        name: shipperName || "Corporate Request",
        email: shipperEmail || "shipper@example.com",
        phone: shipperPhone || "+91 9999999999",
        company: shipperCompany || "Industrial Logistics Ltd",
        monthlyVolume: "10-50 shipments",
        originPincode: originPincode,
        destPincode: destPincode,
        originState,
        destState,
        weightKg: parseFloat(weight) || 10000,
        commodity: commodityCode,
        mode: activeMode as "road" | "air" | "sea" | "rail",
        calculatedCost,
        urgency,
        isHot: urgency === "high",
        status: "New"
      });

      // Synchronize state in store
      useStore.getState().syncLeads();
      useStore.getState().addNotification(
        "Shipment Request Created",
        `Bidding request ${newLead.id} for lane ${originPincode} to ${destPincode} is active.`
      );

      setSuccessMsg(`Shipment provisioned: ${newLead.id}`);
      setTimeout(() => {
        setSlideOverOpen(false);
        setSuccessMsg(null);
        setShipperName("");
        setShipperEmail("");
        setShipperPhone("");
        setShipperCompany("");
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLane = () => {
    if (!results) return;
    const key = "saved_lanes";
    const existing = localStorage.getItem(key);
    let list = [];
    if (existing) {
      try {
        list = JSON.parse(existing);
      } catch {
        list = [];
      }
    }

    const quote = results.quotes[activeMode];
    const costVal = quote && !("error" in quote) ? (quote.total + Math.round(quote.total * 0.18)) : 0;

    const item = {
      id: `lane-${Date.now()}`,
      origin: originPincode,
      destination: destPincode,
      mode: activeMode,
      weight,
      commodity: commodityCode,
      cost: costVal,
      timestamp: new Date().toISOString()
    };

    list.push(item);
    localStorage.setItem(key, JSON.stringify(list));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleScheduleRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!results) return;

    let cronStr = "0 8 * * *"; // daily at 8am default
    if (cronInterval === "weekly") cronStr = "0 8 * * 1"; // weekly Mondays
    else if (cronInterval === "monthly") cronStr = "0 8 1 * *"; // monthly 1st

    const key = "scheduled_queries";
    const existing = localStorage.getItem(key);
    let list = [];
    if (existing) {
      try { list = JSON.parse(existing); } catch { list = []; }
    }

    list.push({
      id: `cron-${Date.now()}`,
      origin: originPincode,
      destination: destPincode,
      mode: activeMode,
      cron: cronStr,
      interval: cronInterval,
      threshold: alertThreshold ? Number(alertThreshold) : undefined,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem(key, JSON.stringify(list));

    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
      setSchedulerOpen(false);
      setAlertThreshold("");
    }, 1500);
  };

  return (
    <div className="space-y-3 bg-neutral-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Quick Action Center
      </h3>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
        {/* Create Shipment */}
        <button
          type="button"
          disabled={!results}
          onClick={() => setSlideOverOpen(true)}
          className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400/20 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Send className="w-3.5 h-3.5" />
          Create Shipment
        </button>

        {/* Save Lane */}
        <button
          type="button"
          disabled={!results}
          onClick={handleSaveLane}
          className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          {saved ? "Lane Saved" : "Bookmark Lane"}
        </button>

        {/* Schedule Audit */}
        <button
          type="button"
          disabled={!results}
          onClick={() => setSchedulerOpen(true)}
          className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <Clock className="w-3.5 h-3.5" />
          Schedule Audit
        </button>

        {/* Compare Network */}
        <a
          href="/dashboard"
          className="flex items-center justify-center gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <Network className="w-3.5 h-3.5" />
          Compare Network
        </a>
      </div>

      {/* 1. Create Shipment Slide-Over */}
      {slideOverOpen && results && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-950 border-l border-white/10 h-full p-6 flex flex-col justify-between shadow-2xl animate-slideIn">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Book shipment route</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSlideOverOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl font-mono text-[9px] text-slate-400 space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">ROUTE:</span><span>{originPincode} ➔ {destPincode}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">MODE:</span><span>{activeMode.toUpperCase()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">WEIGHT:</span><span>{weight} kg</span></div>
                  {(() => {
                    const quote = results.quotes[activeMode];
                    const hasQuote = quote && !("error" in quote);
                    const totalCost = hasQuote ? (quote.total + Math.round(quote.total * 0.18)) : 0;
                    return (
                      <div className="flex justify-between">
                        <span className="text-slate-500">EST. RATE:</span>
                        <span className="text-cyan-400">₹{totalCost.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Contact Name"
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Corporate Email"
                    value={shipperEmail}
                    onChange={(e) => setShipperEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Corporate Phone"
                    value={shipperPhone}
                    onChange={(e) => setShipperPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Company Name"
                    value={shipperCompany}
                    onChange={(e) => setShipperCompany(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />

                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Transit Urgency</span>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as "high" | "medium" | "low")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    >
                      <option value="low" className="bg-neutral-950">Low (Standard Dispatch)</option>
                      <option value="medium" className="bg-neutral-950">Medium (Express Delivery)</option>
                      <option value="high" className="bg-neutral-950">High (Immediate Hot Run)</option>
                    </select>
                  </div>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-102 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 fill-black" />}
                  Confirm & Send Bids Request
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Schedule Recurring Audit Modal */}
      {schedulerOpen && results && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-sm bg-neutral-950 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="w-4 h-4 text-cyan-400" />
                Schedule Recurring Audit
              </span>
              <button
                type="button"
                onClick={() => setSchedulerOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleRecurring} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Audit Frequency</span>
                <select
                  value={cronInterval}
                  onChange={(e) => setCronInterval(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="daily" className="bg-neutral-950">Daily (At 8:00 AM)</option>
                  <option value="weekly" className="bg-neutral-950">Weekly (Mondays at 8:00 AM)</option>
                  <option value="monthly" className="bg-neutral-950">Monthly (1st at 8:00 AM)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Bell className="w-3 h-3 text-amber-400 animate-bounce" />
                  Alert Threshold Rate (INR)
                </span>
                <input
                  type="number"
                  placeholder="e.g. 24000 (Trigger if pricing drops below)"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {scheduleSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono rounded-xl flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  Audit Job Scheduled!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-400 text-black font-bold text-[10px] uppercase tracking-wider rounded-xl hover:scale-102 transition-all cursor-pointer"
              >
                Activate Automated Audit
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
