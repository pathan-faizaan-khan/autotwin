"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Loader2, Sparkles, Volume2, Database, Receipt, Send } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function GlobalVoiceCopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [contextData, setContextData] = useState<any>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-submit after voice pause
  useEffect(() => {
    if (listening && transcript.length > 0) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        handleAnalyzeQuery(transcript);
        SpeechRecognition.stopListening();
      }, 1500);
    }
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); };
  }, [transcript, listening]);

  const handleAnalyzeQuery = useCallback(async (query: string) => {
    if (!query.trim() || isProcessing) return;
    setIsProcessing(true);
    setAiResponse("");
    setContextData(null);
    setTextInput("");

    const currentMessages = [...messages];
    const updatedMessages: {role: 'user' | 'assistant', content: string}[] = [
      ...currentMessages,
      { role: 'user', content: query }
    ];
    setMessages(updatedMessages);

    try {
      const { data } = await axios.post("/api/chat", {
        query,
        messages: currentMessages,
        userId: user?.uid,
      });

      setAiResponse(data.reply);
      setContextData(data.rawData);
      setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      speak(data.reply);
    } catch {
      setAiResponse("Unable to connect to the intelligence module. Please try again.");
    } finally {
      setIsProcessing(false);
      resetTranscript();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isProcessing, user?.uid]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      text.replace(/[*#>`|-]/g, "")
    );
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      /male|david|mark|arthur|google uk english male/i.test(v.name) &&
      !/female|zira|samantha|victoria/i.test(v.name)
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utterance.voice = preferred;
    // After speaking: reset — let user choose to mic or type again
    utterance.onend = () => resetTranscript();
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      if (transcript.trim()) handleAnalyzeQuery(transcript);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: "en-US" });
    }
  };

  const closeCopilot = () => {
    SpeechRecognition.stopListening();
    window.speechSynthesis.cancel();
    setIsOpen(false);
    resetTranscript();
    setTextInput("");
    setAiResponse("");
    setMessages([]);
  };

  const openCopilot = () => {
    setIsOpen(true);
    setAiResponse("");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) handleAnalyzeQuery(textInput.trim());
  };

  const micSupported = browserSupportsSpeechRecognition;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-8 w-[420px] z-[9999] flex flex-col gap-3"
          >
            {/* Context Data Panel */}
            <AnimatePresence>
              {contextData && (contextData.recentDocs?.length > 0 || contextData.recentInvoices?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[220px]"
                >
                  <div className="flex items-center gap-2 mb-3 text-violet-400 text-xs font-bold tracking-widest uppercase">
                    <Database size={14} /> Live Context
                  </div>
                  <div className="space-y-2">
                    {contextData.recentInvoices?.slice(0, 3).map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.04] border border-white/[0.05]">
                        <div className="flex items-center gap-2">
                          <Receipt size={13} className="text-zinc-500" />
                          <span className="text-xs font-medium text-white">{inv.vendor}</span>
                        </div>
                        <span className="text-xs text-zinc-400">₹{inv.amount?.toLocaleString()}</span>
                      </div>
                    ))}
                    {contextData.recentDocs?.slice(0, 2).map((doc: any, i: number) => (
                      <div key={`d-${i}`} className="flex justify-between items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-amber-400" />
                          <span className="text-xs font-medium text-amber-200">Flagged: {doc.vendor}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-400">{Math.round((doc.confidence ?? 0) * 100)}% Risk</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Copilot Panel */}
            <div className="bg-[#030303]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-full h-[120px] bg-gradient-to-b from-violet-600/15 to-transparent blur-[40px] rounded-t-[32px] pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-center px-6 pt-5 pb-3 relative z-10">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  {listening
                    ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    : <Sparkles size={13} className="text-violet-400" />
                  }
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                    {listening ? "Listening..." : "AutoTwin Copilot"}
                  </span>
                </div>
                <button onClick={closeCopilot} className="text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                  <X size={15} />
                </button>
              </div>

              {/* AI Response / Transcript */}
              <div className="px-6 pb-3 relative z-10 min-h-[52px]">
                {isProcessing ? (
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Loader2 className="animate-spin" size={17} />
                    <span className="text-sm font-medium">Analyzing your finances...</span>
                  </div>
                ) : aiResponse ? (
                  <div className="flex items-start gap-3">
                    <Volume2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm text-zinc-200 leading-relaxed">
                      {aiResponse.replace(/[*#>`|-]/g, "")}
                    </p>
                  </div>
                ) : listening && transcript ? (
                  <p className="text-base font-outfit text-white/80 italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-sm text-zinc-600">
                    {micSupported ? "Tap the mic or type below to ask about your finances." : "Type your financial question below."}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-white/5 mb-3" />

              {/* Text Input — ALWAYS VISIBLE */}
              <form onSubmit={handleTextSubmit} className="flex items-center gap-3 px-4 pb-4 relative z-10">
                {micSupported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={isProcessing}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      listening
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                        : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  disabled={isProcessing || listening}
                  placeholder={listening ? "Speak now..." : "Ask about your invoices, spend, risks..."}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                />

                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing || listening}
                  className="shrink-0 w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isOpen ? (listening ? toggleMic : closeCopilot) : openCopilot}
        className={`fixed bottom-8 right-8 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
          listening
            ? "bg-red-500 text-white shadow-red-500/40"
            : isOpen
            ? "bg-zinc-800 text-zinc-300 border border-white/10"
            : "bg-violet-600 text-white shadow-violet-600/40 hover:bg-violet-500"
        }`}
      >
        {isProcessing ? <Loader2 size={22} className="animate-spin" /> : <Mic size={22} />}
      </motion.button>
    </>
  );
}
