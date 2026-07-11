"use client";

import React, { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface StatBlobProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  format?: boolean;
}

export const StatBlob: React.FC<StatBlobProps> = ({
  label,
  value,
  suffix = "",
  prefix = "",
  format = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;

    const start = 0;
    const end = value;
    const duration = 2000; 
    const startTime = performance.now();

    const animateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeProgress * (end - start) + start);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [value, inView]);

  return (
    <div ref={ref} className="text-center p-4 bg-glass border border-white/5 rounded-organic-2 transition-all hover:scale-103 hover:shadow-xl hover:shadow-cyan-500/5 duration-300">
      <div className="text-2xl font-bold font-mono text-white tracking-tight">
        {prefix}
        {format ? displayValue.toLocaleString("en-IN") : displayValue}
        {suffix}
      </div>
      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
        {label}
      </div>
    </div>
  );
};
