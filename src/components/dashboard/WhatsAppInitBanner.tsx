"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ExternalLink } from "lucide-react";

interface Props {
  firebaseUid: string;
  whatsappNumber?: string | null;
  onDismiss?: () => void;
}

const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "";

export default function WhatsAppInitBanner({ firebaseUid, whatsappNumber, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!whatsappNumber || !BOT_NUMBER || dismissed) return null;

  const waLink = (window as any)._waLink || `https://wa.me/${BOT_NUMBER.replace(/\D/g, "")}?text=Hi`;

  const close = () => { setDismissed(true); onDismiss?.(); };

  const handleActivate = async () => {
    try {
      await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid, chatbotInitiated: true }),
      });
    } catch { /* non-fatal */ }
    close();
    window.open(waLink, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="mx-4 md:mx-8 lg:mx-12 mt-2 mb-[-8px] flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <MessageCircle size={16} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 font-medium leading-snug">
              Activate WhatsApp alerts — send a quick message to start the bot.
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">AutoTwin AI can only receive your messages after you initiate the chat.</p>
          </div>
          <button
            onClick={handleActivate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors shrink-0"
          >
            <ExternalLink size={11} /> Open WhatsApp
          </button>
          <button
            onClick={close}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
