"use client";

import { motion } from "framer-motion";
import { Upload, ScanLine, AlertOctagon, UserCheck, Zap } from "lucide-react";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };

const steps = [
  { n: "01", icon: Upload, title: "Upload", desc: "PDFs, images, or email forwards.", color: "#a78bfa", bg: "rgba(139,92,246,0.1)" },
  { n: "02", icon: ScanLine, title: "Extract", desc: "AI reads vendor, amounts, GST in 3s.", color: "#818cf8", bg: "rgba(99,102,241,0.1)" },
  { n: "03", icon: AlertOctagon, title: "Detect", desc: "Flags price spikes and duplicates.", color: "#f472b6", bg: "rgba(236,72,153,0.1)" },
  { n: "04", icon: UserCheck, title: "Approve", desc: "Asks humans only when needed.", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  { n: "05", icon: Zap, title: "Execute", desc: "Updates ERP, Sheets, Slack—automatically.", color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
];

export default function HowItWorksSection() {
  return (
    <section id="workflow" style={{ position: "relative", padding: "96px 0" }}>
      <div style={{ ...W, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.06)", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#818cf8" }} />
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>How It Works</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
              Upload to action in <span className="gradient-text">5 seconds</span>
            </h2>
            <p style={{ fontSize: 16, color: "#71717a", maxWidth: 360, margin: "0 auto" }}>
              A fully transparent AI pipeline — no black boxes.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.n}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: s.color, marginBottom: 14, fontWeight: 600 }}>{s.n}</div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon size={22} color={s.color} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.55 }}>{s.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Status bar */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
          style={{ marginTop: 24, padding: "14px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#d4d4d8" }}>Runs 24/7 without your team lifting a finger</div>
            <div style={{ fontSize: 12, color: "#52525b", marginTop: 3 }}>95% of invoices processed autonomously</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#52525b" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            System Online · 99.97% Uptime
          </div>
        </motion.div>
      </div>
    </section>
  );
}
