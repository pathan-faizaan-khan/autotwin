"use client";

import { motion } from "framer-motion";
import { Settings, Shield, Zap, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="pb-24">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Workspace Preferences</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Configure AI autonomy thresholds and memory constraints.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
        {/* Navigation Sidebar for settings */}
        <div className="space-y-2">
           {[
             { label: "General", icon: Settings, active: true },
             { label: "AI & Autonomy", icon: Zap, active: false },
             { label: "Security", icon: Shield, active: false },
             { label: "Data Retention", icon: Database, active: false },
           ].map(item => (
             <button key={item.label} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[15px] font-bold transition-all
               ${item.active ? 'bg-white/[0.05] text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}`}>
               <item.icon size={18} /> {item.label}
             </button>
           ))}
        </div>

        {/* Settings Form Content */}
        <div className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-10">
           <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/[0.05] pb-6">AI Confidence & Autonomy</h2>
           
           <div className="space-y-12">
              <div>
                 <div className="flex justify-between items-center mb-4">
                    <div>
                       <label className="block text-white font-bold mb-1 text-lg">Auto-Approve Threshold</label>
                       <p className="text-sm text-zinc-500">Invoices with AI confidence above this percentage bypass the Exceptions Queue.</p>
                    </div>
                    <span className="font-outfit text-3xl font-black text-violet-400">85%</span>
                 </div>
                 <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-violet-500 rounded-full" />
                 </div>
              </div>

              <div>
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <label className="block text-white font-bold mb-1 text-lg">Memory Graph Vector Limit</label>
                       <p className="text-sm text-zinc-500">Maximum historical context window for the Retrieval Agent.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    {['1k (Fast)', '5k (Balanced)', '10k (Deep)'].map((opt, i) => (
                       <button key={opt} className={`flex-1 py-4 rounded-2xl border font-bold text-sm transition-all
                         ${i === 1 ? 'border-violet-500/50 bg-violet-500/10 text-violet-400' : 'border-white/[0.05] bg-transparent text-zinc-400 hover:border-white/20 hover:text-white'}`}>
                          {opt}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="pt-8 border-t border-white/[0.05] flex justify-end">
                 <button className="px-8 py-4 rounded-full bg-white text-black font-bold text-sm tracking-wide hover:bg-zinc-200 transition-colors">
                    Save Configuration
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
