/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { springStandard } from "@/lib/animations/variants";

interface GlassBlobProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 1 | 2 | 3;
}

export const GlassBlob: React.FC<GlassBlobProps> = ({ 
  children, 
  className = "", 
  variant = 1,
  ...props 
}) => {
  const radiusClass = 
    variant === 1 ? "rounded-organic-1" : 
    variant === 2 ? "rounded-organic-2" : 
    "rounded-organic-3";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={springStandard}
      className={`bg-glass backdrop-blur-3xl border border-white/5 p-6 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 ${radiusClass} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};
