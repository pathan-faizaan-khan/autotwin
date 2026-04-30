"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import AutoTwinLogo from "@/components/AutoTwinLogo";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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
      } else if (msg.includes("popup-closed-by-user") || msg.includes("cancelled-popup-request")) {
        // User dismissed popup — not an error, just reset
      } else {
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

  const inputStyle = {
    width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#fafafa", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Inter, sans-serif" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.1), transparent)", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <AutoTwinLogo size={48} glow />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#fafafa" }}>
              AutoTwin{" "}
              <span style={{ backgroundImage: "linear-gradient(135deg,#a78bfa,#818cf8,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(14,14,20,0.85)", backdropFilter: "blur(24px)", padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", marginBottom: 6, letterSpacing: "-0.02em" }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "#71717a" }}>Sign in to your financial command center</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={15} color="#f87171" />
              <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
            </motion.div>
          )}

          {/* Google Sign In */}
          <button onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#d4d4d8", fontSize: 14, fontWeight: 600, cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "all 0.2s" }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
            {googleLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <GoogleIcon />}
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 12, color: "#52525b", whiteSpace: "nowrap" }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || googleLoading}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.35)", marginTop: 4 }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in...</> : "Sign In →"}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#71717a" }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>Create account →</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#3f3f46" }}>
          Protected by AutoTwin AI Security
        </p>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #52525b; }`}</style>
    </div>
  );
}
