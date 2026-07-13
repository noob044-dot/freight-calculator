"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  ArrowRight,
  UserPlus,
  Users
} from "lucide-react";
import dynamic from "next/dynamic";
import { AnimatedInput } from "@/components/ui/AnimatedInput";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { springMagnetic, springGentle } from "@/lib/animations/variants";
import { useStore } from "@/lib/store";

// Lazy-load WebGL AuthScene
const AuthScene = dynamic(() => import("@/components/three/AuthScene").then(mod => mod.AuthScene), {
  ssr: false,
});

// Import zxcvbn factory for secure password strength testing
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";

const zxcvbnOptions = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
};
const zxcvbnTester = new ZxcvbnFactory(zxcvbnOptions);

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"Shipper" | "Forwarder" | "Both">("Shipper");
  const [orgSize, setOrgSize] = useState<"1-10" | "11-50" | "51-200" | "200+">("1-10");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email availability check state
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Calculate email regex validation as derived state
  const emailValidationError = useMemo(() => {
    if (!email) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Enter a valid corporate email";
    }
    return null;
  }, [email]);

  // Debounced email check effect (only async updates)
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        setEmailAvailable(data.available);
      } catch (err) {
        console.error("Email checking failed:", err);
      } finally {
        setEmailChecking(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [email]);

  // Handle email input change to clear states immediately
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !emailRegex.test(val)) {
      setEmailAvailable(null);
      setEmailChecking(false);
    }
  };

  // Calculate password complexity using zxcvbn as derived state (avoiding useEffect hooks)
  const { passwordScore, passwordFeedback } = useMemo(() => {
    if (!password) {
      return { passwordScore: 0, passwordFeedback: null as string | null };
    }
    const result = zxcvbnTester.check(password);
    let feedback: string | null = null;
    if (result.feedback.warning) {
      feedback = result.feedback.warning;
    } else if (result.score < 3) {
      feedback = "Choose a more complex password";
    }
    return { passwordScore: result.score, passwordFeedback: feedback };
  }, [password]);

  const strengthColors = ["bg-rose-600", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-400"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (companyName.trim().length < 2) {
      setErrorMsg("Company Name must be at least 2 characters.");
      return;
    }
    if (contactName.trim().length < 2) {
      setErrorMsg("Contact Name must be at least 2 characters.");
      return;
    }
    if (emailAvailable === false) {
      setErrorMsg("A corporate account with this email address already exists.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (passwordScore < 3) {
      setErrorMsg("Password strength must be at least Strong (level 3).");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!terms) {
      setErrorMsg("You must accept the terms & conditions.");
      return;
    }

    setLoading(true);

    try {
      // Map "Both" role to "Shipper" for standard platform interface constraints
      const mappedRole = role === "Both" ? "Shipper" : role;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyName,
          contactName,
          email,
          password,
          role: mappedRole,
          orgSize,
          terms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setErrorMsg(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
      
      // Inject simulated verification toast alert in state store
      useStore.getState().addNotification(
        "Verification link dispatch",
        "Your magic link verification token has been logged to the server logs console."
      );

      // Transition to verification details page
      setTimeout(() => {
        router.push(`/onboarding?step=1&email=${encodeURIComponent(email)}&token=${data.token}`);
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setLoading(false);
      setErrorMsg("Network error. Failed to establish connection to registration API.");
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT SIDE: WebGL particles + info (60% width) */}
      <div className="relative md:w-[60%] min-h-[40vh] md:min-h-screen flex flex-col justify-between p-8 md:p-16 border-r border-white/5 bg-black overflow-hidden">
        <AuthScene />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest font-mono text-cyan-400">
            Freight Calculator
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-xl space-y-6 pt-12 md:pt-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-wider text-cyan-400">
            <UserPlus className="w-3 h-3 animate-pulse" />
            14-Day Free Evaluation Program
          </span>

          <h1 className="text-4xl md:text-6xl font-light tracking-tight leading-none text-white font-display select-text">
            Start Your <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent font-medium">
              Evaluation.
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed select-text">
            Establish a unified tenant partition. Run real-time rate modeling, benchmark forwarder margins, and reconcile toll costs in seconds.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/5 grid grid-cols-3 gap-6 max-w-lg">
          <div>
            <div className="text-xl font-bold font-mono text-white">100%</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Self Service Setup</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-white">Instant</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Verification Dispatched</div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">₹0</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Setup Fees</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Glass form container (40% width) */}
      <div className="relative md:w-[40%] flex flex-col justify-start items-center p-6 sm:p-12 bg-black/95 backdrop-blur-3xl z-10 overflow-y-auto max-h-screen">
        <div className="w-full max-w-[400px] space-y-6 py-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-light text-white tracking-tight">Organization Register</h2>
            <p className="text-xs text-slate-400 mt-1">Establish workspace tenant profile</p>
          </div>

          <div className="relative flex bg-white/5 p-1 rounded-organic-1 border border-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 text-slate-400 hover:text-white cursor-pointer"
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className="relative z-10 flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-white cursor-default"
            >
              <motion.div
                layoutId="tabPill"
                transition={springMagnetic}
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-organic-1 shadow-md z-[-1]"
              />
              <span>Register</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatedInput
              label="Company Name"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <AnimatedInput
              label="Contact Full Name"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />

            <div className="relative">
              <AnimatedInput
                label="Corporate Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              <div className="absolute right-3 top-3.5 flex items-center gap-1.5">
                {emailChecking && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                {!emailChecking && emailAvailable === true && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                {!emailChecking && emailAvailable === false && (
                  <X className="w-4 h-4 text-rose-500" />
                )}
              </div>
              {emailValidationError && (
                <div className="text-[10px] text-rose-400 mt-1 font-medium">{emailValidationError}</div>
              )}
              {emailAvailable === false && (
                <div className="text-[10px] text-rose-400 mt-1 font-medium">Email is already registered</div>
              )}
            </div>

            <div className="relative">
              <AnimatedInput
                label="Password"
                type={showPassword ? "text" : "password"}
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

            {/* Password strength indicators via zxcvbn */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  <span>Strength</span>
                  <span className={passwordScore >= 3 ? "text-emerald-400" : "text-rose-400"}>
                    {strengthLabels[passwordScore]}
                  </span>
                </div>
                <div className="flex gap-1 h-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 24,
                        delay: i * 0.05,
                      }}
                      className={`flex-1 h-full rounded-full origin-left transition-colors duration-300 ${
                        i <= passwordScore ? strengthColors[passwordScore] : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                {passwordFeedback && (
                  <div className="text-[9px] text-rose-400 font-medium leading-tight">
                    ⚠️ {passwordFeedback}
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <AnimatedInput
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && password !== confirmPassword && (
                <div className="text-[10px] text-rose-400 mt-1 font-medium">Passwords do not match</div>
              )}
            </div>

            {/* Role Radio Cards Selector */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                Choose System Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Shipper", label: "Shipper", desc: "Cargo Owner" },
                  { id: "Forwarder", label: "Forwarder", desc: "Logistics Vendor" },
                  { id: "Both", label: "Both Roles", desc: "Unified View" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as "Shipper" | "Forwarder" | "Both")}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none outline-none ${
                      role === item.id
                        ? "border-cyan-400 bg-cyan-400/[0.03] text-white"
                        : "border-white/5 bg-white/[0.01] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-[10px] uppercase tracking-wide leading-tight">
                      {item.label}
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5">{item.desc}</div>
                    {role === item.id && (
                      <motion.div
                        layoutId="activeRoleBorder"
                        className="absolute inset-0 border border-cyan-400 rounded-xl pointer-events-none"
                        transition={springGentle}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Org Size Selector */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                Organization Size
              </label>
              <div className="relative">
                <select
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value as "1-10" | "11-50" | "51-200" | "200+")}
                  className="w-full py-3 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer select-none appearance-none"
                >
                  <option value="1-10" className="bg-neutral-950 text-white">1 - 10 employees</option>
                  <option value="11-50" className="bg-neutral-950 text-white">11 - 50 employees</option>
                  <option value="51-200" className="bg-neutral-950 text-white">51 - 200 employees</option>
                  <option value="200+" className="bg-neutral-950 text-white">200+ employees</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2.5 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/10 bg-white/[0.02] text-cyan-400 focus:ring-0 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 leading-snug">
                I accept the terms and authorize creation of a 14-day evaluation program sandbox for my organization.
              </span>
            </label>

            {errorMsg && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            <MagneticButton
              type="submit"
              disabled={loading || success || emailAvailable === false || passwordScore < 3}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-organic-1 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : success ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                  Account Initialized
                </>
              ) : (
                <>
                  <span>Create Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </MagneticButton>
          </form>
        </div>
      </div>
    </div>
  );
}
