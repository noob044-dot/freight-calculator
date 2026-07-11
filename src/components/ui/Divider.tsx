"use client";

import React from "react";
import { motion } from "framer-motion";

export const Divider: React.FC = () => {
  return (
    <div className="relative w-full py-8 flex items-center justify-center overflow-hidden">
      <svg className="w-full h-px text-white/5" viewBox="0 0 100 1" preserveAspectRatio="none">
        <motion.line
          x1="0"
          y1="0.5"
          x2="100"
          y2="0.5"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
};
