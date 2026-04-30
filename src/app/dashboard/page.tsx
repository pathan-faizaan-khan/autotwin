"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import {
  DollarSign, AlertTriangle, ArrowRight, Activity, TrendingUp,
  FileText, ShieldCheck, Zap, BarChart3, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Legend
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}k`
    : `₹${n.toLocaleString()}`;

function DecisionBadge({ decision }: { decision: string }) {
  const d = decision?.toLowerCase() ?? "";
  if (d === "auto" || d === "auto_approve" || d === "approve")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
        <CheckCircle2 size={10} /> Auto
      </span>
    );
  if (d === "warn")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
        <AlertCircle size={10} /> Warning
      </span>
    );
  if (d === "human_review" || d === "review")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
        <AlertTriangle size={10} /> Review
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[10px] font-bold uppercase tracking-widest">
      <XCircle size={10} /> Flagged
    </span>
  );
}

const DECISION_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      {label && <p className="text-zinc-400 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-bold">
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("₹") ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, glow, delay,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; glow: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-6 rounded-[28px] bg-white/[0.015] border border-white/[0.05] hover:border-white/10 transition-all overflow-hidden"
    >
      <div className={`absolute -top-8 -right-8 w-32 h-32 ${glow} blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="font-outfit text-[2rem] font-black text-white tracking-tight leading-none">{value}</p>
        {sub && <p className="text-zinc-500 text-xs mt-1.5 font-medium">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", user?.uid],
    queryFn: async () => (await axios.get(`/api/analytics?userId=${user?.uid ?? ""}`)).data,
    enabled: !!user?.uid,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals", user?.uid],
    queryFn: async () => (await axios.get(`/api/approvals?userId=${user?.uid ?? ""}`)).data.approvals ?? [],
    enabled: !!user?.uid,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });

  const s = data?.summary ?? {};
  const pendingApprovals = (approvals as any[]).filter((a: any) => a.status === "pending");
  const firstName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "Admin";

  const kpis = [
    {
      label: "Total Managed Spend",
      value: s.totalSpend ? fmt(s.totalSpend) : "₹0",
      sub: `Across ${s.totalDocs ?? 0} documents`,
      icon: DollarSign,
      glow: "bg-violet-500/30",
      delay: 0.05,
    },
    {
      label: "Avg AI Confidence",
      value: `${s.avgConfidence ?? 0}%`,
      sub: s.avgConfidence >= 90 ? "✦ High confidence zone" : s.avgConfidence >= 70 ? "Medium zone" : "⚠ Low confidence",
      icon: ShieldCheck,
      glow: "bg-emerald-500/20",
      delay: 0.1,
    },
    {
      label: "Auto-Approved",
      value: s.autoApproved ?? 0,
      sub: s.totalDocs > 0 ? `${Math.round(((s.autoApproved ?? 0) / s.totalDocs) * 100)}% auto-rate` : "—",
      icon: CheckCircle2,
      glow: "bg-emerald-500/20",
      delay: 0.15,
    },
    {
      label: "Exceptions Queue",
      value: pendingApprovals.length,
      sub: pendingApprovals.length > 0 ? "Needs human review" : "Queue is clear",
      icon: AlertTriangle,
      glow: "bg-amber-500/20",
      delay: 0.2,
    },
    {
      label: "Avg Risk Score",
      value: s.avgRiskScore ? s.avgRiskScore.toFixed(3) : "0.000",
      sub: s.avgRiskScore < 0.3 ? "Low risk" : s.avgRiskScore < 0.6 ? "Medium risk" : "⚠ High risk",
      icon: Activity,
      glow: "bg-red-500/20",
      delay: 0.25,
    },
    {
      label: "Avg Processing Time",
      value: s.avgProcessingMs ? `${(s.avgProcessingMs / 1000).toFixed(1)}s` : "—",
      sub: "Neural pipeline speed",
      icon: Zap,
      glow: "bg-indigo-500/20",
      delay: 0.3,
    },
  ];

  return (
    <div className="pb-28">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest mb-2">Finance Command Center</p>
            <h1 className="font-outfit text-[52px] font-black tracking-tighter leading-none text-white">
              Welcome, {firstName}.
            </h1>
            <p className="text-zinc-500 mt-3 text-base font-light max-w-lg">
              {s.totalDocs > 0
                ? `${s.totalDocs} documents processed · ${s.autoApproved ?? 0} auto-approved · ₹${(s.totalSpend ?? 0).toLocaleString()} total managed`
                : "Autonomous agents are standing by. Upload your first document to begin."}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/invoices"
              className="h-11 px-5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
              <FileText size={15} /> Upload Doc
            </Link>
            <Link href="/dashboard/analytics"
              className="h-11 px-5 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-300 text-sm font-semibold flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
              <BarChart3 size={15} /> Analytics
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {kpis.map((k) =>
          isLoading ? (
            <div key={k.label} className="h-[148px] rounded-[28px] bg-white/[0.02] animate-pulse" />
          ) : (
            <KpiCard key={k.label} {...k} />
          )
        )}
      </div>

      {/* ── Charts Row 1: Spend Trend (full) ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Spend Trend — lg:col-span-2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 p-7 rounded-[28px] bg-white/[0.015] border border-white/[0.05] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">Spend Trajectory</h2>
              <p className="text-zinc-500 text-sm">Actual vs AI Confidence Forecast</p>
            </div>
            <TrendingUp className="text-violet-400" size={22} />
          </div>
          <div className="h-[220px] relative z-10">
            {isLoading ? (
              <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (data?.monthly?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No data yet — upload documents to build the graph</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthly}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="month" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="actual" name="Actual ₹" stroke="#8b5cf6" strokeWidth={3}
                    dot={{ r: 5, fill: "#030303", stroke: "#8b5cf6", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#8b5cf6" }} />
                  <Line type="monotone" dataKey="forecast" name="Forecast ₹" stroke="#fbbf24" strokeWidth={2}
                    strokeDasharray="6 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Decision Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="p-7 rounded-[28px] bg-white/[0.015] border border-white/[0.05] flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">AI Decisions</h2>
              <p className="text-zinc-500 text-sm">Decision distribution</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex-1 rounded-2xl bg-white/[0.02] animate-pulse" />
          ) : (data?.decisions?.length ?? 0) === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm text-center">No decisions yet</div>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.decisions} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                    {data.decisions.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color ?? DECISION_COLORS[i % DECISION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {data.decisions.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color ?? DECISION_COLORS[i % DECISION_COLORS.length] }} />
                      <span className="text-zinc-400 font-medium">{d.name}</span>
                    </div>
                    <span className="text-zinc-200 font-bold font-outfit">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Charts Row 2: Vendor Bar + Confidence Histogram ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vendor Spend Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="p-7 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">Vendor Spend</h2>
              <p className="text-zinc-500 text-sm">Top vendors by total spend</p>
            </div>
            <BarChart3 className="text-indigo-400" size={20} />
          </div>
          <div className="h-[240px]">
            {isLoading ? (
              <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (data?.vendors?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No vendor data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vendors.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="spend" name="Spend ₹" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Category Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-7 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">Spend by Category</h2>
              <p className="text-zinc-500 text-sm">Automated allocation insight</p>
            </div>
            <Activity className="text-emerald-400" size={20} />
          </div>
          <div className="h-[240px]">
            {isLoading ? (
              <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (data?.categories?.length ?? 0) === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No category data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    dataKey="spend"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {data.categories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={DECISION_COLORS[index % DECISION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {payload?.map((entry: any, index: number) => (
                          <div key={`item-${index}`} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Confidence Histogram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-7 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-outfit text-xl font-bold text-white">Confidence Distribution</h2>
              <p className="text-zinc-500 text-sm">AI confidence buckets across all docs</p>
            </div>
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <div className="h-[240px]">
            {isLoading ? (
              <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
            ) : (data?.confidenceHistogram?.every((b: any) => b.count === 0)) ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.confidenceHistogram} margin={{ bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="range" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Bar dataKey="count" name="Documents" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {(data.confidenceHistogram ?? []).map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Documents Feed ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[28px] bg-white/[0.015] border border-white/[0.05] overflow-hidden"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.04]">
          <div>
            <h2 className="font-outfit text-xl font-bold text-white">Recent Documents</h2>
            <p className="text-zinc-500 text-sm">Latest AI-processed extractions</p>
          </div>
          <Link href="/dashboard/invoices"
            className="h-9 px-4 rounded-full border border-white/[0.06] text-zinc-400 hover:text-white hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-white/[0.03]">
          <div>Vendor</div>
          <div>Amount</div>
          <div>Category</div>
          <div>Decision</div>
          <div>Confidence</div>
          <div>Risk Score</div>
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-8 py-4 items-center border-b border-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 rounded bg-white/[0.04] animate-pulse" />
                    <div className="w-16 h-2.5 rounded bg-white/[0.03] animate-pulse" />
                  </div>
                </div>
                {[1, 2, 3, 4, 5].map((j) => <div key={j} className="w-20 h-3 rounded bg-white/[0.03] animate-pulse" />)}
              </div>
            ))
          ) : (data?.recentDocs?.length ?? 0) === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-600">
              <FileText size={40} className="mb-4 opacity-20" />
              <p className="font-outfit text-lg font-semibold text-zinc-500">No documents yet</p>
              <p className="text-sm mt-1">Upload your first invoice to get started</p>
              <Link href="/dashboard/invoices" className="mt-6 h-10 px-5 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                Upload Document
              </Link>
            </div>
          ) : (
            data.recentDocs.map((doc: any, i: number) => {
              const confPct = Math.round(doc.confidence <= 1 ? doc.confidence * 100 : doc.confidence);
              return (
                <Link
                  key={doc.id}
                  href="/dashboard/invoices"
                  className={`group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] px-8 py-4 items-center hover:bg-white/[0.025] transition-colors cursor-pointer ${i !== data.recentDocs.length - 1 ? "border-b border-white/[0.025]" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm leading-tight">{doc.vendor}</p>
                      <p className="text-zinc-600 text-[11px] uppercase tracking-wider mt-0.5">
                        {doc.date ?? new Date(doc.createdAt ?? Date.now()).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="font-outfit text-base font-bold text-white">{fmt(doc.amount)}</div>
                  <div className="text-xs text-zinc-400 font-medium">
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                      {doc.category || "General"}
                    </span>
                  </div>
                  <div><DecisionBadge decision={doc.decision} /></div>
                  <div className="flex items-center gap-2 max-w-[100px]">
                    <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${confPct >= 90 ? "bg-emerald-400" : confPct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${confPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-zinc-400 shrink-0">{confPct}%</span>
                  </div>
                  <div>
                    <span className={`text-sm font-bold font-outfit ${doc.riskScore < 0.3 ? "text-emerald-400" : doc.riskScore < 0.6 ? "text-amber-400" : "text-red-400"}`}>
                      {doc.riskScore?.toFixed(2)}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
