/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { springStandard } from "@/lib/animations/variants";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "violet" | "emerald" | "default";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20",
    default: "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10",
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={springStandard}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${variantStyles[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.span>
  );
};
