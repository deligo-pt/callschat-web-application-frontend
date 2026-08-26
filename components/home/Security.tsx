"use client";

import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Lock,
    EyeOff,
    ScanFace,
    Clock,
    Flame,
    KeyRound,
    Cpu,
    CheckCircle2,
    ShieldAlert,
    Fingerprint,
    Sparkles,
    Shield,
    Camera,
    Check,
    Radio,
    Terminal,
    FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

const sessionHashes = [
    "0x9F42...8B91 (Double Ratchet active)",
    "0x3C19...4D7E (Ephemeral PFS key)",
    "0xA8F0...12E5 (Quantum-resistant X3DH)",
    "0x6D3B...90C4 (Client session verified)"
];

const burnOptions = ["5s", "30s", "5m", "1h", "24h"];

export default function Security() {
    const t = useTranslations("security_section");

    // Cryptographic session key rotation
    const [hashIndex, setHashIndex] = useState(0);

    // Interactive disappearing message sandbox
    const [selectedInterval, setSelectedInterval] = useState("5s");
    const [sandboxCountdown, setSandboxCountdown] = useState(5);
    const [isMessageShredded, setIsMessageShredded] = useState(false);

    // Screenshot simulation feedback
    const [isScreenshotAttempted, setIsScreenshotAttempted] = useState(false);

    // Key exchange rotation loop
    useEffect(() => {
        const interval = setInterval(() => {
            setHashIndex((prev) => (prev + 1) % sessionHashes.length);
        }, 3200);
        return () => clearInterval(interval);
    }, []);

    // Sandboxed countdown loop
    useEffect(() => {
        const interval = setInterval(() => {
            setSandboxCountdown((prev) => {
                if (prev <= 1) {
                    setIsMessageShredded(true);
                    setTimeout(() => {
                        setIsMessageShredded(false);
                    }, 2400);
                    return 5;
                }
                return prev - 1;
            });
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    const triggerScreenshotTest = () => {
        setIsScreenshotAttempted(true);
        setTimeout(() => {
            setIsScreenshotAttempted(false);
        }, 2600);
    };

    return (
        <section
            id="security"
            className="relative w-full bg-slate-900 dark:bg-black text-white px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden"
        >
            {/* Ambient Background Cybersecurity Glow Mesh */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/10 to-cyan-500/10 blur-3xl -z-10 rounded-full"
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
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-semibold text-emerald-400 shadow-sm backdrop-blur-md"
                    >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{t("badge")}</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight"
                    >
                        {t("title_start")}{" "}
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                            {t("title_highlight")}
                        </span>
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                {/* 2-Column Command Center Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    
                    {/* LEFT: 4 INTERACTIVE SECURITY PILLARS (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                        
                        {/* Pillar 1: Signal Protocol E2EE */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4 }}
                            className="rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 p-5 sm:p-6 shadow-sm hover:border-emerald-500/40 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                                            {t("pillar_1_title")}
                                        </h3>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                            {t("pillar_1_desc")}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                    {t("pillar_1_tag")}
                                </span>
                            </div>
                        </motion.div>

                        {/* Pillar 2: Hardware Screenshot Shield */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.08 }}
                            className="rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 p-5 sm:p-6 shadow-sm hover:border-teal-500/40 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                                        <EyeOff className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                                            {t("pillar_2_title")}
                                        </h3>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                            {t("pillar_2_desc")}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 text-[10px] font-bold text-teal-400">
                                    {t("pillar_2_tag")}
                                </span>
                            </div>
                        </motion.div>

                        {/* Pillar 3: Biometric Face ID & Touch Vault */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.16 }}
                            className="rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 p-5 sm:p-6 shadow-sm hover:border-cyan-500/40 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                                        <ScanFace className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                                            {t("pillar_3_title")}
                                        </h3>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                            {t("pillar_3_desc")}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                                    {t("pillar_3_tag")}
                                </span>
                            </div>
                        </motion.div>

                        {/* Pillar 4: Granular Ephemeral Self-Destruct */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.24 }}
                            className="rounded-3xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900/95 p-5 sm:p-6 shadow-sm hover:border-amber-500/40 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                                            {t("pillar_4_title")}
                                        </h3>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                                            {t("pillar_4_desc")}
                                        </p>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                                    {t("pillar_4_tag")}
                                </span>
                            </div>
                        </motion.div>

                    </div>

                    {/* RIGHT: LIVE INTERACTIVE ENCRYPTION VAULT SIMULATOR (5 Cols) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-5 rounded-[2.5rem] border border-emerald-500/30 bg-slate-950/90 p-6 sm:p-8 shadow-xl shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden"
                    >
                        {/* Soft Ambient Radial */}
                        <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

                        <div className="space-y-5">
                            
                            {/* Vault Top Status Bar */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </div>
                                    <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                                        {t("vault_badge")}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                                    {t("vault_status_active")}
                                </span>
                            </div>

                            {/* 1. Live Cryptographic Session Key Exchange */}
                            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-4 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                                        <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                                        {t("vault_keys_title")}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 font-mono">256-Bit</span>
                                </div>
                                
                                <div className="font-mono text-xs text-emerald-300/90 bg-black/60 p-2.5 rounded-xl border border-emerald-500/20 truncate flex items-center justify-between">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={hashIndex}
                                            initial={{ opacity: 0, y: 3 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {sessionHashes[hashIndex]}
                                        </motion.span>
                                    </AnimatePresence>
                                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-2" />
                                </div>
                            </div>

                            {/* 2. Biometric Hologram Scanning Laser Panel */}
                            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/90 p-4">
                                {/* Sweeping Emerald Laser */}
                                <motion.div
                                    className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399]"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                />

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                            <Fingerprint className="h-4 w-4 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-xs">
                                                {t("vault_biometric_title")}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Apple Secure Enclave / Android KeyStore
                                            </p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                        <Check className="h-3 w-3" /> {t("vault_biometric_status")}
                                    </span>
                                </div>
                            </div>

                            {/* 3. Interactive Disappearing Message Sandbox */}
                            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/90 p-4 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                                        {t("vault_sandbox_title")}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                        ⏱ 0{sandboxCountdown}s
                                    </span>
                                </div>

                                {/* Interval Pill Selector */}
                                <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-slate-800">
                                    {burnOptions.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setSelectedInterval(opt)}
                                            className={`flex-1 py-1 text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                                                selectedInterval === opt
                                                    ? "bg-amber-500 text-slate-950 shadow-xs"
                                                    : "text-slate-400 hover:text-white"
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>

                                {/* Live Sandboxed Message Bubble */}
                                <div className="p-3 rounded-xl bg-black/40 border border-slate-800 min-h-[3.2rem] flex items-center">
                                    <AnimatePresence mode="wait">
                                        {isMessageShredded ? (
                                            <motion.div
                                                key="shredded"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-xs font-semibold text-red-400 flex items-center gap-1.5"
                                            >
                                                <Flame className="h-3.5 w-3.5 text-red-400 animate-bounce" />
                                                <span>{t("vault_sandbox_destroyed_msg")}</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="active"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, filter: "blur(5px)" }}
                                                className="text-xs font-mono text-emerald-300 truncate flex items-center gap-1.5"
                                            >
                                                <span>{t("vault_sandbox_active_msg")}</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>

                        {/* Interactive Screenshot Test Trigger Button */}
                        <div className="mt-5 pt-4 border-t border-slate-800 relative overflow-hidden">
                            {/* Simulated Shutter Flash & Redacted State */}
                            <AnimatePresence>
                                {isScreenshotAttempted && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/95 z-20 flex items-center justify-center text-center p-3 rounded-xl border border-red-500/50"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                                            <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
                                            <span>🚫 OS DRM: Screen Capture Blocked & Redacted</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={triggerScreenshotTest}
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                                <Camera className="h-3.5 w-3.5 text-teal-400" />
                                <span>Simulate Screenshot Attempt</span>
                            </button>
                        </div>
                    </motion.div>

                </div>

                {/* BOTTOM TRUST & COMPLIANCE PROOF BAR */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-12 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <FileCheck className="h-4 w-4 text-emerald-400" />
                        <span>{t("proof_1")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <Shield className="h-4 w-4 text-teal-400" />
                        <span>{t("proof_2")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <Cpu className="h-4 w-4 text-cyan-400" />
                        <span>{t("proof_3")}</span>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}