"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertTriangle, CheckCircle, XCircle, Brain, Loader2, TrendingUp, Clock, DollarSign } from "lucide-react";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };
type Step = "idle" | "uploading" | "analyzing" | "decision";

function ConfidenceMeter() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const iv = setInterval(() => setV(p => { if (p >= 87) { clearInterval(iv); return 87; } return p + 2; }), 18);
      return () => clearInterval(iv);
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#71717a" }}>AI Confidence Score</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#fbbf24" }}>{v}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#27272a", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#f59e0b,#fbbf24)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#52525b" }}>
        <span>Low</span>
        <span style={{ color: "rgba(251,191,36,0.6)" }}>Auto-approval: 95%</span>
        <span>High</span>
      </div>
    </div>
  );
}

export default function DemoSection() {
  const [step, setStep] = useState<Step>("idle");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const run = async () => {
    setDecision(null); setStep("uploading");
    await new Promise(r => setTimeout(r, 1400));
    setStep("analyzing");
    await new Promise(r => setTimeout(r, 2000));
    setStep("decision");
  };
  const reset = () => { setStep("idle"); setDecision(null); };

  const card = { borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: 24 };

  return (
    <section id="demo" style={{ position: "relative", padding: "96px 0" }}>
      <div style={{ ...W, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(244,114,182,0.2)", background: "rgba(236,72,153,0.05)", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f472b6", boxShadow: "0 0 6px #f472b6" }} />
              <span style={{ fontSize: 11, color: "#f472b6", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Live Demo</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
              See it <span className="gradient-text">in action</span>
            </h2>
            <p style={{ fontSize: 16, color: "#71717a", maxWidth: 380, margin: "0 auto" }}>Click to run the demo and watch AI detect a price anomaly in real-time.</p>
          </motion.div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
          {/* Left panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ ...card, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={15} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#fafafa" }}>Invoice Upload</span>
              </div>
              {step !== "idle" && <button onClick={reset} style={{ fontSize: 12, color: "#52525b", background: "none", border: "none", cursor: "pointer" }}>Reset</button>}
            </div>

            <AnimatePresence mode="wait">
              {step === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={run}
                  style={{ border: "2px dashed rgba(139,92,246,0.25)", borderRadius: 12, padding: "40px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                  whileHover={{ borderColor: "rgba(139,92,246,0.5)", background: "rgba(139,92,246,0.04)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <Upload size={22} color="#a78bfa" />
                  </div>
                  <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 600, marginBottom: 6 }}>Click to upload demo invoice</p>
                  <p style={{ fontSize: 12, color: "#52525b" }}>INV-TechnoVendor-1092.pdf · 847 KB</p>
                  <div style={{ marginTop: 14, display: "inline-flex", padding: "4px 14px", borderRadius: 100, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", fontSize: 12, color: "#a78bfa" }}>
                    Click to run demo
                  </div>
                </motion.div>
              )}

              {step === "uploading" && (
                <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: "40px 0" }}>
                  <Loader2 size={36} color="#a78bfa" style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 600 }}>Uploading invoice...</p>
                  <div style={{ height: 4, borderRadius: 2, background: "#27272a", marginTop: 16, overflow: "hidden" }}>
                    <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#7c3aed,#4f46e5)" }} />
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </motion.div>
              )}

              {(step === "analyzing" || step === "decision") && (
                <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <CheckCircle size={13} color="#4ade80" />
                    <span style={{ fontSize: 12, color: "#4ade80" }}>Invoice parsed successfully</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                    {[["Vendor", "TechnoVendor Inc.", "#d4d4d8"], ["Invoice No.", "INV-2024-1092", "#a1a1aa"], ["Amount", "₹1,47,600", "#f87171"], ["Previous", "₹49,200", "#d4d4d8"]].map(([l, v, c]) => (
                      <div key={l}><div style={{ color: "#52525b", marginBottom: 3 }}>{l}</div><div style={{ fontWeight: 600, color: c }}>{v}</div></div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {step !== "idle" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[["File received", true], ["OCR extraction", step !== "uploading"], ["Anomaly detection", step === "decision"], ["Awaiting decision", step === "decision"]].map(([l, done]) => (
                  <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    {done ? <CheckCircle size={13} color="#4ade80" /> : <Loader2 size={13} color="#52525b" style={{ animation: "spin 1s linear infinite" }} />}
                    <span style={{ color: done ? "#a1a1aa" : "#52525b" }}>{l as string}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            style={{ ...card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Brain size={15} color="#a78bfa" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "#fafafa" }}>AutoTwin AI Analysis</span>
              {step === "analyzing" && <Loader2 size={13} color="#a78bfa" style={{ animation: "spin 1s linear infinite", marginLeft: 4 }} />}
            </div>

            <AnimatePresence mode="wait">
              {(step === "idle" || step === "uploading") && (
                <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: "center", padding: "48px 0", color: "#52525b", fontSize: 14 }}>
                  Waiting for invoice...
                </motion.div>
              )}

              {step === "analyzing" && (
                <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Extracting vendor context...", "Checking payment history...", "Running anomaly models..."].map((m, i) => (
                    <motion.div key={m} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#a1a1aa" }}>
                      <Loader2 size={13} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
                      {m}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {step === "decision" && (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Alert */}
                  <div style={{ padding: 14, borderRadius: 12, background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fcd34d", marginBottom: 4 }}>⚠ Vendor price increased by 200%</div>
                      <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>
                        ₹1,47,600 vs previous ₹49,200 — 3× increase. No contract amendment found.
                      </div>
                    </div>
                  </div>

                  <ConfidenceMeter />

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      { l: "Price Change", v: "+200%", icon: TrendingUp, c: "#f87171" },
                      { l: "Last Invoice", v: "43 days", icon: Clock, c: "#71717a" },
                      { l: "Similar", v: "7 found", icon: DollarSign, c: "#a78bfa" },
                    ].map(({ l, v, icon: Icon, c }) => (
                      <div key={l} style={{ padding: "12px 8px", borderRadius: 10, background: "rgba(0,0,0,0.2)", textAlign: "center" }}>
                        <Icon size={14} color={c} style={{ margin: "0 auto 6px" }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
                        <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Decision */}
                  {!decision ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button onClick={() => setDecision("approved")}
                        style={{ padding: "11px 0", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => setDecision("rejected")}
                        style={{ padding: "11px 0", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ padding: 14, borderRadius: 12, background: decision === "approved" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${decision === "approved" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, display: "flex", gap: 10, alignItems: "center" }}>
                      {decision === "approved" ? <CheckCircle size={15} color="#4ade80" /> : <XCircle size={15} color="#f87171" />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: decision === "approved" ? "#4ade80" : "#f87171" }}>
                          {decision === "approved" ? "Payment approved & queued in ERP" : "Invoice rejected — vendor notified"}
                        </div>
                        <div style={{ fontSize: 11, color: "#52525b", marginTop: 3 }}>Logged to audit trail · {new Date().toLocaleTimeString()}</div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
