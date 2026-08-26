"use client";

import { useState, useEffect } from "react";
import {
    Sparkles,
    ShieldCheck,
    Languages,
    Lock,
    Phone,
    Briefcase,
    Layers,
    Zap,
    CheckCircle2,
    Volume2,
    Activity,
    Clock,
    UserCheck,
    AlertTriangle,
    EyeOff,
    Mic,
    Shield,
    Radio,
    Flame,
    ScanFace,
    Check,
    Video,
    ShieldAlert,
    Send,
    Bot,
    ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

const translationDemos = [
    {
        senderLang: "ES",
        senderName: "Sofia M. (Madrid, Spain)",
        voiceText: "Hola equipo, ¿podemos revisar la nueva actualización hoy?",
        targetLang: "EN",
        targetTitle: "CallsChat AI Speech Engine",
        translatedText: "Hey team, can we review the new update today?",
        latency: "0.06s",
    },
    {
        senderLang: "DE",
        senderName: "Lukas B. (Berlin, Germany)",
        voiceText: "Guten Morgen! Die neuen Sicherheitsfunktionen sehen super aus.",
        targetLang: "EN",
        targetTitle: "CallsChat AI Speech Engine",
        translatedText: "Good morning! The new security features look awesome.",
        latency: "0.08s",
    },
    {
        senderLang: "BN",
        senderName: "Tanvir R. (Dhaka, Bangladesh)",
        voiceText: "আমাদের আজকের লাইভ অডিও সেশন কখন শুরু হবে?",
        targetLang: "EN",
        targetTitle: "CallsChat AI Speech Engine",
        translatedText: "When will our live audio session start today?",
        latency: "0.07s",
    },
    {
        senderLang: "PT",
        senderName: "Mateo S. (São Paulo, Brazil)",
        voiceText: "Excelente trabalho na interface, está muito rápida e bonita!",
        targetLang: "EN",
        targetTitle: "CallsChat AI Speech Engine",
        translatedText: "Great work on the interface, it is very fast and beautiful!",
        latency: "0.05s",
    },
];

const waveformBarHeights = [
    [4, 16, 8, 22, 6],
    [8, 24, 12, 28, 10],
    [14, 30, 18, 34, 12],
    [6, 20, 10, 26, 8],
    [12, 28, 16, 32, 14],
    [4, 18, 8, 24, 6],
    [10, 26, 14, 30, 12],
    [16, 32, 20, 36, 16],
    [8, 22, 12, 28, 10],
    [14, 28, 18, 32, 12],
    [6, 18, 10, 24, 8],
    [12, 26, 16, 30, 14],
    [18, 34, 22, 36, 16],
    [8, 24, 12, 28, 10],
    [4, 16, 8, 22, 6],
    [10, 22, 14, 26, 8],
    [6, 18, 10, 24, 8],
    [4, 12, 6, 18, 4],
];

const callParticipants = [
    { name: "Alex M.", role: "Host", avatarBg: "bg-blue-600", initial: "A" },
    { name: "Elena R.", role: "Design Lead", avatarBg: "bg-purple-600", initial: "E" },
    { name: "Marcus T.", role: "Dev Lead", avatarBg: "bg-emerald-600", initial: "M" },
];

export default function Features() {
    const t = useTranslations("features_section");
    
    // Card 1: Voice & Translation States
    const [demoIndex, setDemoIndex] = useState(0);
    const [typedText, setTypedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const [recordingTimer, setRecordingTimer] = useState(3);

    // Card 2: Secret Mode Self-Destruct Countdown
    const [secretCountdown, setSecretCountdown] = useState(5);
    const [isSecretDestroyed, setIsSecretDestroyed] = useState(false);

    // Card 3: Dual Mode Auto-Toggle
    const [dualModeTab, setDualModeTab] = useState<"personal" | "business">("personal");

    // Card 4: AI Threat Interceptor Radar
    const [threatState, setThreatState] = useState<"scanning" | "blocked">("scanning");

    // Card 5: HD Call Active Speaker Rotation
    const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(0);

    // Card 6: Team Inbox Lifecycle Step
    const [ticketStep, setTicketStep] = useState<0 | 1 | 2>(0);

    const currentDemo = translationDemos[demoIndex];

    // Card 1: LLM-style token typing animation with smooth cycling
    useEffect(() => {
        let isMounted = true;
        let charIndex = 0;
        setTypedText("");
        setIsTyping(true);

        const targetString = currentDemo.translatedText;
        const typingInterval = setInterval(() => {
            if (!isMounted) return;
            if (charIndex < targetString.length) {
                setTypedText(targetString.slice(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(typingInterval);
                setIsTyping(false);
                const timer = setTimeout(() => {
                    if (isMounted) {
                        setDemoIndex((prev) => (prev + 1) % translationDemos.length);
                    }
                }, 3200);
                return () => clearTimeout(timer);
            }
        }, 36);

        return () => {
            isMounted = false;
            clearInterval(typingInterval);
        };
    }, [demoIndex, currentDemo.translatedText]);

    // Card 1: Live recording timer ticking
    useEffect(() => {
        const timer = setInterval(() => {
            setRecordingTimer((prev) => (prev >= 9 ? 1 : prev + 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Card 2: Secret Mode Self-Destructing Message Cycle
    useEffect(() => {
        const interval = setInterval(() => {
            setSecretCountdown((prev) => {
                if (prev <= 1) {
                    setIsSecretDestroyed(true);
                    setTimeout(() => {
                        setIsSecretDestroyed(false);
                    }, 2200);
                    return 5;
                }
                return prev - 1;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    // Card 3: Dual Mode Ambient Auto-Morph
    useEffect(() => {
        const interval = setInterval(() => {
            setDualModeTab((prev) => (prev === "personal" ? "business" : "personal"));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Card 4: AI Threat Interceptor Scanner Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setThreatState((prev) => (prev === "scanning" ? "blocked" : "scanning"));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Card 5: HD Call Active Speaker Cycle
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSpeakerIndex((prev) => (prev + 1) % callParticipants.length);
        }, 2600);
        return () => clearInterval(interval);
    }, []);

    // Card 6: Enterprise Ticket Resolution Flow Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setTicketStep((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="features" className="relative w-full bg-background px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden">
            {/* Ambient Background Radial Mesh */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-emerald-400/5 blur-3xl -z-10 rounded-full"
            />

            <div className="container mx-auto max-w-7xl">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    {/* Tagline Pill Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{t("badge")}</span>
                    </div>

                    {/* Headline */}
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
                        {t("title_start")}{" "}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                            {t("title_highlight")}
                        </span>
                    </h2>

                    {/* Subtitle */}
                    <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>

                {/* Interactive Balanced Bento Grid (All Capabilities Displayed) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* BENTO CARD 1: AI Real-Time Voice & Speech Translation (Row 1: Span 2 Columns) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4 }}
                        className="md:col-span-2 lg:col-span-2 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                                        <Languages className="h-5 w-5" />
                                    </div>
                                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/50 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                                        {t("card_translation_badge")}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {t("card_translation_title")}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                                    {t("card_translation_desc")}
                                </p>
                            </div>

                            {/* Cycle Language Switcher Pill */}
                            <div className="flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 p-1">
                                {translationDemos.map((demo, idx) => (
                                    <button
                                        key={demo.senderLang}
                                        onClick={() => setDemoIndex(idx)}
                                        className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                            demoIndex === idx
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
                                        }`}
                                    >
                                        {demo.senderLang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live Speech Translation & Real-Time Recording Animation Widget */}
                        <div className="mt-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 sm:p-5 space-y-3.5">
                            
                            {/* SENDER BUBBLE: Real-Time Animated Voice Recording */}
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm ring-2 ring-slate-200 dark:ring-slate-700">
                                    {currentDemo.senderLang}
                                </div>
                                
                                <div className="flex-1 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-none">
                                            {currentDemo.senderName}
                                        </span>
                                        
                                        {/* Real-Time Live Recording Indicator */}
                                        <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 px-2 py-0.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">
                                                LIVE REC 00:0{recordingTimer}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Spoken Native Text */}
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                                        &quot;{currentDemo.voiceText}&quot;
                                    </p>

                                    {/* Multi-Bar Frequency Equalizer Animation */}
                                    <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600">
                                            <Mic className="h-3.5 w-3.5 animate-pulse" />
                                        </div>
                                        
                                        {/* Dynamic Audio Waveform Bars */}
                                        <div className="flex items-center gap-[3px] h-9 flex-1 px-1">
                                            {waveformBarHeights.map((heights, idx) => (
                                                <motion.span
                                                    key={idx}
                                                    className="w-[3px] rounded-full bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400"
                                                    animate={{
                                                        height: heights,
                                                    }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        repeatType: "mirror",
                                                        duration: 1.1 + (idx % 4) * 0.15,
                                                        ease: "easeInOut",
                                                        delay: idx * 0.04,
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <span className="text-[11px] font-mono text-slate-400 font-semibold shrink-0">
                                            48 kHz HD
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RECEIVER BUBBLE: Real-Time LLM-Style Token Typing Animation */}
                            <div className="flex items-start gap-3 pl-4 sm:pl-10">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40">
                                    {currentDemo.targetLang}
                                </div>

                                <div className="flex-1 rounded-2xl rounded-tl-none bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 shadow-lg shadow-blue-600/20 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-blue-100">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                                            <span className="font-bold tracking-wide">{currentDemo.targetTitle}</span>
                                        </div>

                                        {/* Streaming / Completed Status Badge */}
                                        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-white/10">
                                            {isTyping ? (
                                                <>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-ping" />
                                                    <span className="text-cyan-200">Streaming AI Tokens...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                                                    <span className="text-emerald-200">⚡ {currentDemo.latency} Latency</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* LLM Streaming Typing Output */}
                                    <p className="text-sm sm:text-base font-medium leading-relaxed min-h-[1.5rem]">
                                        &quot;{typedText}&quot;
                                        {isTyping && (
                                            <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-300 rounded-xs shadow-[0_0_8px_rgba(103,232,249,0.9)] animate-pulse align-middle" />
                                        )}
                                    </p>
                                </div>
                            </div>

                        </div>
                    </motion.div>

                    {/* BENTO CARD 2: Secret Mode & Biometric Privacy (Row 1: Span 1 Column) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="md:col-span-1 lg:col-span-1 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden relative"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200/60 dark:border-red-800/50 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300">
                                    {t("card_secret_badge")}
                                </span>
                            </div>
                            <h3 className="mt-4 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                                {t("card_secret_title")}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("card_secret_desc")}
                            </p>
                        </div>

                        {/* Animated Biometric & Disappearing Message Widget */}
                        <div className="mt-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-4 space-y-3">
                            
                            {/* Face ID Laser Hologram Scan */}
                            <div className="relative overflow-hidden flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/60 dark:border-slate-800">
                                {/* Moving Laser Beam */}
                                <motion.div
                                    className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399]"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                />
                                
                                <div className="flex items-center gap-2.5">
                                    <ScanFace className="h-4 w-4 text-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Biometric Face ID
                                    </span>
                                </div>
                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                                    <Check className="h-3 w-3" /> VERIFIED
                                </span>
                            </div>

                            {/* Self-Destructing Message Live Countdown */}
                            <div className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                        Self-Destructing Message
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                                        ⏱ 0{secretCountdown}s
                                    </span>
                                </div>

                                <AnimatePresence mode="wait">
                                    {isSecretDestroyed ? (
                                        <motion.p
                                            key="destroyed"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 pt-0.5"
                                        >
                                            <Flame className="h-3.5 w-3.5 animate-bounce" />
                                            Message Vaporized & Cleared
                                        </motion.p>
                                    ) : (
                                        <motion.p
                                            key="active"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, filter: "blur(4px)" }}
                                            className="text-xs font-mono text-slate-700 dark:text-slate-300 pt-0.5 truncate"
                                        >
                                            🔒 Project Quantum Master Access Token
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>

                        </div>
                    </motion.div>

                    {/* BENTO CARD 3: Dual Mode: Personal & Enterprise (Row 2: Span 1 Column) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="md:col-span-1 lg:col-span-1 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/50 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    {t("card_dual_badge")}
                                </span>
                            </div>
                            <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                {t("card_dual_title")}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("card_dual_desc")}
                            </p>
                        </div>

                        {/* Dual Mode Morphing Switcher Widget */}
                        <div className="mt-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 space-y-3">
                            <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1">
                                <button
                                    onClick={() => setDualModeTab("personal")}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        dualModeTab === "personal"
                                            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    👤 Personal Mode
                                </button>
                                <button
                                    onClick={() => setDualModeTab("business")}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        dualModeTab === "business"
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    🏢 Workspace
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {dualModeTab === "personal" ? (
                                    <motion.div
                                        key="personal-view"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.25 }}
                                        className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
                                                <span className="font-bold text-slate-800 dark:text-white">Emma Watson</span>
                                            </div>
                                            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full">
                                                🔒 E2EE 1v1
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            &quot;Conference room is ready! See you soon 🚀&quot;
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="business-view"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.25 }}
                                        className="rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xs border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
                                                <span className="font-bold text-slate-800 dark:text-white">Ticket #402 (P1)</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                                                ⚡ 12m SLA
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                            &quot;Priority Customer: API Token provisioned&quot;
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* BENTO CARD 4: Active AI Threat & Scam Shield (Row 2: Span 1 Column) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="md:col-span-1 lg:col-span-1 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                    {t("card_safety_badge")}
                                </span>
                            </div>
                            <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                {t("card_safety_title")}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("card_safety_desc")}
                            </p>
                        </div>

                        {/* Live AI Threat Interceptor Scanner Widget */}
                        <div className="mt-6 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 space-y-2 relative overflow-hidden">
                            {/* Scanning Laser Beam */}
                            {threatState === "scanning" && (
                                <motion.div
                                    className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b]"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                />
                            )}

                            <div className="flex items-center justify-between text-xs font-bold">
                                <div className="flex items-center gap-1.5">
                                    <ShieldAlert className={`h-4 w-4 ${threatState === "blocked" ? "text-red-600 animate-pulse" : "text-amber-600"}`} />
                                    <span className={threatState === "blocked" ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-300"}>
                                        {threatState === "blocked" ? "🛑 Threat Intercepted & Blocked" : "🔍 AI Threat Scanner Active"}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                                    3ms
                                </span>
                            </div>

                            <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 truncate bg-white/80 dark:bg-black/50 p-2 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                                <span className="text-red-500 line-through">http://secure-update-verify.co</span>
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Client-Side Zero-Leak
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">100% Protected</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO CARD 5: Ultra-HD 4K Video & Audio Huddles (Row 2: Span 1 Column) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="md:col-span-1 lg:col-span-1 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/50 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                                    {t("card_calls_badge")}
                                </span>
                            </div>
                            <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                                {t("card_calls_title")}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                {t("card_calls_desc")}
                            </p>
                        </div>

                        {/* Interactive Active Speaker Video Call & Noise Suppression Widget */}
                        <div className="mt-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 space-y-3">
                            
                            {/* 3-Participant Call Tiles with Speaking Ring Glow */}
                            <div className="grid grid-cols-3 gap-2">
                                {callParticipants.map((participant, index) => {
                                    const isSpeaking = activeSpeakerIndex === index;
                                    return (
                                        <div
                                            key={participant.name}
                                            className={`rounded-xl bg-white dark:bg-slate-900 p-2.5 flex flex-col items-center justify-center text-center transition-all border ${
                                                isSpeaking
                                                    ? "border-emerald-500 shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/50"
                                                    : "border-slate-200/60 dark:border-slate-800"
                                            }`}
                                        >
                                            <div className="relative">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold ${participant.avatarBg}`}>
                                                    {participant.initial}
                                                </div>
                                                {isSpeaking && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <span className="mt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-full">
                                                {participant.name}
                                            </span>
                                            <span className="text-[9px] text-slate-400">
                                                {isSpeaking ? "Speaking..." : participant.role}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Noise Suppression & WebRTC Latency Bar */}
                            <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 p-2.5 border border-slate-200/60 dark:border-slate-800 text-xs">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">AI Noise Cancel</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-[10px]">
                                    🟢 18ms WebRTC
                                </span>
                            </div>

                        </div>
                    </motion.div>

                    {/* BENTO CARD 6: Shared Team Inbox & Multi-Agent Routing (Row 3: Full-Width Showcase) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="md:col-span-2 lg:col-span-3 rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            {/* Left Content Info (7 Columns) */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/50 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                            {t("card_business_badge")}
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                                        {t("card_business_title")}
                                    </h3>
                                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                                        {t("card_business_desc")}
                                    </p>
                                </div>

                                {/* Feature Highlights Grid */}
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>Multi-Agent RBAC</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>Custom Webhooks</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>99.99% Uptime SLA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Content: Interactive Live Ticket Routing Simulation (5 Columns) */}
                            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 p-5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                            Live Shared Ticket Queue
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                                        Ticket #1042
                                    </span>
                                </div>

                                {/* Customer Incoming Message */}
                                <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/60 dark:border-slate-800 shadow-xs">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Marcus (Enterprise Lead)</span>
                                        <span>Just now</span>
                                    </div>
                                    <p className="text-xs text-slate-800 dark:text-slate-200">
                                        &quot;Can we provision 100 enterprise accounts with SSO and audit logs?&quot;
                                    </p>
                                </div>

                                {/* Live Auto-Routing & Resolution Simulation */}
                                <AnimatePresence mode="wait">
                                    {ticketStep === 0 && (
                                        <motion.div
                                            key="routing"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/40 p-3 text-xs"
                                        >
                                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                                                <Bot className="h-4 w-4 animate-spin" />
                                                <span>AI Routing Engine Analyzing...</span>
                                            </div>
                                            <span className="text-[10px] text-blue-600 font-mono">⚡ 12ms</span>
                                        </motion.div>
                                    )}

                                    {ticketStep === 1 && (
                                        <motion.div
                                            key="assigned"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/40 p-3 text-xs"
                                        >
                                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                                                <UserCheck className="h-4 w-4" />
                                                <span>Assigned to @Sarah (Senior Lead)</span>
                                            </div>
                                            <span className="text-[10px] text-amber-600 font-semibold animate-pulse">Typing...</span>
                                        </motion.div>
                                    )}

                                    {ticketStep === 2 && (
                                        <motion.div
                                            key="resolved"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="rounded-xl bg-emerald-600 text-white p-3.5 shadow-md shadow-emerald-600/15 space-y-1"
                                        >
                                            <div className="flex items-center justify-between text-[11px] text-emerald-100">
                                                <span className="font-bold flex items-center gap-1.5">
                                                    <UserCheck className="h-3.5 w-3.5" />
                                                    @Sarah (Support Lead)
                                                </span>
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    ✓ RESOLVED (38s)
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium">
                                                &quot;Approved! SAML 2.0 & Okta integration enabled for your domain.&quot;
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </section>
    );
}