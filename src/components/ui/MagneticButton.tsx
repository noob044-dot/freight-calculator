/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMagnetic } from "@/hooks/useMagnetic";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  success?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = "",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loading = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  success = false,
  ...props
}) => {
  const { ref, x, y } = useMagnetic(120, 0.3);

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={`relative overflow-hidden cursor-pointer transition-colors duration-200 ${className}`}
      {...(props as any)}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
