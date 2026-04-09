"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Search, X,
  CheckCircle2, AlertCircle, AlertTriangle, XCircle, FileText,
  ArrowUpRight, BarChart3, Clock
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n?.toLocaleString("en-IN") ?? "0"}`;
const fmtShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k`
  : fmt(n);

function groupByDate(docs: any[]) {
  const groups = new Map<string, any[]>();
  docs.forEach((doc) => {
    const d = doc.date ?? (doc.createdAt ? new Date(doc.createdAt).toISOString().split("T")[0] : "Unknown");
    const existing = groups.get(d) ?? [];
    groups.set(d, [...existing, doc]);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([date, docs]) => ({ date, docs }));
}

function formatDateLabel(dateStr: string) {
  if (dateStr === "Unknown") return "Unknown Date";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch { return dateStr; }
}

function DecisionBadge({ decision }: { decision: string }) {
  const d = (decision ?? "").toLowerCase();
  if (d === "auto" || d === "auto_approve" || d === "approve" || d === "approved")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/15"><CheckCircle2 size={9} />Auto</span>;
  if (d === "warn")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/15"><AlertCircle size={9} />Warning</span>;
  if (d === "human_review" || d === "review")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/15"><AlertTriangle size={9} />Review</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold uppercase tracking-widest border border-red-500/15"><XCircle size={9} />Flagged</span>;
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", user?.uid],
    queryFn: async () => (await axios.get(`/api/invoices?userId=${user?.uid ?? ""}`)).data.invoices ?? [],
    enabled: !!user?.uid,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", user?.uid],
    queryFn: async () => (await axios.get(`/api/analytics?userId=${user?.uid ?? ""}`)).data,
    enabled: !!user?.uid,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = invoices as any[];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((inv) => inv.vendor?.toLowerCase().includes(q));
    }
    if (minAmount) list = list.filter((inv) => inv.amount >= Number(minAmount));
    if (maxAmount) list = list.filter((inv) => inv.amount <= Number(maxAmount));
    return list;
  }, [invoices, searchQuery, minAmount, maxAmount]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const statsThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const docs = (invoices as any[]).filter((d) => {
      const t = d.createdAt ? new Date(d.createdAt).getTime() : 0;
      return t >= weekAgo.getTime();
    });
    return { count: docs.length, total: docs.reduce((sum, d) => sum + d.amount, 0) };
  }, [invoices]);

  const statsThisMonth = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    const docs = (invoices as any[]).filter((d) => {
      const t = d.createdAt ? new Date(d.createdAt).getTime() : 0;
      return t >= monthAgo.getTime();
    });
    return { count: docs.length, total: docs.reduce((sum, d) => sum + d.amount, 0) };
  }, [invoices]);

  const largest = useMemo(() => {
    const all = invoices as any[];
    return all.sort((a, b) => b.amount - a.amount)[0] ?? null;
  }, [invoices]);

  const s = analytics?.summary ?? {};
  const totalDocs = (invoices as any[]).length;

  return (
    <div className="pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Money Flow</p>
        <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-3">Transactions</h1>
        <p className="text-zinc-500 text-base font-light max-w-xl">
          Complete chronological view of all financial transactions processed by the AI pipeline.
        </p>
      </motion.div>

      {/* ── Summary Banner ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "This Week", value: fmtShort(statsThisWeek.total),
            sub: `${statsThisWeek.count} transactions`, icon: Calendar, color: "text-violet-400", glow: "bg-violet-500/10",
          },
          {
            label: "This Month", value: fmtShort(statsThisMonth.total),
            sub: `${statsThisMonth.count} transactions`, icon: TrendingUp, color: "text-indigo-400", glow: "bg-indigo-500/10",
          },
          {
            label: "Total Managed", value: fmtShort(s.totalSpend ?? 0),
            sub: `${totalDocs} documents`, icon: DollarSign, color: "text-emerald-400", glow: "bg-emerald-500/10",
          },
          {
            label: "Largest Transaction", value: largest ? fmtShort(largest.amount) : "—",
            sub: largest?.vendor ?? "—", icon: ArrowUpRight, color: "text-amber-400", glow: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="group p-6 rounded-[24px] bg-white/[0.015] border border-white/[0.05] hover:border-white/10 transition-all relative overflow-hidden"
          >
            <div className={`absolute -top-6 -right-6 w-24 h-24 ${stat.glow} blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <stat.icon size={18} className={`${stat.color} mb-4 relative z-10`} />
            <p className="font-outfit text-2xl font-black text-white tracking-tight relative z-10">{stat.value}</p>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1 relative z-10">{stat.label}</p>
            <p className="text-zinc-500 text-xs mt-1 relative z-10">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Search */}
        <div className="relative group flex-1 min-w-[220px] max-w-sm">
          <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/[0.05] group-focus-within:border-white/20 transition-all" />
          <div className="relative flex items-center px-4 gap-3">
            <Search size={14} className="text-zinc-500 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor..."
              className="w-full bg-transparent border-none py-3 text-white text-sm outline-none placeholder:text-zinc-600"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white"><X size={13} /></button>
            )}
          </div>
        </div>

        {/* Min Amount */}
        <div className="relative group w-40">
          <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/[0.05] group-focus-within:border-white/20 transition-all" />
          <div className="relative flex items-center px-4">
            <span className="text-zinc-600 text-sm shrink-0">₹</span>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="Min amount"
              className="w-full bg-transparent border-none py-3 px-2 text-white text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Max Amount */}
        <div className="relative group w-40">
          <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/[0.05] group-focus-within:border-white/20 transition-all" />
          <div className="relative flex items-center px-4">
            <span className="text-zinc-600 text-sm shrink-0">₹</span>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="Max amount"
              className="w-full bg-transparent border-none py-3 px-2 text-white text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {(searchQuery || minAmount || maxAmount) && (
          <button
            onClick={() => { setSearchQuery(""); setMinAmount(""); setMaxAmount(""); }}
            className="h-10 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <X size={13} /> Clear
          </button>
        )}

        <p className="text-zinc-600 text-sm font-medium ml-auto">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Transaction Timeline ──────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="w-32 h-4 rounded bg-white/[0.04] animate-pulse" />
              <div className="rounded-[24px] bg-white/[0.01] border border-white/[0.04] overflow-hidden">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="px-8 py-5 border-b border-white/[0.03] flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-32 h-3.5 rounded bg-white/[0.04] animate-pulse" />
                      <div className="w-20 h-2.5 rounded bg-white/[0.03] animate-pulse" />
                    </div>
                    <div className="w-20 h-5 rounded bg-white/[0.04] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-white/[0.01] rounded-[28px] border border-white/[0.04]">
          <DollarSign size={48} className="mx-auto mb-4 opacity-10 text-white" />
          <p className="font-outfit text-xl font-semibold text-zinc-400 mb-1">No Transactions Found</p>
          <p className="text-zinc-600 text-sm">
            {searchQuery || minAmount || maxAmount ? "Try adjusting your filters" : "Upload documents to see money flow"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ date, docs }, gi) => {
            const groupTotal = docs.reduce((sum, d) => sum + (d.amount ?? 0), 0);
            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Date separator */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={13} className="text-zinc-600" />
                    <span className="text-zinc-400 text-sm font-semibold">{formatDateLabel(date)}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                  <span className="text-zinc-500 text-sm font-bold font-outfit">{fmtShort(groupTotal)}</span>
                  <span className="text-zinc-600 text-xs">{docs.length} doc{docs.length > 1 ? "s" : ""}</span>
                </div>

                {/* Transactions for this date */}
                <div className="rounded-[24px] bg-white/[0.01] border border-white/[0.04] overflow-hidden">
                  {docs.map((inv: any, i: number) => {
                    const confPct = Math.round(inv.confidence <= 1 ? inv.confidence * 100 : inv.confidence);
                    const riskScore = inv.riskScore ?? 0;
                    return (
                      <div
                        key={inv.id}
                        className={`group flex items-center gap-4 px-6 py-4 hover:bg-white/[0.025] transition-all ${i !== docs.length - 1 ? "border-b border-white/[0.03]" : ""}`}
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all shrink-0">
                          <FileText size={16} />
                        </div>

                        {/* Vendor */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm leading-tight truncate group-hover:text-violet-300 transition-colors">
                            {inv.vendor}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
                              {inv.invoiceNo ?? (inv.invoiceId ?? "").substring(0, 8).toUpperCase()}
                            </p>
                            {inv.processingTimeMs && (
                              <span className="text-[10px] text-zinc-700 flex items-center gap-1">
                                <Clock size={9} /> {(inv.processingTimeMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Decision Badge */}
                        <div className="shrink-0 hidden sm:block">
                          <DecisionBadge decision={inv.decision ?? inv.status} />
                        </div>

                        {/* Confidence */}
                        <div className="shrink-0 hidden md:flex items-center gap-2 w-[90px]">
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confPct >= 90 ? "bg-emerald-400" : confPct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-500 shrink-0">{confPct}%</span>
                        </div>

                        {/* Risk */}
                        <div className="shrink-0 hidden lg:block w-16 text-right">
                          <span className={`text-xs font-bold ${riskScore < 0.3 ? "text-emerald-400" : riskScore < 0.6 ? "text-amber-400" : "text-red-400"}`}>
                            R: {riskScore.toFixed(2)}
                          </span>
                        </div>

                        {/* Amount */}
                        <div className="shrink-0 text-right">
                          <p className="font-outfit text-lg font-black text-white leading-tight">{fmtShort(inv.amount)}</p>
                          <p className="text-[11px] text-zinc-600">INR</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
