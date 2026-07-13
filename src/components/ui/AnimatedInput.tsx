/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParticleBurst } from "@/hooks/useParticleBurst";


interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  value,
  onFocus,
  onBlur,
  className = "",
  ...props
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const { particles, triggerBurst } = useParticleBurst();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="relative w-full h-[52px] bg-black/40 border border-white/5 rounded-xl flex items-center px-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full group" suppressHydrationWarning={true}>
      {/* Particle Burst effect on focus */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: p.x, y: p.y, scale: 1, opacity: 0.8 }}
          animate={{
            x: p.tx,
            y: p.ty,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 30,
          }}
        />
      ))}

      {/* Input element (must come first for peer selectors to work) */}
      <input
        value={value}
        placeholder=" "
        onFocus={(e) => {
          triggerBurst(e);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          if (onBlur) onBlur(e);
        }}
        className={`peer w-full bg-black/40 border ${
          error ? "border-rose-500/50 focus:border-rose-500" : "border-white/5 focus:border-cyan-400"
        } rounded-xl pl-3 pr-3 py-3.5 text-xs text-white outline-none transition-all duration-300 focus:bg-cyan-500/[0.01] focus:shadow-[0_0_20px_rgba(34,211,238,0.08)] ${className}`}
        suppressHydrationWarning={true}
        {...props}
      />

      {/* Floating Label (styled using native CSS peer states to support autofill) */}
      <label
        className={`absolute left-3 top-3.5 text-xs font-medium uppercase tracking-wider pointer-events-none select-none origin-left transition-all duration-300
          peer-focus:-translate-y-7 peer-focus:scale-82
          peer-[:not(:placeholder-shown)]:-translate-y-7 peer-[:not(:placeholder-shown)]:scale-82
          peer-autofill:-translate-y-7 peer-autofill:scale-82
          peer-[-webkit-autofill]:-translate-y-7 peer-[-webkit-autofill]:scale-82
          ${error ? "text-rose-500" : "text-slate-400 peer-focus:text-cyan-400"}
        `}
      >
        {label}
      </label>

      {/* Error state validation morph */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            className="text-[10px] text-rose-400 font-medium mt-1 pl-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
