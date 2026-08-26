"use client";

import { useState, useEffect } from "react";
import {
    Sparkles,
    User,
    Briefcase,
    Lock,
    Shield,
    Play,
    Pause,
    CheckCheck,
    Clock,
    Flame,
    Users,
    BarChart3,
    Webhook,
    CheckCircle2,
    ArrowRight,
    Repeat,
    Layers,
    ShieldCheck,
    Volume2,
    EyeOff,
    Radio,
    Bot
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

const voiceWaveformHeights = [
    [6, 18, 10, 24, 8],
    [12, 28, 16, 32, 14],
    [18, 36, 22, 40, 16],
    [8, 22, 12, 26, 10],
    [14, 30, 18, 34, 12],
    [4, 16, 8, 20, 6],
    [10, 26, 14, 30, 12],
    [16, 34, 20, 38, 14],
    [8, 24, 12, 28, 10],
    [12, 28, 16, 32, 14],
    [6, 18, 10, 22, 8],
    [4, 12, 6, 16, 4]
];

export default function DualMood() {
    const t = useTranslations("dual_mode_section");

    // Personal card: Voice note playback state & timer
    const [isPlayingVoice, setIsPlayingVoice] = useState(true);
    const [voiceSeconds, setVoiceSeconds] = useState(7);

    // Personal card: Ephemeral media countdown
    const [ephemeralTimer, setEphemeralTimer] = useState(10);

    // Business card: Active ticket routing state
    const [ticketResolutionState, setTicketResolutionState] = useState<"routing" | "assigned" | "resolved">("assigned");

    // Bottom bridge interactive switcher state
    const [activeBridgeMode, setActiveBridgeMode] = useState<"personal" | "business">("personal");

    // Voice note timer effect
    useEffect(() => {
        if (!isPlayingVoice) return;
        const interval = setInterval(() => {
            setVoiceSeconds((prev) => (prev >= 14 ? 1 : prev + 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPlayingVoice]);

    // Ephemeral self-destruct timer
    useEffect(() => {
        const interval = setInterval(() => {
            setEphemeralTimer((prev) => (prev <= 1 ? 10 : prev - 1));
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    // Ticket resolution cycle
    useEffect(() => {
        const interval = setInterval(() => {
            setTicketResolutionState((prev) => {
                if (prev === "routing") return "assigned";
                if (prev === "assigned") return "resolved";
                return "routing";
            });
        }, 3600);
        return () => clearInterval(interval);
    }, []);

    return (
        <section
            id="dual-mood"
            className="relative w-full bg-slate-50/50 dark:bg-slate-950/50 px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden border-y border-slate-200/60 dark:border-slate-800/60"
        >
            {/* Ambient Background Glow Mesh */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-purple-500/5 via-blue-500/5 to-emerald-400/5 blur-3xl -z-10 rounded-full"
            />

            <div className="container mx-auto max-w-7xl">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    {/* Badge Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-950/40 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm backdrop-blur-md"
                    >
                        <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{t("badge")}</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight"
                    >
                        {t("title_start")}{" "}
                        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                            {t("title_highlight")}
                        </span>
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                {/* Main 2-Column Side-by-Side Showcase */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    
                    {/* 1. PERSONAL MODE SHOWCASE CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-[2.5rem] border border-purple-200/70 dark:border-purple-900/40 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 lg:p-10 shadow-lg shadow-purple-500/5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-300"
                    >
                        {/* Soft Ambient Radial Corner */}
                        <div className="pointer-events-none absolute -top-24 -left-24 w-60 h-60 bg-gradient-to-br from-purple-500/15 to-pink-500/5 rounded-full blur-2xl" />

                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 text-white shadow-md shadow-purple-600/25">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                            {t("personal_badge")}
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {t("personal_title")}
                                        </h3>
                                    </div>
                                </div>
                                <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/50 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                                    {t("personal_encrypted_badge")}
                                </span>
                            </div>

                            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("personal_desc")}
                            </p>

                            {/* Interactive 1v1 Chat Mockup Window */}
                            <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 p-4 sm:p-5 shadow-inner space-y-3.5">
                                
                                {/* Contact Bar */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80 text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="relative">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                                SJ
                                            </div>
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">
                                                {t("personal_contact_name")}
                                            </p>
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                                ● {t("personal_contact_status")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        <span>E2EE 1v1</span>
                                    </div>
                                </div>

                                {/* Voice Note Bubble with Live Equalizer */}
                                <div className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 p-3.5 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                                            <Volume2 className="h-3.5 w-3.5" />
                                            {t("personal_voice_title")}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                                            0:0{voiceSeconds} / 0:14
                                        </span>
                                    </div>

                                    {/* Waveform & Play Button */}
                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                                            aria-label={isPlayingVoice ? "Pause voice note" : "Play voice note"}
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer"
                                        >
                                            {isPlayingVoice ? (
                                                <Pause className="h-3.5 w-3.5 fill-white" />
                                            ) : (
                                                <Play className="h-3.5 w-3.5 ml-0.5 fill-white" />
                                            )}
                                        </button>

                                        {/* Waveform Bars */}
                                        <div className="flex items-center gap-1 flex-1 h-8 px-1">
                                            {voiceWaveformHeights.map((heights, idx) => (
                                                <motion.span
                                                    key={idx}
                                                    className="w-1 rounded-full bg-gradient-to-t from-purple-600 to-pink-500"
                                                    animate={
                                                        isPlayingVoice
                                                            ? { height: heights }
                                                            : { height: [8, 14, 8][idx % 3] }
                                                    }
                                                    transition={{
                                                        repeat: Infinity,
                                                        repeatType: "mirror",
                                                        duration: 0.9 + (idx % 3) * 0.15,
                                                        ease: "easeInOut",
                                                        delay: idx * 0.05,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                                        {t("personal_voice_caption")}
                                    </p>
                                </div>

                                {/* Ephemeral Media Bubble */}
                                <div className="flex items-center justify-between rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40 p-2.5 text-xs">
                                    <div className="flex items-center gap-2">
                                        <EyeOff className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                        <span className="font-semibold text-purple-900 dark:text-purple-200">
                                            Confidential Media Photo (Protected)
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-200/60 dark:bg-purple-900/60 px-2 py-0.5 rounded-full">
                                        ⏱ 0{ephemeralTimer}s
                                    </span>
                                </div>

                            </div>
                        </div>

                        {/* Feature Points Grid */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                <span>{t("personal_feat_1")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                <span>{t("personal_feat_2")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                <span>{t("personal_feat_3")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                                <span>{t("personal_feat_4")}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. BUSINESS / ENTERPRISE MODE SHOWCASE CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-[2.5rem] border border-blue-200/70 dark:border-blue-900/40 bg-white/90 dark:bg-slate-900/90 p-6 sm:p-8 lg:p-10 shadow-lg shadow-blue-500/5 flex flex-col justify-between relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-300"
                    >
                        {/* Soft Ambient Radial Corner */}
                        <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-bl from-blue-500/15 to-cyan-500/5 rounded-full blur-2xl" />

                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-600/25">
                                        <Briefcase className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                            {t("business_badge")}
                                        </span>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {t("business_title")}
                                        </h3>
                                    </div>
                                </div>
                                <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/50 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                                    ⚡ SLA Active
                                </span>
                            </div>

                            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("business_desc")}
                            </p>

                            {/* Interactive Shared Team Inbox Mockup Window */}
                            <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 p-4 sm:p-5 shadow-inner space-y-3.5">
                                
                                {/* Org Team Bar */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/80 text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                                            🏢
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">
                                                {t("business_org_name")}
                                            </p>
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                                ● {t("business_agents_count")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200/80 dark:border-blue-800 px-2.5 py-1 text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300">
                                        <span>{t("business_ticket_badge")}</span>
                                    </div>
                                </div>

                                {/* Active Incoming Customer Ticket */}
                                <div className="rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 p-3.5 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            Marcus (Enterprise Lead)
                                        </span>
                                        <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200/60 dark:border-red-800/40">
                                            {t("business_priority_badge")}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                        {t("business_customer_msg")}
                                    </p>

                                    {/* Auto-Dispatching Status */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                        <AnimatePresence mode="wait">
                                            {ticketResolutionState === "routing" && (
                                                <motion.div
                                                    key="routing"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]"
                                                >
                                                    <Bot className="h-3.5 w-3.5 animate-spin" />
                                                    <span>AI Dispatcher Analyzing Skillsets...</span>
                                                </motion.div>
                                            )}
                                            {ticketResolutionState === "assigned" && (
                                                <motion.div
                                                    key="assigned"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-[11px]"
                                                >
                                                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>{t("business_assigned_tag")}</span>
                                                </motion.div>
                                            )}
                                            {ticketResolutionState === "resolved" && (
                                                <motion.div
                                                    key="resolved"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span>✓ SSO Provisioned & SLA Met (32s)</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <span className="text-[10px] font-mono text-slate-400">⚡ 12ms</span>
                                    </div>
                                </div>

                                {/* Enterprise Metrics Bar */}
                                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                                        <p className="text-[11px] font-bold text-emerald-600">{t("business_metric_csat")}</p>
                                        <p className="text-[9px] text-slate-400">Satisfaction</p>
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                                        <p className="text-[11px] font-bold text-blue-600">{t("business_metric_sla")}</p>
                                        <p className="text-[9px] text-slate-400">Response</p>
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-2 border border-slate-200/60 dark:border-slate-800">
                                        <p className="text-[11px] font-bold text-purple-600">{t("business_metric_ai")}</p>
                                        <p className="text-[9px] text-slate-400">Copilot</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Feature Points Grid */}
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>{t("business_feat_1")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>{t("business_feat_2")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>{t("business_feat_3")}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>{t("business_feat_4")}</span>
                            </div>
                        </div>
                    </motion.div>

                </div>

                {/* 3. INTERACTIVE 1-TAP SWITCHING BRIDGE BANNER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-10 rounded-3xl border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/80 via-white/90 to-purple-50/80 dark:from-slate-900/90 dark:via-slate-900/90 dark:to-indigo-950/60 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                            <Repeat className="h-5 w-5 animate-spin" style={{ animationDuration: "12s" }} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                {t("bridge_badge")}
                            </span>
                            <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                {t("bridge_title")}
                            </h4>
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                                {t("bridge_desc")}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Switcher Toggle */}
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-200/80 dark:bg-slate-800 p-1.5 shrink-0 shadow-inner">
                        <button
                            onClick={() => setActiveBridgeMode("personal")}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeBridgeMode === "personal"
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                        >
                            <User className="h-3.5 w-3.5" />
                            <span>{t("bridge_switch_personal")}</span>
                        </button>
                        <button
                            onClick={() => setActiveBridgeMode("business")}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                activeBridgeMode === "business"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                            }`}
                        >
                            <Briefcase className="h-3.5 w-3.5" />
                            <span>{t("bridge_switch_business")}</span>
                        </button>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}