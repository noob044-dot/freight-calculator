"use client";

import React, { useMemo } from "react";
import { Play, Loader2, HelpCircle } from "lucide-react";
import { PincodeAutocomplete } from "@/components/PincodeAutocomplete";
import { SearchableCommodity } from "@/components/SearchableCommodity";
import AdvancedDrawer from "./AdvancedDrawer";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface ControlPanelProps {
  originPincode: string;
  setOriginPincode: (pin: string) => void;
  onSelectOriginCoords: (coords: { lat: number; lon: number } | null) => void;

  destPincode: string;
  setDestPincode: (pin: string) => void;
  onSelectDestCoords: (coords: { lat: number; lon: number } | null) => void;

  weight: string;
  setWeight: (w: string) => void;
  weightUnit: "kg" | "MT" | "LB";
  setWeightUnit: (u: "kg" | "MT" | "LB") => void;

  commodityCode: string;
  setCommodityCode: (code: string) => void;

  vehicleAxles: "2" | "3" | "4-6" | "Auto";
  setVehicleAxles: (axles: "2" | "3" | "4-6" | "Auto") => void;

  containerType: "20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto";
  setContainerType: (type: "20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto") => void;

  incoterm: string;
  setIncoterm: (incoterm: string) => void;

  dimensions: { length: string; width: string; height: string };
  setDimensions: (dims: { length: string; width: string; height: string }) => void;

  cargoValue: string;
  setCargoValue: (val: string) => void;

  dangerousGoods: { isDG: boolean; unClass: string; packingGroup: string };
  setDangerousGoods: (dg: { isDG: boolean; unClass: string; packingGroup: string }) => void;

  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;

  loadingStage: "idle" | "calculating_tolls" | "fetching_rates" | "benchmarking";
  runAnalysis: () => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
}

export default function ControlPanel({
  originPincode,
  setOriginPincode,
  onSelectOriginCoords,
  destPincode,
  setDestPincode,
  onSelectDestCoords,
  weight,
  setWeight,
  weightUnit,
  setWeightUnit,
  commodityCode,
  setCommodityCode,
  vehicleAxles,
  setVehicleAxles,
  containerType,
  setContainerType,
  incoterm,
  setIncoterm,
  dimensions,
  setDimensions,
  cargoValue,
  setCargoValue,
  dangerousGoods,
  setDangerousGoods,
  advancedOpen,
  setAdvancedOpen,
  loadingStage,
  runAnalysis,
  showHelp,
  setShowHelp
}: ControlPanelProps) {

  // Sync range slider bounds dynamically per unit
  const rangeBounds = useMemo(() => {
    switch (weightUnit) {
      case "MT":
        return { min: 0.1, max: 50, step: 0.1 };
      case "LB":
        return { min: 220, max: 110000, step: 10 };
      case "kg":
      default:
        return { min: 100, max: 50000, step: 10 };
    }
  }, [weightUnit]);

  // Click presets
  const presets = [
    { label: "500 kg", kgVal: 500 },
    { label: "1 MT", kgVal: 1000 },
    { label: "5 MT", kgVal: 5000 },
    { label: "10 MT", kgVal: 10000 },
    { label: "20 MT", kgVal: 20000 },
    { label: "Full Truck", kgVal: 40000 }
  ];

  const handlePresetSelect = (kg: number) => {
    let finalVal = kg;
    if (weightUnit === "MT") {
      finalVal = kg / 1000;
    } else if (weightUnit === "LB") {
      finalVal = Math.round(kg * 2.20462);
    }
    setWeight(finalVal.toString());
  };

  const loaderLabels = {
    idle: "",
    calculating_tolls: "Calculating tolls...",
    fetching_rates: "Fetching carrier rates...",
    benchmarking: "Benchmarking index..."
  };

  return (
    <div className="bg-neutral-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-xl h-fit sticky top-20 flex flex-col gap-5">
      
      {/* 1. Origin Pincode */}
      <PincodeAutocomplete
        label="Origin Location"
        value={originPincode}
        onChange={setOriginPincode}
        onSelectCoords={onSelectOriginCoords}
        recentKey="origin"
        placeholder="Enter 6-digit origin pincode"
      />

      {/* 2. Destination Pincode */}
      <PincodeAutocomplete
        label="Destination Location"
        value={destPincode}
        onChange={setDestPincode}
        onSelectCoords={onSelectDestCoords}
        recentKey="destination"
        placeholder="Enter 6-digit destination pincode"
      />

      {/* 3. Sync Slider / Input Weight */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total Cargo Weight
          </label>
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
            {(["kg", "MT", "LB"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => {
                  // Translate weight value to match the unit
                  const val = parseFloat(weight) || 0;
                  let translated = val;
                  if (weightUnit === "kg" && unit === "MT") translated = val / 1000;
                  else if (weightUnit === "kg" && unit === "LB") translated = val * 2.20462;
                  else if (weightUnit === "MT" && unit === "kg") translated = val * 1000;
                  else if (weightUnit === "MT" && unit === "LB") translated = val * 2204.62;
                  else if (weightUnit === "LB" && unit === "kg") translated = val / 2.20462;
                  else if (weightUnit === "LB" && unit === "MT") translated = val / 2204.62;

                  setWeightUnit(unit);
                  setWeight(
                    unit === "MT" 
                      ? translated.toFixed(2) 
                      : Math.round(translated).toString()
                  );
                }}
                className={`px-2 py-0.5 rounded-md text-[8px] font-bold font-mono transition-all cursor-pointer ${
                  weightUnit === unit
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Sync Text Field & Range slider */}
        <div className="grid grid-cols-[1fr_90px] gap-3">
          <div className="flex items-center">
            <input
              type="range"
              min={rangeBounds.min}
              max={rangeBounds.max}
              step={rangeBounds.step}
              value={parseFloat(weight) || rangeBounds.min}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="relative">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg py-2.5 px-3 text-right text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Presets Chips */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePresetSelect(p.kgVal)}
              className="px-2 py-1 bg-white/5 border border-white/5 hover:border-cyan-400/30 hover:bg-cyan-400/[0.02] rounded-lg text-[9px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Commodity classification */}
      <SearchableCommodity value={commodityCode} onChange={setCommodityCode} />

      {/* 5. Advanced Drawer Container */}
      <AdvancedDrawer
        isOpen={advancedOpen}
        setIsOpen={setAdvancedOpen}
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
      />

      {/* 6. Run Analysis Trigger Button */}
      <div className="space-y-2 mt-2">
        <MagneticButton
          type="button"
          onClick={runAnalysis}
          disabled={loadingStage !== "idle"}
          className="w-full py-3 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-80"
        >
          {loadingStage !== "idle" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{loaderLabels[loadingStage]}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              <span>Run Instrument Analysis</span>
            </>
          )}
        </MagneticButton>

        {/* Collapsible Keyboard hint footer */}
        <div className="flex justify-between items-center px-1">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            Keyboard Shortcuts
          </button>
          <span className="text-[8px] font-mono text-slate-600">CMD/CTRL + ENTER</span>
        </div>

        {showHelp && (
          <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[9px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between"><span>Run Analysis:</span><span className="text-cyan-400">Ctrl + Enter</span></div>
            <div className="flex justify-between"><span>Switch Modes:</span><span className="text-cyan-400">1 - 5</span></div>
            <div className="flex justify-between"><span>Toggle Hints:</span><span className="text-cyan-400">?</span></div>
            <div className="flex justify-between"><span>Close Panels:</span><span className="text-cyan-400">Escape</span></div>
          </div>
        )}
      </div>

    </div>
  );
}
