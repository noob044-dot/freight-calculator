"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Truck, Check, ChevronRight, ChevronLeft, ShieldCheck, 
  Settings, AlertCircle, Loader2 
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { mockDb } from '@/mock/db';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { AnimatedInput } from '@/components/ui/AnimatedInput';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, org, setAuth } = useStore();
  
  // Form State initialized lazily to avoid cascading renders
  const [role, setRole] = useState(() => {
    const u = useStore.getState().user;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.role || u.role || 'Shipper';
    }
    return 'Shipper';
  });
  const [companyName, setCompanyName] = useState(() => {
    const u = useStore.getState().user;
    const o = useStore.getState().org;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.companyName || o?.name || '';
    }
    return o?.name || '';
  });
  const [gstin, setGstin] = useState(() => {
    const u = useStore.getState().user;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.gstin || '';
    }
    return '';
  });
  const [preferredModes, setPreferredModes] = useState<string[]>(() => {
    const u = useStore.getState().user;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.preferredModes || [];
    }
    return [];
  });
  const [preferredLanes, setPreferredLanes] = useState<string[]>(() => {
    const u = useStore.getState().user;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.preferredLanes || [];
    }
    return [];
  });
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const u = useStore.getState().user;
    if (u) {
      const saved = mockDb.onboarding.get(u.id);
      return saved?.currentStep || 1;
    }
    return 1;
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!useStore.getState().user) {
      router.push('/login');
    }
  }, [router]);

  if (!user) return null;

  const saveCurrentStep = (nextStep: number) => {
    mockDb.onboarding.save(user.id, {
      currentStep: nextStep,
      role,
      companyName,
      gstin,
      preferredModes,
      preferredLanes
    });
    setCurrentStep(nextStep);
  };

  const handleNext = () => {
    setErrorMsg(null);

    if (currentStep === 1) {
      saveCurrentStep(2);
    } else if (currentStep === 2) {
      if (!companyName) {
        setErrorMsg('Company name is required.');
        return;
      }
      if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(gstin.toUpperCase())) {
        setErrorMsg('Enter a valid 15-digit GSTIN or leave blank for evaluation.');
        return;
      }
      saveCurrentStep(3);
    } else if (currentStep === 3) {
      if (preferredModes.length === 0) {
        setErrorMsg('Select at least one preferred mode of transport.');
        return;
      }
      saveCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      // 1. Update user onboarding state in mock database
      const updatedUser = mockDb.users.update(user.id, { 
        onboardingComplete: true, 
        role: role as 'Shipper' | 'Forwarder' | 'admin' | 'viewer' 
      });
      const updatedOrg = mockDb.orgs.get(user.orgId);
      
      // Update local storage store
      if (updatedUser) {
        // Sign custom token again to contain onboardingComplete flag
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: `mock-token-${user.id}` }),
        });
        const data = await res.json();
        
        if (data.success) {
          setAuth(data.user, data.org, data.token, data.refresh);
        } else {
          setAuth(updatedUser, updatedOrg, 'token-bypass', 'refresh-bypass');
        }
      }

      setLoading(false);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErrorMsg('Failed to complete onboarding. Please try again.');
    }
  };

  const toggleMode = (mode: string) => {
    setPreferredModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const toggleLane = (lane: string) => {
    setPreferredLanes(prev => 
      prev.includes(lane) ? prev.filter(l => l !== lane) : [...prev, lane]
    );
  };

  const transportModes = [
    { id: 'road', name: 'Road FTL', desc: 'Full Truckload shipping via highways', icon: Truck },
    { id: 'air', name: 'Air Cargo', desc: 'Express shipping via local and international airlines', icon: Building2 }, // Fallback icon
    { id: 'rail', name: 'Rail Freight', desc: 'Bulk transit via national rail corridors', icon: Settings },
    { id: 'sea', name: 'Sea Freight', desc: 'Ocean container shipments for global logistics', icon: Settings }
  ];

  const indianLanes = [
    'MAHARASHTRA', 'GUJARAT', 'DELHI', 'KARNATAKA', 'TAMIL NADU', 'WEST BENGAL', 'HARYANA', 'PUNJAB'
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 sm:p-12 md:p-16 relative overflow-hidden">
      
      {/* Glow Accent */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/5 pb-4 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">Freight Intelligence</span>
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
          Step {currentStep} of 4
        </div>
      </header>

      {/* Stepper Progress Bar */}
      <div className="relative z-10 max-w-4xl w-full mx-auto my-6">
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="h-full bg-gradient-accent origin-left"
          />
        </div>
      </div>

      {/* Wizard Panel Content */}
      <main className="relative z-10 max-w-2xl w-full mx-auto my-auto py-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: ROLE CONFIRMATION */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-light tracking-tight text-white">Choose your system role</h2>
                <p className="text-xs text-slate-400 mt-1.5">Customize your workspace experience.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('Shipper')}
                  className={`p-5 rounded-2xl border text-left transition-all hover:border-cyan-400/40 relative overflow-hidden group cursor-pointer ${
                    role === 'Shipper' 
                      ? 'border-cyan-400 bg-cyan-400/[0.03]' 
                      : 'border-white/5 bg-white/[0.01]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Shipper / Cargo Owner</h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Compare rates, analyze lane intelligence, benchmark spot rates, and invite forwarders to bid.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Forwarder')}
                  className={`p-5 rounded-2xl border text-left transition-all hover:border-cyan-400/40 relative overflow-hidden group cursor-pointer ${
                    role === 'Forwarder' 
                      ? 'border-cyan-400 bg-cyan-400/[0.03]' 
                      : 'border-white/5 bg-white/[0.01]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white">Freight Forwarder</h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Set up rate card directories, bid on shipper lanes, track invoices, and manage client bookings.
                  </p>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: COMPANY DETAILS */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-light tracking-tight text-white">Tell us about your organization</h2>
                <p className="text-xs text-slate-400 mt-1.5">Enter details to unlock billing and GST support.</p>
              </div>

              <div className="space-y-4">
                <AnimatedInput
                  label="Registered Company Name"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                
                <div className="space-y-1">
                  <AnimatedInput
                    label="Corporate GSTIN (Optional)"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 pl-1">
                    E.g. 27AAFCS4123K1Z1. Required for automatic GST calculations.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CARGO PREFERENCES */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-light tracking-tight text-white">Configure cargo preferences</h2>
                <p className="text-xs text-slate-400 mt-1.5">Select preferred shipping modes and active lanes.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Transport Modes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {transportModes.map(mode => {
                      const Icon = mode.icon;
                      const active = preferredModes.includes(mode.id);
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => toggleMode(mode.id)}
                          className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                            active 
                              ? 'border-cyan-400 bg-cyan-400/5 text-white' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${active ? 'bg-cyan-400/10 text-cyan-400' : 'bg-white/5 text-slate-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-[11px] uppercase tracking-wider">{mode.name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{mode.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Lanes (Select States)</h3>
                  <div className="flex flex-wrap gap-2">
                    {indianLanes.map(state => {
                      const active = preferredLanes.includes(state);
                      return (
                        <button
                          key={state}
                          type="button"
                          onClick={() => toggleLane(state)}
                          className={`px-3 py-1.5 rounded-full border text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                            active 
                              ? 'border-cyan-400 bg-cyan-400/5 text-cyan-400' 
                              : 'border-white/5 bg-white/[0.01] text-slate-400 hover:text-white'
                          }`}
                        >
                          {state}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SETUP COMPLETE */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-6 py-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-light tracking-tight text-white">Setup completed!</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your tenant profile is configured and sync is verified. You are ready to log into the command center.
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3 font-mono text-[10px] text-slate-400">
                <div className="flex justify-between"><span className="text-slate-500">TENANT ORG:</span><span>{org?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">ASSIGNED ROLE:</span><span>{role}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">MODES ENROLLED:</span><span>{preferredModes.map(m => m.toUpperCase()).join(', ') || 'NONE'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">ACTIVE LANES:</span><span>{preferredLanes.join(', ') || 'ALL'}</span></div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {errorMsg && (
          <div className="mt-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="relative z-10 border-t border-white/5 pt-6 max-w-4xl w-full mx-auto flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < 4 ? (
          <MagneticButton
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-102 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </MagneticButton>
        ) : (
          <MagneticButton
            type="button"
            onClick={handleComplete}
            disabled={loading}
            className="px-8 py-3 bg-gradient-accent text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Provisioning...
              </>
            ) : (
              <>
                <span>Enter Command Center</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </>
            )}
          </MagneticButton>
        )}
      </footer>

    </div>
  );
}
