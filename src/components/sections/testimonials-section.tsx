"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "CFO, Meridian Logistics",
    avatar: "PS",
    avatarBg: "from-violet-500 to-indigo-600",
    stars: 5,
    quote:
      "AutoTwin AI caught a duplicate invoice worth ₹2.3 lakhs on day one. The confidence score feature is a game-changer — our team only reviews what genuinely needs human judgment now. We've reduced invoice processing time by 78%.",
    metric: "₹2.3L",
    metricLabel: "saved on day 1",
  },
  {
    name: "Rahul Desai",
    role: "Finance Head, NovaTech Solutions",
    avatar: "RD",
    avatarBg: "from-pink-500 to-rose-600",
    stars: 5,
    quote:
      "We were skeptical about AI handling vendor payments. But the self-healing automation and audit logs gave our compliance team the confidence they needed. It literally fixed a broken GL mapping at 2 AM without waking anyone up.",
    metric: "78%",
    metricLabel: "time saved",
  },
  {
    name: "Anjali Mehra",
    role: "Founder, Blaze Retail Co.",
    avatar: "AM",
    avatarBg: "from-emerald-500 to-teal-600",
    stars: 5,
    quote:
      "As a startup, we can't afford a full-time finance team. AutoTwin AI is essentially our intelligent finance co-pilot at 1/10th the cost. The Financial Memory Graph is insane — it remembers patterns we didn't even know existed.",
    metric: "3x",
    metricLabel: "faster approvals",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-28 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-violet-950/5 to-zinc-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-violet-500/20 text-violet-400 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              SOCIAL PROOF
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-4"
          >
            Trusted by finance teams{" "}
            <span className="gradient-text">everywhere</span>
          </motion.h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Real results, from real teams who've replaced manual invoice headaches with AutoTwin AI.
          </p>
        </div>

        {/* Metrics row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {[
            { value: "1,200+", label: "Companies onboarded" },
            { value: "98.7%", label: "Anomaly accuracy" },
            { value: "₹14Cr+", label: "Savings generated" },
            { value: "4.9/5", label: "Customer satisfaction" },
          ].map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-5 text-center">
              <p className="text-3xl font-black gradient-text">{value}</p>
              <p className="text-sm text-zinc-500 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4 cursor-default relative overflow-hidden group"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-violet-500/20 absolute top-4 right-4" />

              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Metric highlight */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                <span className="text-2xl font-black gradient-text">{testimonial.metric}</span>
                <span className="text-xs text-zinc-500">{testimonial.metricLabel}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.avatarBg} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-zinc-500">{testimonial.role}</p>
                </div>
              </div>

              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />
            </motion.div>
          ))}
        </div>

        {/* Logo cloud */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-14 text-center"
        >
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-6">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {["Meridian Logistics", "NovaTech Solutions", "Blaze Retail", "FinEdge Capital", "PaySmart India", "CloudKhata"].map((company) => (
              <span key={company} className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors font-medium">
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
