"use client";

import React, { useState, useRef, useEffect } from 'react';
import { COMMODITY_FACTORS } from '../lib/road-engine';

interface SearchableCommodityProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const SearchableCommodity: React.FC<SearchableCommodityProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Search commodity...'
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setQuery(value);
    setPrevValue(value);
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const q = query.toLowerCase();
  const filtered = q
    ? COMMODITY_FACTORS.filter(c => c.code.includes(q) || c.name.toLowerCase().includes(q) || c.category.includes(q))
    : COMMODITY_FACTORS;

  const select = (code: string) => {
    onChange(code);
    setQuery(code);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => i < filtered.length - 1 ? i + 1 : i);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => i > 0 ? i - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) select(filtered[activeIndex].code);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={ref}>
      <input
        type="text"
        value={query}
        onFocus={() => { setIsOpen(true); setActiveIndex(-1); }}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        className={className || 'w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-fg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent'}
        placeholder={placeholder}
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card-custom border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((c, i) => (
              <button
                key={c.code}
                type="button"
                onClick={() => select(c.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors border-b border-border/50 last:border-0 cursor-pointer ${
                  i === activeIndex ? 'bg-accent/10 text-accent font-semibold' : 'text-fg-muted hover:text-fg hover:bg-bg-elevated'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-fg">{c.code}</span>
                  <span className="text-xs text-fg-muted ml-2">{c.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-bg-elevated text-fg-muted/60 font-semibold rounded uppercase tracking-wider">
                  {c.factor}x
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-fg-muted text-center font-mono">No matching commodities</div>
          )}
        </div>
      )}
    </div>
  );
};
