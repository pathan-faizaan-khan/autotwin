"use client";

import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertOctagon, Lightbulb } from "lucide-react";
import { aiInsights } from "@/services/api";

const typeConfig = {
  critical: { icon: AlertOctagon, color: "#f87171", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.2)", label: "CRITICAL" },
  warning: { icon: TrendingUp, color: "#fbbf24", bg: "rgba(234,179,8,0.07)", border: "rgba(234,179,8,0.2)", label: "WARNING" },
  info: { icon: Lightbulb, color: "#818cf8", bg: "rgba(129,140,248,0.07)", border: "rgba(129,140,248,0.2)", label: "INSIGHT" },
  success: { icon: TrendingDown, color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.2)", label: "SAVED" },
};

export default function AIInsights() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={16} color="#a78bfa" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>AI Insights</h2>
          <p style={{ fontSize: 12, color: "#71717a" }}>Generated just now</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {aiInsights.map((insight, i) => {
          const cfg = typeConfig[insight.type];
          const Icon = cfg.icon;
          return (
            <motion.div key={insight.id}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ x: 2, transition: { duration: 0.15 } }}
              style={{ padding: 16, borderRadius: 14, background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${cfg.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} color={cfg.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.08em" }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, color: "#52525b" }}>{insight.timestamp}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 6, lineHeight: 1.3 }}>{insight.title}</p>
                  <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.55 }}>{insight.description}</p>
                  {insight.metric && (
                    <div style={{ marginTop: 10, padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", display: "inline-block" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{insight.metric}</span>
                    </div>
                  )}
                  {insight.action && (
                    <button style={{ marginTop: 10, display: "block", fontSize: 12, color: cfg.color, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
