"use client";

import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Sparkles,
    ShieldCheck,
    Languages,
    ArrowRight,
    Star,
    Lock,
    Zap,
    ChevronLeft,
    ChevronRight,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, useAnimationControls } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface HeroProps {
    onDownloadClick: () => void;
}

interface HeroSlide {
    id: number;
    image: string;
    labelKey: string;
    highlight: string;
}

const HERO_SLIDES: HeroSlide[] = [
    {
        id: 0,
        image: "/new-hero.jpeg",
        labelKey: "slide_1_label",
        highlight: "Connect. Chat. Call. Anywhere.",
    },
    {
        id: 1,
        image: "/new-hero-2.jpeg",
        labelKey: "slide_2_label",
        highlight: "Crystal-Clear HD Video Huddles",
    },
    {
        id: 2,
        image: "/new-hero-3.jpeg",
        labelKey: "slide_3_label",
        highlight: "Instant AI Voice & Speech Translation",
    },
];

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Hero({ onDownloadClick }: HeroProps) {
    const t = useTranslations("hero");
    const prefersReducedMotion = useReducedMotion();
    const [activeSlide, setActiveSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const contentControls = useAnimationControls();
    const showcaseControls = useAnimationControls();

    const ease = [0.22, 1, 0.36, 1] as const;

    // Smooth entry layout effect preventing SSR mismatch or blank render
    useIsomorphicLayoutEffect(() => {
        if (prefersReducedMotion) return;

        contentControls.set({ opacity: 0, y: 24 });
        showcaseControls.set({ opacity: 0, scale: 0.96, y: 16 });

        contentControls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.8, ease, delay: 0.1 },
        });

        showcaseControls.start({
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.9, ease, delay: 0.25 },
        });
    }, [prefersReducedMotion]);

    // Auto-advance hero slides smoothly
    const handleNextSlide = useCallback(() => {
        setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, []);

    const handlePrevSlide = useCallback(() => {
        setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }, []);

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            handleNextSlide();
        }, 6500);

        return () => clearInterval(interval);
    }, [isPaused, handleNextSlide]);

    return (
        <section className="relative w-full overflow-hidden bg-background pt-4 pb-16 lg:pt-8 lg:pb-24">
            {/* Ambient Background Radial Glows */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[450px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-cyan-400/10 blur-3xl -z-10 rounded-full"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 right-0 w-72 h-72 bg-blue-400/10 blur-3xl -z-10 rounded-full"
            />

            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-14">
                    
                    {/* Left Column: Headline, Value Proposition & High-Converting CTAs */}
                    <motion.div
                        initial={false}
                        animate={contentControls}
                        className="flex flex-col justify-center lg:col-span-7 xl:col-span-7"
                    >
                        {/* Glowing Tagline Pill Badge */}
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
                            </span>
                            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{t("badge")}</span>
                        </div>

                        {/* High-Impact Headline */}
                        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.08]">
                            {t("title_start")}{" "}
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                                {t("title_highlight")}
                            </span>
                        </h1>

                        {/* Value Proposition Description */}
                        <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                            {t("subtitle")}
                        </p>

                        {/* Combined Download Trigger CTAs */}
                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            {/* iOS App Store Downloader Button */}
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    onClick={onDownloadClick}
                                    className="group relative flex h-14 w-full sm:w-auto items-center justify-start gap-3.5 rounded-2xl bg-[#0A1628] hover:bg-[#060e1a] px-6 text-white shadow-xl shadow-slate-950/15 border border-slate-700/30 transition-all duration-200"
                                >
                                    {/* Apple Logo SVG */}
                                    <svg className="h-6 w-6 fill-white transition-transform group-hover:scale-105" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                                            Download on the
                                        </span>
                                        <span className="text-sm font-bold tracking-tight text-white leading-tight">
                                            App Store
                                        </span>
                                    </div>
                                </Button>
                            </motion.div>

                            {/* Android Google Play Downloader Button */}
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    onClick={onDownloadClick}
                                    variant="outline"
                                    className="group relative flex h-14 w-full sm:w-auto items-center justify-start gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-6 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                >
                                    {/* Google Play Logo SVG */}
                                    <svg className="h-6 w-6 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.609 1.814L13.793 12 3.61 22.186c-.366-.35-.61-.88-.61-1.506V3.32c0-.626.244-1.156.61-1.506z" fill="#00C1FF"/>
                                        <path d="M17.18 8.613l-3.387 3.387-3.387-3.387 4.966-2.868c.55-.318 1.258-.318 1.808 0l-.001.001 1.808 1.045c.48.277.625.84.444 1.332l-2.244 1.29z" fill="#00E676"/>
                                        <path d="M17.18 15.387l2.244 1.29c.18.492.036 1.055-.444 1.332l-1.808 1.045c-.55.318-1.258.318-1.808 0l-4.966-2.868 3.387-3.387 3.387 3.387z" fill="#FF3D00"/>
                                        <path d="M21.232 10.955l-2.244-1.298-2.595 2.343 2.595 2.343 2.244-1.298c.767-.443.767-1.647 0-2.09z" fill="#FFD400"/>
                                    </svg>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Get it on
                                        </span>
                                        <span className="text-sm font-bold tracking-tight leading-tight">
                                            Google Play
                                        </span>
                                    </div>
                                </Button>
                            </motion.div>

                            {/* Web App Direct Launch */}
                            <Link
                                href="/connect"
                                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors py-3 px-2 group"
                            >
                                <span>{t("web_connect")}</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Social Proof & Rating Metrics */}
                        <div className="mt-8 pt-6 border-t border-slate-200/70 dark:border-slate-800/80 flex flex-wrap items-center gap-6">
                            {/* Star Rating Group */}
                            <div className="flex items-center gap-2">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t("rating_score")}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {t("rating_text")}
                                </span>
                            </div>

                            {/* Trust Bullet Items */}
                            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Zero Logs
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    Sub-50ms Latency
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    100+ Languages
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Premium Framed Visual Stage & Interactive Lifestyle Carousel */}
                    <motion.div
                        initial={false}
                        animate={showcaseControls}
                        className="relative lg:col-span-5 xl:col-span-5 flex justify-center items-center"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Outer Glow Halo */}
                        <div
                            aria-hidden
                            className="absolute -inset-3 bg-gradient-to-tr from-blue-600/25 via-indigo-500/20 to-cyan-400/25 rounded-[2.5rem] blur-2xl -z-10 transition-all duration-500"
                        />

                        {/* Showcase Container Frame */}
                        <div className="relative w-full max-w-[420px] aspect-[9/14] sm:aspect-[9/13.5] rounded-3xl overflow-hidden border-2 border-white/60 dark:border-white/15 bg-slate-900 shadow-2xl shadow-blue-500/15 group">
                            
                            {/* Slide Cross-Fade Transition Layer */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSlide}
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.55, ease: "easeInOut" }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={HERO_SLIDES[activeSlide].image}
                                        alt="CallsChat Lifestyle Visual"
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
                                        priority
                                        className="object-cover object-top"
                                    />
                                    {/* Vignette Bottom Gradient for readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                                </motion.div>
                            </AnimatePresence>

                            {/* Floating Glassmorphic Badge: Top Left (256-Bit E2EE) */}
                            <motion.div
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-2xl border border-white/40 dark:border-white/15 bg-white/85 dark:bg-slate-900/85 px-3 py-1.5 shadow-lg shadow-black/10 backdrop-blur-md"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                </span>
                                <Lock className="h-3.5 w-3.5 text-slate-800 dark:text-slate-100" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {t("encrypted_badge")}
                                </span>
                            </motion.div>

                            {/* Floating Glassmorphic Badge: Top Right (AI Scam Shield) */}
                            <motion.div
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-2xl border border-white/40 dark:border-white/15 bg-white/85 dark:bg-slate-900/85 px-3 py-1.5 shadow-lg shadow-black/10 backdrop-blur-md"
                            >
                                <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {t("ai_shield_badge")}
                                </span>
                            </motion.div>

                            {/* Floating Glassmorphic Badge: Bottom (Live Translation Wave) */}
                            <motion.div
                                initial={{ y: 8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="absolute bottom-16 left-4 right-4 z-20 flex items-center justify-between rounded-2xl border border-white/40 dark:border-white/20 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xl backdrop-blur-md"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                                        <Languages className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                            {t("translation_badge")}
                                        </div>
                                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                            Auto Speech-to-Speech
                                        </div>
                                    </div>
                                </div>
                                {/* Animated Live Equalizer Bars */}
                                <div className="flex items-end gap-0.5 h-4">
                                    <span className="w-1 bg-blue-500 rounded-full h-2 animate-pulse" />
                                    <span className="w-1 bg-blue-600 rounded-full h-4 animate-bounce" />
                                    <span className="w-1 bg-indigo-500 rounded-full h-3 animate-pulse" />
                                    <span className="w-1 bg-cyan-500 rounded-full h-1.5 animate-bounce" />
                                </div>
                            </motion.div>

                            {/* Carousel Controller & Thumbnail Story Tabs (Bottommost Bar) */}
                            <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2 rounded-2xl bg-black/40 backdrop-blur-md px-3 py-2 border border-white/10">
                                <div className="flex items-center gap-1.5 flex-1">
                                    {HERO_SLIDES.map((slide, idx) => {
                                        const isActive = idx === activeSlide;
                                        return (
                                            <button
                                                key={slide.id}
                                                onClick={() => setActiveSlide(idx)}
                                                className={`relative h-2 rounded-full transition-all duration-300 ${
                                                    isActive ? "flex-1 bg-white" : "w-3 bg-white/30 hover:bg-white/60"
                                                }`}
                                                aria-label={`Switch to slide ${idx + 1}`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeSlideIndicator"
                                                        className="absolute inset-0 bg-blue-400 rounded-full"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-1 text-white/90">
                                    <button
                                        onClick={handlePrevSlide}
                                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                        aria-label="Previous Slide"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={handleNextSlide}
                                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                        aria-label="Next Slide"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </motion.div>

                </div>
            </div>
        </section>
    );
}
