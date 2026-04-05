"use client";

import { motion } from "framer-motion";
import { Lock, Shield, ClipboardList, Users, Mail, FileSpreadsheet, HardDrive, Database, Webhook, RefreshCcw } from "lucide-react";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };

const security = [
  { icon: Lock, title: "AES-256 Encryption", desc: "All data encrypted at rest and in transit.", color: "#a78bfa", bg: "rgba(139,92,246,0.1)" },
  { icon: Users, title: "Role-Based Access", desc: "Finance, Manager, Auditor, and Admin roles.", color: "#818cf8", bg: "rgba(99,102,241,0.1)" },
  { icon: ClipboardList, title: "Audit Logs", desc: "Every action timestamped and tamper-proof.", color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  { icon: Shield, title: "SOC 2 Type II", desc: "Compliant. ISO 27001 in progress.", color: "#f472b6", bg: "rgba(236,72,153,0.1)" },
];

const integrations = [
  { icon: Mail, name: "Gmail", desc: "Auto-import" },
  { icon: FileSpreadsheet, name: "Google Sheets", desc: "Sync" },
  { icon: HardDrive, name: "Drive", desc: "Storage" },
  { icon: Database, name: "Tally / Zoho", desc: "ERP" },
  { icon: Webhook, name: "REST API", desc: "Custom" },
  { icon: RefreshCcw, name: "Zapier", desc: "No-code" },
];

export default function TrustSection() {
  return (
    <section id="trust" style={{ position: "relative", padding: "96px 0" }}>
      <div style={{ ...W, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.05)", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Security & Trust</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 12 }}>
              Built for <span className="gradient-text">enterprise trust</span>
            </h2>
            <p style={{ fontSize: 16, color: "#71717a", maxWidth: 360, margin: "0 auto" }}>Your financial data is treated with zero compromise.</p>
          </motion.div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          {/* Security */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {security.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.title}
                  initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{ display: "flex", gap: 14, padding: "16px 20px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "#71717a" }}>{s.desc}</div>
                  </div>
                </motion.div>
              );
            })}

            {/* Compliance */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {["SOC 2", "GDPR", "ISO 27001*", "DPDPA"].map(b => (
                <div key={b} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.07)", color: "#71717a", background: "rgba(255,255,255,0.02)" }}>{b}</div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4d4d8", marginBottom: 20 }}>Integrations</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
              {integrations.map((ig, i) => {
                const Icon = ig.icon;
                return (
                  <motion.div key={ig.name}
                    initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    style={{ padding: "16px 12px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", cursor: "default" }}>
                    <Icon size={20} color="#71717a" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#d4d4d8" }}>{ig.name}</div>
                    <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{ig.desc}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* API snippet */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ borderRadius: 12, overflow: "hidden", background: "rgba(6,6,10,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.6 }} />)}
                </div>
                <span style={{ fontSize: 11, color: "#52525b" }}>api.autotwin.ai</span>
              </div>
              <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
                <div><span style={{ color: "#52525b" }}>POST</span> <span style={{ color: "#a1a1aa" }}>/v1/invoices/analyze</span></div>
                <div><span style={{ color: "#a78bfa" }}>Authorization:</span> <span style={{ color: "#52525b" }}>Bearer sk-••••••••</span></div>
                <div style={{ marginTop: 8 }}><span style={{ color: "#4ade80" }}>{"{"}</span> <span style={{ color: "#fcd34d" }}>&quot;file_url&quot;</span><span style={{ color: "#a1a1aa" }}>: &quot;gs://bucket/invoice.pdf&quot;</span> <span style={{ color: "#4ade80" }}>{"}"}</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
