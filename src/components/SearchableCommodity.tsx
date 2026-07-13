"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Package, Search, ChevronDown, Check } from "lucide-react";
import { COMMODITY_FACTORS } from "../lib/road-engine";

interface SearchableCommodityProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchableCommodity: React.FC<SearchableCommodityProps> = ({
  value,
  onChange,
  className = "",
  placeholder = "Search commodity..."
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Group commodities by category
  const selectedCommodity = useMemo(() => {
    return COMMODITY_FACTORS.find((c) => c.code === value) || COMMODITY_FACTORS[0];
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCommodities = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return COMMODITY_FACTORS;
    return COMMODITY_FACTORS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q))
    );
  }, [query]);

  // Grouped list for rendering
  const grouped = useMemo(() => {
    const groups: Record<string, typeof COMMODITY_FACTORS> = {};
    filteredCommodities.forEach((c) => {
      const cat = c.category || "General Cargo";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [filteredCommodities]);

  // Flattened list to map keyboard index navigation
  const flatFilteredList = useMemo(() => {
    return Object.values(grouped).flat();
  }, [grouped]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setQuery("");
    setActiveItemIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev < flatFilteredList.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItemIndex >= 0 && activeItemIndex < flatFilteredList.length) {
        handleSelect(flatFilteredList[activeItemIndex].code);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={ref}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        Commodity Classification
      </label>
      
      {/* Selector Trigger Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-xl px-3.5 py-3 cursor-pointer hover:border-white/20 transition-all ${
          isOpen ? "border-cyan-400/50" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Package className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-white text-xs truncate font-medium">
            {selectedCommodity.name}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cyan-400/10 text-cyan-400 rounded-md border border-cyan-400/10 flex-shrink-0">
            {selectedCommodity.factor}x
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-neutral-900/95 border border-white/5 rounded-xl shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto scrollbar-thin">
          {/* Search box within dropdown */}
          <div className="p-2 border-b border-white/5 sticky top-0 bg-neutral-900/95 backdrop-blur-md z-10">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveItemIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400/30 font-mono"
              />
            </div>
          </div>

          <div className="p-1">
            {flatFilteredList.length > 0 ? (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="space-y-0.5">
                  <div className="px-3 py-1.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.01] rounded">
                    {category}
                  </div>
                  {items.map((item) => {
                    // Find actual flat index
                    const flatIdx = flatFilteredList.findIndex((i) => i.code === item.code);
                    const isSelected = item.code === value;
                    const isActive = flatIdx === activeItemIndex;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleSelect(item.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-all cursor-pointer ${
                          isActive
                            ? "bg-cyan-400/10 text-cyan-400 font-semibold"
                            : isSelected
                            ? "text-cyan-400 bg-cyan-400/5 font-medium"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className="text-[8px] font-mono text-slate-500 font-bold">{item.code.toUpperCase()}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-slate-300 font-semibold">
                            {item.factor}x
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-xs text-slate-500 text-center font-mono">
                No matching commodities
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
