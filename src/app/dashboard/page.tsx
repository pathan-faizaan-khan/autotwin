"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { DollarSign, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: analytics, isLoading: analyticsLoading } = useQuery({ queryKey: ["analytics"], queryFn: async () => (await axios.get("/api/analytics")).data });
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({ queryKey: ["workflows"], queryFn: async () => (await axios.get("/api/workflow")).data.workflows || [], refetchInterval: 5000 });
  const { data: approvals = [] } = useQuery({ queryKey: ["approvals"], queryFn: async () => (await axios.get("/api/approvals")).data.approvals || [], refetchInterval: 5000 });

  const pendingApprovals = approvals.filter((a: any) => a.status === "pending");
  const totalSpend = analytics?.summary?.totalSpend || 0;
  const latestWorkflow = workflows[0];

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-20">
        <h1 className="font-outfit text-[56px] font-black tracking-tighter leading-tight text-white mb-4">
          Financial<br />Command Center.
        </h1>
        <p className="text-xl text-zinc-500 font-light max-w-xl">
          Welcome back, {user?.displayName || user?.email?.split("@")[0] || "Admin"}. Your autonomous agents are standing by.
        </p>
      </motion.div>

      {/* Extreme Minimalist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* KPI 1 */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} 
          className="group relative h-[280px] p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] hover:border-white/[0.08] transition-all flex flex-col justify-between overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-violet-600/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="w-12 h-12 rounded-full border border-violet-500/20 bg-violet-500/10 flex items-center justify-center text-violet-400">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-2">Total Managed Spend</h3>
            {analyticsLoading ? <div className="h-14 w-48 bg-white/5 rounded-xl animate-pulse" /> : 
              <div className="font-outfit text-5xl font-black text-white tracking-tighter">₹{totalSpend.toLocaleString()}</div>
            }
          </div>
        </motion.div>

        {/* KPI 2 & Fast Route */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} 
          className="group relative h-[280px] p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] hover:border-amber-500/20 transition-all flex flex-col justify-between overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div className={`w-12 h-12 rounded-full border ${pendingApprovals.length > 0 ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-white/5 bg-white/[0.02] text-zinc-600'} flex items-center justify-center`}>
              <AlertTriangle size={20} />
            </div>
            {pendingApprovals.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold tracking-widest uppercase">Action Req</span>
            )}
          </div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <h3 className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-2">Exceptions Queue</h3>
              {analyticsLoading ? <div className="h-14 w-24 bg-white/5 rounded-xl animate-pulse" /> : 
                <div className={`font-outfit text-5xl font-black tracking-tighter ${pendingApprovals.length > 0 ? "text-amber-400" : "text-zinc-100"}`}>{pendingApprovals.length}</div>
              }
            </div>
            <Link href="/dashboard/approvals" className="w-12 h-12 rounded-full border border-white/[0.05] flex items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Live Signal Panel */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} 
          className="group h-[280px] p-8 rounded-[32px] bg-gradient-to-br from-indigo-950/20 to-black border border-indigo-500/10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
             <Activity className="text-indigo-400" size={24} />
             <span className="font-outfit text-lg font-bold text-zinc-100 tracking-tight">System Pulse</span>
          </div>
          
          <div className="relative z-10">
            {workflowsLoading ? (
               <div className="space-y-4">
                 <div className="h-6 w-3/4 bg-white/5 rounded-md animate-pulse" />
                 <div className="h-4 w-1/2 bg-white/5 rounded-md animate-pulse" />
               </div>
            ) : !latestWorkflow ? (
               <div>
                  <p className="text-2xl font-outfit font-bold text-white mb-2">Awaiting Directives.</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">Agents are on standby. Upload an invoice to trigger processing.</p>
               </div>
            ) : (
               <div>
                 <p className="text-2xl font-outfit font-bold text-white mb-2 line-clamp-1">{latestWorkflow.name}</p>
                 <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="relative flex h-2 w-2">
                       <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${latestWorkflow.status === 'running' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                       <span className={`relative inline-flex rounded-full h-2 w-2 ${latestWorkflow.status === 'running' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                     </span>
                    {latestWorkflow.status === 'running' ? 'Agents Active' : 'Last run complete'}
                 </div>
               </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
