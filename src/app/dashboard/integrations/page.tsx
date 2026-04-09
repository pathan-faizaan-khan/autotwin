"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PlugZap, Unplug, Loader2, CheckCircle2, XCircle,
  Link2, RefreshCcw, Mail, ShieldCheck, Zap, Database,
  ExternalLink, AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: React.ReactNode;
  accentColor: string;
  connected: boolean | null;
  loading?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  badge?: string;
}

// ── Integration Card ──────────────────────────────────────────────────────────
function IntegrationCard({ int, i }: { int: Integration; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={`group p-7 rounded-[28px] border relative overflow-hidden transition-all ${
        int.connected
          ? "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.14]"
          : "bg-white/[0.01] border-white/[0.04] hover:border-white/[0.08]"
      }`}
    >
      {/* Glow */}
      {int.connected && (
        <div className={`absolute -top-10 -right-10 w-40 h-40 ${int.accentColor} blur-[80px] rounded-full pointer-events-none opacity-30`} />
      )}

      <div className="relative z-10 flex items-start gap-5">
        {/* Logo */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
          int.connected
            ? "bg-white/[0.06] border-white/[0.10]"
            : "bg-white/[0.02] border-white/[0.05]"
        }`}>
          {int.logo}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h2 className="font-outfit font-bold text-white text-lg leading-tight">{int.name}</h2>
            {int.badge && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/20">
                {int.badge}
              </span>
            )}
            {int.connected === true && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
            )}
            {int.connected === null && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-500">
                <Loader2 size={9} className="animate-spin" /> CHECKING
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">{int.category}</p>
          <p className="text-zinc-400 text-sm leading-relaxed">{int.description}</p>
        </div>

        {/* Action */}
        <div className="shrink-0 mt-1">
          {int.loading || int.connected === null ? (
            <Loader2 size={20} className="text-zinc-600 animate-spin" />
          ) : int.connected ? (
            <button
              onClick={int.onDisconnect}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-all"
            >
              <Unplug size={14} /> Disconnect
            </button>
          ) : (
            <button
              onClick={int.onConnect}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)]"
            >
              <PlugZap size={14} /> Connect
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const { user } = useAuth();
  const { toast, dismiss } = useToast();

  // Gmail state
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [gmailLoading, setGmailLoading] = useState(false);

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

  useEffect(() => { checkGmailStatus(); }, [checkGmailStatus]);

  // Handle redirect back from Google OAuth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = window.location.search;
    if (params.includes("sync=success")) {
      toast("Gmail Connected", "success", "Autonomous invoice sync is now permanently active.");
      setGmailConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.includes("error=access_denied")) {
      toast("Access Denied", "error", "Google permissions were declined. Try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []); // eslint-disable-line

  const handleConnectGmail = () => {
    if (!user) return toast("Not Logged In", "error", "You must be logged in first.");
    toast("Redirecting to Google OAuth...", "loading");
    window.location.href = `/api/integrations/gmail/auth?userId=${user.uid}`;
  };

  const handleDisconnectGmail = async () => {
    if (!user) return;
    setGmailLoading(true);
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
      setGmailLoading(false);
    }
  };

  const integrations: Integration[] = [
    // ── AI Pipeline ────────────────────────────────────────────────────
    {
      id: "gmail",
      name: "Gmail Autonomous Sync",
      description: gmailConnected
        ? "Active — AutoTwin is monitoring your inbox and auto-ingesting invoice emails through the full AI pipeline."
        : "Connect Gmail to automatically detect invoices, receipts & bills in your inbox and process them through the AI confidence engine.",
      category: "Email · AI Pipeline",
      badge: "Core",
      accentColor: "bg-emerald-500",
      connected: gmailConnected,
      loading: gmailLoading,
      logo: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z"
            fill={gmailConnected ? "#34d399" : "#52525b"} fillOpacity="0.15" />
          <path d="M22 6L12 13 2 6" stroke={gmailConnected ? "#34d399" : "#71717a"} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      onConnect: handleConnectGmail,
      onDisconnect: handleDisconnectGmail,
    },
    // ── Accounting ────────────────────────────────────────────────────
    {
      id: "quickbooks",
      name: "QuickBooks Online",
      description: "Sync approved invoices and expenses directly into your QuickBooks ledger. Eliminates double data entry.",
      category: "Accounting",
      accentColor: "bg-green-500",
      connected: false,
      logo: <div className="w-7 h-7 rounded-lg bg-[#2CA01C] flex items-center justify-center text-white font-black text-xs">QB</div>,
      onConnect: () => toast("QuickBooks", "error", "Coming soon — integration in development."),
      onDisconnect: () => {},
    },
    {
      id: "xero",
      name: "Xero",
      description: "Push processed financial documents and reconcile accounts automatically with Xero.",
      category: "Accounting",
      accentColor: "bg-sky-500",
      connected: false,
      logo: <div className="w-7 h-7 rounded-lg bg-[#13B5EA] flex items-center justify-center text-white font-black text-xs">X</div>,
      onConnect: () => toast("Xero", "error", "Coming soon — integration in development."),
      onDisconnect: () => {},
    },
    {
      id: "netsuite",
      name: "NetSuite ERP",
      description: "Enterprise-grade ERP sync. Route approved invoices directly into your NetSuite finance module.",
      category: "ERP",
      accentColor: "bg-zinc-400",
      connected: false,
      logo: <Database size={22} className="text-zinc-400" />,
      onConnect: () => toast("NetSuite", "error", "Coming soon — integration in development."),
      onDisconnect: () => {},
    },
    // ── Notifications ──────────────────────────────────────────────────
    {
      id: "slack",
      name: "Slack",
      description: "Receive real-time alerts for high-risk invoices, anomalies, and approval requests in your Slack workspace.",
      category: "Notifications",
      accentColor: "bg-pink-500",
      connected: false,
      logo: <div className="w-7 h-7 rounded-lg bg-[#E01E5A] flex items-center justify-center text-white font-black text-xs">S</div>,
      onConnect: () => toast("Slack", "error", "Coming soon — integration in development."),
      onDisconnect: () => {},
    },
    {
      id: "googledrive",
      name: "Google Drive",
      description: "Monitor Drive folders for new invoices and financial documents — auto-processed on upload.",
      category: "File Storage",
      accentColor: "bg-yellow-500",
      connected: false,
      logo: (
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
          <path d="M7.5 14.5l-4-7h8l4 7H7.5z" fill="#4285F4" fillOpacity="0.6" />
          <path d="M12 7.5h8l-4 7H8l4-7z" fill="#34A853" fillOpacity="0.6" />
          <path d="M3.5 14.5h12l2 3.5H1.5l2-3.5z" fill="#FBBC05" fillOpacity="0.7" />
        </svg>
      ),
      onConnect: () => toast("Google Drive", "error", "Coming soon — integration in development."),
      onDisconnect: () => {},
    },
  ];

  const connected = integrations.filter((i) => i.connected === true);
  const available = integrations.filter((i) => i.connected !== true);

  return (
    <div className="pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Ecosystem Hub</p>
        <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-3">Integrations</h1>
        <p className="text-zinc-500 text-base font-light max-w-xl">
          Connect AutoTwin AI to your financial systems, email, and communication tools for a fully autonomous pipeline.
        </p>
      </motion.div>

      {/* Stats Banner */}
      <div className="flex items-center gap-6 p-5 rounded-[20px] bg-white/[0.015] border border-white/[0.05] mb-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-outfit font-bold text-white text-lg leading-none">{connected.length}</p>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Active</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/[0.06]" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
            <XCircle size={16} className="text-zinc-500" />
          </div>
          <div>
            <p className="font-outfit font-bold text-white text-lg leading-none">{available.length}</p>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Available</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/[0.06]" />
        <p className="text-zinc-500 text-sm">
          {gmailConnected
            ? "Gmail is active — invoices from your inbox are being auto-processed."
            : "Connect Gmail to activate the autonomous email ingestion pipeline."}
        </p>
      </div>

      {/* Active integrations */}
      {connected.length > 0 && (
        <div className="mb-8">
          <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Connections
          </p>
          <div className="grid grid-cols-1 gap-4">
            {connected.map((int, i) => <IntegrationCard key={int.id} int={int} i={i} />)}
          </div>
        </div>
      )}

      {/* Available integrations */}
      <div>
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-4">Available Integrations</p>
        <div className="grid grid-cols-1 gap-4">
          {available.map((int, i) => <IntegrationCard key={int.id} int={int} i={i} />)}
        </div>
      </div>
    </div>
  );
}
