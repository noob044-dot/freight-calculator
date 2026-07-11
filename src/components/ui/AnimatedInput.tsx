"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParticleBurst } from "@/hooks/useParticleBurst";
import { springStandard } from "@/lib/animations/variants";

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
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== "";
  const { particles, triggerBurst } = useParticleBurst();

  return (
    <div className="relative w-full group">
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

      {/* Floating Label */}
      <motion.label
        initial={false}
        animate={{
          y: (isFocused || hasValue) ? -28 : 0,
          scale: (isFocused || hasValue) ? 0.82 : 1,
          color: error ? "#f43f5e" : isFocused ? "#22d3ee" : "#94a3b8",
        }}
        transition={springStandard}
        className="absolute left-3 top-3.5 text-xs font-medium uppercase tracking-wider pointer-events-none select-none origin-left"
      >
        {label}
      </motion.label>

      {/* Input element */}
      <input
        value={value}
        onFocus={(e) => {
          setIsFocused(true);
          triggerBurst(e);
          if (onFocus) onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          if (onBlur) onBlur(e);
        }}
        className={`w-full bg-black/40 border ${
          error ? "border-rose-500/50 focus:border-rose-500" : "border-white/5 focus:border-cyan-400"
        } rounded-xl pl-3 pr-3 py-3.5 text-xs text-white placeholder-transparent outline-none transition-all duration-300 focus:bg-cyan-500/[0.01] focus:shadow-[0_0_20px_rgba(34,211,238,0.08)] ${className}`}
        {...props}
      />

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
