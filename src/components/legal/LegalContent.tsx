"use client";

import { motion } from "framer-motion";
import { Inter, Outfit } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalContent({ title, lastUpdated, children }: Props) {
  return (
    <div className={`${inter.variable} ${outfit.variable} font-sans min-h-screen bg-zinc-950 text-zinc-300 selection:bg-violet-500/30 overflow-x-hidden pt-24 pb-20 relative`}>
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">Legal Document</p>
          <h1 className="font-outfit text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 leading-none">
            {title}
          </h1>
          <p className="text-zinc-500 text-sm font-medium mb-12">
            Last Updated: <span className="text-zinc-400">{lastUpdated}</span>
          </p>

          <div className="prose prose-invert prose-zinc max-w-none 
            prose-headings:font-outfit prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3
            prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:mb-6
            prose-li:text-zinc-400 prose-li:mb-4
            prose-ul:my-6 prose-ol:my-6
            prose-strong:text-zinc-100 prose-strong:font-bold
            prose-hr:border-white/5 prose-hr:my-12
          ">
            {children}
          </div>

          <div className="mt-20 pt-10 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} AutoTwin AI. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
