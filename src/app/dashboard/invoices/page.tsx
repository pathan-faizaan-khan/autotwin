"use client";

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Plus, FileText, ArrowUpRight, Loader2,
  X, CheckCircle2, AlertCircle, AlertTriangle, XCircle,
  Clock, Zap, Shield, Brain, BarChart3, ChevronRight,
  ShieldCheck, TrendingUp, ExternalLink
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n?.toLocaleString("en-IN") ?? "0"}`;

function DecisionBadge({ decision }: { decision: string }) {
  const d = decision?.toLowerCase() ?? "";
  if (d === "auto" || d === "auto_approve" || d === "approve")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold uppercase tracking-widest border border-emerald-500/20"><CheckCircle2 size={11} />Auto Approved</span>;
  if (d === "warn")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold uppercase tracking-widest border border-amber-500/20"><AlertCircle size={11} />Warning</span>;
  if (d === "human_review" || d === "review")
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-[11px] font-bold uppercase tracking-widest border border-indigo-500/20"><AlertTriangle size={11} />Human Review</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-[11px] font-bold uppercase tracking-widest border border-red-500/20"><XCircle size={11} />Flagged</span>;
}

function LogLevelBadge({ level }: { level: string }) {
  const l = level?.toLowerCase();
  if (l === "success") return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{level}</span>;
  if (l === "warning" || l === "warn") return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 border border-amber-500/20">{level}</span>;
  if (l === "error") return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/20">{level}</span>;
  return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-zinc-800 text-zinc-400">{level}</span>;
}

const FILTER_TABS = ["All", "Auto", "Warn", "Review", "Flagged"] as const;
type FilterTab = typeof FILTER_TABS[number];

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "doc">("overview");

  const confPct = Math.round(invoice.confidence <= 1 ? invoice.confidence * 100 : invoice.confidence);
  const riskPct = Math.round((invoice.riskScore ?? 0) * 100);

  // Parse confidence breakdown
  let confBreakdown: any = null;
  try {
    confBreakdown = typeof invoice.confidenceBreakdown === "string"
      ? JSON.parse(invoice.confidenceBreakdown)
      : invoice.confidenceBreakdown;
  } catch { /* ignore */ }

  const breakdownData = confBreakdown?.breakdown
    ? [
        { metric: "Extraction", value: Math.round((confBreakdown.breakdown.extraction?.score ?? 0) * 100) },
        { metric: "Pattern", value: Math.round((confBreakdown.breakdown.pattern?.score ?? 0) * 100) },
        { metric: "Historical", value: Math.round((confBreakdown.breakdown.historical?.score ?? 0) * 100) },
      ]
    : [];

  // Parse logs
  let logs: any[] = [];
  try {
    logs = typeof invoice.logs === "string" ? JSON.parse(invoice.logs) : (invoice.logs ?? []);
  } catch { /* ignore */ }

  const DRAWER_TABS = [
    { id: "overview", label: "AI Overview", icon: Brain },
    { id: "logs", label: "Pipeline Logs", icon: Clock },
    { id: "doc", label: "Document", icon: FileText },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-[680px] bg-[#060608] border-l border-white/[0.06] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-white/[0.05]">
          <div className="flex-1 pr-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="font-outfit text-2xl font-black text-white tracking-tight">{invoice.vendor}</h2>
                <p className="text-zinc-500 text-sm font-medium">{invoice.invoiceNo ?? (invoice.invoiceId ?? "").substring(0, 8).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <DecisionBadge decision={invoice.decision} />
              <span className="text-zinc-600 text-[11px]">·</span>
              <span className="text-zinc-500 text-sm font-medium">{invoice.date ?? "—"}</span>
              {invoice.processingTimeMs && (
                <>
                  <span className="text-zinc-600 text-[11px]">·</span>
                  <span className="text-zinc-500 text-sm font-medium flex items-center gap-1">
                    <Zap size={11} className="text-indigo-400" />
                    {(invoice.processingTimeMs / 1000).toFixed(2)}s
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-white/[0.07] bg-white/[0.03] flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount + Risk Score Hero */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.04] border-b border-white/[0.04]">
          <div className="bg-[#060608] px-6 py-4">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Amount</p>
            <p className="font-outfit text-2xl font-black text-white">{fmt(invoice.amount)}</p>
          </div>
          <div className="bg-[#060608] px-6 py-4">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">AI Confidence</p>
            <p className={`font-outfit text-2xl font-black ${confPct >= 90 ? "text-emerald-400" : confPct >= 70 ? "text-amber-400" : "text-red-400"}`}>
              {confPct}%
            </p>
          </div>
          <div className="bg-[#060608] px-6 py-4">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">Risk Score</p>
            <p className={`font-outfit text-2xl font-black ${riskPct < 30 ? "text-emerald-400" : riskPct < 60 ? "text-amber-400" : "text-red-400"}`}>
              {(invoice.riskScore ?? 0).toFixed(3)}
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-white/[0.04] px-6 pt-2">
          {DRAWER_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all mr-1 ${
                activeTab === id
                  ? "border-violet-500 text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Overview Tab ─────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="px-8 py-6 space-y-6">
              {/* AI Explanation */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Brain size={11} /> AI Explanation
                </p>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {invoice.explanation ?? "No explanation available."}
                </p>
              </div>

              {/* Confidence Breakdown */}
              {breakdownData.length > 0 && (
                <div>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <ShieldCheck size={11} /> Confidence Breakdown
                  </p>
                  <div className="space-y-3">
                    {breakdownData.map((item) => (
                      <div key={item.metric}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-zinc-400 text-sm font-medium">{item.metric}</span>
                          <span className={`font-outfit text-sm font-bold ${item.value >= 90 ? "text-emerald-400" : item.value >= 70 ? "text-amber-400" : "text-red-400"}`}>
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className={`h-full rounded-full ${item.value >= 90 ? "bg-emerald-500" : item.value >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {breakdownData.length > 0 && (
                    <div className="mt-4 h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={breakdownData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <XAxis dataKey="metric" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 100]} stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                          <Bar dataKey="value" name="Score %" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {breakdownData.map((entry, i) => (
                              <Cell key={i} fill={entry.value >= 90 ? "#10b981" : entry.value >= 70 ? "#f59e0b" : "#ef4444"} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Risk Gauge */}
              <div>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Shield size={11} /> Risk Score Gauge
                </p>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-zinc-400 text-sm">Risk Level</span>
                    <span className={`font-outfit font-black text-xl ${riskPct < 30 ? "text-emerald-400" : riskPct < 60 ? "text-amber-400" : "text-red-400"}`}>
                      {riskPct < 30 ? "LOW" : riskPct < 60 ? "MEDIUM" : "HIGH"}
                    </span>
                  </div>
                  <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 opacity-20 rounded-full" />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${riskPct}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full relative z-10 ${riskPct < 30 ? "bg-emerald-500" : riskPct < 60 ? "bg-amber-500" : "bg-red-500"}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5 font-medium">
                    <span>Safe (0.0)</span>
                    <span>{(invoice.riskScore ?? 0).toFixed(3)}</span>
                    <span>Critical (1.0)</span>
                  </div>
                </div>
              </div>

              {/* Vendor Profile from logs */}
              {confBreakdown?.reasoning && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10">
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Brain size={11} /> AI Reasoning
                  </p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{confBreakdown.reasoning}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Pipeline Logs Tab ─────────────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="px-8 py-6">
              {logs.length === 0 ? (
                <div className="py-16 text-center text-zinc-600">
                  <Clock size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No pipeline logs available</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-white/[0.05]" />
                  <div className="space-y-4">
                    {logs.map((log: any, i: number) => {
                      const ts = log.timestamp ? new Date(log.timestamp) : null;
                      const stepColor =
                        log.level === "success" ? "bg-emerald-500" :
                        log.level === "warning" || log.level === "warn" ? "bg-amber-500" :
                        log.level === "error" ? "bg-red-500" : "bg-zinc-600";
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex gap-5 relative"
                        >
                          <div className={`w-[30px] h-[30px] rounded-full ${stepColor} shrink-0 flex items-center justify-center text-white z-10 mt-1`} style={{ fontSize: 10, fontWeight: 700 }}>
                            {i + 1}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className="text-white text-sm font-semibold">{log.step}</span>
                              <LogLevelBadge level={log.level} />
                              {ts && (
                                <span className="text-zinc-600 text-[10px] font-mono">
                                  {ts.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">{log.message}</p>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="mt-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.04] overflow-hidden">
                                <pre className="text-[10px] text-zinc-500 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Document Tab ──────────────────────────────────────────── */}
          {activeTab === "doc" && (
            <div className="h-full flex flex-col">
              {invoice.fileUrl ? (
                <>
                  <div className="px-6 py-3 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
                    <span className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                      <FileText size={14} className="text-violet-400" /> Source Document
                    </span>
                    <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-sm">
                      Open <ExternalLink size={13} />
                    </a>
                  </div>
                  <div className="flex-1 bg-black/60">
                    {invoice.fileUrl.toLowerCase().includes(".pdf") ? (
                      <iframe src={invoice.fileUrl} className="w-full h-full border-none" title="Document" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6">
                        <img src={invoice.fileUrl} alt="Document" className="max-w-full max-h-full object-contain rounded-xl" />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                  <FileText size={40} className="mb-3 opacity-20" />
                  <p>No document attached</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.uid],
    queryFn: async () => (await axios.get(`/api/invoices?userId=${user?.uid ?? ""}`)).data.invoices ?? [],
    enabled: !!user?.uid,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  // Rich data: merge OCR fields if available
  const { data: rawDocs = [] } = useQuery({
    queryKey: ["extractedDocs", user?.uid],
    queryFn: async () => {
      const res = await axios.get(`/api/analytics?userId=${user?.uid ?? ""}`);
      return res.data?.recentDocs ?? [];
    },
    enabled: !!user?.uid,
    staleTime: 60_000,
  });

  // Build a map from id → full OCR doc for enrichment
  const docsMap = useMemo(() => {
    const m = new Map<string, any>();
    rawDocs.forEach((d: any) => m.set(d.id, d));
    return m;
  }, [rawDocs]);

  const filtered = useMemo(() => {
    let list = invoices as any[];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (inv) => inv.vendor?.toLowerCase().includes(q) || inv.invoiceNo?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "All") {
      list = list.filter((inv) => {
        const d = (inv.decision ?? inv.status ?? "").toLowerCase();
        if (activeFilter === "Auto") return d === "auto" || d === "auto_approve" || d === "approve" || d === "approved";
        if (activeFilter === "Warn") return d === "warn";
        if (activeFilter === "Review") return d === "human_review" || d === "review";
        if (activeFilter === "Flagged") return d === "reject" || d === "flag" || d === "flagged" || d === "rejected";
        return true;
      });
    }
    return list;
  }, [invoices, searchQuery, activeFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      setIsProcessing(true);
      setLoadingStep("Uploading document to secure vault...");
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from("chat-attachments").upload(`invoices/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);
      setLoadingStep("Initializing VisionAgent extraction...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.uid);
      formData.append("fileUrl", publicUrl);
      await axios.post("/api/process-invoice", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setLoadingStep("Syncing Financial Memory Graph...");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
    } catch (err: any) {
      alert("Pipeline Error: " + err.message);
    } finally {
      setIsProcessing(false);
      setLoadingStep("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openDrawer = (inv: any) => {
    // Merge with full OCR doc if available
    const enriched = docsMap.get(inv.id) ? { ...inv, ...docsMap.get(inv.id) } : inv;
    setSelectedInvoice(enriched);
  };

  const tabCounts = useMemo(() => {
    const all = invoices as any[];
    return {
      All: all.length,
      Auto: all.filter((i) => { const d = (i.decision ?? i.status ?? "").toLowerCase(); return d === "auto" || d === "auto_approve" || d === "approve" || d === "approved"; }).length,
      Warn: all.filter((i) => (i.decision ?? "").toLowerCase() === "warn").length,
      Review: all.filter((i) => { const d = (i.decision ?? "").toLowerCase(); return d === "human_review" || d === "review"; }).length,
      Flagged: all.filter((i) => { const d = (i.decision ?? i.status ?? "").toLowerCase(); return d === "reject" || d === "flag" || d === "flagged" || d === "rejected"; }).length,
    };
  }, [invoices]);

  return (
    <div className="pb-24 relative">
      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center">
            <div className="bg-[#060608] border border-white/[0.07] p-10 rounded-[40px] max-w-sm w-full text-center flex flex-col items-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 font-outfit">Neural Pipeline Active</h3>
              <p className="text-sm text-zinc-400 font-medium">{loadingStep}</p>
              <div className="mt-6 w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse rounded-full w-3/4" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedInvoice && (
          <DetailDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Document Intelligence Hub</p>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-3">Invoice Engine</h1>
          <p className="text-zinc-500 font-light max-w-lg">
            Every ingested document — autonomously verified, structured & analyzed. Click any row for deep AI insights.
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*,.pdf" />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="h-11 px-5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
          >
            <Plus size={16} /> Upload Document
          </motion.button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeFilter === tab ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeFilter === tab ? "bg-violet-500/30 text-violet-300" : "bg-white/[0.05] text-zinc-500"
                }`}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative group">
          <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/[0.05] group-focus-within:border-white/20 transition-all" />
          <div className="relative flex items-center px-4 gap-3">
            <Search size={15} className="text-zinc-500 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, ID..."
              className="w-full bg-transparent border-none py-3 text-white text-sm outline-none placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="text-zinc-600 text-sm font-medium ml-auto">
          {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[28px] bg-white/[0.01] border border-white/[0.04] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_56px] px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-white/[0.04] bg-white/[0.01]">
          <div>Vendor & ID</div>
          <div>Amount</div>
          <div>Decision</div>
          <div>Confidence</div>
          <div>Risk Score</div>
          <div />
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_56px] px-8 py-5 items-center border-b border-white/[0.025]">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] animate-pulse" />
                  <div className="space-y-2">
                    <div className="w-32 h-3.5 rounded bg-white/[0.04] animate-pulse" />
                    <div className="w-20 h-2.5 rounded bg-white/[0.03] animate-pulse" />
                  </div>
                </div>
                {[1, 2, 3, 4].map((j) => <div key={j} className="w-16 h-3 rounded bg-white/[0.03] animate-pulse" />)}
                <div />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-28 px-8 text-center">
              <FileText className="mx-auto mb-5 opacity-10 text-white" size={56} />
              <p className="font-outfit text-xl font-semibold text-zinc-400 mb-1">
                {searchQuery || activeFilter !== "All" ? "No matching documents" : "Database Empty"}
              </p>
              <p className="text-zinc-600 text-sm">
                {searchQuery ? `No results for "${searchQuery}"` : activeFilter !== "All" ? "Try a different filter" : "Upload your first document to begin"}
              </p>
            </div>
          ) : (
            filtered.map((inv: any, i: number) => {
              const confPct = Math.round(inv.confidence <= 1 ? inv.confidence * 100 : inv.confidence);
              const riskScore = inv.riskScore ?? 0;
              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openDrawer(inv)}
                  className={`group grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_56px] px-8 py-5 items-center hover:bg-white/[0.025] transition-all cursor-pointer ${i !== filtered.length - 1 ? "border-b border-white/[0.025]" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all shrink-0">
                      <FileText size={17} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight group-hover:text-violet-300 transition-colors">{inv.vendor}</h3>
                      <p className="text-[11px] text-zinc-600 uppercase tracking-wider mt-0.5">
                        {inv.invoiceNo ?? (inv.invoiceId ?? "").substring(0, 8).toUpperCase()} · {inv.date ?? new Date(inv.createdAt ?? Date.now()).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="font-outfit text-base font-bold text-white">{fmt(inv.amount)}</div>
                  <div><DecisionBadge decision={inv.decision ?? inv.status} /></div>

                  <div className="flex items-center gap-2 max-w-[110px]">
                    <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${confPct >= 90 ? "bg-emerald-400" : confPct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${confPct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-zinc-400 shrink-0 font-outfit">{confPct}%</span>
                  </div>

                  <div>
                    <span className={`font-outfit text-sm font-bold ${riskScore < 0.3 ? "text-emerald-400" : riskScore < 0.6 ? "text-amber-400" : "text-red-400"}`}>
                      {riskScore.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <div className="w-8 h-8 rounded-full border border-white/[0.05] flex items-center justify-center text-zinc-600 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
