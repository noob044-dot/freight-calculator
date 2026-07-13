"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, History } from "lucide-react";
import { PincodeData } from "../lib/pincode-db-types";

interface PincodeAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectCoords?: (coords: { lat: number; lon: number } | null) => void;
  recentKey?: string;
  placeholder?: string;
}

export const PincodeAutocomplete: React.FC<PincodeAutocompleteProps> = ({
  label,
  value,
  onChange,
  onSelectCoords,
  recentKey,
  placeholder = "Search pincode..."
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PincodeData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // partition recents by key (e.g. recent_pins_origin vs recent_pins_destination)
  const storageKey = recentKey ? `recent_pins_${recentKey}` : "recent_pins";
  
  // Lazy initialize recents from localStorage
  const [recents, setRecents] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved).slice(0, 5);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Adjust state during rendering when value prop changes (React recommended)
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setQuery(value);
  }

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch results with 200ms debouncing
  useEffect(() => {
    if (query.length < 2) {
      const t = setTimeout(() => {
        setResults([]);
      }, 0);
      return () => clearTimeout(t);
    }

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/api/pincodes?q=${query}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (item: PincodeData) => {
    onChange(item.pincode);
    setQuery(item.pincode);
    if (onSelectCoords) {
      onSelectCoords({ lat: item.lat, lon: item.lon });
    }

    // Save to recents list
    const updated = [item.pincode, ...recents.filter((p) => p !== item.pincode)].slice(0, 5);
    setRecents(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    setIsOpen(false);
    setActiveItemIndex(-1);
  };

  const handleRecentClick = async (pin: string) => {
    onChange(pin);
    setQuery(pin);
    setIsOpen(false);
    try {
      // Lookup coordinates from the API for the recent pin
      const res = await fetch(`/api/pincodes?q=${pin}`);
      const data = await res.json();
      const match = data.results?.find((item: PincodeData) => item.pincode === pin);
      if (match && onSelectCoords) {
        onSelectCoords({ lat: match.lat, lon: match.lon });
      }
    } catch (err) {
      console.error("Recent pin coords lookup error:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeItemIndex >= 0 && activeItemIndex < results.length) {
        handleSelect(results[activeItemIndex]);
      }
    } else if (e.key === "Tab") {
      // Auto-select top result on Tab if active
      if (activeItemIndex >= 0 && activeItemIndex < results.length) {
        handleSelect(results[activeItemIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white text-xs focus:outline-none focus:border-cyan-400/50 font-mono transition-all placeholder:text-slate-600 focus:scale-[1.002] focus:shadow-lg focus:shadow-cyan-500/[0.02]"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-cyan-400 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Recents Helper Chips */}
      {isOpen && query.length === 0 && recents.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-neutral-900/90 border border-white/5 p-3 rounded-xl backdrop-blur-xl shadow-2xl flex flex-col gap-2">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3 h-3 text-slate-500" />
            Recent Routes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {recents.map((pin) => (
              <button
                key={pin}
                type="button"
                onClick={() => handleRecentClick(pin)}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-mono text-slate-300 hover:text-white hover:border-cyan-400/40 hover:bg-cyan-400/[0.02] transition-all cursor-pointer"
              >
                {pin}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {isOpen && (results.length > 0 || query.length >= 2) && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-neutral-900/95 border border-white/5 rounded-xl shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl scrollbar-thin">
          {results.length > 0 ? (
            results.map((item, index) => {
              // Mock toll plazacount deterministically: e.g. 2 to 6 plazas based on pincode value
              const tollPlazaCount = (Number(item.pincode) % 5) + 2;
              return (
                <button
                  type="button"
                  key={item.pincode}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-xs transition-colors border-b border-white/5 last:border-0 cursor-pointer ${
                    index === activeItemIndex
                      ? "bg-cyan-400/10 text-cyan-400 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{item.pincode}</span>
                    <span className="text-[10px] text-slate-500">{item.district}, {item.state}</span>
                  </div>
                  <span className="text-[8px] font-mono px-2 py-0.5 bg-white/5 text-slate-400 font-semibold rounded-md border border-white/5">
                    {tollPlazaCount} Plazas
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-[10px] text-slate-500 text-center font-mono">
              No matching pincodes
            </div>
          )}
        </div>
      )}
    </div>
  );
};
