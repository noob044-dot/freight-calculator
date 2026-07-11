"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Eye, EyeOff, Loader2, Check, Shield, ArrowRight
} from 'lucide-react';
import { AuthScene } from '@/components/three/AuthScene';
import { AnimatedInput } from '@/components/ui/AnimatedInput';
import { MagneticButton } from '@/components/ui/MagneticButton';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (password.length >= 12) score += 1;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthColors = ['bg-rose-600', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Simulate Network latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (activeTab === 'login') {
      // Basic login validation (supports both standard credentials and basic auth backup)
      if ((email === 'admin@freightquote.in' && password === 'Freight@2026') || (email === 'admin' && password === 'admin123')) {
        setSuccess(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Put token in cookies / headers if needed by middleware
        document.cookie = `auth=Basic ${btoa('admin:admin123')}; path=/`;
        router.push('/dashboard');
      } else {
        setLoading(false);
        setErrorMsg('Invalid corporate email or password. Use: admin@freightquote.in / Freight@2026');
      }
    } else {
      // Signup mode
      if (!name || !company || !email || password.length < 8) {
        setLoading(false);
        setErrorMsg('Please complete all corporate validation steps.');
        return;
      }
      setSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDE: WebGL background + stats (60% desktop) */}
      <div className="relative md:w-[60%] min-h-[40vh] md:min-h-screen flex flex-col justify-between p-8 md:p-16 border-r border-white/5 bg-black overflow-hidden">
        
        {/* Three.js particles scene */}
        <AuthScene />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">Freight Intelligence</span>
        </div>

        {/* Big title */}
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

        {/* Metrics */}
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
          
          {/* Logo SVG Draw */}
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
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
            >
              {activeTab === 'login' && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-gradient-accent rounded-organic-1 shadow-md z-[-1]"
                />
              )}
              <span className={activeTab === 'login' ? 'text-white' : ''}>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
            >
              {activeTab === 'signup' && (
                <motion.div
                  layoutId="activeTabPill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-gradient-accent rounded-organic-1 shadow-md z-[-1]"
                />
              )}
              <span className={activeTab === 'signup' ? 'text-white' : ''}>Register</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {activeTab === 'signup' ? (
                <motion.div
                  key="signup-fields-wrap"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <AnimatedInput
                    label="Contact name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <AnimatedInput
                    label="Company name"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                  <AnimatedInput
                    label="Corporate email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
                </motion.div>
              ) : (
                <motion.div
                  key="login-fields-wrap"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <AnimatedInput
                    label="Corporate email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password strength meter */}
            {activeTab === 'signup' && password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  <span>Strength</span>
                  <span>{['Weak', 'Fair', 'Good', 'Strong', 'Excellent'][Math.min(strength, 4)]}</span>
                </div>
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-full rounded-full transition-all duration-300 ${
                        i < strength ? strengthColors[strength - 1] : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                {errorMsg}
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
                  Authenticating...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                  Authorization Granted
                </>
              ) : (
                <>
                  <span>Submit Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </MagneticButton>

          </form>

          {/* Social connections */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="text-center text-[9px] uppercase tracking-widest text-slate-500 font-bold">
              or audit credentials via
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs transition-all duration-200 cursor-pointer"
              >
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs transition-all duration-200 cursor-pointer"
              >
                GitHub
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500">
            Encrypted keys subject to strict corporate audit logs.
          </div>

        </div>

      </div>

    </div>
  );
}
