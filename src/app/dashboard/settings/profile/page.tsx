"use client";

import { motion } from "framer-motion";
import { User, Mail, ShieldCheck, KeyRound, Smartphone, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  
  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  return (
    <div className="pb-24">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Identity & Access</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Manage your personnel clearance, credentials, and security keys.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
        
        {/* Navigation Sidebar (Matches Settings) */}
        <div className="space-y-2">
           {[
             { label: "Profile Identity", icon: User, active: true },
             { label: "Authentication", icon: KeyRound, active: false },
             { label: "Active Sessions", icon: Smartphone, active: false },
           ].map(item => (
             <button key={item.label} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[15px] font-bold transition-all
               ${item.active ? 'bg-white/[0.05] text-white border border-white/[0.05]' : 'border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'}`}>
               <item.icon size={18} /> {item.label}
             </button>
           ))}
           
           <div className="pt-8">
             <button onClick={() => signOut()} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[15px] font-bold text-red-500 hover:bg-red-500/10 transition-colors">
               <LogOut size={18} /> Terminate Session
             </button>
           </div>
        </div>

        {/* Profile Content */}
        <div className="space-y-8">
          
          {/* Identity Card */}
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-8 border-b border-white/[0.05] pb-6 relative z-10">Personnel File</h2>
            
            <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] shrink-0 group-hover:scale-105 transition-transform duration-500">
                 <span className="font-outfit text-5xl font-black text-white">{initials}</span>
              </div>
              
              <div className="flex-1 space-y-6 w-full">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Display Name</label>
                  <input type="text" disabled value={user?.displayName || "Admin User"} className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-5 py-4 text-white font-medium outline-none opacity-80 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    Registered Email <ShieldCheck size={14} className="text-emerald-400" />
                  </label>
                  <div className="flex items-center gap-4 w-full bg-white/[0.03] border border-emerald-500/20 rounded-xl px-5 py-4">
                    <Mail size={18} className="text-zinc-500" />
                    <span className="text-white font-medium">{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UID Card */}
          <div className="bg-white/[0.01] border border-white/[0.03] rounded-[40px] p-10">
             <h2 className="text-xl font-bold text-white mb-8 border-b border-white/[0.05] pb-6">System Identifiers</h2>
             
             <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Internal UUID</label>
                <div className="w-full bg-black/40 border border-white/[0.05] rounded-xl px-5 py-4 font-mono text-zinc-400 text-sm break-all">
                  {user?.uid || "generating..."}
                </div>
                <p className="text-xs text-zinc-600 mt-3 font-medium">This unique hash binds your identity to the Financial Memory Graph. Do not share.</p>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
