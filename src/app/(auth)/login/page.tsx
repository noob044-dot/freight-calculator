"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Building2,
  Eye, EyeOff, Loader2, Check, Shield, ArrowRight, Mail, Key
} from 'lucide-react';
import dynamic from 'next/dynamic';
const AuthScene = dynamic(() => import('@/components/three/AuthScene').then(mod => mod.AuthScene), {
  ssr: false,
});
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { springMagnetic } from '@/lib/animations/variants';
import { useStore } from '@/lib/store';
import { loginRequestSchema, magicLinkRequestSchema } from '@/lib/api/contracts';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- 1. MAGIC LINK / TOKEN AUTO-VERIFICATION ---
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      const h = setTimeout(() => {
        setLoading(true);
        setErrorMsg(null);
        
        fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Verification failed');
            return data;
          })
          .then((data) => {
            // Set Zustand store
            useStore.getState().setAuth(data.user, data.org, data.token, data.refresh);
            useStore.getState().hydrate();
            
            setSuccess(true);
            setSuccessMsg('Identity verified. Access corridor unlocked.');
            
            setTimeout(() => {
              const redirectPath = searchParams.get('redirect') || '/dashboard';
              router.push(redirectPath);
            }, 1500);
          })
          .catch((err) => {
            setLoading(false);
            setErrorMsg(err.message || 'Token verification failed.');
          });
      }, 0);
      return () => clearTimeout(h);
    }
  }, [searchParams, router]);

  // --- 2. CREDENTIALS AND MAGIC LINK SUBMIT HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (loginMode === 'password') {
        // Validate payload via Zod contract
        const validation = loginRequestSchema.safeParse({ email, password });
        if (!validation.success) {
          setLoading(false);
          setErrorMsg(validation.error.issues[0].message);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLoading(false);
          setErrorMsg(data.error || 'Authentication failed');
          return;
        }

        // Wait for cookie to be stored (resolve cookie race condition)
        await new Promise(r => setTimeout(r, 100));

        // Hydrate Zustand store
        useStore.getState().setAuth(data.user, data.org, data.token, data.refresh);
        useStore.getState().hydrate();

        setSuccess(true);
        setSuccessMsg('Authorization granted. Syncing workspace...');
        
        setTimeout(() => {
          // Redirect to onboarding if not complete, otherwise go to dashboard/intended page
          if (!data.user.onboardingComplete) {
            router.push('/onboarding');
          } else {
            const redirectPath = searchParams.get('redirect') || '/dashboard';
            router.push(redirectPath);
          }
        }, 1200);
      } else {
        // Magic link flow
        const validation = magicLinkRequestSchema.safeParse({ email });
        if (!validation.success) {
          setLoading(false);
          setErrorMsg(validation.error.issues[0].message);
          return;
        }

        const res = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLoading(false);
          setErrorMsg(data.error || 'Failed to dispatch magic link');
          return;
        }

        setLoading(false);
        setSuccessMsg(data.message || 'Magic link sent. Check console logs!');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg('Network error. Failed to establish connection with auth server.');
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden">

      {/* LEFT SIDE: WebGL background + stats (60% desktop) */}
      <div className="relative md:w-[60%] min-h-[40vh] md:min-h-screen flex flex-col justify-between p-8 md:p-16 border-r border-white/5 bg-black overflow-hidden">

        <AuthScene />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">Freight Intelligence</span>
        </div>

        <div className="relative z-10 my-auto max-w-xl space-y-6 pt-12 md:pt-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-cyan-400">
            <Shield className="w-3 h-3" />
            Verified Encrypted Session
          </span>

          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-none text-white font-display select-text">
            Control the <br />
            <span className="text-gradient-accent font-medium">Platform.</span>
          </h1>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed select-text">
            Sign in to access real-time forwarder bids, verify compliance audits, generate GST-compliant invoices, and analyze margin waterfall charts.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-6 max-w-lg">
          <div>
            <div className="text-xl font-bold font-mono text-white">24 Mins</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Average Response SLA</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">97%</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Contract Compliance</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">₹2L/mo</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Average Savings</div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Glass Panel login controls (40% desktop) */}
      <div className="relative md:w-[40%] flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-black/90 backdrop-blur-3xl z-10">

        <div className="w-full max-w-[380px] space-y-8">

          <div className="flex justify-center mb-6">
            <svg width="48" height="48" viewBox="0 0 36 36" fill="none" className="text-cyan-400">
              <rect
                x="2" y="2" width="32" height="32" rx="8"
                stroke="currentColor" strokeWidth="2" fill="none"
              />
              <text
                x="18" y="22" textAnchor="middle"
                fill="currentColor" fontSize="13" fontWeight="900"
                fontFamily="var(--font-sans)"
              >
                FI
              </text>
            </svg>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-light text-white tracking-tight">Identity Authentication</h2>
            <p className="text-xs text-slate-400 mt-1">Secure workspace authorization</p>
          </div>

          <div className="relative flex bg-white/5 p-1 rounded-organic-1 border border-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
            >
              {activeTab === 'login' && (
                <motion.div
                  layoutId="tabPill"
                  transition={springMagnetic}
                  className="absolute inset-0 bg-gradient-accent rounded-organic-1 shadow-md z-[-1]"
                />
              )}
              <span className={activeTab === 'login' ? 'text-white' : ''}>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { router.push('/register'); }}
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
            >
              {activeTab === 'signup' && (
                <motion.div
                  layoutId="tabPill"
                  transition={springMagnetic}
                  className="absolute inset-0 bg-gradient-accent rounded-organic-1 shadow-md z-[-1]"
                />
              )}
              <span className={activeTab === 'signup' ? 'text-white' : ''}>Register</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-5">
              <AnimatedInput
                label="Corporate email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              {loginMode === 'password' && (
                <div className="relative">
                  <AnimatedInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 z-10 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Login Mode */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setLoginMode(loginMode === 'password' ? 'magic' : 'password');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer font-medium uppercase tracking-wider"
              >
                {loginMode === 'password' ? (
                  <>
                    <Mail className="w-3 h-3" />
                    Sign in with Magic Link
                  </>
                ) : (
                  <>
                    <Key className="w-3 h-3" />
                    Sign in with Password
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
                {successMsg}
              </div>
            )}

            <MagneticButton
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Request...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                  Authorization Granted
                </>
              ) : (
                <>
                  <span>{loginMode === 'password' ? 'Submit Credentials' : 'Send Magic Link'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </MagneticButton>

          </form>

          {/* Social connections - Google only */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="text-center text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              or continue with
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-500">
            Encrypted keys subject to strict corporate audit logs.
          </div>

        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-slate-500 font-mono text-xs">LOADING AUTHENTICATOR...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
