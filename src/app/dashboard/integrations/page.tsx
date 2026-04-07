"use client";

import { motion } from "framer-motion";
import { Link2, Hexagon, Component, RefreshCcw } from "lucide-react";

export default function IntegrationsPage() {
  const integrations = [
    { name: "QuickBooks Online", type: "Accounting", status: "connected", logo: "bg-[#2ca01c]", icon: Link2 },
    { name: "Xero", type: "Accounting", status: "disconnected", logo: "bg-[#13b5ea]", icon: Component },
    { name: "NetSuite ERP", type: "ERP", status: "disconnected", logo: "bg-[#000000]", icon: Hexagon },
    { name: "Slack", type: "Notifications", status: "connected", logo: "bg-[#e01e5a]", icon: RefreshCcw },
  ];

  return (
    <div className="pb-24">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Ecosystem Hub</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Connect the AI to your existing ledgers and comm channels.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {integrations.map((int, i) => (
          <motion.div key={int.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
             className="group p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] flex items-center justify-between transition-colors">
             <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[20px] ${int.logo} flex items-center justify-center shadow-lg shadow-black/50 overflow-hidden relative`}>
                   <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                   <int.icon size={28} className="text-white relative z-10" />
                </div>
                <div>
                   <h2 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{int.name}</h2>
                   <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">{int.type}</p>
                </div>
             </div>
             
             <div>
                {int.status === 'connected' ? (
                  <button className="px-6 py-3 rounded-full border border-zinc-700 bg-transparent text-zinc-400 text-[13px] font-bold hover:text-white transition-colors">
                     Manage
                  </button>
                ) : (
                  <button className="px-6 py-3 rounded-full bg-white text-black text-[13px] font-bold hover:bg-zinc-200 transition-colors">
                     Connect
                  </button>
                )}
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
