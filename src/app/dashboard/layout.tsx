"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(224);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <p style={{ color: "#52525b", fontSize: 14 }}>Loading AutoTwin AI...</p>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <Sidebar onWidthChange={setSidebarWidth} />

      {/* Top Nav — positioned after sidebar */}
      <TopNav sidebarWidth={sidebarWidth} />

      {/* Main content */}
      <main style={{
        marginLeft: sidebarWidth,
        paddingTop: 56,
        minHeight: "100vh",
        transition: "margin-left 0.25s ease",
        background: "#09090b",
      }}>
        <div style={{ padding: "28px 28px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
