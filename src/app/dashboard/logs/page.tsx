"use client";

import { motion } from "framer-motion";
import { Terminal, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function LogsPage() {
  const { data: logs = [], isLoading } = useQuery({ queryKey: ["logs"], queryFn: async () => (await axios.get("/api/logs")).data.logs || [], refetchInterval: 3000 });

  return (
    <div className="pb-24">
      <div className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
            System TTY <Terminal className="text-zinc-500" strokeWidth={3} size={40} />
          </h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Raw low-latency multiprocess execution logs.</p>
        </div>
        <div className="w-full lg:w-96 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" placeholder="grep stream..." className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:border-white/20 outline-none" />
        </div>
      </div>

      <div className="bg-[#030303] border border-white/[0.05] rounded-[32px] overflow-hidden">
        <div className="flex gap-2 p-5 border-b border-white/[0.05] bg-white/[0.01]">
          <div className="w-3 h-3 rounded-full bg-white/[0.05] hover:bg-red-500/80 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-white/[0.05] hover:bg-amber-500/80 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-white/[0.05] hover:bg-emerald-500/80 transition-colors" />
        </div>
        
        <div className="p-8 max-h-[700px] overflow-y-auto font-mono text-[13px] leading-relaxed relative">
          {isLoading ? (
             <div className="text-zinc-600 animate-pulse">Initializing socket connection to verbose log stream...</div>
          ) : logs.length === 0 ? (
             <div className="text-zinc-600">No output returned. System standing by...</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="group flex flex-col md:flex-row md:items-start gap-4 p-2 -mx-2 rounded bg-transparent hover:bg-white/[0.02] transition-colors">
                  <div className="text-zinc-600 shrink-0 w-44">[{new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 23)}]</div>
                  <div className="flex-1 flex flex-col xl:flex-row gap-4">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest shrink-0 h-fit uppercase 
                       ${log.agent.includes('Vision') ? 'bg-cyan-500/10 text-cyan-400' : log.agent.includes('Confidence') ? 'bg-violet-500/10 text-violet-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                       {log.agent}
                     </span>
                     <span className="text-zinc-300">
                       <span className="text-zinc-100 font-bold">{log.action}: </span>
                       {log.details}
                       {log.confidence && <span className="ml-2 text-violet-400 font-bold">[{log.confidence}% CONF]</span>}
                     </span>
                  </div>
                  <div className="text-zinc-600 md:ml-auto md:text-right shrink-0">{log.durationMs}ms</div>
                </div>
              ))}
              <div className="text-zinc-600 pt-8 animate-pulse text-xs">...stream alive</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
