/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { PincodeData } from '../lib/pincode-db-types';

interface PincodeAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const PincodeAutocomplete: React.FC<PincodeAutocompleteProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Search pincode...'
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PincodeData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch results when query changes (debounced by 150ms)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
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
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (pincode: string) => {
    onChange(pincode);
    setQuery(pincode);
    setIsOpen(false);
    setActiveItemIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveItemIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItemIndex >= 0 && activeItemIndex < results.length) {
        handleSelect(results[activeItemIndex].pincode);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-xs font-bold text-fg-muted uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-bg-elevated border border-border rounded-lg pl-10 pr-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent font-mono transition-all placeholder:text-fg-muted/50"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
          </div>
        )}
      </div>

      {isOpen && (results.length > 0 || query.length >= 2) && (
        <div className="absolute z-50 w-full mt-1 bg-card-custom border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            results.map((item, index) => (
              <button
                type="button"
                key={item.pincode}
                onClick={() => handleSelect(item.pincode)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors border-b border-border/50 last:border-0 cursor-pointer ${
                  index === activeItemIndex ? 'bg-accent/10 text-accent font-semibold' : 'text-fg-muted hover:text-fg hover:bg-bg-elevated'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-fg">{item.pincode}</span>
                  <span className="text-xs text-fg-muted ml-2">{item.district}, {item.state}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-bg-elevated text-accent font-semibold rounded uppercase tracking-wider">
                  Zone {item.deliveryZone}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-fg-muted text-center font-mono">
              No matching pincodes
            </div>
          )}
        </div>
      )}
    </div>
  );
};
