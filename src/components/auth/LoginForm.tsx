'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import { loginSchema, LoginFormData } from '@/lib/auth/schema';
import { AnimatedInput } from './AnimatedInput';
import { AnimatedButton } from './AnimatedButton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 20 },
  },
};

export const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    setError,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');
  const { onChange: emailOnChange, onBlur: emailOnBlur, ref: emailRef, name: emailName } = register('email');
  const { onChange: pwOnChange, onBlur: pwOnBlur, ref: pwRef, name: pwName } = register('password');
  const { onChange: remOnChange, ref: remRef, name: remName } = register('remember');

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setLoading(true);
    setSubmitError(null);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (data.email === 'admin@freightquote.in' && data.password === 'Freight@2026') {
      setSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.push('/dashboard');
      return;
    }

    setLoading(false);
    if (data.email !== 'admin@freightquote.in') {
      setError('email', { message: 'Account not found with this email' });
    } else {
      setError('password', { message: 'Incorrect password' });
    }
  }, [router, setError]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <motion.div variants={itemVariants}>
        <div className="mb-2">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-accent">
            <motion.rect
              x="2" y="2" width="32" height="32" rx="8"
              stroke="currentColor" strokeWidth="2.5" fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
            <motion.text
              x="18" y="23" textAnchor="middle"
              fill="currentColor" fontSize="16" fontWeight="700"
              fontFamily="var(--font-source-sans, sans-serif)"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              FQ
            </motion.text>
          </svg>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 mb-2">
        <h1 className="text-[40px] font-light tracking-tight text-fg leading-none">
          Welcome back
        </h1>
        <p className="mt-3 text-base font-light text-fg-muted">
          Sign in to your freight intelligence platform
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5" noValidate>
        <motion.div variants={itemVariants}>
          <AnimatedInput
            label="Email address"
            type="email"
            value={emailValue}
            onChange={emailOnChange}
            onBlur={emailOnBlur}
            name={emailName}
            ref={emailRef}
            error={errors.email?.message}
            touched={touchedFields.email}
            icon={<Mail className="w-4 h-4" />}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnimatedInput
            label="Password"
            type="password"
            value={passwordValue}
            onChange={pwOnChange}
            onBlur={pwOnBlur}
            name={pwName}
            ref={pwRef}
            error={errors.password?.message}
            touched={touchedFields.password}
            icon={<Lock className="w-4 h-4" />}
            showStrength
          />
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              ref={remRef}
              name={remName}
              onChange={remOnChange}
              className="w-4 h-4 rounded border-white/20 bg-transparent accent-accent cursor-pointer"
            />
            <span className="text-xs text-fg-muted font-light">Remember me</span>
          </label>
          <button
            type="button"
            className="text-xs text-accent/70 hover:text-accent font-light transition-colors cursor-pointer"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnimatedButton
            loading={loading}
            success={success}
            disabled={loading || success}
            type="submit"
          >
            Sign in
          </AnimatedButton>
        </motion.div>
      </form>

      <AnimatePresence>
        {submitError && (
          <motion.p
            className="mt-4 text-xs text-error text-center font-light"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {submitError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants} className="mt-8">
        <div className="relative flex items-center gap-3 mb-6">
          <span className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-fg-muted/40 uppercase tracking-widest font-light">
            or continue with
          </span>
          <span className="flex-1 h-px bg-white/5" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-fg-muted hover:text-fg text-xs font-medium transition-all duration-300 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-fg-muted hover:text-fg text-xs font-medium transition-all duration-300 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 text-center">
        <p className="text-xs text-fg-muted/40 font-light">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-accent/70 hover:text-accent transition-colors cursor-pointer"
          >
            Get early access
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};
