"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, ShieldAlert 
} from "lucide-react";
import { springGentle } from "@/lib/animations/variants";

interface AdvancedDrawerProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  
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
}

export default function AdvancedDrawer({
  isOpen,
  setIsOpen,
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
  setDangerousGoods
}: AdvancedDrawerProps) {

  // Derived Calculations
  const calculations = useMemo(() => {
    const l = parseFloat(dimensions.length) || 0;
    const w = parseFloat(dimensions.width) || 0;
    const h = parseFloat(dimensions.height) || 0;
    
    // CBM = L * W * H (in cm) / 1,000,000
    const cbm = (l * w * h) / 1000000;
    // Volumetric weight (Air standard: 167 kg per CBM)
    const volWeight = cbm * 167;
    
    const value = parseFloat(cargoValue) || 0;
    // Insurance Estimate = 0.3% of cargo value
    const insurance = value * 0.003;
    
    return {
      cbm: cbm.toFixed(2),
      volWeight: volWeight.toFixed(1),
      insurance: insurance.toLocaleString("en-IN", { maximumFractionDigits: 0 })
    };
  }, [dimensions, cargoValue]);

  const incoterms = ["EXW", "FOB", "FCA", "CPT", "CIP", "DAP", "DPU", "DDP", "CIF", "CFR"];

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-[10px] uppercase tracking-widest font-bold text-slate-400 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
          Advanced Route Parameters
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springGentle}
          className="text-cyan-400"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springGentle}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-4 space-y-4 border-t border-white/5 mt-2">
              
              {/* Row 1: Vehicle & Containers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Axle Configuration
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["2", "3", "4-6", "Auto"] as const).map((ax) => (
                      <button
                        key={ax}
                        type="button"
                        onClick={() => setVehicleAxles(ax)}
                        className={`py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                          vehicleAxles === ax
                            ? "bg-cyan-400/10 border border-cyan-400/30 text-cyan-400"
                            : "bg-white/5 border border-transparent text-slate-400 hover:text-white"
                        }`}
                      >
                        {ax === "Auto" ? "AUTO" : `${ax} Ax`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Container Standard
                  </label>
                  <select
                    value={containerType}
                    onChange={(e) => setContainerType(e.target.value as "20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto")}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="Auto" className="bg-neutral-950">AUTO SELECT</option>
                    <option value="20GP" className="bg-neutral-950">20FT DRY GP</option>
                    <option value="40GP" className="bg-neutral-950">40FT DRY GP</option>
                    <option value="40HC" className="bg-neutral-950">40FT HIGH CUBE</option>
                    <option value="Reefer" className="bg-neutral-950">40FT REEFER</option>
                    <option value="Tank" className="bg-neutral-950">CHEMICAL TANKER</option>
                    <option value="Flat" className="bg-neutral-950">FLAT RACK</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Incoterms & Cargo Values */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Incoterms (2020)
                  </label>
                  <select
                    value={incoterm}
                    onChange={(e) => setIncoterm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    {incoterms.map((inc) => (
                      <option key={inc} value={inc} className="bg-neutral-950">
                        {inc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Cargo Value (INR)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 5,00,000"
                      value={cargoValue}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/,/g, "");
                        if (!isNaN(Number(clean))) setCargoValue(clean);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-3 py-1.5 text-[9px] font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute left-2.5 top-2 text-[9px] font-bold text-slate-500">₹</span>
                  </div>
                  {parseFloat(cargoValue) > 0 && (
                    <p className="text-[8px] text-slate-500 pl-1 leading-tight">
                      Est. Insurance Surcharge (0.3%): <span className="text-emerald-400">₹{calculations.insurance}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Dimensions & Volumetric Weight */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    Cargo Dimensions (L × W × H in cm)
                  </label>
                  {parseFloat(calculations.cbm) > 0 && (
                    <span className="text-[9px] font-bold text-cyan-400 font-mono">
                      {calculations.cbm} CBM | Vol: {calculations.volWeight} kg
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="L (cm)"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white focus:outline-none focus:border-cyan-400 text-center"
                  />
                  <input
                    type="number"
                    placeholder="W (cm)"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white focus:outline-none focus:border-cyan-400 text-center"
                  />
                  <input
                    type="number"
                    placeholder="H (cm)"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-1.5 text-[9px] font-mono text-white focus:outline-none focus:border-cyan-400 text-center"
                  />
                </div>
              </div>

              {/* Row 4: Dangerous Goods (Hazmat) */}
              <div className="space-y-2.5 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dangerousGoods.isDG}
                    onChange={(e) => setDangerousGoods({ ...dangerousGoods, isDG: e.target.checked })}
                    className="w-3.5 h-3.5 bg-white/5 border border-white/10 rounded text-cyan-400 focus:ring-0"
                  />
                  <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-slate-400 hover:text-white transition-colors">
                    <ShieldAlert className={`w-3.5 h-3.5 ${dangerousGoods.isDG ? "text-rose-500" : "text-slate-500"}`} />
                    Dangerous Goods / Hazmat Classification
                  </span>
                </label>

                {dangerousGoods.isDG && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-3 pt-1.5"
                  >
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 font-bold uppercase block">UN Class Surcharge</span>
                      <select
                        value={dangerousGoods.unClass}
                        onChange={(e) => setDangerousGoods({ ...dangerousGoods, unClass: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-[9px] text-white focus:outline-none"
                      >
                        <option value="none" className="bg-neutral-950">Class 9 (Misc - 5%)</option>
                        <option value="class3" className="bg-neutral-950">Class 3 (Flammables - 15%)</option>
                        <option value="class1" className="bg-neutral-950">Class 1 (Explosives - 25%)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-500 font-bold uppercase block">Packing Group</span>
                      <select
                        value={dangerousGoods.packingGroup}
                        onChange={(e) => setDangerousGoods({ ...dangerousGoods, packingGroup: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-1 text-[9px] text-white focus:outline-none"
                      >
                        <option value="PGIII" className="bg-neutral-950">PG III (Low Risk - 0%)</option>
                        <option value="PGII" className="bg-neutral-950">PG II (Med Risk - 5%)</option>
                        <option value="PGI" className="bg-neutral-950">PG I (High Risk - 10%)</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
