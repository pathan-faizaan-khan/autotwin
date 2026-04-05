"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { monthlySpendData, vendorSpendData } from "@/services/api";

const tabs = ["Spending Trend", "Vendor Comparison", "Forecast"] as const;
type Tab = typeof tabs[number];

// Recharts custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(14,14,20,0.96)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 12px 32px rgba(0,0,0,0.5)" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>
          {p.name}: ₹{(p.value / 1000).toFixed(0)}K
        </p>
      ))}
    </div>
  );
}

const axisStyle = { fontSize: 11, fill: "#52525b" };
const gridStyle = { stroke: "rgba(255,255,255,0.04)", strokeDasharray: "3 3" };

export default function AnalyticsCharts() {
  const [active, setActive] = useState<Tab>("Spending Trend");

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>Financial Analytics</h2>
          <p style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>Last 6 months + 2 month forecast</p>
        </div>
        <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)}
              style={{ padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
                background: active === t ? "rgba(139,92,246,0.2)" : "transparent",
                color: active === t ? "#a78bfa" : "#71717a",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ height: 280 }}>
        {active === "Spending Trend" && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySpendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#71717a", paddingTop: 8 }} />
              <Line type="monotone" dataKey="actual" name="Actual Spend" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#a78bfa", r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="budget" name="Budget" stroke="#27272a" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {active === "Vendor Comparison" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendorSpendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="vendor" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Spend" radius={[6, 6, 0, 0]}
                fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}

        {active === "Forecast" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySpendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#71717a", paddingTop: 8 }} />
              <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#f472b6" strokeWidth={2.5} fill="url(#forecastGrad)" />
              <Area type="monotone" dataKey="budget" name="Budget Cap" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 5" fill="url(#budgetGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </section>
  );
}
