"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import AutoTwinLogo from "@/components/AutoTwinLogo";
import Link from "next/link";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "Demo", href: "#demo" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 50,
          background: scrolled ? "rgba(9,9,11,0.92)" : "rgba(9,9,11,0.5)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <AutoTwinLogo size={32} />
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
              <span className="gradient-text">AutoTwin</span>
              <span style={{ color: "#d4d4d8" }}> AI</span>
            </span>
          </Link>

          {/* Nav */}
          <nav style={{ display: "flex", gap: 32, alignItems: "center" }} className="hidden-mobile">
            {links.map((l) => (
              <Link key={l.label} href={l.href} style={{ color: "#71717a", fontSize: 14, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/login" style={{ color: "#71717a", fontSize: 14, textDecoration: "none", padding: "6px 12px", fontWeight: 500 }}
              className="hidden-mobile"
              onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d8")}
              onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}>
              Sign in
            </Link>
            <Link href="/register" style={{ fontSize: 13, fontWeight: 600, padding: "7px 18px", borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,0.25)" }}>
              Get Started
            </Link>
            <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", display: "none", padding: 4 }} className="show-mobile">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ position: "fixed", top: 56, left: 0, right: 0, zIndex: 49, background: "rgba(9,9,11,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px 20px" }}>
            {links.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setOpen(false)}
                style={{ display: "block", color: "#a1a1aa", fontSize: 15, textDecoration: "none", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
