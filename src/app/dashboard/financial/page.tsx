"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingDown, FileSpreadsheet, ChevronDown,
  ExternalLink, Loader2, AlertCircle, CheckCircle2,
  Receipt, BookOpen,
} from "lucide-react";

const COLORS = ["#7c3aed", "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${n.toLocaleString()}`;

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function buildMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ key, label: monthLabel(key) });
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      {label && <p className="text-zinc-400 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-bold">
          {p.name}: {typeof p.value === "number" ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function KpiCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-zinc-50 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

type DocStatus = "idle" | "loading" | "done" | "error";

function DocCard({
  title, description, icon: Icon, onGenerate, status, url,
}: {
  title: string; description: string; icon: any;
  onGenerate: () => void; status: DocStatus; url?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>

      {status === "done" && url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-colors"
        >
          <CheckCircle2 size={14} />
          Open in Google Sheets
          <ExternalLink size={12} />
        </a>
      ) : status === "error" ? (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} />
          Failed to generate. Check Google integration.
        </div>
      ) : (
        <button
          onClick={onGenerate}
          disabled={status === "loading"}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? (
            <><Loader2 size={14} className="animate-spin" /> Generating…</>
          ) : (
            <><FileSpreadsheet size={14} /> Generate → Google Sheets</>
          )}
        </button>
      )}
    </div>
  );
}

export default function FinancialPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentMonthKey());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [bsStatus, setBsStatus] = useState<DocStatus>("idle");
  const [bsUrl, setBsUrl] = useState<string>();
  const [isStatus, setIsStatus] = useState<DocStatus>("idle");
  const [isUrl, setIsUrl] = useState<string>();

  const { data: cashFlow, isLoading } = useQuery({
    queryKey: ["financial-cash-flow", user?.uid, month],
    queryFn: () =>
      axios
        .get(`/api/financial?type=cash-flow&userId=${user?.uid}&month=${month}`)
        .then(r => r.data),
    enabled: !!user?.uid,
    staleTime: 60_000,
  });

  const handleGenerate = useCallback(
    async (type: "balance-sheet" | "income-statement") => {
      if (!user?.uid) return;
      const setStatus = type === "balance-sheet" ? setBsStatus : setIsStatus;
      const setUrl = type === "balance-sheet" ? setBsUrl : setIsUrl;
      setStatus("loading");
      try {
        const { data } = await axios.post(
          `/api/financial?type=${type}&userId=${user.uid}&month=${month}`
        );
        setUrl(data.url);
        setStatus("done");
      } catch {
        setStatus("error");
      }
    },
    [user?.uid, month]
  );

  const cf = cashFlow;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cash flow, balance sheet & income statement</p>
        </div>

        {/* Month Picker */}
        <div className="relative">
          <button
            onClick={() => setShowMonthPicker(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-zinc-300 hover:bg-white/[0.06] transition-colors"
          >
            {monthLabel(month)}
            <ChevronDown size={14} className={`transition-transform ${showMonthPicker ? "rotate-180" : ""}`} />
          </button>
          {showMonthPicker && (
            <div className="absolute right-0 mt-1 z-50 w-56 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden">
              {MONTH_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setMonth(opt.key); setShowMonthPicker(false); setBsStatus("idle"); setIsStatus("idle"); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${month === opt.key ? "bg-violet-600/20 text-violet-300" : "text-zinc-300 hover:bg-white/[0.05]"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : cf ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard label="Total Outflow" value={fmt(cf.totalOutflow)} sub={`${cf.invoiceCount} invoices`} icon={TrendingDown} color="bg-violet-500/10 text-violet-400" />
          <KpiCard label="Approved" value={fmt(cf.approvedTotal)} sub="settled" icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-400" />
          <KpiCard label="Pending" value={fmt(cf.pendingTotal)} sub="under review" icon={AlertCircle} color="bg-amber-500/10 text-amber-400" />
          <KpiCard label="Top Category" value={cf.largestCategory} sub="by spend" icon={Receipt} color="bg-indigo-500/10 text-indigo-400" />
        </motion.div>
      ) : null}

      {/* Charts Row */}
      {cf && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Cash Flow */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-zinc-300 mb-4">Weekly Cash Flow</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cf.byWeek} barGap={4}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-sm font-bold text-zinc-300 mb-4">Spend by Category</h2>
            {cf.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={cf.byCategory}
                    dataKey="total"
                    nameKey="category"
                    cx="40%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={48}
                  >
                    {cf.byCategory.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [fmt(Number(value)), "Amount"]}
                    contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    labelStyle={{ color: "#a1a1aa" }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px] text-zinc-600 text-sm">No data for this period</div>
            )}
          </div>
        </div>
      )}

      {/* Category Table */}
      {cf && cf.byCategory.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <h2 className="text-sm font-bold text-zinc-300">Category Breakdown</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-widest">Category</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-widest">Invoices</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-widest">Total Spend</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-widest">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {cf.byCategory.map((row: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {row.category}
                  </td>
                  <td className="px-6 py-3 text-zinc-400 text-right">{row.count}</td>
                  <td className="px-6 py-3 text-zinc-200 font-semibold text-right">{fmt(row.total)}</td>
                  <td className="px-6 py-3 text-zinc-400 text-right">
                    {cf.totalOutflow > 0 ? `${((row.total / cf.totalOutflow) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Document Generation */}
      <div>
        <h2 className="text-sm font-bold text-zinc-300 mb-4">Financial Documents — {monthLabel(month)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocCard
            title="Balance Sheet"
            description="Assets vs liabilities overview with full invoice ledger. Organized by approval status and category."
            icon={BookOpen}
            status={bsStatus}
            url={bsUrl}
            onGenerate={() => handleGenerate("balance-sheet")}
          />
          <DocCard
            title="Income Statement"
            description="Expense summary by category with detail drill-down. Shows total operating spend for the period."
            icon={FileSpreadsheet}
            status={isStatus}
            url={isUrl}
            onGenerate={() => handleGenerate("income-statement")}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          Documents are generated directly to your connected Google Sheets account.
          {" "}<span className="text-zinc-500">Connect Google in Integrations if not already set up.</span>
        </p>
      </div>
    </div>
  );
}
