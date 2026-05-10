"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { QueryProvider } from "@/components/providers/query-provider";
import { useAuth } from "@/context/AuthContext";
import GlobalVoiceCopilot from "@/components/dashboard/GlobalVoiceCopilot";
import Link from "next/link";
import {
  LayoutDashboard, FileText, MessageSquare, Settings, BarChart3,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

const mobileBottomNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarWidth(0);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && user) {
      fetch(`/api/user/me?firebaseUid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.needsOnboarding) {
            router.replace("/onboarding");
          } else {
            setCheckingSetup(false);
          }
        })
        .catch(() => setCheckingSetup(false));
    }
  }, [user, loading, router]);

  if (loading || checkingSetup || !user) return null;

  const isChat = pathname === "/dashboard/chat";

  return (
    <div className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-[#030303] text-zinc-100 selection:bg-violet-500/30 overflow-hidden flex`}>
      <QueryProvider>
        {/* Background glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* Sidebar */}
        <Sidebar
          onWidthChange={setSidebarWidth}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main */}
        <div
          className="flex flex-col flex-1 relative z-10 h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ marginLeft: isMobile ? 0 : sidebarWidth }}
        >
          <TopNav onMobileMenuOpen={() => setMobileSidebarOpen(true)} />

          <main
            id="main-scroll-area"
            className={`flex-1 ${
              isChat
                ? "overflow-hidden pt-[64px] md:pt-[96px]"
                : "overflow-y-auto px-4 md:px-8 lg:px-12 pt-20 md:pt-28 pb-24"
            }`}
          >
            <div className={`mx-auto ${isChat ? "h-full w-full" : "max-w-[1400px]"}`}>
              {children}
            </div>
          </main>

          <GlobalVoiceCopilot />
        </div>

        {/* Mobile bottom navigation bar */}
        {isMobile && (
          <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#030303]/95 backdrop-blur-xl border-t border-white/[0.06] flex items-center justify-around px-2 pb-safe">
            {mobileBottomNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-colors min-w-[52px] ${
                    active ? "text-violet-400" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </QueryProvider>
    </div>
  );
}
