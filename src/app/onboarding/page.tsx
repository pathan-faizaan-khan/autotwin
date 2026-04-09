"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter, Outfit } from "next/font/google";
import { ShieldCheck, ArrowRight, Loader2, Phone, User, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    whatsappNumber: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login"); // Not logged into Firebase
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/user/me?firebaseUid=${user.uid}`);
        const data = await res.json();
        
        if (data.needsOnboarding === false) {
          router.push("/dashboard"); // Already fully onboarded
        } else {
          // Pre-fill if there's partial data
          setFormData({
            displayName: data.user?.displayName || user.displayName || "",
            whatsappNumber: data.user?.whatsappNumber || "",
          });
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.whatsappNumber) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          email: user?.email,
          displayName: formData.displayName,
          whatsappNumber: formData.whatsappNumber,
        }),
      });

      if (res.ok) {
        window.location.href = "/dashboard"; // hard redirect to clear layout caches
      }
    } catch {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    );
  }

  return (
    <main className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-[#030303] text-zinc-100 selection:bg-violet-500/30 flex items-center justify-center p-6 relative overflow-hidden`}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#09090b] border border-white/[0.08] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mb-8">
            <ShieldCheck className="text-violet-400" size={24} />
          </div>

          <h1 className="font-outfit text-3xl font-black tracking-tight text-white mb-2">Secure your account</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Please provide the mandatory details to finish activating your Financial Command Center.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Disabled Email */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Primary Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input 
                  type="email" 
                  disabled 
                  value={user?.email || ""} 
                  className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3.5 pl-11 text-zinc-400 text-sm outline-none cursor-not-allowed opacity-60 font-medium"
                />
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 pl-11 text-white text-sm outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>

            {/* WhatsApp Number (Mandatory) */}
            <div>
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest block mb-2">WhatsApp Number (Mandatory)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input 
                  type="tel" 
                  required
                  placeholder="+91 9876543210"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3.5 pl-11 text-white text-sm outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 font-medium">AutoTwin AI needs your number to send risk alerts.</p>
            </div>

            <button 
              type="submit" 
              disabled={submitting || !formData.whatsappNumber}
              className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <><span className="text-sm">Complete Setup</span> <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
