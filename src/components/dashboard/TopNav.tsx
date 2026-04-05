"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, ChevronDown, LogOut, User, Settings, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { notifications } from "@/services/api";

export default function TopNav({ sidebarWidth }: { sidebarWidth: number }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  const notifTypeColor = (t: string) =>
    t === "alert" ? "#fbbf24" : t === "error" ? "#f87171" : t === "success" ? "#4ade80" : "#818cf8";

  return (
    <div style={{
      position: "fixed", top: 0, left: sidebarWidth, right: 0, height: 56, zIndex: 30,
      background: "rgba(9,9,11,0.94)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      transition: "left 0.25s ease",
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
        <Search size={14} color="#52525b" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Ask AI anything… e.g. 'Show anomalies this month'"
          style={{
            width: "100%", padding: "8px 12px 8px 36px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            color: "#d4d4d8", fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.4)")}
          onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.07)")}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#52525b", display: "flex" }}>
            <X size={13} />
          </button>
        )}
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            style={{ position: "relative", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#71717a" }}>
            <Bell size={16} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 6, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#f87171", border: "2px solid #09090b" }} />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }}
                style={{ position: "absolute", top: 44, right: 0, width: 320, borderRadius: 14, background: "rgba(14,14,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 100 }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>Notifications</span>
                  {unread > 0 && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: "rgba(248,113,113,0.15)", color: "#f87171", fontWeight: 600 }}>{unread} new</span>}
                </div>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", background: n.read ? "transparent" : "rgba(139,92,246,0.03)" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: notifTypeColor(n.type), marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: n.read ? "#71717a" : "#d4d4d8", marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: "#52525b", lineHeight: 1.4 }}>{n.description}</p>
                          <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 4 }}>{n.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px 6px 6px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>
              {initials}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#d4d4d8", lineHeight: 1.2 }}>{user?.displayName || "User"}</p>
              <p style={{ fontSize: 11, color: "#52525b", lineHeight: 1.2 }}>{user?.email}</p>
            </div>
            <ChevronDown size={13} color="#52525b" style={{ transform: showUser ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <AnimatePresence>
            {showUser && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.15 }}
                style={{ position: "absolute", top: 44, right: 0, width: 200, borderRadius: 14, background: "rgba(14,14,20,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)", overflow: "hidden", zIndex: 100 }}>
                {[
                  { icon: User, label: "Profile", action: () => {} },
                  { icon: Settings, label: "Settings", action: () => {} },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action}
                    style={{ width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", fontSize: 13, textAlign: "left" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#fafafa"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#a1a1aa"; }}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", margin: "4px 0" }} />
                <button onClick={handleSignOut}
                  style={{ width: "100%", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <LogOut size={14} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`input::placeholder { color: #52525b; }`}</style>
    </div>
  );
}
