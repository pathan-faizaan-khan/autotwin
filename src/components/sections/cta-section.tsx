"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section id="cta" className="relative py-28 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-violet-950/8 to-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-r from-violet-600/15 to-indigo-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass animated-border rounded-3xl p-12 md:p-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/20 badge-glow mb-8"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">Join 1,200+ finance teams</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-6"
          >
            Start using AI for{" "}
            <span className="gradient-text">financial decisions</span>{" "}
            today
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto mb-10"
          >
            AutoTwin AI works from day one. No data science team required. No months of setup.
            Upload your first invoice and see results in under 60 seconds.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Link
              id="cta-get-started"
              href="/signup"
              className="group relative flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-xl shine-effect opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="mailto:sales@autotwin.ai"
              className="flex items-center gap-2 px-8 py-4 rounded-xl glass border border-white/10 text-zinc-300 font-bold text-base hover:text-white hover:border-violet-500/30 transition-all duration-200"
            >
              Talk to Sales
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-5 text-sm text-zinc-500"
          >
            {[
              "No credit card required",
              "20 invoices free forever",
              "Cancel anytime",
              "Setup in 2 minutes",
            ].map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
