"use client";

import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ZAxis, Legend
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  TrendingUp, ShieldCheck, BarChart3, Activity, Zap,
  CheckCircle2, AlertCircle, AlertTriangle, XCircle
} from "lucide-react";

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k`
  : `₹${n.toLocaleString()}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
      {label && <p className="text-zinc-400 mb-1.5 font-medium text-xs">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? "#a78bfa" }} className="font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function SectionTitle({ title, sub, icon: Icon, iconColor }: { title: string; sub: string; icon: any; iconColor: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-outfit text-xl font-bold text-white">{title}</h2>
        <p className="text-zinc-500 text-sm mt-0.5">{sub}</p>
      </div>
      <Icon size={20} className={iconColor} />
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", user?.uid],
    queryFn: async () => (await axios.get(`/api/analytics?userId=${user?.uid ?? ""}`)).data,
    enabled: !!user?.uid,
    staleTime: 60_000,
  });

  const s = data?.summary ?? {};
  const hasData = (data?.monthly?.length ?? 0) > 0 || (data?.vendors?.length ?? 0) > 0;

  const statPanels = [
    { label: "Total Spend", value: s.totalSpend ? fmt(s.totalSpend) : "₹0", icon: TrendingUp, color: "text-violet-400" },
    { label: "Avg Invoice", value: s.avgInvoice ? fmt(s.avgInvoice) : "₹0", icon: BarChart3, color: "text-indigo-400" },
    { label: "Avg Confidence", value: `${s.avgConfidence ?? 0}%`, icon: ShieldCheck, color: "text-emerald-400" },
    { label: "Auto-Approval Rate", value: s.totalDocs > 0 ? `${Math.round(((s.autoApproved ?? 0) / s.totalDocs) * 100)}%` : "—", icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Avg Risk", value: s.avgRiskScore ? s.avgRiskScore.toFixed(3) : "0.000", icon: Activity, color: "text-amber-400" },
    { label: "Avg Processing", value: s.avgProcessingMs ? `${(s.avgProcessingMs / 1000).toFixed(1)}s` : "—", icon: Zap, color: "text-indigo-400" },
  ];

  return (
    <div className="pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-12">
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Intelligence Studio</p>
        <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-3">Analytics</h1>
        <p className="text-zinc-500 text-base font-light max-w-xl">
          Deep financial intelligence — spend trajectories, vendor analysis, AI decision patterns & risk distribution.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statPanels.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 rounded-[24px] bg-white/[0.015] border border-white/[0.05]"
          >
            {isLoading ? (
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.04] animate-pulse" />
                <div className="w-20 h-6 rounded bg-white/[0.04] animate-pulse" />
                <div className="w-16 h-3 rounded bg-white/[0.03] animate-pulse" />
              </div>
            ) : (
              <>
                <stat.icon size={18} className={`${stat.color} mb-3`} />
                <p className="font-outfit text-2xl font-black text-white tracking-tight">{stat.value}</p>
                <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-1">{stat.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {!hasData && !isLoading ? (
        <div className="py-40 text-center bg-white/[0.01] rounded-[40px] border border-white/[0.03]">
          <p className="font-outfit text-3xl font-black text-zinc-400 mb-3">Insufficient Data</p>
          <p className="text-zinc-600">Upload and process documents for the AI to build intelligence models.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Row 1: Spend + Decision Donut ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spend Trajectory — full width on mobile, 2/3 on lg */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-2 p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/8 blur-[100px] rounded-full pointer-events-none" />
              <SectionTitle title="Burn Trajectory" sub="Actual spend vs AI confidence forecast" icon={TrendingUp} iconColor="text-violet-400" />
              <div className="h-[280px] relative z-10">
                {isLoading ? (
                  <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ) : (data?.monthly?.length ?? 0) === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No monthly data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="month" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmt} width={64} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
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
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
            >
              <SectionTitle title="AI Decisions" sub="Decision distribution" icon={CheckCircle2} iconColor="text-emerald-400" />
              {isLoading ? (
                <div className="h-[280px] rounded-2xl bg-white/[0.02] animate-pulse" />
              ) : (data?.decisions?.length ?? 0) === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-zinc-600 text-sm">No decisions yet</div>
              ) : (
                <div className="flex flex-col gap-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.decisions} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={52} outerRadius={78} paddingAngle={4} strokeWidth={0}>
                        {data.decisions.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {data.decisions.map((d: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-zinc-400 font-medium">{d.name}</span>
                        </div>
                        <span className="font-outfit font-bold text-zinc-200">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Row 2: Vendor Bar + Confidence Histogram ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Spend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
            >
              <SectionTitle title="Vendor Spend" sub="Top vendors by total spend" icon={BarChart3} iconColor="text-indigo-400" />
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ) : (data?.vendors?.length ?? 0) === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No vendor data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.vendors.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
                      <XAxis type="number" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmt} />
                      <YAxis type="category" dataKey="name" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Bar dataKey="spend" name="Total Spend" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Confidence Histogram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
            >
              <SectionTitle title="Confidence Distribution" sub="AI confidence across all processed docs" icon={ShieldCheck} iconColor="text-emerald-400" />
              <div className="h-[300px]">
                {isLoading ? (
                  <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.confidenceHistogram ?? []} margin={{ bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="range" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false}
                        tick={{ fill: "#52525b" }} interval={0} angle={-10} textAnchor="end" height={48} />
                      <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Bar dataKey="count" name="Documents" radius={[6, 6, 0, 0]} maxBarSize={56}>
                        {(data?.confidenceHistogram ?? []).map((e: any, i: number) => (
                          <Cell key={i} fill={e.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Row 3: Risk Distribution + Scatter ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]"
            >
              <SectionTitle title="Risk Distribution" sub="Low / Medium / High risk document counts" icon={Activity} iconColor="text-amber-400" />
              <div className="h-[260px]">
                {isLoading ? (
                  <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.riskDistribution ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="range" stroke="#3f3f46" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                      <Bar dataKey="count" name="Documents" radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {(data?.riskDistribution ?? []).map((e: any, i: number) => (
                          <Cell key={i} fill={e.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Confidence vs Risk Scatter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05] relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/8 blur-[80px] rounded-full pointer-events-none" />
              <SectionTitle title="Confidence vs Risk" sub="Each dot = one document" icon={Activity} iconColor="text-indigo-400" />
              <div className="h-[260px] relative z-10">
                {isLoading ? (
                  <div className="h-full rounded-2xl bg-white/[0.02] animate-pulse" />
                ) : (data?.scatterData?.length ?? 0) === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">Upload documents to see scatter</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis type="number" dataKey="confidence" name="Confidence %" domain={[0, 100]}
                        stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}
                        label={{ value: "Confidence %", position: "insideBottom", offset: -5, fill: "#52525b", fontSize: 10 }} />
                      <YAxis type="number" dataKey="risk" name="Risk %"  domain={[0, 100]}
                        stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false}
                        label={{ value: "Risk %", angle: -90, position: "insideLeft", fill: "#52525b", fontSize: 10 }} />
                      <ZAxis type="number" range={[40, 200]} />
                      <Tooltip cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm">
                              <p className="font-bold text-white mb-1">{d.vendor}</p>
                              <p className="text-zinc-400">Confidence: <span className="text-violet-400 font-bold">{d.confidence}%</span></p>
                              <p className="text-zinc-400">Risk: <span className="text-amber-400 font-bold">{d.risk}%</span></p>
                              <p className="text-zinc-400">Decision: <span className="text-zinc-200 font-bold capitalize">{d.decision}</span></p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={data.scatterData} fill="#8b5cf6" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
