"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { workflowJobs } from "@/services/api";

const stepStatusIcon = {
  completed: <CheckCircle2 size={14} color="#4ade80" />,
  running: <Loader2 size={14} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />,
  failed: <XCircle size={14} color="#f87171" />,
  retrying: <RefreshCw size={14} color="#fbbf24" style={{ animation: "spin 1s linear infinite" }} />,
  pending: <Clock size={14} color="#3f3f46" />,
};

const stepStatusColor = {
  completed: "#4ade80",
  running: "#a78bfa",
  failed: "#f87171",
  retrying: "#fbbf24",
  pending: "#3f3f46",
};

const jobStatusBadge = {
  running: { label: "Running", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.2)" },
  completed: { label: "Completed", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
  failed: { label: "Failed", color: "#f87171", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
};

export default function WorkflowMonitor() {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em" }}>Workflow Monitor</h2>
          <p style={{ fontSize: 13, color: "#71717a", marginTop: 2 }}>Real-time pipeline status</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#52525b" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", display: "inline-block" }} />
          System Online
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {workflowJobs.map((job, i) => {
          const badge = jobStatusBadge[job.status];
          return (
            <motion.div key={job.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Job header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#d4d4d8" }}>{job.name}</p>
                  <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Started {job.startedAt}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 100, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                  {badge.label}
                </span>
              </div>

              {/* Pipeline steps */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                {job.steps.map((step, si) => (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 10, background: `${stepStatusColor[step.status]}0d`, border: `1px solid ${stepStatusColor[step.status]}26` }}>
                      {stepStatusIcon[step.status]}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: stepStatusColor[step.status] }}>{step.name}</p>
                        {step.duration && <p style={{ fontSize: 10, color: "#52525b" }}>{step.duration}</p>}
                        {step.count !== undefined && <p style={{ fontSize: 10, color: "#52525b" }}>{step.count} items</p>}
                      </div>
                    </div>
                    {si < job.steps.length - 1 && <ArrowRight size={12} color="#3f3f46" />}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
