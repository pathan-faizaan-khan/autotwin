"use client";

import { motion } from "framer-motion";
import { FileSearch, TrendingUp, BrainCircuit, RefreshCw, Network, Shield } from "lucide-react";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };

const features = [
  { icon: FileSearch, title: "Invoice Intelligence", desc: "Parse PDFs, images, and emails with 99.2% accuracy.", color: "#a78bfa", bg: "rgba(139,92,246,0.08)" },
  { icon: TrendingUp, title: "Predictive Insights", desc: "Forecast cash flow and vendor price trends 30 days ahead.", color: "#818cf8", bg: "rgba(99,102,241,0.08)" },
  { icon: BrainCircuit, title: "Confidence-Aware AI", desc: "Auto-approves when confident. Asks humans when uncertain.", color: "#f472b6", bg: "rgba(236,72,153,0.08)", highlight: true },
  { icon: RefreshCw, title: "Self-Healing", desc: "Detects broken workflows and fixes them automatically.", color: "#4ade80", bg: "rgba(74,222,128,0.07)" },
  { icon: Network, title: "Memory Graph", desc: "Remembers vendor history so your team doesn't have to.", color: "#fbbf24", bg: "rgba(251,191,36,0.07)" },
  { icon: Shield, title: "Enterprise Security", desc: "AES-256, RBAC, audit logs, and SOC 2 Type II.", color: "#22d3ee", bg: "rgba(34,211,238,0.07)" },
];

export default function FeaturesSection() {
  return (
    <section id="features" style={{ position: "relative", padding: "96px 0" }}>
      <div style={{ ...W, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(167,139,250,0.2)", background: "rgba(124,58,237,0.06)", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
              <span style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Capabilities</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
              Everything you need to <span className="gradient-text">automate finance</span>
            </h2>
            <p style={{ fontSize: 16, color: "#71717a", maxWidth: 440, margin: "0 auto" }}>
              Six capabilities that replace entire finance workflows with AI.
            </p>
          </motion.div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{
                  padding: 24, borderRadius: 16,
                  background: f.highlight ? "rgba(236,72,153,0.05)" : "rgba(255,255,255,0.02)",
                  border: f.highlight ? "1px solid rgba(236,72,153,0.2)" : "1px solid rgba(255,255,255,0.06)",
                  transition: "all 0.2s",
                  cursor: "default",
                }}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={20} color={f.color} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{f.title}</h3>
                  {f.highlight && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "rgba(244,114,182,0.15)", color: "#f472b6", fontWeight: 600, border: "1px solid rgba(244,114,182,0.2)" }}>KEY USP</span>}
                </div>
                <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
