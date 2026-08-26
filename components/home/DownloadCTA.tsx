"use client";

import {
    QrCode,
    Sparkles,
    Smartphone,
    Monitor,
    Globe,
    CheckCircle2,
    ArrowUpRight,
    Lock,
    Shield,
    Star,
    Terminal,
    DownloadCloud
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function DownloadCTA() {
    const t = useTranslations("download_cta_section");

    return (
        <section
            id="download"
            className="relative w-full bg-slate-950 text-white px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden border-t border-slate-800"
        >
            {/* Ambient Background Aura Mesh */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-blue-600/10 via-indigo-600/10 to-emerald-500/10 blur-3xl -z-10 rounded-full"
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
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/50 px-4 py-1.5 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-md"
                    >
                        <DownloadCloud className="h-3.5 w-3.5 text-blue-400" />
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
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
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

                {/* 2-Pillar Download Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    
                    {/* 1. MOBILE APPS & INTERACTIVE QR SCANNER CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-[2.5rem] border border-blue-500/20 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-xl shadow-blue-500/5 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300"
                    >
                        {/* Soft Ambient Radial Corner */}
                        <div className="pointer-events-none absolute -top-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl" />

                        <div>
                            {/* Card Header */}
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-md shadow-blue-600/20">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                        iOS & Android
                                    </span>
                                    <h3 className="text-2xl font-black text-white">
                                        {t("mobile_title")}
                                    </h3>
                                </div>
                            </div>

                            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                                {t("mobile_subtitle")}
                            </p>

                            {/* Direct App Store Download Buttons */}
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                
                                {/* iOS App Store Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 px-4 py-3 text-left shadow-lg shadow-white/5 transition-all cursor-pointer border border-white"
                                >
                                    {/* Apple Vector Logo */}
                                    <svg className="h-6 w-6 shrink-0 fill-current" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    <div className="leading-tight">
                                        <p className="text-[10px] text-slate-500 font-medium uppercase">
                                            Download on
                                        </p>
                                        <p className="text-sm font-bold tracking-tight">
                                            {t("app_store_title")}
                                        </p>
                                        <p className="text-[10px] text-slate-400">iOS 15.0+</p>
                                    </div>
                                </motion.button>

                                {/* Google Play Store Button */}
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-white px-4 py-3 text-left shadow-lg border border-slate-700 transition-all cursor-pointer"
                                >
                                    {/* Google Play Vector Logo */}
                                    <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M3.609 1.814L13.792 12 3.61 22.186A1.85 1.85 0 0 1 3 20.887V3.113c0-.494.219-.974.609-1.299z" />
                                        <path fill="#FBBC04" d="M17.556 8.236L13.792 12l3.764 3.764 4.238-2.422a1.442 1.442 0 0 0 0-2.684l-4.238-2.422z" />
                                        <path fill="#EA4335" d="M3.609 1.814l10.183 10.186 3.764-3.764L5.352.887C4.697.513 3.992.932 3.609 1.814z" />
                                        <path fill="#34A853" d="M3.609 22.186l13.947-7.95-3.764-3.764-10.183 10.186c.383.882 1.088 1.301 1.743.928z" />
                                    </svg>
                                    <div className="leading-tight">
                                        <p className="text-[10px] text-slate-400 font-medium uppercase">
                                            Get it on
                                        </p>
                                        <p className="text-sm font-bold tracking-tight">
                                            {t("google_play_title")}
                                        </p>
                                        <p className="text-[10px] text-slate-400">Android 8.0+</p>
                                    </div>
                                </motion.button>

                            </div>

                            {/* Interactive Laser-Scanned QR Code Box */}
                            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                                
                                {/* White QR Code Container with Hologram Laser */}
                                <div className="relative overflow-hidden flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-lg shadow-white/5">
                                    {/* Sweeping Laser Line */}
                                    <motion.div
                                        className="pointer-events-none absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_10px_#3b82f6]"
                                        animate={{ top: ["0%", "100%", "0%"] }}
                                        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                                    />
                                    <QrCode className="h-full w-full text-slate-950" strokeWidth={1.75} />
                                </div>

                                <div className="space-y-1.5 text-center sm:text-left">
                                    <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                                        {t("qr_scan_title")}
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {t("qr_scan_desc")}
                                    </p>
                                    <span className="inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full mt-1">
                                        ✓ Direct App Store Link
                                    </span>
                                </div>

                            </div>
                        </div>

                        {/* Bottom Feature Tags */}
                        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> 1-Tap Biometric Setup
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> Push Notifications
                            </span>
                        </div>
                    </motion.div>

                    {/* 2. DESKTOP CLIENTS & INSTANT WEB HUB CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        className="rounded-[2.5rem] border border-emerald-500/20 bg-slate-900/80 p-6 sm:p-8 lg:p-10 shadow-xl shadow-emerald-500/5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300"
                    >
                        {/* Soft Ambient Radial Corner */}
                        <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl" />

                        <div>
                            {/* Card Header */}
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-600/20">
                                    <Monitor className="h-6 w-6" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                        Mac, Windows, Linux & Web
                                    </span>
                                    <h3 className="text-2xl font-black text-white">
                                        {t("desktop_title")}
                                    </h3>
                                </div>
                            </div>

                            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                                {t("desktop_subtitle")}
                            </p>

                            {/* Desktop Download Triggers Row */}
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                
                                {/* macOS Download */}
                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center justify-center rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3.5 text-center transition-all cursor-pointer"
                                >
                                    <svg className="h-5 w-5 fill-white mb-1.5" viewBox="0 0 24 24">
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    <p className="text-xs font-bold text-white">{t("macos_title")}</p>
                                    <p className="text-[10px] text-slate-400">{t("macos_subtitle")}</p>
                                </motion.button>

                                {/* Windows Download */}
                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center justify-center rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3.5 text-center transition-all cursor-pointer"
                                >
                                    {/* Windows Logo */}
                                    <svg className="h-5 w-5 fill-[#00ADEF] mb-1.5" viewBox="0 0 24 24">
                                        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                                    </svg>
                                    <p className="text-xs font-bold text-white">{t("windows_title")}</p>
                                    <p className="text-[10px] text-slate-400">{t("windows_subtitle")}</p>
                                </motion.button>

                                {/* Linux Download */}
                                <motion.button
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex flex-col items-center justify-center rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3.5 text-center transition-all cursor-pointer"
                                >
                                    <Terminal className="h-5 w-5 text-amber-400 mb-1.5" />
                                    <p className="text-xs font-bold text-white">{t("linux_title")}</p>
                                    <p className="text-[10px] text-slate-400">{t("linux_subtitle")}</p>
                                </motion.button>

                            </div>

                            {/* Instant Web Client Launch Card */}
                            <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 via-slate-950/80 to-teal-950/50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                
                                <div className="space-y-1 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                        <Globe className="h-4 w-4 text-emerald-400" />
                                        <h4 className="text-sm font-bold text-white">
                                            {t("web_app_card_title")}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-400 max-w-sm">
                                        {t("web_app_card_desc")}
                                    </p>
                                </div>

                                <Link
                                    href="/auth/login"
                                    className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                                >
                                    <span>{t("web_app_btn")}</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </Link>

                            </div>
                        </div>

                        {/* Bottom Feature Tags */}
                        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Multi-Screen Synchronization
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Keyboard Navigation Shortcuts
                            </span>
                        </div>
                    </motion.div>

                </div>

                {/* BOTTOM TRUST & COMPLIANCE PROOF BAR */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center"
                >
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>{t("proof_free")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <Lock className="h-4 w-4 text-blue-400" />
                        <span>{t("proof_e2ee")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <Globe className="h-4 w-4 text-indigo-400" />
                        <span>{t("proof_global")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>{t("proof_rating")}</span>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}