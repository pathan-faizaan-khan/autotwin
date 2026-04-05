"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain, LayoutDashboard, FileText, CheckSquare, MessageSquare,
  BarChart3, GitBranch, ScrollText, Plug, Settings,
  ChevronLeft, ChevronRight
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Workflow", href: "/dashboard/workflow", icon: GitBranch },
  { label: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ onWidthChange }: { onWidthChange?: (w: number) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onWidthChange?.(next ? 64 : 224);
  };
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
        background: "rgba(9,9,11,0.97)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        overflow: "hidden", flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10, minHeight: 57 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
          <Brain size={16} color="white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              style={{ fontSize: 14, fontWeight: 800, color: "#fafafa", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
              AutoTwin <span style={{ backgroundImage: "linear-gradient(135deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AI</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "10px 16px" : "9px 12px",
                borderRadius: 8, marginBottom: 2, textDecoration: "none",
                background: active ? "rgba(139,92,246,0.15)" : "transparent",
                border: active ? "1px solid rgba(139,92,246,0.2)" : "1px solid transparent",
                color: active ? "#a78bfa" : "#71717a",
                transition: "all 0.15s ease",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#d4d4d8"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#71717a"; } }}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <button onClick={toggleCollapse}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: "9px 12px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "#52525b", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.background = "none"; }}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
