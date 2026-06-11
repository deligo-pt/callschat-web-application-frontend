"use client";

import { Play } from "lucide-react";
import { Button } from "../ui/button";
import { motion, useReducedMotion } from "framer-motion";

interface HeroProps {
    onDownloadClick: () => void;
}

export default function Hero({ onDownloadClick }: HeroProps) {
    const prefersReducedMotion = useReducedMotion();

    // Animation ported from the Figma "Hero" component set (id 94:185),
    // variant chain Default → Variant3 → Final (Smart Animate, GENTLE spring):
    //
    //   Default  --(after 100ms)--> Variant3 : everything fades to opacity 0
    //                                           (stage clear) — spring 400.1 / 30
    //   Variant3 --(after 200ms)--> Final    : the real entrance — spring 52.9 / 10.91
    //
    // The Default→Variant3 fade-out is a reset, so on first load we simply
    // start hidden and play the Variant3→Final entrance (~300ms in). Per the
    // file geometry, in that entrance:
    //   • the text block slides in from the LEFT (x −537 → +79) + fades in,
    //     moving as ONE unit;
    //   • the hero image zooms from a small upper-right thumbnail (517×392)
    //     to full-bleed (1236×938) + fades in.
    const gentleSpring = { type: "spring" as const, mass: 1, stiffness: 52.9, damping: 10.91 };
    const entranceDelay = 0.3; // 100ms (Default) + 200ms (Variant3) timeouts

    return (
        <section className="w-full bg-white px-4 py-8 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-7xl">

                {/* Rounded Hero Showcase Card */}
                <motion.div
                    initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="relative min-h-150 w-full overflow-hidden rounded-xl bg-gray-100 px-6 py-16 sm:px-12 md:px-20 lg:min-h-230 lg:py-44"
                >
                    {/* Image layer — eases in from the TOP-RIGHT corner: the image
                        scales up from a small thumbnail (~0.42 → 1) with its
                        top-right corner pinned, while fading in. Per the Figma
                        Hero set, the top-right corner stays fixed at (1248,126)
                        across Variant3 → Final. */}
                    <motion.div
                        aria-hidden
                        initial={
                            prefersReducedMotion
                                ? { scale: 1, opacity: 1 }
                                : { scale: 0.42, opacity: 0 }
                        }
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...gentleSpring, delay: entranceDelay }}
                        style={{
                            backgroundImage: `url('/hero.png')`,
                            transformOrigin: "top right",
                        }}
                        className="absolute inset-0 z-0 bg-cover bg-center"
                    />

                    {/* Content block — slides in from the left as a single unit.
                        Travel distance matches Figma (x −537 → 79 = 616px). */}
                    <motion.div
                        initial={
                            prefersReducedMotion
                                ? { opacity: 1, x: 0 }
                                : { opacity: 0, x: -616 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...gentleSpring, delay: entranceDelay }}
                        className="relative z-10 flex h-full max-w-xl flex-col justify-center"
                    >

                        {/* Tagline Badge */}
                        <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#1AC1F2] px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            AI-Powered Privacy First
                        </div>

                        {/* Typography Header Group */}
                        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0A2540] sm:text-5xl md:text-6xl">
                            Communicate <br />
                            <span className="text-primary">Without Limits</span>
                        </h1>

                        {/* Support Paragraph Description */}
                        <p className="mt-6 text-base leading-relaxed text-[#102A63] sm:text-lg">
                            Experience the future of messaging with AI-powered privacy, real-time
                            translation, and intelligent communication.
                        </p>

                        {/* Combined Download Trigger CTAs */}
                        <div className="mt-10 flex flex-wrap gap-4">
                            {/* iOS Downloader */}
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={onDownloadClick}
                                    variant="default"
                                    className="flex h-14 items-center gap-3 rounded-2xl bg-[#102A63] px-9 text-white shadow-xl transition-colors duration-200 hover:bg-[#0b1d45] focus:outline-none"
                                >
                                    {/* Outlined Apple Logo Icon */}
                                    <svg fill="#ffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                    </svg>
                                    <span className="text-base font-medium tracking-wide">Download for iOS</span>
                                </Button>
                            </motion.div>

                            {/* Android Downloader */}
                            <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={onDownloadClick}
                                    variant="outline"
                                    className="flex h-14 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-9 text-gray-900 shadow-md transition-colors duration-200 hover:bg-gray-50 focus:outline-none"
                                >
                                    <Play
                                        className="h-5 w-5 text-[#102A63]"
                                        fill="currentColor"
                                        stroke="currentColor"
                                    />
                                    <span className="text-base font-medium tracking-wide">Download for Android</span>
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
}
