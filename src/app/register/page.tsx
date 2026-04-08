"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, CheckCircle, Phone } from "lucide-react";
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

  const inputStyle = {
    width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#fafafa", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.1), transparent)", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 10 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
              <Brain size={24} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#fafafa" }}>
              AutoTwin{" "}
              <span style={{ backgroundImage: "linear-gradient(135deg,#a78bfa,#818cf8,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(14,14,20,0.85)", backdropFilter: "blur(24px)", padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", marginBottom: 6, letterSpacing: "-0.02em" }}>Create your account</h1>
            <p style={{ fontSize: 14, color: "#71717a" }}>Start preventing financial mistakes today</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={15} color="#f87171" />
              <span style={{ fontSize: 13, color: "#f87171" }}>{error}</span>
            </motion.div>
          )}

          {/* Google Sign Up */}
          <button onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ width: "100%", padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#d4d4d8", fontSize: 14, fontWeight: 600, cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "all 0.2s" }}
            onMouseEnter={e => { if (!googleLoading) { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}>
            {googleLoading ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <GoogleIcon />}
            {googleLoading ? "Connecting..." : "Sign up with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 12, color: "#52525b", whiteSpace: "nowrap" }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Smith"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Work Email</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>WhatsApp Number</label>
              <div style={{ position: "relative" }}>
                <Phone size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+91 98765 43210 (optional)"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
              </div>
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>Used for WhatsApp invoice alerts (optional)</p>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {strengthLevel && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 3, borderRadius: 2, background: "#27272a", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: strengthWidth }} transition={{ duration: 0.3 }}
                      style={{ height: "100%", borderRadius: 2, background: strengthColor }} />
                  </div>
                  <p style={{ fontSize: 11, color: strengthColor, marginTop: 3 }}>
                    {strengthLevel === "strong" ? "Strong password ✓" : strengthLevel === "medium" ? "Medium — add uppercase & numbers" : "Weak password"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#52525b" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password"
                  style={{
                    ...inputStyle, paddingRight: 42,
                    borderColor: confirm && password !== confirm ? "rgba(239,68,68,0.4)" : confirm && password === confirm ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                  onBlur={e => (e.target.style.borderColor =
                    password && confirm && password !== confirm ? "rgba(239,68,68,0.4)"
                    : password && confirm && password === confirm ? "rgba(74,222,128,0.4)"
                    : "rgba(255,255,255,0.08)")} />
                {confirm && password === confirm && (
                  <CheckCircle size={15} color="#4ade80" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }} />
                )}
              </div>
            </div>

            <button type="submit" disabled={loading || googleLoading}
              style={{ width: "100%", padding: "12px", borderRadius: 10, background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.35)", marginTop: 4 }}>
              {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</> : "Create Account →"}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#71717a" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none" }}>Sign in →</Link>
            </p>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input::placeholder { color: #52525b; }`}</style>
    </div>
  );
}
