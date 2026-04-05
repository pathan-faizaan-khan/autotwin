"use client";

import { Brain } from "lucide-react";
import Link from "next/link";

const W = { maxWidth: 1200, margin: "0 auto", padding: "0 24px" };

const cols = [
  { title: "Product", links: [{ l: "Features", h: "#features" }, { l: "How It Works", h: "#workflow" }, { l: "Pricing", h: "#pricing" }, { l: "Changelog", h: "/changelog" }] },
  { title: "Company", links: [{ l: "About", h: "/about" }, { l: "Blog", h: "/blog" }, { l: "Careers", h: "/careers" }] },
  { title: "Legal", links: [{ l: "Privacy", h: "/privacy" }, { l: "Terms", h: "/terms" }, { l: "GDPR", h: "/gdpr" }] },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,6,10,0.8)", padding: "56px 0 32px" }}>
      <div style={{ ...W, width: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain size={14} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                <span className="gradient-text">AutoTwin</span>
                <span style={{ color: "#d4d4d8" }}> AI</span>
              </span>
            </Link>
            <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.65, maxWidth: 220 }}>
              Confidence-Aware Financial Intelligence. Stop mistakes before they happen.
            </p>
          </div>

          {/* Links */}
          {cols.map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: "#71717a", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 16 }}>{col.title}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(({ l, h }) => (
                  <Link key={l} href={h} style={{ fontSize: 13, color: "#52525b", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#a1a1aa")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 12, color: "#3f3f46" }}>© {new Date().getFullYear()} AutoTwin AI Technologies Pvt. Ltd.</p>

        </div>
      </div>
    </footer>
  );
}
