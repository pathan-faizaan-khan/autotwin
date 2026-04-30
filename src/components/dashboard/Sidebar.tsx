"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, MessageSquare,
  BarChart3, Plug, Settings,
  ChevronRight, ChevronLeft, AlertTriangle, TrendingUp, FileSpreadsheet
} from "lucide-react";
import AutoTwinLogo from "@/components/AutoTwinLogo";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { label: "Transactions", href: "/dashboard/transactions", icon: TrendingUp },
  { label: "Manual Approvals", href: "/dashboard/approvals", icon: AlertTriangle },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Financial Sheets", href: "/dashboard/sheets", icon: FileSpreadsheet },
];

const secondaryItems = [
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar({ onWidthChange }: { onWidthChange?: (w: number) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    onWidthChange?.(next ? 80 : 260); // Much wider base sidebar (260px)
  };

  const NavGroup = ({ items }: { items: typeof navItems }) => (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
           <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
             className={`group relative flex items-center gap-4 py-3 rounded-xl transition-all duration-300 ease-out
                ${collapsed ? 'justify-center px-0' : 'px-4'}
                ${active ? 'text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'}`}>
             
             {/* Active Indicator Glow */}
             {active && (
               <motion.div layoutId="active-nav" className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
             )}
             
             <div className="relative z-10 flex items-center justify-center">
               <Icon size={18} className={`transition-colors duration-300 ${active ? 'text-zinc-50' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
               {active && (
                 <div className="absolute inset-0 blur-md bg-white/20" />
               )}
             </div>

             <AnimatePresence>
               {!collapsed && (
                 <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                   className="relative z-10 text-[14px] font-medium tracking-wide">
                   {item.label}
                 </motion.span>
               )}
             </AnimatePresence>
           </Link>
        );
      })}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 bottom-0 z-40 bg-transparent flex flex-col justify-between py-6 px-4"
    >
      <div className="flex flex-col h-full">
        {/* Brand Area */}
        <div className={`flex items-center gap-3 px-2 mb-12 ${collapsed ? 'justify-center' : ''}`}>
          <AutoTwinLogo size={40} borderRadius={12} glow />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
                <span className="font-outfit text-lg font-black tracking-tighter leading-none text-zinc-50 flex items-center gap-1">
                  AutoTwin<span className="text-violet-400">AI</span>
                </span>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Confidence Engine</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar">
          <NavGroup items={navItems} />
        </nav>

        {/* Secondary Navigation & Footer */}
        <div className="mt-8 border-t border-white/[0.04] pt-4 flex flex-col gap-4">
          <NavGroup items={secondaryItems} />
          
          <button onClick={toggleCollapse} className={`group flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.05] transition-all text-zinc-600 hover:text-zinc-300 mt-2 ${collapsed ? 'mx-auto' : 'ml-auto mr-4'}`}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
