"use client";

import {
    Lock,
    Languages,
    Cpu,
    ShieldCheck,
    Phone,
    Briefcase
} from "lucide-react";
import { motion } from "framer-motion";
import FeatureCard from "../shared/FeatureCard";

export default function Features() {
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

    // Framer Motion staggered grid presets
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12, // Gap delay between card entries
            },
        },
    };

    const headerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, easeOut: true },
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
                        />
                    ))}
                </motion.div>

            </div>
        </section>
    );
}