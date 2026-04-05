"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { anomalyAlerts } from "@/services/api";
import type { AnomalyAlert } from "@/types/dashboard";

const severityConfig = {
  high: { color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", label: "HIGH" },
  medium: { color: "#fbbf24", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)", label: "MED" },
  low: { color: "#4ade80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.2)", label: "LOW" },
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(anomalyAlerts);
  const [expanded, setExpanded] = useState<string | null>(null);

  const act = (id: string, status: AnomalyAlert["status"]) => {
    setAlerts(a => a.map(x => x.id === id ? { ...x, status } : x));
  };

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>⚠ Anomaly Alerts</h2>
          <p style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>{alerts.filter(a => a.status === "pending").length} require action</p>
        </div>
        <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 100, background: "rgba(248,113,113,0.12)", color: "#f87171", fontWeight: 600, border: "1px solid rgba(248,113,113,0.2)" }}>
          {alerts.filter(a => a.severity === "high").length} High Risk
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((alert, i) => {
          const sev = severityConfig[alert.severity];
          const isOpen = expanded === alert.id;
          const isResolved = alert.status === "approved" || alert.status === "rejected";

          return (
            <motion.div key={alert.id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              style={{ borderRadius: 14, border: `1px solid ${isResolved ? "rgba(255,255,255,0.05)" : sev.border}`, background: isResolved ? "rgba(255,255,255,0.01)" : sev.bg, overflow: "hidden", opacity: isResolved ? 0.55 : 1 }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                onClick={() => setExpanded(isOpen ? null : alert.id)}>
                <div style={{ padding: "4px 8px", borderRadius: 6, background: `${sev.color}18`, fontSize: 10, fontWeight: 800, color: sev.color, letterSpacing: "0.06em", flexShrink: 0 }}>
                  {sev.label}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isResolved ? "#71717a" : "#fafafa", marginBottom: 2 }}>{alert.title}</p>
                  <p style={{ fontSize: 12, color: "#52525b" }}>{alert.vendor} · {alert.amount} · <span style={{ color: alert.change.startsWith("+") ? "#f87171" : "#fbbf24" }}>{alert.change}</span></p>
                </div>

                {/* Confidence */}
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: sev.color }}>{alert.confidence}%</p>
                  <p style={{ fontSize: 10, color: "#52525b" }}>confidence</p>
                </div>

                {/* Status */}
                <div style={{ padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, flexShrink: 0,
                  background: alert.status === "approved" ? "rgba(74,222,128,0.12)" : alert.status === "rejected" ? "rgba(239,68,68,0.12)" : alert.status === "reviewing" ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.05)",
                  color: alert.status === "approved" ? "#4ade80" : alert.status === "rejected" ? "#f87171" : alert.status === "reviewing" ? "#818cf8" : "#71717a",
                }}>
                  {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                </div>

                <div style={{ color: "#52525b" }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, padding: "12px 0" }}>{alert.description}</p>
                  <p style={{ fontSize: 11, color: "#52525b", marginBottom: 12 }}>{alert.timestamp}</p>
                  {!isResolved && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => act(alert.id, "approved")}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button onClick={() => act(alert.id, "rejected")}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <XCircle size={13} /> Reject
                      </button>
                      <button onClick={() => act(alert.id, "reviewing")}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Eye size={13} /> Review
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
