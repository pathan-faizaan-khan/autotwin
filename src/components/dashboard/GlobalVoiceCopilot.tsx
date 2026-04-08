"use client";

import React, { useState, useEffect, useRef } from "react";
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2, Sparkles, Volume2, Database, Receipt } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function GlobalVoiceCopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [contextData, setContextData] = useState<any>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Handle user pausing speech (timeout triggers API call)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (listening && transcript.length > 0) {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        handleAnalyzeQuery(transcript);
        SpeechRecognition.stopListening();
      }, 1500); // 1.5s of silence triggers execution
    }
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [transcript, listening]);

  const handleAnalyzeQuery = async (query: string) => {
    if (!query) return;
    setIsProcessing(true);
    setAiResponse("");
    setContextData(null);
    
    // Optimistically update message history with the user's spoken intent
    const currentMessages = [...messages];
    const updatedMessages: {role: 'user' | 'assistant', content: string}[] = [
       ...currentMessages, 
       { role: 'user', content: query }
    ];
    setMessages(updatedMessages);
    
    try {
      const { data } = await axios.post("/api/chat", {
        query,
        messages: currentMessages, // Send previous history explicitly
        userId: user?.uid 
      });

      setAiResponse(data.reply);
      setContextData(data.rawData);
      
      // Save AI answer to context buffer natively
      setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      
      speak(data.reply);
      
    } catch (error) {
      setAiResponse("I'm sorry, I encountered an error connecting to the intelligence module.");
    } finally {
      setIsProcessing(false);
      resetTranscript();
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      // Clear queue
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Clean markdown symbols for cleaner TTS
      utterance.text = text.replace(/[*#>`|-]/g, "");
      
      // Auto-detect a good voice (prioritizing clear English/Multilingual if available)
      const voices = window.speechSynthesis.getVoices();
      
      // Prioritize Male voices (David, Mark, Google UK Male, Arthur, etc)
      const preferred = voices.find(v => 
         /male|david|mark|arthur|google uk english male/i.test(v.name) && !/female|zira|samantha|victoria/i.test(v.name)
      ) || voices.find(v => v.lang.includes("en")) || voices[0];
      
      if (preferred) utterance.voice = preferred;
      
      // Continuous 1-to-1 conversation loop handoff trigger
      utterance.onend = () => {
         // Forcefully snap the mic back open to await the user's rebuttal indefinitely
         resetTranscript();
         SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      if (transcript.trim().length > 0) {
        handleAnalyzeQuery(transcript);
      }
    } else {
      setIsOpen(true);
      resetTranscript();
      setAiResponse("");
      setContextData(null);
      // Added `language` fallback to 'en-US' to aggressively constrain Browser STT silent drops
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
    }
  };

  const closeCopilot = () => {
    SpeechRecognition.stopListening();
    window.speechSynthesis.cancel();
    setIsOpen(false);
    setMessages([]); // Purge active session
  };

  if (!browserSupportsSpeechRecognition) {
    return null; // Not supported on this browser silently mount nothing
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-8 w-[400px] z-[9999] flex flex-col gap-4 max-h-[80vh]"
          >
            {/* Visual Screen Render - Fulfills "shows fetched data on screen" */}
            {contextData && (contextData.recentDocs?.length > 0 || contextData.recentInvoices?.length > 0) && (
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[300px] custom-scrollbar"
              >
                 <div className="flex items-center gap-2 mb-4 text-violet-400 text-sm font-bold tracking-widest uppercase">
                   <Database size={16} /> Context Retrieved
                 </div>
                 <div className="space-y-3">
                    {/* Render standard invoices context slice */}
                    {contextData.recentInvoices?.slice(0, 3).map((inv: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.04] border border-white/[0.05]">
                         <div className="flex items-center gap-3">
                           <Receipt size={16} className="text-zinc-500" />
                           <span className="text-sm font-medium text-white">{inv.vendor}</span>
                         </div>
                         <span className="text-sm font-medium text-zinc-400">₹{inv.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    
                    {contextData.recentDocs?.slice(0, 2).map((doc: any, i: number) => (
                      <div key={`d-${i}`} className="flex justify-between items-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                         <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full animate-pulse bg-amber-400" />
                           <span className="text-sm font-medium text-amber-200">Flagged: {doc.vendor}</span>
                         </div>
                         <span className="text-sm font-bold text-amber-400">{Math.round(doc.confidence * 100)}% Risk</span>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}

            {/* AI Voice Bubble */}
            <div className="bg-[#030303]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-full h-[150px] bg-gradient-to-b from-violet-600/20 to-transparent blur-[50px] rounded-t-[32px] pointer-events-none" />
               
               <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                     {listening ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <Sparkles size={14} className="text-violet-400" />}
                     <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                        {listening ? "Actively Listening..." : "AutoTwin Copilot"}
                     </span>
                  </div>
                  <button onClick={closeCopilot} className="text-zinc-500 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                    <X size={16} />
                  </button>
               </div>

               <div className="mb-4 relative z-10 min-h-[60px]">
                  {isProcessing ? (
                     <div className="flex items-center gap-3 text-zinc-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm font-medium">Fetching secure financial data...</span>
                     </div>
                  ) : aiResponse ? (
                     <div className="flex items-start gap-4">
                        <Volume2 className="text-emerald-400 shrink-0 mt-1" size={20} />
                        <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                           {aiResponse.replace(/[*#>`|-]/g, '')}
                        </p>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-3 w-full">
                        <p className="text-xl font-outfit text-white font-medium min-h-[30px]">
                           {transcript || "Speak or type your question..."}
                        </p>
                        {!listening && (
                          <input 
                            type="text" 
                            placeholder="Type a manual query to AutoTwin AI..." 
                            className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500/50 w-full"
                            onKeyDown={(e) => {
                               if (e.key === 'Enter' && e.currentTarget.value.trim().length > 0) {
                                  handleAnalyzeQuery(e.currentTarget.value);
                                  e.currentTarget.value = "";
                               }
                            }}
                          />
                        )}
                     </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Global Trigger Button */}
      <motion.button
         whileHover={{ scale: 1.05 }}
         whileTap={{ scale: 0.95 }}
         onClick={toggleListen}
         className={`fixed bottom-8 right-8 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            listening ? 'bg-red-500 text-white shadow-red-500/30' : 
            isOpen ? 'bg-zinc-800 text-zinc-300 border border-white/10' : 
            'bg-violet-600 text-white shadow-violet-600/30 hover:bg-violet-500'
         }`}
      >
         {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Mic size={24} />}
      </motion.button>
    </>
  );
}
