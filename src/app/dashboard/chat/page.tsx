"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Sparkles, Loader2, Key, Paperclip, File, X,
  Image as ImageIcon, MessageSquare, Clock, ChevronRight, FileText, Zap, Plus,
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

const MAX_CONTEXT_MESSAGES = 50;

type Message = {
  id?: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
  channel?: "platform" | "whatsapp" | "voice";
  language?: string;
  attachment?: { url: string; type: "image" | "file"; name: string };
};

const WELCOME: Message = {
  id: "welcome",
  role: "ai",
  text: "I am logged into the Financial Memory Graph. How can I assist you with your operations today?\n\nTry asking:\n* *\"Show me spending anomalies this week\"*\n* *\"Which vendors are highest risk?\"*\n* *\"What's our budget burn rate?\"*\n* *\"Any duplicate invoices?\"*\n* *\"What's pending in approvals?\"*",
  timestamp: Date.now(),
  channel: "platform",
};

function mapRow(row: any): Message {
  return {
    id: row.id,
    role: row.role === "user" ? "user" : "ai",
    text: row.content,
    timestamp: new Date(row.created_at).getTime(),
    channel: row.channel ?? "platform",
    language: row.language ?? "en",
  };
}

function groupByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  const map: Record<string, Message[]> = {};
  for (const m of messages) {
    const d = new Date(m.timestamp).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
    if (!map[d]) { map[d] = []; groups.push({ date: d, messages: map[d] }); }
    map[d].push(m);
  }
  return groups;
}

const PROCESSABLE_MIME = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp",
]);

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processMode, setProcessMode] = useState<"attach" | "invoice" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isContextFull = messages.filter(m => m.id !== "welcome").length >= MAX_CONTEXT_MESSAGES;

  const handleNewChat = () => {
    setMessages([{ ...WELCOME, timestamp: Date.now() }]);
    setInput("");
    setStagedFile(null);
    setProcessMode(null);
    setErrorMsg(null);
  };

  // Load chat history from Supabase
  useEffect(() => {
    if (!user?.uid) return;
    setHistoryLoading(true);
    supabase
      .from("chat_messages")
      .select("id, role, content, channel, language, created_at")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: true })
      .limit(MAX_CONTEXT_MESSAGES)
      .then(({ data, error }) => {
        if (error) console.warn("History load error:", error.message);
        setMessages(data && data.length > 0 ? data.map(mapRow) : [WELCOME]);
        setHistoryLoading(false);
      });
  }, [user]);

  // Supabase Realtime — receive WhatsApp/voice messages live
  useEffect(() => {
    if (!user?.uid) return;
    const ch = supabase
      .channel(`chat-${user.uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.uid}` },
        ({ new: row }: any) => {
          if (row.channel !== "platform") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [...prev, mapRow(row)];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, processing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setStagedFile(f);
    setProcessMode(PROCESSABLE_MIME.has(f.type) ? null : "attach");
  };

  const uploadToSupabase = async (file: File) => {
    try {
      setUploading(true);
      let toUpload: File = file;
      if (file.type.startsWith("image/")) {
        toUpload = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      }
      const form = new FormData();
      form.append("file", toUpload, file.name);
      form.append("bucket", "chat-attachments");
      form.append("userId", user?.uid || "");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      const { url, name } = await res.json();
      return { url, type: file.type.startsWith("image/") ? "image" as const : "file" as const, name };
    } catch (err: any) {
      setErrorMsg("File upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
      setStagedFile(null);
      setProcessMode(null);
    }
  };

  const processAsInvoice = async () => {
    if (!stagedFile || !user?.uid) return;
    setProcessing(true);
    setErrorMsg(null);
    const file = stagedFile;
    setStagedFile(null);
    setProcessMode(null);

    setMessages((prev) => [
      ...prev,
      {
        id: `proc-${Date.now()}`,
        role: "user",
        text: `Processing document: **${file.name}** through OCR pipeline...`,
        timestamp: Date.now(),
        channel: "platform",
      },
    ]);

    try {
      const form = new FormData();
      form.append("file", file, file.name);
      form.append("userId", user.uid);
      const res = await fetch("/api/process-invoice", { method: "POST", body: form });
      const result = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `proc-result-${Date.now()}`,
          role: "ai",
          text: result.success
            ? `Document processed successfully.\n\n**Vendor:** ${result.vendor || "Unknown"}\n**Amount:** ${result.currency || "INR"} ${result.amount ?? "—"}\n**Invoice #:** ${result.invoice_no || "—"}\n**Status:** ${result.decision || result.status || "Extracted"}\n\nThe document has been indexed and is now queryable through the memory graph.`
            : `Document processing failed: ${result.error || "Unknown error"}`,
          timestamp: Date.now(),
          channel: "platform",
        },
      ]);
    } catch (err: any) {
      setErrorMsg("Processing failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !stagedFile) return;
    if (!user?.uid) return;
    if (isContextFull) return;

    setErrorMsg(null);
    setIsLoading(true);

    let attachmentData = undefined;
    if (stagedFile) attachmentData = await uploadToSupabase(stagedFile);

    const currentInput = input;
    setInput("");

    const userMsg: Message = {
      id: `pending-${Date.now()}`,
      role: "user",
      text: currentInput || "Uploaded a file.",
      timestamp: Date.now(),
      channel: "platform",
      ...(attachmentData && { attachment: attachmentData }),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { data } = await axios.post("/api/chat", { query: currentInput, userId: user.uid });
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: data.reply,
          timestamp: Date.now(),
          channel: "platform",
          language: data.language,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to contact AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => (processMode === "invoice" ? processAsInvoice() : sendMessage());

  const scrollToMsg = (id: string) => {
    setHistoryOpen(false);
    setTimeout(() => msgRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  };

  const dateGroups = groupByDate(messages.filter((m) => m.id !== "welcome"));
  const isProcessable = stagedFile && PROCESSABLE_MIME.has(stagedFile.type);
  const busy = isLoading || uploading || processing;

  return (
    <div className="h-full flex flex-col max-w-[900px] mx-auto pb-4 md:pb-6 px-2 md:px-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4 md:mb-6 shrink-0 text-center relative">
        <h1 className="font-outfit text-2xl md:text-4xl font-black text-white tracking-tighter mb-1 md:mb-2 flex items-center justify-center gap-3">
          <Sparkles className="text-violet-500" size={20} /> Generative Operations
        </h1>
        <p className="text-xs md:text-sm text-zinc-500 font-light">Direct neural interface to your extracted financial data.</p>

        {/* Header action buttons */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors px-2 md:px-3 py-2 rounded-xl hover:bg-white/5"
          >
            <Plus size={13} /> New Chat
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors px-2 md:px-3 py-2 rounded-xl hover:bg-white/5"
          >
            <Clock size={13} /> History
          </button>
        </div>
      </motion.div>

      {/* History Drawer */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
              className="fixed top-24 inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-24 h-[calc(100vh-6rem)] w-[85vw] max-w-[340px] bg-[#0a0a0a] border-l border-white/[0.07] z-50 flex flex-col"
            >
              <div className="p-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-violet-400" />
                  <span className="text-sm font-semibold text-white">Chat History</span>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {dateGroups.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-8">No history yet</p>
                ) : (
                  dateGroups.map(({ date, messages: dayMsgs }) => (
                    <div key={date}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2 px-1">{date}</p>
                      <div className="space-y-1">
                        {dayMsgs
                          .filter((m) => m.role === "user")
                          .slice(0, 6)
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={() => m.id && scrollToMsg(m.id)}
                              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group flex items-center gap-2"
                            >
                              <User size={12} className="text-zinc-600 shrink-0" />
                              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate flex-1">
                                {m.text.slice(0, 72)}{m.text.length > 72 ? "…" : ""}
                              </span>
                              <ChevronRight size={12} className="text-zinc-700 group-hover:text-violet-400 shrink-0 transition-colors" />
                            </button>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chat container */}
      <div className="bg-white/[0.01] border border-white/[0.05] rounded-[24px] md:rounded-[40px] overflow-hidden flex flex-col flex-1 relative min-h-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 relative z-10 scroll-smooth">
          {historyLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-zinc-600" />
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={m.id || i}
              ref={(el) => { if (m.id) msgRefs.current[m.id] = el; }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex max-w-[92%] md:max-w-[85%] gap-3 md:gap-4 ${m.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${m.role === "user" ? "bg-white/10 text-white" : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"}`}>
                {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 md:px-6 py-3 md:py-4 text-[13px] md:text-[15px] leading-relaxed backdrop-blur-md shadow-xl ${m.role === "user" ? "bg-white/10 rounded-3xl rounded-tr-lg text-white" : "bg-black/40 border border-white/[0.05] rounded-3xl rounded-tl-lg text-zinc-300"}`}>
                  {m.attachment && (
                    <div className="mb-3 max-w-[240px] md:max-w-[280px]">
                      {m.attachment.type === "image" ? (
                        <img src={m.attachment.url} alt={m.attachment.name} className="w-full rounded-xl border border-white/10" />
                      ) : (
                        <a href={m.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                          <File size={24} className="text-violet-400" />
                          <span className="text-xs font-semibold truncate flex-1">{m.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {m.text !== "Uploaded a file." && (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-2 mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-2 mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-zinc-100" {...props} />,
                        em: ({ node, ...props }) => <em className="italic text-zinc-400" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />,
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  )}
                </div>
                <div className={`flex items-center gap-2 px-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {m.channel === "whatsapp" && (
                    <span className="flex items-center gap-1 text-[9px] text-green-500 font-bold uppercase tracking-widest">
                      <MessageSquare size={10} /> WhatsApp
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {busy && (
            <div className="flex gap-3 md:gap-4 max-w-[92%] md:max-w-[85%]">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-600/20 text-violet-400">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="px-4 md:px-6 py-3 md:py-4 bg-transparent text-zinc-500 flex items-center gap-2 text-sm font-medium">
                {uploading ? "Compressing & Up-Linking..." : processing ? "Running OCR pipeline (~30s)..." : "Generating response..."}
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Context window full banner */}
        <AnimatePresence>
          {isContextFull && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-4 mb-3 px-4 py-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-between gap-3 z-10"
            >
              <p className="text-xs text-violet-300">
                Context window full ({MAX_CONTEXT_MESSAGES} messages). Start a new chat to continue.
              </p>
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors shrink-0"
              >
                <Plus size={12} /> New Chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-3 md:p-6 bg-[#030303] border-t border-white/[0.05] relative z-10 flex flex-col gap-3 md:gap-4">
          <AnimatePresence>
            {stagedFile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] w-fit px-4 py-2 rounded-xl">
                  {stagedFile.type.startsWith("image/") ? (
                    <ImageIcon size={16} className="text-indigo-400" />
                  ) : (
                    <FileText size={16} className="text-violet-400" />
                  )}
                  <span className="text-xs text-zinc-300 font-medium max-w-[150px] md:max-w-[200px] truncate">{stagedFile.name}</span>
                  <span className="text-[10px] text-zinc-500">{(stagedFile.size / 1024 / 1024).toFixed(2)}MB</span>
                  <button
                    onClick={() => { setStagedFile(null); setProcessMode(null); }}
                    className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                {isProcessable && (
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-[11px] text-zinc-500">Send as:</span>
                    <button
                      onClick={() => setProcessMode("attach")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${processMode === "attach" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                      Attachment
                    </button>
                    <button
                      onClick={() => setProcessMode("invoice")}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${processMode === "invoice" ? "bg-violet-600/30 text-violet-300 border border-violet-500/40" : "text-zinc-500 hover:text-violet-400"}`}
                    >
                      <Zap size={11} /> Process as Invoice
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 md:gap-3 w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.csv,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || isContextFull}
              className="w-10 h-10 md:w-[50px] md:h-[50px] rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors shrink-0 disabled:opacity-40"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={busy || isContextFull}
              placeholder={
                isContextFull
                  ? "Context window full — start a new chat above"
                  : processMode === "invoice"
                  ? "Add a note (optional) or press Enter to process..."
                  : "Query the memory graph... (Shift+Enter for newline)"
              }
              className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-white/20 transition-all rounded-2xl md:rounded-3xl py-3 md:py-4 px-4 md:px-6 text-white text-[13px] md:text-[15px] outline-none resize-none min-h-[44px] md:min-h-[50px] max-h-[120px] md:max-h-[150px] custom-scrollbar disabled:opacity-40"
              rows={1}
            />

            <button
              onClick={handleSend}
              disabled={busy || (!input.trim() && !stagedFile) || isContextFull}
              className={`w-10 h-10 md:w-[50px] md:h-[50px] rounded-full disabled:bg-white/10 disabled:text-zinc-600 text-white flex items-center justify-center transition-all shrink-0 shadow-lg disabled:shadow-none ${
                processMode === "invoice"
                  ? "bg-violet-800 hover:bg-violet-700 shadow-violet-800/20"
                  : "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20"
              }`}
            >
              {processMode === "invoice" ? <Zap size={16} /> : <Send size={16} className={(input.trim() || stagedFile) && !isLoading ? "ml-0.5" : ""} />}
            </button>
          </div>

          {errorMsg && (
            <div className="text-center flex items-center justify-center gap-2 text-red-400 text-xs font-semibold">
              <Key size={14} /> {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
