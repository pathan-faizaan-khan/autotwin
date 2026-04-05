"use client";

import { motion } from "framer-motion";
import OverviewCards from "@/components/dashboard/OverviewCards";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import InvoiceTable from "@/components/dashboard/InvoiceTable";
import AIInsights from "@/components/dashboard/AIInsights";
import WorkflowMonitor from "@/components/dashboard/WorkflowMonitor";
import { useAuth } from "@/context/AuthContext";

const card = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 24,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fafafa", letterSpacing: "-0.03em", marginBottom: 4 }}>
          {greeting}, {user?.displayName || user?.email?.split("@")[0] || "there"} 👋
        </h1>
        <p style={{ fontSize: 14, color: "#71717a" }}>
          Here&apos;s what AutoTwin AI is watching for you right now.
        </p>
      </motion.div>

      {/* ── Row 1: Overview KPIs ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        style={{ marginBottom: 24 }}>
        <OverviewCards />
      </motion.div>

      {/* ── Row 2: Charts + AI Insights ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>
        <div style={card}>
          <AnalyticsCharts />
        </div>
        <div style={card}>
          <AIInsights />
        </div>
      </motion.div>

      {/* ── Row 3: Alerts ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        style={{ ...card, marginBottom: 24 }}>
        <AlertsPanel />
      </motion.div>

      {/* ── Row 4: Invoice Table + Workflow ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <div style={card}>
          <InvoiceTable />
        </div>
        <div style={card}>
          <WorkflowMonitor />
        </div>
      </motion.div>
    </div>
  );
}
