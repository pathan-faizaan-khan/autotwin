"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Shield, Zap, Bell, User, Save, CheckCircle2,
  Loader2, Mail, Smartphone, AlertCircle, LogOut, KeyRound,
  Database, Brain
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Section = "ai" | "notifications" | "profile" | "security";

interface SettingsState {
  confidenceAutoApprove: number;
  confidenceHitl: number;
  notifyEmail: boolean;
  notifyAlerts: boolean;
  notifyWorkflow: boolean;
}

const DEFAULT: SettingsState = {
  confidenceAutoApprove: 95,
  confidenceHitl: 70,
  notifyEmail: true,
  notifyAlerts: true,
  notifyWorkflow: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full border transition-all duration-300 focus:outline-none ${
        checked ? "bg-violet-500/30 border-violet-500/50" : "bg-white/[0.04] border-white/[0.08]"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${
        checked ? "translate-x-5 bg-violet-400" : "translate-x-0 bg-zinc-500"
      }`} />
    </button>
  );
}

function Slider({
  value, onChange, min = 0, max = 100, step = 1,
  leftLabel, rightLabel, accentColor = "bg-violet-500",
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
  leftLabel?: string; rightLabel?: string; accentColor?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="relative h-2 bg-white/[0.06] rounded-full group cursor-pointer">
        <div className={`absolute h-full rounded-full ${accentColor} opacity-80`} style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${accentColor} border-2 border-[#060608] shadow-lg transition-all`}
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[10px] text-zinc-600 font-medium mt-1.5">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>("ai");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const originalRef = useRef<SettingsState>(DEFAULT);

  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() ?? "U";

  // Load from API
  const loadSettings = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const s: SettingsState = {
          confidenceAutoApprove: data.confidenceAutoApprove ?? DEFAULT.confidenceAutoApprove,
          confidenceHitl: data.confidenceHitl ?? DEFAULT.confidenceHitl,
          notifyEmail: data.notifyEmail ?? DEFAULT.notifyEmail,
          notifyAlerts: data.notifyAlerts ?? DEFAULT.notifyAlerts,
          notifyWorkflow: data.notifyWorkflow ?? DEFAULT.notifyWorkflow,
        };
        setSettings(s);
        originalRef.current = s;
      }
    } catch { /* use defaults */ } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      setDirty(JSON.stringify(next) !== JSON.stringify(originalRef.current));
      return next;
    });
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, ...settings }),
      });
      if (res.ok) {
        originalRef.current = settings;
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const navItems: { id: Section; label: string; icon: any }[] = [
    { id: "ai", label: "AI & Autonomy", icon: Brain },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Account Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-10">
        <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest mb-2">Workspace</p>
        <h1 className="font-outfit text-5xl font-black text-white tracking-tighter mb-3">Settings</h1>
        <p className="text-zinc-500 text-base font-light max-w-xl">Configure AI autonomy thresholds, notification preferences, and account settings.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
        {/* ── Left Nav ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-sm font-semibold transition-all text-left ${
                section === item.id
                  ? "bg-white/[0.06] text-white border border-white/[0.08]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent"
              }`}
            >
              <item.icon size={16} className={section === item.id ? "text-violet-400" : ""} />
              {item.label}
            </button>
          ))}
          <div className="mt-auto pt-8 border-t border-white/[0.04] mt-8">
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full transition-all border border-transparent"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* ── Content Panel ─────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* ── AI & Autonomy ──────────────────────────────────────── */}
          {section === "ai" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-1">
                  <Brain size={18} className="text-violet-400" />
                  <h2 className="font-outfit text-xl font-bold text-white">AI Confidence Thresholds</h2>
                </div>
                <p className="text-zinc-500 text-sm mb-8">Controls when the AI acts autonomously vs. escalating for human review.</p>

                {loading ? (
                  <div className="space-y-6">
                    {[1, 2].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Auto-approve threshold */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="text-white font-semibold block mb-0.5">Auto-Approve Threshold</label>
                          <p className="text-zinc-500 text-xs">Invoices above this confidence score are auto-processed without human review.</p>
                        </div>
                        <span className={`font-outfit text-2xl font-black ${
                          settings.confidenceAutoApprove >= 90 ? "text-emerald-400" : "text-amber-400"
                        }`}>{settings.confidenceAutoApprove}%</span>
                      </div>
                      <Slider
                        value={settings.confidenceAutoApprove}
                        onChange={v => update("confidenceAutoApprove", v)}
                        min={70} max={100} step={1}
                        leftLabel="70% — Lenient" rightLabel="100% — Strict"
                        accentColor="bg-emerald-500"
                      />
                      {settings.confidenceAutoApprove < settings.confidenceHitl && (
                        <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
                          <AlertCircle size={11} /> Auto-approve threshold should be above the HITL threshold.
                        </p>
                      )}
                    </div>

                    {/* HITL threshold */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="text-white font-semibold block mb-0.5">Human-in-the-Loop (HITL) Floor</label>
                          <p className="text-zinc-500 text-xs">Invoices below this threshold are sent to the Exceptions Queue for manual review.</p>
                        </div>
                        <span className={`font-outfit text-2xl font-black ${
                          settings.confidenceHitl >= 70 ? "text-amber-400" : "text-red-400"
                        }`}>{settings.confidenceHitl}%</span>
                      </div>
                      <Slider
                        value={settings.confidenceHitl}
                        onChange={v => update("confidenceHitl", v)}
                        min={0} max={95} step={1}
                        leftLabel="0% — Flag all" rightLabel="95% — Flag rarely"
                        accentColor="bg-amber-500"
                      />
                    </div>

                    {/* Visual zone indicator */}
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-3">Decision Zones Preview</p>
                      <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden">
                        <div className="h-full rounded-l-full bg-red-500/60" style={{ width: `${settings.confidenceHitl}%` }} title={`0–${settings.confidenceHitl}% → Human Review`} />
                        <div className="h-full bg-amber-500/60" style={{ width: `${settings.confidenceAutoApprove - settings.confidenceHitl}%` }} title={`${settings.confidenceHitl}–${settings.confidenceAutoApprove}% → Warning`} />
                        <div className="h-full rounded-r-full bg-emerald-500/60 flex-1" title={`${settings.confidenceAutoApprove}–100% → Auto Approve`} />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                        <span className="text-red-400">↳ Human Review (&lt;{settings.confidenceHitl}%)</span>
                        <span className="text-amber-400">Warning</span>
                        <span className="text-emerald-400">Auto-Approve (&gt;{settings.confidenceAutoApprove}%) ↲</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Notifications ─────────────────────────────────────── */}
          {section === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-1">
                  <Bell size={18} className="text-indigo-400" />
                  <h2 className="font-outfit text-xl font-bold text-white">Notification Preferences</h2>
                </div>
                <p className="text-zinc-500 text-sm mb-8">Choose which events trigger alerts to your configured channels.</p>

                {loading ? (
                  <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-1">
                    {[
                      {
                        key: "notifyEmail" as const,
                        label: "Email Digest", sub: "Daily summary of processed invoices sent to your registered email.",
                        icon: Mail,
                      },
                      {
                        key: "notifyAlerts" as const,
                        label: "Risk & Anomaly Alerts", sub: "Immediate notification for high-risk invoices or anomaly detections.",
                        icon: AlertCircle,
                      },
                      {
                        key: "notifyWorkflow" as const,
                        label: "Pipeline Status Updates", sub: "Notifications when AI pipeline steps complete or fail.",
                        icon: Zap,
                      },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-5 rounded-2xl hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-500">
                            <item.icon size={16} />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{item.label}</p>
                            <p className="text-zinc-500 text-xs mt-0.5">{item.sub}</p>
                          </div>
                        </div>
                        <Toggle checked={settings[item.key]} onChange={v => update(item.key, v)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Profile ────────────────────────────────────────────── */}
          {section === "profile" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05] relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-600/8 blur-[80px] rounded-full pointer-events-none" />
                <h2 className="font-outfit text-xl font-bold text-white mb-8 relative z-10">Personnel File</h2>
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.25)] shrink-0">
                    <span className="font-outfit text-3xl font-black text-white">{initials}</span>
                  </div>
                  <div>
                    <p className="font-outfit font-bold text-white text-xl">{user?.displayName || "Admin User"}</p>
                    <p className="text-zinc-500 text-sm mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-widest border border-violet-500/20">Free Plan</span>
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Display Name</label>
                    <input type="text" disabled value={user?.displayName || "Admin User"}
                      className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-5 py-3.5 text-zinc-400 text-sm outline-none cursor-not-allowed opacity-60" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      Email <CheckCircle2 size={10} className="text-emerald-400" /> Verified
                    </label>
                    <div className="flex items-center gap-3 w-full bg-white/[0.02] border border-emerald-500/15 rounded-xl px-5 py-3.5">
                      <Mail size={15} className="text-zinc-500 shrink-0" />
                      <span className="text-zinc-300 text-sm">{user?.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Firebase UID</label>
                    <div className="w-full bg-black/40 border border-white/[0.04] rounded-xl px-5 py-3.5 font-mono text-zinc-600 text-xs break-all">
                      {user?.uid}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Security ───────────────────────────────────────────── */}
          {section === "security" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="p-8 rounded-[28px] bg-white/[0.015] border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-1">
                  <Shield size={18} className="text-blue-400" />
                  <h2 className="font-outfit text-xl font-bold text-white">Security</h2>
                </div>
                <p className="text-zinc-500 text-sm mb-8">Authentication settings and active session management.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Google OAuth 2.0</p>
                        <p className="text-zinc-500 text-xs mt-0.5">Authenticated via Google — no password stored.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                        <Smartphone size={16} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Two-Factor Authentication</p>
                        <p className="text-zinc-500 text-xs mt-0.5">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-widest">Coming Soon</span>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                        <KeyRound size={16} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">API Keys</p>
                        <p className="text-zinc-500 text-xs mt-0.5">Manage programmatic access tokens for the AutoTwin API.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-widest">Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[28px] bg-red-500/[0.04] border border-red-500/10">
                <p className="text-zinc-400 text-sm font-semibold mb-3">Danger Zone</p>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={14} /> Sign Out of All Devices
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Save Footer (only relevant sections) ──────────────── */}
          {(section === "ai" || section === "notifications") && !loading && (
            <div className={`flex items-center gap-4 justify-end pt-2 transition-all ${dirty ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
              {saved && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Saved successfully
                </motion.span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="h-11 px-6 rounded-full bg-white text-black text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
