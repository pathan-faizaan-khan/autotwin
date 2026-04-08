"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { QueryProvider } from "@/components/providers/query-provider";
import { useAuth } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarWidth, setSidebarWidth] = useState(240);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user) return null;

  const isChat = pathname === "/dashboard/chat";

  return (
    <div className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-[#030303] text-zinc-100 selection:bg-violet-500/30 overflow-hidden flex`}>
      <QueryProvider>
        {/* Background Ambient Glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* Sidebar */}
        <Sidebar onWidthChange={setSidebarWidth} />

        {/* Main Interface Wrapper */}
        <div className="flex flex-col flex-1 relative z-10 h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ marginLeft: sidebarWidth }}>
          <TopNav />

          <main id="main-scroll-area" className={`flex-1 ${isChat ? 'overflow-hidden pt-[96px]' : 'overflow-y-auto px-8 md:px-12 pt-28 pb-24'}`}>
            <div className={`mx-auto ${isChat ? 'h-full w-full' : 'max-w-[1400px]'}`}>
              {children}
            </div>
          </main>
        </div>
      </QueryProvider>
    </div>
  );
}
