"use client";

import React, { useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  size: number;
  color: string;
}

export function useParticleBurst() {
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerBurst = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Center of the input field
    const startX = rect.width / 2;
    const startY = rect.height / 2;
    const count = 16;
    const colors = ["#22d3ee", "#38bdf8", "#6366f1", "#8b5cf6"];

    const newParticles = Array.from({ length: count }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      return {
        id: Math.random() + i,
        x: startX,
        y: startY,
        tx: startX + Math.cos(angle) * distance,
        ty: startY + Math.sin(angle) * distance - 20,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });

    setParticles(newParticles);
    
    // Clear after animation duration
    setTimeout(() => {
      setParticles([]);
    }, 850);
  }, []);

  return { particles, triggerBurst };
}
