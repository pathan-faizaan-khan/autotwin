"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2, Key, Paperclip, File, X, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/context/AuthContext";
import { realtimedb } from "@/lib/firebase";
import { ref, onValue, push, set } from "firebase/database";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

type Message = {
  id?: string;
  role: "user" | "ai";
  text: string;
  timestamp: number;
  attachment?: {
    url: string;
    type: "image" | "file";
    name: string;
  };
};

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
  const [uploading, setUploading] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firebase Realtime DB
  useEffect(() => {
    if (!user?.uid) return;
    const chatRef = ref(realtimedb, `chats/${user.uid}/messages`);
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedMsgs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(parsedMsgs);
      } else {
        // Initial welcome message if empty
        const initialMsg = {
          role: "ai" as const,
          text: "I am logged into the Financial Memory Graph. How can I assist you with your operations today?\n\nTry asking:\n* *\"Show me spending anomalies this week\"*\n* *\"Which vendors are highest risk?\"*\n* *\"What's our budget burn rate?\"*\n* *\"Any duplicate invoices?\"*\n* *\"What's pending in approvals?\"*",
          timestamp: Date.now()
        };
        push(chatRef, initialMsg).catch(e => {
          console.warn("DB Init warning:", e.message);
          setMessages([initialMsg]);
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-scroll Down
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStagedFile(e.target.files[0]);
    }
  };

  const uploadToSupabase = async (file: File) => {
    try {
      setUploading(true);
      let fileToUpload = file;

      // Compress Images
      if (file.type.startsWith("image/")) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        });
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(`${user?.uid}/${fileName}`, fileToUpload);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);
      return { url: publicUrl, type: file.type.startsWith("image/") ? "image" as const : "file" as const, name: file.name };
    } catch (err: any) {
      setErrorMsg("File upload failed: " + err.message);
      return null;
    } finally {
      setUploading(false);
      setStagedFile(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !stagedFile) return;
    if (!user?.uid) return;

    setErrorMsg(null);
    setIsLoading(true);

    let attachmentData = undefined;
    if (stagedFile) {
      attachmentData = await uploadToSupabase(stagedFile);
    }

    const currentInput = input;
    setInput("");

    const chatRef = ref(realtimedb, `chats/${user.uid}/messages`);
    
    // Save User Message (Do not await, to prevent infinite hanging if offline)
    const userMsg = {
      role: "user" as const,
      text: currentInput || "Uploaded a file.",
      timestamp: Date.now(),
      ...(attachmentData && { attachment: attachmentData })
    };
    push(chatRef, userMsg).catch(e => {
      console.warn("DB Save warning (user):", e.message);
      setMessages(prev => [...prev, userMsg]); // Push to local state fallback
    });

    try {
      // Send context to AI Route
      const newMsgs = [...messages, userMsg];
      const { data } = await axios.post("/api/chat", { messages: newMsgs, query: currentInput, userId: user.uid });
      
      // Save AI Response
      const aiMsg = {
        role: "ai" as const,
        text: data.reply,
        timestamp: Date.now()
      };
      
      push(chatRef, aiMsg).catch(e => {
        console.warn("DB Save warning (AI):", e.message);
        setMessages(prev => [...prev, aiMsg]); // Push to local state fallback
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to contact AI.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-[900px] mx-auto pb-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 shrink-0 text-center">
        <h1 className="font-outfit text-4xl font-black text-white tracking-tighter mb-2 flex items-center justify-center gap-3">
          <Sparkles className="text-violet-500" size={24} /> Generative Operations
        </h1>
        <p className="text-sm text-zinc-500 font-light">Direct neural interface to your extracted financial data.</p>
      </motion.div>

      <div className="bg-white/[0.01] border border-white/[0.05] rounded-[40px] overflow-hidden flex flex-col flex-1 relative min-h-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 scroll-smooth">
          {messages.map((m, i) => (
            <motion.div key={m.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex max-w-[85%] gap-4 ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${m.role === 'user' ? 'bg-white/10 text-white' : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'}`}>
                 {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
               </div>
               <div className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`px-6 py-4 text-[15px] leading-relaxed backdrop-blur-md shadow-xl ${m.role === 'user' ? 'bg-white/10 rounded-3xl rounded-tr-lg text-white' : 'bg-black/40 border border-white/[0.05] rounded-3xl rounded-tl-lg text-zinc-300'}`}>
                   
                   {m.attachment && (
                     <div className="mb-3 max-w-[280px]">
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
                         p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                         ul: ({node, ...props}) => <ul className="list-disc pl-5 mt-2 mb-2 space-y-1" {...props} />,
                         ol: ({node, ...props}) => <ol className="list-decimal pl-5 mt-2 mb-2 space-y-1" {...props} />,
                         li: ({node, ...props}) => <li className="pl-1" {...props} />,
                         strong: ({node, ...props}) => <strong className="font-bold text-zinc-100" {...props} />,
                         em: ({node, ...props}) => <em className="italic text-zinc-400" {...props} />,
                         code: ({node, ...props}) => <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm" {...props} />
                       }}
                     >
                       {m.text}
                     </ReactMarkdown>
                   )}
                 </div>
                 <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2">
                   {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
               </div>
            </motion.div>
          ))}
          {(isLoading || uploading) && (
            <div className="flex gap-4 max-w-[85%]">
               <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-600/20 text-violet-400"><Loader2 size={16} className="animate-spin" /></div>
               <div className="px-6 py-4 bg-transparent text-zinc-500 flex items-center gap-2 text-sm font-medium">
                 {uploading ? "Compressing & Up-Linking..." : "Generating response..."}
               </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        <div className="p-6 bg-[#030303] border-t border-white/[0.05] relative z-10 flex flex-col gap-4">
          
          {/* Staged File Preview */}
          <AnimatePresence>
            {stagedFile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] w-fit px-4 py-2 rounded-xl">
                 {stagedFile.type.startsWith("image/") ? <ImageIcon size={16} className="text-indigo-400" /> : <File size={16} className="text-violet-400" />}
                 <span className="text-xs text-zinc-300 font-medium max-w-[200px] truncate">{stagedFile.name}</span>
                 <span className="text-[10px] text-zinc-500">{(stagedFile.size / 1024 / 1024).toFixed(2)}MB</span>
                 <button onClick={() => setStagedFile(null)} className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors">
                   <X size={12} />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.csv,.xlsx" />
             <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || uploading}
               className="w-[50px] h-[50px] rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-violet-400 transition-colors shrink-0">
               <Paperclip size={20} />
             </button>

             <textarea 
               value={input} onChange={e => setInput(e.target.value)} 
               onKeyDown={e => {
                 if (e.key === 'Enter' && !e.shiftKey) { 
                   e.preventDefault(); 
                   sendMessage(); 
                 }
               }}
               disabled={isLoading || uploading}
               placeholder="Query the memory graph... (Shift+Enter for newline)"
               className="flex-1 bg-white/[0.03] border border-white/[0.08] focus:border-white/20 transition-all rounded-3xl py-4 px-6 text-white text-[15px] outline-none resize-none min-h-[50px] max-h-[150px] custom-scrollbar" 
               rows={1}
             />
             
             <button onClick={sendMessage} disabled={isLoading || uploading || (!input.trim() && !stagedFile)}
               className="w-[50px] h-[50px] rounded-full bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-zinc-600 text-white flex items-center justify-center transition-all shrink-0 shadow-lg shadow-violet-500/20 disabled:shadow-none">
               <Send size={18} className={(input.trim() || stagedFile) && !isLoading ? 'ml-1' : ''} />
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
