"use client";

import { Lock, EyeOff, LockKeyhole, FingerprintPattern, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Security() {
    const securityFeatures = [
        {
            title: "Screenshot Blocked",
            description: "Prevents screenshots and screen recording to protect your private conversations.",
            icon: EyeOff,
            iconBg: "bg-[#FF4500]",
        },
        {
            title: "Face Unlock Authentication",
            description: "Biometric security ensures only you can access your secret chats.",
            icon: FingerprintPattern,
            iconBg: "bg-[#DF00FF]",
        },
        {
            title: "Disappearing Messages",
            description: "Set custom timers for messages to auto-delete after being read.",
            icon: Clock,
            iconBg: "bg-[#32CD32]",
        },
    ];

    // Design: Crisp slide-ups for headers
    const textRevealPresets = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, easeOut: true }
        }
    };

    // Design: Staggered entry from left for the features list
    const featureListVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const individualFeatureVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring" as const, stiffness: 100, damping: 15 }
        }
    };

    // Design: High impact spring scaling for the Right Column Monitor Dashboard
    const monitorDisplayVariants = {
        hidden: { opacity: 0, scale: 0.9, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: "spring" as const, stiffness: 80, damping: 15, delay: 0.2 }
        }
    };

    return (
        <section id="security" className="w-full bg-[#102A63] px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden">
            <div className="container mx-auto max-w-7xl">

                {/* Section Badge Pill */}
                <motion.div
                    className="flex justify-center mb-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={textRevealPresets}
                >
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-accent-blue bg-white/5 px-4 py-2 text-xl font-semibold text-[#7AD3FA] backdrop-blur-md">
                        <Lock className="h-5 w-5" />
                        Maximum Security
                    </div>
                </motion.div>

                {/* Section Titles */}
                <motion.div
                    className="mb-16 text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={textRevealPresets}
                >
                    <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-[64px]">
                        Secret Mode.
                    </h2>
                    <span className="block mt-2 text-3xl font-bold text-accent-blue sm:text-[64px]">
                        Military-grade privacy.
                    </span>
                    <p className="mx-auto mt-6 max-w-xl text-2xl leading-relaxed text-gray-300/90 font-normal">
                        Ultra-secure encrypted conversations with advanced protection features that keep your most sensitive chats completely private.
                    </p>
                </motion.div>

                {/* Two Column Section Layout */}
                <div className="flex flex-col md:flex-row justify-between items-center w-full gap-10">

                    {/* Left Column: Feature Items List Block */}
                    <motion.div
                        className="flex flex-col gap-12 flex-1 w-full"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={featureListVariants}
                    >
                        {securityFeatures.map((feature, idx) => {
                            const FeatureIcon = feature.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    variants={individualFeatureVariants}
                                    className="rounded-[1.25rem] border-2 border-accent-blue bg-transparent p-6 transition-colors duration-200 hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-5">
                                        {/* Circle Icon Badge */}
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${feature.iconBg}`}>
                                            <FeatureIcon className="h-5 w-5" strokeWidth={2} />
                                        </div>

                                        {/* Metadata Content */}
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-base font-bold text-white tracking-wide">
                                                {feature.title}
                                            </h3>
                                            <p className="text-xs leading-relaxed text-gray-400 font-normal">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Right Column: Dynamic Screen Status Monitor Display */}
                    <motion.div
                        className="flex justify-center w-full flex-1 h-fit"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={monitorDisplayVariants}
                    >
                        <div className="w-full max-w-105 rounded-4xl border-2 border-accent-blue bg-transparent p-10 text-center shadow-xl shadow-black/10">
                            <div className="flex flex-col items-center">

                                {/* Big Floating Security Radar Lock Status Circle */}
                                <motion.div
                                    className="flex h-16 w-16 items-center justify-center border-2 border-primary/80 rounded-full bg-accent-blue text-white shadow-lg shadow-blue-600/20 ring-4 ring-blue-600/10"
                                    animate={{ scale: [1, 1.06, 1] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                >
                                    <LockKeyhole className="h-6 w-6" />
                                </motion.div>

                                <h4 className="mt-5 text-[17px] font-bold text-white tracking-wide">
                                    Secret Mode Active
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                    Your conversation is fully protected
                                </p>

                                {/* Status Options List Toggles */}
                                <div className="mt-8 flex flex-col gap-3.5 w-full">

                                    {/* Row 1: Screenshot Protection */}
                                    <div className="flex items-center justify-between rounded-xl border-2 border-accent-blue bg-transparent px-4 py-3.5">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <EyeOff className="h-3.75 w-3.75 text-accent-blue" />
                                            <span className="text-xs font-medium tracking-wide">Screenshot Protection: ON</span>
                                        </div>
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 border border-emerald-500/20 uppercase">
                                            Active
                                        </span>
                                    </div>

                                    {/* Row 2: Biometric Lock */}
                                    <div className="flex items-center justify-between rounded-xl border-2 border-accent-blue bg-transparent px-4 py-3.5">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <FingerprintPattern className="h-3.75 w-3.75 text-accent-blue" />
                                            <span className="text-xs font-medium tracking-wide">Biometric Lock: Enabled</span>
                                        </div>
                                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-400 border border-emerald-500/20 uppercase">
                                            Secured
                                        </span>
                                    </div>

                                    {/* Row 3: Auto-Delete */}
                                    <div className="flex items-center justify-between rounded-xl border-2 border-accent-blue bg-transparent px-4 py-3.5">
                                        <div className="flex items-center gap-3 text-gray-300">
                                            <Clock className="h-3.75 w-3.75 text-accent-blue" />
                                            <span className="text-xs font-medium tracking-wide">Auto-Delete: 24 hours</span>
                                        </div>
                                        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-blue-400 border border-blue-500/20 uppercase">
                                            Set
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>
                    </motion.div>

                </div>

            </div>
        </section>
    );
}