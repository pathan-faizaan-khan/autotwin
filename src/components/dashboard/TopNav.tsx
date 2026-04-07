"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, LogOut, User, Settings, X, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function TopNav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showUser, setShowUser] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications: any[] = [];
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const scrollArea = document.getElementById('main-scroll-area');
    if (!scrollArea) return;

    const handleScroll = () => {
      setScrolled(scrollArea.scrollTop > 20);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  return (
    <div className={`absolute top-0 right-0 left-0 h-24 z-30 px-8 md:px-12 flex items-center justify-between transition-all duration-500 ${scrolled ? 'bg-[#030303]/80 backdrop-blur-2xl border-b border-white/[0.05]' : 'bg-transparent'}`}>
      {/* Search Bar - Spatial Design */}
      <div className="flex-1 max-w-[400px] relative group">
        <div className="absolute inset-0 bg-white/[0.01] rounded-2xl border border-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-4 text-zinc-600 transition-colors duration-300 group-hover:text-zinc-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Command the AI... e.g. 'Extract receipt'"
            className="w-full bg-transparent border-none py-3.5 pr-4 pl-12 text-zinc-100 text-[15px] outline-none placeholder:text-zinc-600 focus:placeholder:text-zinc-700 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        
        {/* Trigger Button */}
        <button className="hidden md:flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.08] transition-colors border border-white/[0.05] rounded-full px-5 py-2.5 text-[13px] font-semibold text-zinc-300">
          <PlusCircle size={14} className="text-violet-400" /> New Extraction
        </button>

        <div className="w-[1px] h-6 bg-white/[0.05] mx-2 hidden md:block" />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            className={`relative p-2 rounded-full transition-colors ${showNotifs ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Bell size={20} />
            {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-[340px] rounded-[24px] bg-[#09090b]/90 backdrop-blur-3xl border border-white/[0.05] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="p-5 border-b border-white/[0.05]">
                  <span className="text-[15px] font-bold text-zinc-100">Notifications</span>
                </div>
                <div className="p-8 text-center text-zinc-600 text-[13px]">
                  All caught up. No new alerts.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600/40 to-indigo-600/20 border border-white/10 flex items-center justify-center text-[13px] font-extrabold text-white hover:border-white/30 transition-all hover:scale-105">
            {initials}
          </button>

          <AnimatePresence>
            {showUser && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-[240px] rounded-[24px] bg-[#09090b]/90 backdrop-blur-3xl border border-white/[0.05] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col p-2">
                <div className="p-4 mb-2">
                  <p className="text-[15px] font-bold text-zinc-100 truncate">{user?.displayName || "Admin User"}</p>
                  <p className="text-[12px] text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button onClick={() => { router.push('/dashboard/settings/profile'); setShowUser(false); }} className="w-full px-4 py-2.5 flex items-center gap-3 rounded-xl text-[14px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] transition-colors text-left">
                  <User size={16} /> Your Profile
                </button>
                <button onClick={() => { router.push('/dashboard/settings'); setShowUser(false); }} className="w-full px-4 py-2.5 flex items-center gap-3 rounded-xl text-[14px] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] transition-colors text-left">
                  <Settings size={16} /> Workspace Settings
                </button>
                <div className="h-[1px] bg-white/[0.05] my-2 mx-4" />
                <button onClick={handleSignOut}
                  className="w-full px-4 py-2.5 flex items-center gap-3 rounded-xl text-[14px] text-red-400 hover:text-red-300 hover:bg-red-400/5 transition-colors text-left">
                  <LogOut size={16} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
