"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Globe, LogOut, Bell, Command, Palette
} from "lucide-react";
import { useStore, AppTheme } from "@/lib/store";
import ControlPanel from "./ControlPanel";
import LiveIntelligence from "./LiveIntelligence";
import ContextIntelligence from "./ContextIntelligence";
import { QuoteResponse } from "@/lib/api/contracts";

export function CalculateClientWrapper() {
  const router = useRouter();
  
  // Zustand store bindings
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const notifications = useStore((state) => state.notifications);
  const addNotification = useStore((state) => state.addNotification);

  // Authenticate check
  const [isAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return document.cookie.split(";").some((item) => item.trim().startsWith("auth="));
    }
    return false;
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleSignOut = () => {
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    useStore.getState().logout();
    router.push("/login");
  };

  // --- STATE SYSTEM ---
  const [originPincode, setOriginPincode] = useState("400001");
  const [destPincode, setDestPincode] = useState("110001");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [originName, setOriginName] = useState("Mumbai");
  const [destName, setDestName] = useState("Delhi");

  const [weight, setWeight] = useState("10000");
  const [weightUnit, setWeightUnit] = useState<"kg" | "MT" | "LB">("kg");
  const [commodityCode, setCommodityCode] = useState("general");

  // Advanced drawer variables
  const [vehicleAxles, setVehicleAxles] = useState<"2" | "3" | "4-6" | "Auto">("Auto");
  const [containerType, setContainerType] = useState<"20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto">("Auto");
  const [incoterm, setIncoterm] = useState("EXW");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [cargoValue, setCargoValue] = useState("");
  const [dangerousGoods, setDangerousGoods] = useState({ isDG: false, unClass: "none", packingGroup: "PGIII" });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Run stage control
  const [loadingStage, setLoadingStage] = useState<"idle" | "calculating_tolls" | "fetching_rates" | "benchmarking">("idle");
  const [activeMode, setActiveMode] = useState<string>("road");
  const [results, setResults] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Header UI details
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);

  // Sync initial pincode coordinates on mount
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res1 = await fetch(`/api/pincodes?q=${originPincode}`);
        const d1 = await res1.json();
        interface PincodeRecord {
          pincode: string;
          lat: number;
          lon: number;
          district: string;
          state: string;
        }
        const m1 = d1.results?.find((item: PincodeRecord) => item.pincode === originPincode);
        if (m1) {
          setOriginCoords({ lat: m1.lat, lon: m1.lon });
          setOriginName(`${m1.district}, ${m1.state}`);
        }

        const res2 = await fetch(`/api/pincodes?q=${destPincode}`);
        const d2 = await res2.json();
        const m2 = d2.results?.find((item: PincodeRecord) => item.pincode === destPincode);
        if (m2) {
          setDestCoords({ lat: m2.lat, lon: m2.lon });
          setDestName(`${m2.district}, ${m2.state}`);
        }
      } catch (err) {
        console.error("Initial pincode coordinate lookup failed:", err);
      }
    };
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update body tag theme property when theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Execute Analysis
  const runAnalysis = useCallback(async () => {
    if (!originPincode || !destPincode) {
      setError("Origin and Destination pincodes are required.");
      return;
    }

    setError(null);
    setResults(null);

    // Sequence stages
    setLoadingStage("calculating_tolls");
    await new Promise((r) => setTimeout(r, 700));

    setLoadingStage("fetching_rates");
    await new Promise((r) => setTimeout(r, 700));

    setLoadingStage("benchmarking");
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Calculate weight in kg for the API
      let weightKg = parseFloat(weight) || 10000;
      if (weightUnit === "MT") weightKg = weightKg * 1000;
      else if (weightUnit === "LB") weightKg = weightKg / 2.20462;

      const payload = {
        originPincode,
        destPincode,
        weightKg,
        commodity: commodityCode,
        vehicleType: vehicleAxles === "Auto" ? "40T" : vehicleAxles === "2" ? "16T" : "25T",
        containerType: containerType === "Auto" ? undefined : containerType,
        incoterm,
        valueInr: cargoValue ? parseFloat(cargoValue) : undefined,
        dimensions: (dimensions.length && dimensions.width && dimensions.height) ? {
          length: parseFloat(dimensions.length),
          width: parseFloat(dimensions.width),
          height: parseFloat(dimensions.height)
        } : undefined
      };

      const res = await fetch("/api/quote?mode=all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Analysis calculation failed.");
      }

      setResults(data);
      addNotification(
        "Calculation Complete",
        `Calculated lane ${originPincode} to ${destPincode} successfully.`
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during execution.";
      setError(errMsg);
    } finally {
      setLoadingStage("idle");
    }
  }, [originPincode, destPincode, weight, weightUnit, commodityCode, vehicleAxles, containerType, incoterm, dimensions, cargoValue, addNotification]);

  // Keyboard Shortcuts (Cmd+Enter, 1-5, ?, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      // Cmd+Enter -> Run analysis
      if (isCmdOrCtrl && e.key === "Enter") {
        e.preventDefault();
        runAnalysis();
      }

      // Escape -> close drawer and dropdowns
      if (e.key === "Escape") {
        setAdvancedOpen(false);
        setThemeOpen(false);
        setNotifOpen(false);
        setCmdKOpen(false);
      }

      // Mode bindings (1-5) when not focused in input fields
      const activeTag = document.activeElement?.tagName;
      if (activeTag !== "INPUT" && activeTag !== "SELECT" && activeTag !== "TEXTAREA") {
        if (e.key === "1") setActiveMode("road");
        else if (e.key === "2") setActiveMode("air");
        else if (e.key === "3") setActiveMode("sea");
        else if (e.key === "4") setActiveMode("rail");
        
        if (e.key === "?") {
          e.preventDefault();
          setShowHelp((prev) => !prev);
        }

        // Cmd+K -> open search command panel
        if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
          e.preventDefault();
          setCmdKOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runAnalysis]);

  const themes: AppTheme[] = [
    "dark", "light", "cyberpunk", "matrix", "nord", "dracula",
    "synthwave", "solarized", "retro", "forest", "sunset", "slate"
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-400">
      
      {/* 56px Fixed Header */}
      <header className="h-[56px] border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 select-none">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-cyan flex items-center justify-center text-black shadow-lg shadow-cyan-500/20 animate-pulse-slow">
            <Globe className="w-4.5 h-4.5 animate-spin-slow" />
          </div>
          <div>
            <span className="font-bold text-xs uppercase tracking-widest text-white">Antigravity</span>
            <span className="text-[8px] font-mono text-cyan-400 block -mt-0.5">FREIGHT INSTRUMENT PANEL</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setCmdKOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
        >
          <Command className="w-3.5 h-3.5" />
          <span>Search command palette</span>
          <kbd className="bg-white/5 px-1 py-0.5 rounded border border-white/5 text-[8px]">⌘K</kbd>
        </button>

        {/* Right Side: Options (Theme, Notification, User) */}
        <div className="flex items-center gap-3">
          
          {/* Theme Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen(!themeOpen)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white cursor-pointer"
              title="Switch Theme"
            >
              <Palette className="w-4 h-4" />
            </button>
            
            {themeOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-white/5 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                {themes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTheme(t);
                      setThemeOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-[9px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                      theme === t
                        ? "bg-cyan-400/10 text-cyan-400"
                        : "text-slate-500 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-white/5 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl space-y-1">
                <div className="px-2 py-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1.5">
                  Notification Hub
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-none pt-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 bg-white/[0.01] rounded-lg border border-white/5 space-y-0.5">
                      <p className="text-[9px] font-bold text-white">{n.title}</p>
                      <p className="text-[8px] text-slate-500 leading-tight">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-6 text-center text-[9px] text-slate-600 font-mono">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all text-[10px] uppercase font-bold tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid Container layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-[30%_46%_24%] gap-6 overflow-hidden">
        
        {/* Zone 1: Control Panel (30%, sticky) */}
        <div className="lg:sticky lg:top-20 h-fit">
          <ControlPanel
            originPincode={originPincode}
            setOriginPincode={setOriginPincode}
            onSelectOriginCoords={setOriginCoords}
            destPincode={destPincode}
            setDestPincode={setDestPincode}
            onSelectDestCoords={setDestCoords}
            weight={weight}
            setWeight={setWeight}
            weightUnit={weightUnit}
            setWeightUnit={setWeightUnit}
            commodityCode={commodityCode}
            setCommodityCode={setCommodityCode}
            vehicleAxles={vehicleAxles}
            setVehicleAxles={setVehicleAxles}
            containerType={containerType}
            setContainerType={setContainerType}
            incoterm={incoterm}
            setIncoterm={setIncoterm}
            dimensions={dimensions}
            setDimensions={setDimensions}
            cargoValue={cargoValue}
            setCargoValue={setCargoValue}
            dangerousGoods={dangerousGoods}
            setDangerousGoods={setDangerousGoods}
            advancedOpen={advancedOpen}
            setAdvancedOpen={setAdvancedOpen}
            loadingStage={loadingStage}
            runAnalysis={runAnalysis}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
          />
        </div>

        {/* Zone 2: Live Intelligence (46%, scrollable) */}
        <div className="scrollbar-none overflow-y-auto space-y-6">
          <LiveIntelligence
            loadingStage={loadingStage}
            results={results}
            error={error}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            originPincode={originPincode}
            destPincode={destPincode}
            weight={weight}
            weightUnit={weightUnit}
            commodityCode={commodityCode}
            vehicleAxles={vehicleAxles}
            containerType={containerType}
            incoterm={incoterm}
            originCoords={originCoords}
            destCoords={destCoords}
            originName={originName}
            destName={destName}
          />
        </div>

        {/* Zone 3: Context Intelligence (24%, sticky) */}
        <div className="lg:sticky lg:top-20 h-fit">
          <ContextIntelligence
            results={results}
            activeMode={activeMode}
            weight={weight}
            commodityCode={commodityCode}
            originPincode={originPincode}
            destPincode={destPincode}
          />
        </div>
      </main>

      {/* 2. Command Palette Modal (Ctrl+K) */}
      {cmdKOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-neutral-950 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Command className="w-4 h-4 text-cyan-400" />
                System Command Palette
              </span>
              <button
                type="button"
                onClick={() => setCmdKOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                X
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="Search commands (e.g. Calculate, Theme matrix, Sign out)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="max-h-48 overflow-y-auto space-y-1 pt-2 font-mono text-[9px] text-slate-400">
                <button
                  type="button"
                  onClick={() => { runAnalysis(); setCmdKOpen(false); }}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg text-left"
                >
                  <span>&gt; RUN INSTRUMENT ANALYSIS</span>
                  <span className="text-cyan-400">Ctrl + Enter</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setTheme("matrix"); setCmdKOpen(false); }}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg text-left"
                >
                  <span>&gt; SET THEME: MATRIX</span>
                  <span></span>
                </button>
                <button
                  type="button"
                  onClick={() => { handleSignOut(); setCmdKOpen(false); }}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg text-left text-rose-400"
                >
                  <span>&gt; SIGN OUT SESSION</span>
                  <span></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
