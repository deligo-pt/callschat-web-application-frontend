"use client";

import {
    Lock,
    Languages,
    Cpu,
    ShieldCheck,
    Phone,
    Briefcase
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import FeatureCard from "../shared/FeatureCard";

export default function Features() {
    const prefersReducedMotion = useReducedMotion();

    const featuresData = [
        {
            title: "Secret Mode",
            description: "Ultra-secure chats with screenshot blocking, forward protection, and face unlock.",
            icon: Lock,
            iconBgColor: "#EF4444",
        },
        {
            title: "Live Translator",
            description: "Real-time translation in different languages. Break languages barriers instantly.",
            icon: Languages,
            iconBgColor: "#0070E0",
        },
        {
            title: "AI Assistant",
            description: "Smart replies, message scheduling, and context-aware suggestions",
            icon: Cpu,
            iconBgColor: "#009975",
        },
        {
            title: "AI Safety Layer",
            description: "Detects scams, toxic messages, manipulation, and fake links automatically.",
            icon: ShieldCheck,
            iconBgColor: "#D97706",
        },
        {
            title: "HD Calls",
            description: "Crystal-clear voice and video calls with AI noise cancellation.",
            icon: Phone,
            iconBgColor: "#7C3AED",
        },
        {
            title: "Business Mode",
            description: "Switch to professional profile with analytics and team management.",
            icon: Briefcase,
            iconBgColor: "#64748B",
        },
    ];

    // Ported from Figma (feature set, Default→Variant2). The cards assemble into
    // the grid simultaneously (no stagger) — the varied "feel" comes from each
    // card travelling a different distance, not from delays. EASE_IN over 1.1s.
    const easeIn = [0.42, 0, 1, 1] as const;

    // Per-card downward start offset (px) measured from the Figma variant
    // geometry: each card slides UP this far into its grid slot.
    const cardOffsets = prefersReducedMotion ? [0, 0, 0, 0, 0, 0] : [88, 216, 208, 176, 248, 337];

    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0 } },
    };

    // The header slides DOWN 72px into place (title + subtitle start high).
    const headerVariants = {
        hidden: { y: prefersReducedMotion ? 0 : -72 },
        visible: {
            y: 0,
            transition: { duration: 1.1, ease: easeIn },
        },
    };

    return (
        <section id="features" className="w-full bg-background px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16">
            <div className="container mx-auto max-w-6xl">

                {/* Section Header */}
                <motion.div
                    className="mb-16 text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={headerVariants}
                >
                    <h2 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                        Powerful Features
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-gray-500/90 leading-snug">
                        Everything you need for secure, intelligent, and seamless communication
                    </p>
                </motion.div>

                {/* Features Matrix Grid */}
                <motion.div
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={containerVariants}
                >
                    {featuresData.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            iconBgColor={feature.iconBgColor}
                            offsetY={cardOffsets[index]}
                        />
                    ))}
                </motion.div>

            </div>
        </section>
    );
}