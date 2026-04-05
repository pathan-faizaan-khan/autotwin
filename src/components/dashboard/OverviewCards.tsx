"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IndianRupee, Flame, Building2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { overviewMetrics } from "@/services/api";

const iconMap: Record<string, React.ReactNode> = {
  IndianRupee: <IndianRupee size={20} />,
  Flame: <Flame size={20} />,
  Building2: <Building2 size={20} />,
  AlertTriangle: <AlertTriangle size={20} />,
};

function AnimatedCounter({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  if (prefix === "₹") {
    return <span>{prefix}{val.toLocaleString("en-IN")}</span>;
  }
  return <span>{val.toLocaleString()}</span>;
}

export default function OverviewCards() {
  const colors: Record<string, { bg: string; border: string }> = {
    "#a78bfa": { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
    "#f472b6": { bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)" },
    "#818cf8": { bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.2)" },
    "#fbbf24": { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)" },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
      {overviewMetrics.map((m, i) => {
        const c = colors[m.color] || { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" };
        const isPositive = m.trend === "up";
        const isNeutral = m.trend === "neutral";
        const trendColor = isNeutral ? "#71717a" : m.id === "alerts" || m.id === "burn" ? (isPositive ? "#f87171" : "#4ade80") : (isPositive ? "#4ade80" : "#f87171");

        return (
          <motion.div key={m.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            style={{ padding: 22, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.07)`, position: "relative", overflow: "hidden" }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${m.color}18 0%, transparent 70%)`, pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: m.color }}>
                {iconMap[m.icon]}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 100, background: `${trendColor}14`, fontSize: 12, fontWeight: 600, color: trendColor }}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(m.change)}%
              </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 900, color: "#fafafa", letterSpacing: "-0.03em", marginBottom: 4 }}>
              {m.value.startsWith("₹")
                ? <AnimatedCounter target={m.rawValue} prefix="₹" />
                : <AnimatedCounter target={m.rawValue} />
              }
            </div>
            <p style={{ fontSize: 13, color: "#71717a" }}>{m.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
