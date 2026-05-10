"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Shield, Zap, BarChart3, Bot, CheckCircle2, ArrowRight,
} from "lucide-react";
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

const features = [
  {
    icon: Bot,
    title: "AI-Powered Financial Memory",
    desc: "Natural language queries across all your invoices, vendors, and transactions.",
  },
  {
    icon: Shield,
    title: "Risk Prevention Engine",
    desc: "Confidence scoring stops duplicate payments and fraud before they happen.",
  },
  {
    icon: Zap,
    title: "Instant OCR Extraction",
    desc: "Drop any invoice — PDF, image, WhatsApp — and get structured data in seconds.",
  },
  {
    icon: BarChart3,
    title: "Live Financial Analytics",
    desc: "Real-time spend breakdowns, anomaly detection, and vendor risk dashboards.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("unauthorized-domain")) {
        setError("This domain is not authorized. Contact support.");
      } else if (!msg.includes("popup-closed-by-user") && !msg.includes("cancelled-popup-request")) {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        setError("Invalid email or password. Please try again.");
      } else if (msg.includes("user-not-found")) {
        setError("No account found. Create an account first.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait before retrying.");
      } else {
        setError("Sign in failed. Check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex overflow-hidden">
      <GoogleOneTap context="signin" />

      {/* ── Left panel: Features ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12 xl:p-16">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-[#030303] to-indigo-950/60" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/15 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <AutoTwinLogo size={40} glow />
            <span className="font-outfit text-xl font-black tracking-tighter text-white">
              AutoTwin<span className="text-violet-400">AI</span>
            </span>
          </Link>

          {/* Main copy */}
          <div className="mt-auto mb-10">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Trusted by 500+ finance teams
              </span>
              <h2 className="font-outfit text-4xl xl:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-6">
                Your financial data,<br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                  finally intelligent.
                </span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
                AutoTwin AI extracts, analyzes, and protects your financial operations — across Gmail, WhatsApp, and your entire invoice stack.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-10 space-y-4"
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{f.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-3 pt-8 border-t border-white/[0.05]"
          >
            <div className="flex -space-x-2">
              {["V", "S", "R", "M"].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 border-2 border-[#030303] flex items-center justify-center text-[10px] font-bold text-white">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              <span className="text-zinc-300 font-semibold">500+ finance teams</span> rely on AutoTwin AI daily
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col items-center justify-center p-6 md:p-10 lg:p-12 relative bg-[#030303] lg:border-l lg:border-white/[0.04]">
        {/* Mobile logo */}
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
          className="w-full max-w-[400px]"
        >
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-outfit font-black text-white tracking-tighter mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-500 text-sm">Sign in to your financial command center</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </motion.div>
          )}

          {/* Google */}
          <button
            id="google-signin-btn"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.16] text-zinc-200 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-600">or sign in with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] focus:border-violet-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.12] focus:border-violet-500/50 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-600">
            <CheckCircle2 size={11} className="text-emerald-600" />
            End-to-end encrypted · SOC 2 compliant
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Create account →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        input::placeholder { color: #52525b; }
        .bg-red-500\\/8 { background-color: rgba(239,68,68,0.08); }
      `}</style>
    </div>
  );
}
