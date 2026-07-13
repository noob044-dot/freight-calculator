"use client";

import React from "react";
import { Link2 } from "lucide-react";

export default function DataCitations() {
  const citations = [
    { name: "NHAI Toll plaza API", url: "https://www.nhai.gov.in" },
    { name: "DGCA Air Cargo", url: "https://www.dgca.gov.in" },
    { name: "IRCTC Freight Operations", url: "https://www.fois.indianrail.gov.in" },
    { name: "DG Shipping Port Index", url: "https://www.dgshipping.gov.in" }
  ];

  return (
    <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl space-y-2">
      <h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
        Data Verification citations
      </h4>
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400">
        {citations.map((c) => (
          <a
            key={c.name}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
          >
            <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{c.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
