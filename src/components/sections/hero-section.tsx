"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, TrendingUp, Brain } from "lucide-react";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };
const SECTION = { position: "relative" as const, padding: "96px 0", overflow: "hidden" };

export default function HeroSection() {
  return (
    <section style={{ ...SECTION, minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 120 }}>
      {/* Subtle radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div className="bg-grid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />

      <div style={{ ...W, width: "100%", textAlign: "center" }}>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: "clamp(36px, 5.5vw, 68px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.03em", marginBottom: 20 }}>
          Stop financial mistakes<br />
          <span className="gradient-text">before they happen</span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          style={{ fontSize: 17, color: "#71717a", maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.65 }}>
          AutoTwin AI reads your invoices, detects anomalies, and asks for approval only when it needs to.
        </motion.p>

        {/* Trust row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 24px", marginBottom: 64 }}>
          {["No credit card needed", "20 free invoices/month", "Setup in 2 minutes"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, color: "#52525b", fontSize: 13 }}>
              <CheckCircle size={13} color="#22c55e" />
              {t}
            </div>
          ))}
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
          style={{ position: "relative", maxWidth: 780, margin: "0 auto" }}>
          {/* Glow behind */}
          <div style={{ position: "absolute", inset: "-40px", background: "radial-gradient(ellipse at center, rgba(124,58,237,0.12), transparent 70%)", pointerEvents: "none", borderRadius: 32 }} />

          {/* Card */}
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(12,12,18,0.9)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            {/* Chrome bar */}
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(18,18,26,0.8)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#f87171", "#fbbf24", "#4ade80"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#3f3f46", background: "rgba(255,255,255,0.04)", padding: "2px 12px", borderRadius: 4 }}>app.autotwin.ai/dashboard</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: 20, display: "grid", gridTemplateColumns: "160px 1fr", gap: 16 }}>
              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {["Dashboard", "Invoices", "Analytics", "Alerts", "Settings"].map((item, i) => (
                  <div key={item} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 12, color: i === 0 ? "#a78bfa" : "#3f3f46", background: i === 0 ? "rgba(139,92,246,0.15)" : "transparent" }}>{item}</div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {[
                    { label: "Processed", value: "1,247", sub: "+12%", color: "#a78bfa" },
                    { label: "Anomalies", value: "23", sub: "This month", color: "#f472b6" },
                    { label: "Saved", value: "₹4.2L", sub: "+28%", color: "#818cf8" },
                  ].map(k => (
                    <div key={k.label} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: "#22c55e", marginTop: 2 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Alert */}
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1 }}
                  style={{ padding: 12, borderRadius: 10, background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ padding: 6, borderRadius: 8, background: "rgba(234,179,8,0.12)", flexShrink: 0 }}>
                    <AlertTriangle size={13} color="#fbbf24" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fcd34d", marginBottom: 3 }}>Anomaly Detected</div>
                    <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5 }}>TechnoVendor Inc. — Invoice #1092 — Price up by <span style={{ color: "#f87171", fontWeight: 700 }}>+200%</span></div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#27272a" }}>
                        <div style={{ width: "87%", height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>87%</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer" }}>Approve</button>
                    <button style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>Reject</button>
                  </div>
                </motion.div>

                {/* Mini chart */}
                <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: "#71717a", display: "flex", alignItems: "center", gap: 5 }}><TrendingUp size={11} color="#a78bfa" /> Invoice Volume</span>
                    <span style={{ fontSize: 11, color: "#3f3f46" }}>Last 7 days</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 36 }}>
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8 + i * 0.07, duration: 0.3 }}
                        style={{ flex: 1, height: `${h}%`, minHeight: 3, borderRadius: "3px 3px 0 0", background: "linear-gradient(to top, rgba(139,92,246,0.7), rgba(139,92,246,0.25))", transformOrigin: "bottom" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", bottom: -16, left: 24, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, background: "rgba(9,9,11,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", fontSize: 12, color: "#a78bfa", fontWeight: 500 }}>
            <Brain size={13} color="#a78bfa" />
            Self-Healing Active
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
