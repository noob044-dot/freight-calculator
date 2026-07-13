"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, FileText, FileSpreadsheet, Code, Link2, Check, Share2 } from "lucide-react";
import { exportQuoteToPDF } from "@/lib/export/pdf";
import { exportQuoteToExcel } from "@/lib/export/excel";
import { generateShareLink } from "@/lib/utils/shareLink";
import { QuoteResponse } from "@/lib/api/contracts";

interface ExportDropdownProps {
  results: QuoteResponse;
  originPincode: string;
  destPincode: string;
  weight: string;
  weightUnit: string;
  commodityCode: string;
  vehicleAxles: "2" | "3" | "4-6" | "Auto";
  containerType: "20GP" | "40GP" | "40HC" | "45HC" | "Reefer" | "Tank" | "Flat" | "Auto";
  incoterm: string;
  activeMode: string;
}

export default function ExportDropdown({
  results,
  originPincode,
  destPincode,
  weight,
  weightUnit,
  commodityCode,
  vehicleAxles,
  containerType,
  incoterm,
  activeMode
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const handleExportPDF = () => {
    exportQuoteToPDF(
      results,
      originPincode,
      destPincode,
      parseFloat(weight) || 0,
      weightUnit,
      commodityCode,
      activeMode
    );
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    exportQuoteToExcel(
      results,
      originPincode,
      destPincode,
      parseFloat(weight) || 0,
      weightUnit,
      commodityCode
    );
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Freight_Report_${originPincode}_to_${destPincode}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    setIsOpen(false);
  };

  const handleShareLink = async () => {
    try {
      const link = await generateShareLink({
        originPincode,
        destPincode,
        weight: parseFloat(weight) || 0,
        weightUnit,
        commodityCode,
        vehicleAxles,
        containerType,
        incoterm
      });
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate share link:", err);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-lg"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Export Options</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 bg-neutral-900/95 border border-white/5 rounded-xl shadow-2xl backdrop-blur-xl p-1.5">
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Download PDF Report
            </span>
            <span className="text-[8px] font-mono text-slate-600">CMD+P</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Export Excel Sheet
            </span>
            <span className="text-[8px] font-mono text-slate-600">CMD+X</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <Code className="w-4 h-4 text-amber-400" />
              Download Raw JSON
            </span>
            <span className="text-[8px] font-mono text-slate-600">CMD+J</span>
          </button>

          <div className="h-px bg-white/5 my-1" />

          <button
            type="button"
            onClick={handleShareLink}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : (
                <Link2 className="w-4 h-4 text-cyan-400" />
              )}
              {copied ? "Copied Link!" : "Generate Share Link"}
            </span>
            <span className="text-[8px] font-mono text-slate-600">CMD+L</span>
          </button>
        </div>
      )}
    </div>
  );
}
