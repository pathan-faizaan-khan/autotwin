"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowRight,
  Shield, Zap, BarChart3, Bot,
} from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import AutoTwinLogo from "@/components/AutoTwinLogo";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import GoogleOneTap from "@/components/GoogleOneTap";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const perks = [
  { icon: Bot, text: "AI memory across all your invoices" },
  { icon: Shield, text: "Fraud & duplicate detection built-in" },
  { icon: Zap, text: "WhatsApp + Gmail invoice automation" },
  { icon: BarChart3, text: "Real-time spend analytics dashboard" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const saveProfile = async (uid: string, displayName: string | null, emailAddr: string, whatsappNumber?: string) => {
    try {
      await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: uid, displayName, email: emailAddr, whatsappNumber }),
      });
    } catch { /* non-fatal */ }
  };

  const strengthLevel = password.length >= 8
    ? (password.match(/[A-Z]/) && password.match(/[0-9]/) ? "strong" : "medium")
    : password.length > 0 ? "weak" : null;
  const strengthColor = strengthLevel === "strong" ? "#4ade80" : strengthLevel === "medium" ? "#fbbf24" : "#f87171";
  const strengthWidth = strengthLevel === "strong" ? "100%" : strengthLevel === "medium" ? "60%" : "30%";

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      await saveProfile(googleUser.uid, googleUser.displayName, googleUser.email ?? "");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("popup-closed-by-user") && !msg.includes("cancelled-popup-request")) {
        setError("Google sign-up failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const newUser = await signUp(email, password, name);
      await saveProfile(newUser.uid, name, email, whatsapp || undefined);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists. Sign in instead.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("weak-password")) {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex overflow-hidden">
      <GoogleOneTap context="signup" />

      {/* ── Left panel: Perks ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 xl:p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#030303] to-violet-950/60" />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <AutoTwinLogo size={40} glow />
            <span className="font-outfit text-xl font-black tracking-tighter text-white">
              AutoTwin<span className="text-violet-400">AI</span>
            </span>
          </Link>

          <div className="mt-auto mb-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              <h2 className="font-outfit text-4xl xl:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-6">
                Stop financial mistakes<br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                  before they cost you.
                </span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                Join 500+ finance teams automating invoice processing, catching fraud, and getting AI-powered insights — starting today.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="mt-10 grid grid-cols-1 gap-3"
            >
              {perks.map((p, i) => (
                <motion.div
                  key={p.text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <p.icon size={15} className="text-violet-400" />
                  </div>
                  <span className="text-sm text-zinc-300 font-medium">{p.text}</span>
                  <CheckCircle size={14} className="text-emerald-500 ml-auto shrink-0" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Right panel: Register form ── */}
      <div className="w-full lg:w-[500px] xl:w-[540px] flex flex-col items-center justify-center p-6 md:p-10 lg:p-12 relative bg-[#030303] lg:border-l lg:border-white/[0.04] overflow-y-auto">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <AutoTwinLogo size={44} glow />
            <span className="font-outfit text-xl font-black tracking-tighter text-white">
              AutoTwin<span className="text-violet-400">AI</span>
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-[420px] py-6 lg:py-0"
        >
          <div className="mb-7">
            <h1 className="text-2xl md:text-3xl font-outfit font-black text-white tracking-tighter mb-2">
              Create your account
            </h1>
            <p className="text-zinc-500 text-sm">Start preventing financial mistakes today</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-xl border flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </motion.div>
          )}

          <button
            id="google-signup-btn"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-zinc-200 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            {googleLoading ? "Connecting..." : "Sign up with Google"}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-600">or register with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Smith"
                  className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] focus:border-violet-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Work Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                  className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] focus:border-violet-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all" />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">WhatsApp Number <span className="normal-case text-zinc-600 font-normal">(optional)</span></label>
              <PhoneInput value={whatsapp} onChange={setWhatsapp} placeholder="Phone number for invoice alerts" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters"
                  className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] focus:border-violet-500/50 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {strengthLevel && (
                <div className="mt-2">
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: strengthWidth }} transition={{ duration: 0.3 }}
                      className="h-full rounded-full" style={{ background: strengthColor }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: strengthColor }}>
                    {strengthLevel === "strong" ? "Strong password ✓" : strengthLevel === "medium" ? "Medium — add uppercase & numbers" : "Weak password"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password"
                  className="w-full bg-white/[0.03] rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                  style={{
                    border: confirm && password !== confirm ? "1px solid rgba(239,68,68,0.4)"
                      : confirm && password === confirm ? "1px solid rgba(74,222,128,0.4)"
                      : "1px solid rgba(255,255,255,0.07)",
                  }} />
                {confirm && password === confirm && (
                  <CheckCircle size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : <>Create Account <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">Sign in →</Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`input::placeholder { color: #52525b; }`}</style>
    </div>
  );
}
