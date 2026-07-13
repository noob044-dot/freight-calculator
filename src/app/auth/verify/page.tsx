"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(!!token);
  const [errorMsg, setErrorMsg] = useState<string | null>(token ? null : "No token found in verification URL.");

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Verification failed");
        }

        // Wait to resolve cookie write race
        await new Promise(r => setTimeout(r, 100));

        // Hydrate store
        useStore.getState().setAuth(data.user, data.org, data.token, data.refresh);
        useStore.getState().hydrate();

        // Redirect based on onboarding completeness
        if (!data.user.onboardingComplete) {
          router.push("/onboarding?step=1");
        } else {
          router.push("/dashboard");
        }
      } catch (err: unknown) {
        setLoading(false);
        setErrorMsg(err instanceof Error ? err.message : "Verification failed");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="w-full max-w-[400px] bg-neutral-900/40 border border-white/5 p-8 rounded-2xl text-center space-y-6 backdrop-blur-xl">
      {loading ? (
        <>
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <h2 className="text-xl font-light">Verifying credentials...</h2>
          <p className="text-xs text-slate-500">Securing your workspace tunnel...</p>
        </>
      ) : errorMsg ? (
        <>
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-light text-white">Verification Failed</h2>
          <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:text-white text-slate-300 transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-light text-white">Authorized</h2>
          <p className="text-xs text-slate-400">Success! Navigating to corridor...</p>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <Suspense fallback={
        <div className="w-full max-w-[400px] bg-neutral-900/40 border border-white/5 p-8 rounded-2xl text-center space-y-6 backdrop-blur-xl">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto" />
          <h2 className="text-xl font-light">Loading verification handler...</h2>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
