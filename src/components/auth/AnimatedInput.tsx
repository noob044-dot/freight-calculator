'use client';

import { useState, useCallback, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface AnimatedInputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  error?: string;
  touched?: boolean;
  icon?: React.ReactNode;
  showStrength?: boolean;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, type, value, onChange, onBlur, name, error, touched, icon, showStrength }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const isActive = focused || value.length > 0;

    const getStrength = useCallback((pw: string) => {
      if (!pw) return 0;
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[a-z]/.test(pw)) score++;
      if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
      return score;
    }, []);

    const strength = showStrength ? getStrength(value) : 0;
    const segments = [
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f59e0b' },
      { label: 'Good', color: '#22c55e' },
      { label: 'Strong', color: '#22c55e' },
    ];
    const strengthIdx = strength > 0 ? strength - 1 : -1;

    return (
      <div className="relative">
        <motion.div
          className="relative rounded-xl overflow-hidden"
          animate={
            error && touched
              ? { x: [0, -8, 8, -8, 4, -4, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <div className="flex items-center">
            {icon && (
              <span className="absolute left-4 z-10 text-fg-muted/40 pointer-events-none">
                {icon}
              </span>
            )}
            <input
              ref={ref}
              type={showPassword ? 'text' : type}
              value={value}
              name={name}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={(e) => { setFocused(false); onBlur(e); }}
              autoComplete={type === 'password' ? 'current-password' : 'email'}
              aria-label={label}
              className={`
                w-full bg-transparent border-2 rounded-xl px-4 py-4 text-fg text-sm
                outline-none transition-all duration-300
                placeholder-transparent
                ${icon ? 'pl-12' : ''}
                ${error && touched ? 'border-error' : focused ? 'border-accent/50' : 'border-white/10'}
              `}
              style={{
                boxShadow: focused && !error
                  ? '0 0 0 3px rgba(14,165,233,0.15)'
                  : error && touched
                  ? '0 0 0 3px rgba(239,68,68,0.15)'
                  : 'none',
              }}
            />
            <motion.label
              className="absolute left-0 top-0 text-fg-muted/50 pointer-events-none font-light"
              style={{ fontSize: isActive ? '11px' : '14px', paddingLeft: icon ? '48px' : '16px' }}
              animate={{
                y: isActive ? -20 : 16,
                scale: isActive ? 0.85 : 1,
                color: error && touched ? '#ef4444' : focused ? '#0ea5e9' : 'rgba(148,163,184,0.5)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {label}
            </motion.label>
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 z-10 text-fg-muted/40 hover:text-fg-muted/70 transition-colors cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            {touched && !error && value.length > 0 && type !== 'password' && (
              <motion.span
                className="absolute right-3 text-success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check className="w-4 h-4" />
              </motion.span>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {error && touched && (
            <motion.p
              className="flex items-center gap-1.5 mt-1.5 text-xs text-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{error}</span>
            </motion.p>
          )}
        </AnimatePresence>

        {showStrength && value.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex gap-1">
              {segments.map((seg, i) => (
                <motion.div
                  key={i}
                  className="h-1 flex-1 rounded-full overflow-hidden bg-white/5"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: strength >= 0 && strength > i ? '100%' : 0,
                      backgroundColor: strength >= 0 && strength > i ? seg.color : 'transparent',
                    }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  />
                </motion.div>
              ))}
            </div>
            {strengthIdx >= 0 && (
              <motion.p
                className="text-[10px] font-medium tracking-wider uppercase"
                style={{ color: segments[strengthIdx].color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {segments[strengthIdx].label}
              </motion.p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';
