"use client";

import { motion } from "framer-motion";
import { User, Mail, ShieldCheck, KeyRound, Smartphone, LogOut, Database, Loader2, Unplug, PlugZap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useEffect, useState, useCallback } from "react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { toast, dismiss } = useToast();
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  const checkGmailStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/integrations?userId=${user.uid}&provider=gmail`);
      const data = await res.json();
      setGmailConnected(data.connected);
    } catch {
      setGmailConnected(false);
    }
  }, [user]);

  useEffect(() => {
    checkGmailStatus();
  }, [checkGmailStatus]);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = window.location.search;
    if (params.includes("sync=success")) {
      toast("Gmail Connected", "success", "Autonomous sync is permanently active.");
      setGmailConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.includes("error=access_denied")) {
      toast("Access Denied", "error", "Google permissions were declined. Try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line

  const handleConnectGmail = () => {
    if (!user) return toast("Not Logged In", "error", "You must be logged in first.");
    toast("Redirecting to Google...", "loading");
    window.location.href = `/api/integrations/gmail/auth?userId=${user.uid}`;
  };

  const handleDisconnectGmail = async () => {
    if (!user) return;
    setDisconnecting(true);
    const id = toast("Disconnecting Gmail...", "loading");
    try {
      await fetch(`/api/integrations?userId=${user.uid}&provider=gmail`, { method: "DELETE" });
      setGmailConnected(false);
      dismiss(id);
      toast("Gmail Disconnected", "success", "Integration removed from your account.");
    } catch {
      dismiss(id);
      toast("Failed to Disconnect", "error", "Please try again.");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Identity &amp; Access</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Manage your personnel clearance, credentials, and security keys.</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
        
        {/* Navigation Sidebar */}
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

          {/* Integrations Card */}
          <div className="bg-white/[0.01] border border-emerald-500/10 rounded-[40px] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[80px] rounded-full pointer-events-none" />
            <h2 className="text-xl font-bold text-white mb-8 border-b border-white/[0.05] pb-6 flex items-center gap-3">
              <Database className="text-emerald-400" /> Connected Integrations
            </h2>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
                    ${gmailConnected ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.05]'}`}>
                    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                      <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" fill={gmailConnected ? "#34d399" : "#52525b"} fillOpacity="0.15" />
                      <path d="M22 6L12 13 2 6" stroke={gmailConnected ? "#34d399" : "#52525b"} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white tracking-tight">Gmail Autonomous Sync</h3>
                      {gmailConnected === null && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-500">
                          <Loader2 size={9} className="animate-spin" /> CHECKING
                        </span>
                      )}
                      {gmailConnected === true && (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                        </span>
                      )}
                      {gmailConnected === false && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700">
                          NOT CONNECTED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">
                      {gmailConnected
                        ? "Monitoring inbox — invoices auto-ingested via AI pipeline."
                        : "Connect Gmail to automatically detect and process invoices."}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  {gmailConnected === null && (
                    <Loader2 size={18} className="text-zinc-600 animate-spin" />
                  )}
                  {gmailConnected === false && (
                    <button
                      onClick={handleConnectGmail}
                      className="flex items-center gap-2 px-5 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                    >
                      <PlugZap size={15} /> Connect
                    </button>
                  )}
                  {gmailConnected === true && (
                    <button
                      onClick={handleDisconnectGmail}
                      disabled={disconnecting}
                      className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {disconnecting ? <Loader2 size={15} className="animate-spin" /> : <Unplug size={15} />}
                      {disconnecting ? "Removing..." : "Disconnect"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
