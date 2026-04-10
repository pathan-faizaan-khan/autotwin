"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { FileSpreadsheet, Loader2, ExternalLink, Calendar, Search } from "lucide-react";

interface SheetRecord {
  spreadsheetId: string;
  month: string;
  createdAt: string;
}

export default function SheetsDashboard() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchSheets() {
      if (!user) return;
      try {
        const res = await fetch(`/api/integrations/sheets?userId=${user.uid}`);
        const data = await res.json();
        if (data.sheets) {
          setSheets(data.sheets);
        }
      } catch (err) {
        setError("Failed to load Google Sheets history.");
      } finally {
        setLoading(false);
      }
    }
    fetchSheets();
  }, [user]);

  const filteredSheets = sheets.filter(s => 
    s.month.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Loader2 size={40} className="text-violet-500 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Retrieving financial archives...</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Google Drive Archives</p>
          <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-4">Financial Ledgers</h1>
          <p className="text-lg text-zinc-500 font-light max-w-xl">
            Access your automatically generated monthly spreadsheets. Each ledger contains detailed daily breakdowns of processed invoices.
          </p>
        </motion.div>

        {sheets.length > 0 && (
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by month or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.1] rounded-2xl pl-12 pr-4 py-4 text-white font-medium outline-none focus:border-violet-500/50 focus:bg-white/[0.05] transition-all"
            />
          </div>
        )}
      </div>

      {sheets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-dashed border-white/[0.1] rounded-[40px] p-20 flex flex-col items-center justify-center text-center max-w-3xl mx-auto"
        >
          <div className="w-24 h-24 rounded-3xl bg-violet-600/10 flex items-center justify-center mb-8 border border-violet-500/20">
            <FileSpreadsheet size={48} className="text-violet-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Archives Yet</h2>
          <p className="text-zinc-500 mb-8 max-w-md">
            Archive generation begins automatically with your first invoice processing after connecting Google Sheets.
          </p>
          <button 
            onClick={() => window.location.href = "/dashboard/integrations"}
            className="px-8 py-4 rounded-2xl bg-violet-600 text-white font-black hover:bg-violet-700 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            Manage Integrations
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSheets.map((sheet, idx) => (
            <motion.div
              key={sheet.spreadsheetId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-8 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={28} className="text-emerald-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{formatMonth(sheet.month)}</h3>
                
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-8">
                  <Calendar size={14} />
                  <span>Created on {new Date(sheet.createdAt).toLocaleDateString()}</span>
                </div>
                
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <ExternalLink size={16} /> Open Ledger
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {sheets.length > 0 && searchTerm && filteredSheets.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500 italic">No ledgers match your search terms.</p>
        </div>
      )}
    </div>
  );
}
