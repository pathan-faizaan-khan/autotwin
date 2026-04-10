"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, ArrowRight, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

export default function ManualApprovalsPage() {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: approvals = [], isLoading } = useQuery({ queryKey: ["approvals", user?.uid], queryFn: async () => (await axios.get(`/api/approvals?userId=${user?.uid || ""}`)).data.approvals || [], enabled: !!user?.uid, refetchInterval: 30000, refetchOnWindowFocus: false });
  const pending = approvals.filter((a: any) => a.status === "pending");

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => await axios.patch("/api/approvals", { id, status, notes: "Resolution applied" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["approvals"] })
  });

  return (
    <div className="pb-24">
      <div className="mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-outfit text-5xl font-black text-amber-400 tracking-tighter mb-4">Manual Approvals</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Low-confidence extractions routed by the AI for human resolution.</p>
        </motion.div>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-6">
            {[1,2].map(i => <div key={i} className="h-64 rounded-[32px] bg-white/[0.01] border border-white/[0.03] animate-pulse" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="py-32 rounded-[40px] bg-white/[0.01] border border-white/[0.03] text-center flex flex-col items-center">
             <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-8 border border-emerald-500/20">
               <Check size={40} />
             </div>
             <p className="font-outfit text-3xl font-black text-white mb-2">Queue is empty.</p>
             <p className="text-zinc-500 text-lg">Agents are operating with high-confidence.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pending.map((app: any) => (
              <motion.div key={app.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="group p-8 rounded-[32px] bg-white/[0.01] border border-white/[0.03] hover:bg-white/[0.02] flex flex-col md:flex-row gap-8 lg:gap-16 items-start transition-all">
                
                {/* Meta details */}
                <div className="w-full md:w-1/3 shrink-0 flex flex-col justify-between h-full">
                   <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
                        <AlertTriangle size={14} /> Review Required
                     </div>
                     <h2 className="text-3xl font-bold text-white mb-2">{app.vendor}</h2>
                     <p className="text-zinc-500 font-medium mb-6">Invoice {app.invoiceNo}</p>
                     
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.05]">
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">AI Reason</p>
                        <p className="text-red-300/80 text-[15px]">{app.reason}</p>
                     </div>
                   </div>
                </div>

                {/* Amount and Action */}
                <div className="w-full md:w-2/3 flex flex-col gap-10 border-t md:border-t-0 md:border-l border-white/[0.05] pt-8 md:pt-0 md:pl-16">
                   <div>
                      <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Extracted Liability</p>
                      <p className="font-outfit text-6xl font-black tracking-tighter text-white">₹{app.amount?.toLocaleString()}</p>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4">
                      <button onClick={() => updateStatus.mutate({ id: app.id, status: "approved" })} className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center gap-3 transition-colors text-lg">
                        <Check size={20} /> Force Approve
                      </button>
                      <button onClick={() => updateStatus.mutate({ id: app.id, status: "rejected" })} className="flex-1 h-14 rounded-2xl bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 border border-white/5 text-zinc-300 font-bold flex items-center justify-center gap-3 transition-colors text-lg">
                        <X size={20} /> Reject Invoice
                      </button>
                   </div>

                   <button 
                      onClick={() => setSelectedFileUrl(app.fileUrl)}
                      disabled={!app.fileUrl} 
                      className="text-sm font-semibold text-zinc-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 w-fit"
                   >
                      {app.fileUrl ? "Analyze original PDF" : "No Document Attached"} <ArrowRight size={14} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedFileUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
             <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative"
             >
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/50">
                   <div className="flex items-center gap-3">
                      <FileText className="text-violet-400" size={20} />
                      <span className="font-bold text-white font-outfit text-lg">Source Document Viewer</span>
                   </div>
                   <button 
                     onClick={() => setSelectedFileUrl(null)} 
                     className="text-zinc-500 hover:text-white bg-white/5 rounded-full p-2 transition-colors"
                   >
                      <X size={20} />
                   </button>
                </div>
                <div className="w-full flex-1 bg-zinc-950 relative">
                   {selectedFileUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                      <img src={selectedFileUrl} alt="Document" className="w-full h-full object-contain p-4" />
                   ) : (
                      <iframe 
                         src={selectedFileUrl} 
                         className="w-full h-full border-none" 
                         title="PDF Viewer"
                         loading="lazy"
                      />
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
