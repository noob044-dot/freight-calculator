'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';

interface AnimatedButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const AnimatedButton = ({
  children,
  loading,
  success,
  disabled,
  onClick,
  type = 'submit',
}: AnimatedButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!btnRef.current || disabled || loading || success) return;
    const rect = btnRef.current.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onClick?.();
  };

  return (
    <motion.button
      ref={btnRef}
      type={type}
      disabled={disabled || loading || success}
      onClick={handleClick}
      onMouseEnter={() => { setIsHovered(true); }}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
      className="relative w-full py-4 rounded-xl font-semibold text-sm text-white overflow-hidden cursor-pointer select-none"
      style={{
        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
        backgroundSize: '200% 200%',
        backgroundPosition: isHovered ? '100% 100%' : '0% 0%',
      }}
      animate={{
        scale: isHovered && !loading && !success ? 1.02 : 1,
        y: isHovered && !loading && !success ? mousePos.y * 0.08 : 0,
        x: isHovered && !loading && !success ? mousePos.x * 0.08 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      aria-label="Sign in"
    >
      <motion.div
        className="absolute inset-0 bg-white/5 rounded-xl"
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{ left: r.x, top: r.y }}
          initial={{ width: 0, height: 0, opacity: 1, x: 0, y: 0 }}
          animate={{ width: 300, height: 300, opacity: 0, x: -150, y: -150 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing in...</span>
          </motion.span>
        ) : success ? (
          <motion.span
            key="success"
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <motion.span
              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20"
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="block relative z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
