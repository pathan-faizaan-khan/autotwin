"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus, FileText, ArrowUpRight, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: invoices = [], isLoading } = useQuery({ 
    queryKey: ["invoices"], 
    queryFn: async () => (await axios.get("/api/invoices")).data.invoices || [], 
    refetchInterval: 10000 
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setIsProcessing(true);
      
      // 1. Upload to Supabase Storage
      setLoadingStep("Uploading document to secure vault...");
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage.from('chat-attachments').upload(`invoices/${fileName}`, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);

      // 2. Trigger FastAPI Pipeline
      setLoadingStep("Initializing VisionAgent extraction...");
      await axios.post("/api/process-invoice", { fileUrl: publicUrl, userId: user.uid });
      
      setLoadingStep("Updating Financial Memory Graph...");
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });

    } catch (err: any) {
      alert("Pipeline Error: " + err.message);
    } finally {
      setIsProcessing(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="pb-24 relative">
      
      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">
            <div className="bg-[#030303] border border-white/[0.05] p-10 rounded-[40px] max-w-sm w-full text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-violet-600/20 flex items-center justify-center mb-6 text-violet-400">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-outfit">Neural Pipeline Active</h3>
              <p className="text-sm text-zinc-400 font-medium">{loadingStep}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Invoice Engine</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">Every ingested document, autonomously verified and structured.</p>
        </motion.div>
        
        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*,.pdf" />
        <motion.button onClick={() => fileInputRef.current?.click()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="group h-[52px] px-6 rounded-full bg-white text-black font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors">
          <Plus size={18} /> Upload Document
        </motion.button>
      </div>

      <div className="flex flex-col gap-8">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative group">
            <div className="absolute inset-0 bg-white/[0.02] rounded-2xl border border-white/[0.05] group-focus-within:border-white/20 transition-all" />
            <div className="relative flex items-center px-4">
              <Search size={18} className="text-zinc-500" />
              <input placeholder="Search vendors, ID, amount..." className="w-full bg-transparent border-none py-4 px-4 text-white text-[15px] outline-none placeholder:text-zinc-600" />
            </div>
          </div>
          <button className="h-[56px] px-6 rounded-2xl border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-3 font-medium">
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Minimalist List */}
        <div className="bg-white/[0.01] border border-white/[0.03] rounded-[32px] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-8 py-5 border-b border-white/[0.03] text-xs font-bold uppercase tracking-widest text-zinc-600">
            <div>Vendor & ID</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Confidence</div>
            <div></div>
          </div>

          <div className="flex flex-col">
            {isLoading ? (
               [1,2,3,4,5].map(i => (
                 <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-8 py-6 items-center border-b border-white/[0.02]">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 animate-pulse" />
                       <div className="space-y-2"><div className="w-32 h-4 rounded bg-white/5 animate-pulse"/><div className="w-20 h-3 rounded bg-white/5 animate-pulse"/></div>
                    </div>
                 </div>
               ))
            ) : invoices.length === 0 ? (
               <div className="py-32 px-8 text-center text-zinc-500">
                  <FileText className="mx-auto mb-6 opacity-20" size={64} />
                  <p className="text-xl font-outfit font-medium">Database Empty</p>
                  <p className="text-sm mt-2">Awaiting your first upload.</p>
               </div>
            ) : (
              invoices.map((inv: any, i: number) => (
                <div key={inv.id} className={`group grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-8 py-6 items-center transition-colors hover:bg-white/[0.02] ${i !== invoices.length - 1 ? 'border-b border-white/[0.02]' : ''}`}>
                   
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500 group-hover:bg-violet-500/10 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-all">
                       <FileText size={20} />
                     </div>
                     <div>
                       <h3 className="font-bold text-white text-base mb-1">{inv.vendor}</h3>
                       <p className="text-xs text-zinc-500 uppercase tracking-wider">{inv.invoiceNo}</p>
                     </div>
                   </div>

                   <div className="font-outfit text-xl font-medium text-white">
                     {inv.currency === "INR" ? "₹" : ""}{inv.amount.toLocaleString()}
                   </div>

                   <div>
                     <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ${
                       inv.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                       inv.status === 'flagged' ? 'bg-amber-500/10 text-amber-400' :
                       inv.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                       'bg-zinc-800 text-zinc-400'
                     }`}>
                       {inv.status}
                     </span>
                   </div>

                   <div className="flex items-center gap-3 max-w-[120px]">
                      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${inv.confidence >= 90 ? 'bg-emerald-400' : inv.confidence >= 75 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${inv.confidence}%` }} />
                      </div>
                      <span className="text-xs font-bold text-zinc-400">{inv.confidence}%</span>
                   </div>

                   <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 hover:bg-white/10 hover:text-white transition-all ml-auto">
                      <ArrowUpRight size={18} />
                   </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
