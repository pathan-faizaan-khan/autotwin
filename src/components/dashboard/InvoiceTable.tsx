"use client";

import { motion } from "framer-motion";
import { recentInvoices } from "@/services/api";

const statusConfig = {
  approved: { label: "Approved", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
  pending: { label: "Pending", color: "#fbbf24", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.2)" },
  needs_review: { label: "Needs Review", color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
  rejected: { label: "Rejected", color: "#71717a", bg: "rgba(113,113,122,0.1)", border: "rgba(113,113,122,0.2)" },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 90 ? "#4ade80" : value >= 75 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#27272a", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 30 }}>{value}%</span>
    </div>
  );
}

export default function InvoiceTable() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>Recent Invoices</h2>
          <p style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>{recentInvoices.length} invoices this period</p>
        </div>
        <button style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa", cursor: "pointer" }}>
          View All →
        </button>
      </div>

      <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 120px 90px", padding: "10px 16px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["Vendor", "Amount", "Status", "Confidence", "Date"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#52525b", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {recentInvoices.map((inv, i) => {
          const st = statusConfig[inv.status];
          return (
            <motion.div key={inv.id}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 100px 130px 120px 90px", padding: "12px 16px", borderBottom: i < recentInvoices.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#d4d4d8" }}>{inv.vendor}</p>
                <p style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>{inv.invoiceNo}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{inv.amount}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", paddingRight: 16 }}>
                <ConfidenceBar value={inv.confidence} />
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#52525b" }}>{inv.date}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
