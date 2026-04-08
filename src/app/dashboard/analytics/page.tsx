"use client";

import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["analytics", user?.uid], queryFn: async () => (await axios.get(`/api/analytics?userId=${user?.uid || ""}`)).data, enabled: !!user?.uid });

  return (
    <div className="pb-24">
      <div className="mb-16">
         <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Intelligence Studio</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">High-level predictive burn modeling driven by autonomous operations.</p>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
           <div className="h-[500px] bg-white/[0.02] rounded-[40px]" />
           <div className="h-[500px] bg-white/[0.02] rounded-[40px]" />
        </div>
      ) : !data?.monthly?.length ? (
        <div className="py-40 text-center text-zinc-500 bg-white/[0.01] rounded-[40px] border border-white/[0.03]">
          <p className="font-outfit text-3xl font-black text-zinc-400 mb-2">Insufficient Graph Density</p>
          <p>Intelligence Engine requires more processed extractions to build a confidence model.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Chart 1 */}
           <div className="p-10 bg-white/[0.01] rounded-[40px] border border-white/[0.03] lg:col-span-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
             <h2 className="text-xl font-bold text-white mb-10 relative z-10">Burn Trajectory VS Confidence Forecast</h2>
             <div className="h-[400px] relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.monthly}>
                   <XAxis dataKey="month" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                   <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                   <Tooltip contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white' }} />
                   <Line type="monotone" dataKey="actual" stroke="#a78bfa" strokeWidth={4} dot={{ r: 6, fill: "#030303", strokeWidth: 2 }} activeDot={{ r: 8 }} />
                   <Line type="monotone" dataKey="forecast" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
           </div>

           {/* Chart 2 */}
           <div className="p-10 bg-[#030303] rounded-[40px] border border-white/[0.05] relative overflow-hidden group hover:border-white/10 transition-colors">
              <h2 className="text-xl font-bold text-white mb-10">Anomaly Detection Plot</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.anomalies?.slice().reverse() || []}>
                    <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                    <Bar dataKey="count" fill="#3f3f46" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           {/* Stats card */}
           <div className="p-10 bg-gradient-to-br from-indigo-950/30 to-black rounded-[40px] border border-white/[0.03] flex flex-col justify-center">
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-4">Live Analysis</p>
              <p className="font-outfit text-6xl font-black text-white tracking-tighter mb-8">₹{data.summary?.totalSpend?.toLocaleString()}</p>
              <div className="space-y-4 text-lg">
                 <div className="flex justify-between border-b border-white/[0.05] pb-4"><span className="text-zinc-500">Avg extraction</span><span className="text-emerald-400 font-medium font-outfit">₹{data.summary?.avgInvoice.toLocaleString()}</span></div>
                 <div className="flex justify-between"><span className="text-zinc-500">Critical Flags</span><span className="text-red-400 font-medium font-outfit">{data.summary?.anomaliesDetected}</span></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
