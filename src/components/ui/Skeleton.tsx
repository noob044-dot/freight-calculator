"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: 1 | 2 | 3;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", variant = 1 }) => {
  const radiusClass = 
    variant === 1 ? "rounded-organic-1" : 
    variant === 2 ? "rounded-organic-2" : 
    "rounded-organic-3";

  return (
    <div 
      className={`relative overflow-hidden bg-white/[0.02] border border-white/5 ${radiusClass} ${className} before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent`}
    />
  );
};
