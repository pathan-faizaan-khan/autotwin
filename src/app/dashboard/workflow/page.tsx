"use client";

import { motion } from "framer-motion";
import { Activity, Play, CheckCircle2, Loader2, PlayCircle, GitBranch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function WorkflowPage() {
  const { data: workflows = [], isLoading } = useQuery({ queryKey: ["workflows"], queryFn: async () => (await axios.get("/api/workflow")).data.workflows || [], refetchInterval: 3000 });

  return (
    <div className="pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
            Autonomous Graph <GitBranch className="text-violet-500" size={40} strokeWidth={3} />
          </h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Self-healing multi-agent execution paths.</p>
        </motion.div>
        <button className="h-[52px] px-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold tracking-widest uppercase text-xs flex items-center gap-3 transition-colors">
          <Play size={14} /> Manually Trigger
        </button>
      </div>

      <div className="space-y-8">
        {isLoading ? (
           [1,2].map(i => <div key={i} className="h-[300px] w-full rounded-[40px] bg-white/[0.01] border border-white/[0.03] animate-pulse" />)
        ) : workflows.length === 0 ? (
           <div className="py-40 border border-dashed border-white/[0.05] rounded-[40px] text-center text-zinc-500">
             <Activity className="mx-auto mb-6 opacity-20" size={64} />
             <p className="font-outfit text-3xl font-black text-zinc-400 mb-2">Graph Idle</p>
             <p>Awaiting ingestion trigger to begin healing cycle.</p>
           </div>
        ) : (
          workflows.map((wf: any, i: number) => (
            <motion.div key={wf.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
               className="bg-[#030303] border border-white/[0.05] rounded-[40px] p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />
               
               <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-12 relative z-10">
                 <div>
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-2xl font-bold text-white tracking-tight">{wf.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border
                        ${wf.status === 'completed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
                          wf.status === 'failed' ? 'text-red-400 border-red-500/20 bg-red-500/10' : 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10'}`}>
                        {wf.status}
                      </span>
                    </div>
                    <p className="text-zinc-500 font-mono text-sm">Target ID: {wf.id} • Trigger: {wf.triggerType}</p>
                 </div>
                 <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all shrink-0">
                    <PlayCircle size={24} />
                 </button>
               </div>

               {/* Modern Agent Step Pipeline */}
               <div className="relative z-10 pl-6">
                 <div className="absolute left-[31px] top-4 bottom-4 w-px bg-white/[0.05]" />
                 <div className="space-y-12">
                   {wf.steps.map((step: any) => (
                     <div key={step.id} className="relative flex gap-8">
                       <div className={`mt-1 shrink-0 ${step.status === 'pending' ? 'opacity-30' : ''}`}>
                          {step.status === 'completed' ? <CheckCircle2 className="text-emerald-500 bg-[#030303]" size={24} /> :
                           step.status === 'running' ? <Loader2 className="text-indigo-400 animate-spin bg-[#030303]" size={24} /> :
                           <div className="w-6 h-6 rounded-full border-2 border-zinc-700 bg-[#030303]" />}
                       </div>
                       <div className={`${step.status === 'pending' ? 'opacity-30' : ''}`}>
                         <h3 className="text-lg font-bold text-zinc-100 mb-1">{step.name}</h3>
                         <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest mb-3">{step.agent}</p>
                         
                         {step.detail && (
                           <div className="px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-zinc-400 text-sm max-w-2xl">
                             {step.detail}
                           </div>
                         )}
                         {step.duration && <p className="text-xs text-zinc-600 font-mono mt-3">{step.duration}</p>}
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
