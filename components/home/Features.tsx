// components/Features.tsx
import {
    Lock,
    Languages,
    Cpu,
    ShieldCheck,
    Phone,
    Briefcase
} from "lucide-react";
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

    return (
        <section id="features" className="w-full bg-background px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16">
            <div className="container mx-auto max-w-6xl">

                {/* Section Header */}
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                        Powerful Features
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-gray-500/90 leading-snug">
                        Everything you need for secure, intelligent, and seamless communication
                    </p>
                </div>

                {/* Features Matrix */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {featuresData.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            title={feature.title}
                            description={feature.description}
                            icon={feature.icon}
                            iconBgColor={feature.iconBgColor}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
}