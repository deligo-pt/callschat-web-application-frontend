import { Cpu, AlertTriangle, Link, ShieldCheck } from "lucide-react";

export default function SafetyLayer() {
    const safetyFeatures = [
        {
            title: "Scam Detection",
            description: "AI analyzes message patterns to identify potential scams, fraud attempts, and phishing before you fall victim.",
            icon: AlertTriangle,
            iconBg: "bg-[#FF4500]", // Deep Orange
        },
        {
            title: "Fake Link Protection",
            description: "Automatically scans and warns about malicious links, phishing sites, and suspicious URLs in real-time.",
            icon: Link,
            iconBg: "bg-[#FF9F00]", // Bright Amber
        },
        {
            title: "Always Protected",
            description: "Our AI safety layer learns and adapts to new threats, keeping you safe 24/7 without any effort required.",
            icon: ShieldCheck,
            iconBg: "bg-[#1A62E8]", // Blue Accent
        },
    ];

    return (
        <section id="ai-service" className="w-full bg-[#EDF7FD] px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16">
            <div className="container mx-auto max-w-7xl w-full">

                {/* Top Header Badge Pill */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#0A2540]/10 bg-[#0A2540] px-4 py-1.5 text-xs font-semibold text-[#4AA5FF] shadow-sm">
                        <Cpu className="h-3.5 w-3.5 text-[#4AA5FF]" />
                        AI Protection
                    </div>
                </div>

                {/* Section Headings */}
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#1A62E8] sm:text-5xl">
                        AI Safety Layer.
                    </h2>
                    <span className="block mt-2 text-3xl font-bold text-[#0A2540] sm:text-4xl">
                        Always watching your back.
                    </span>
                    <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 font-normal">
                        Ultra-secure encrypted conversations with advanced protection features that<br />
                        keep your most sensitive chats completely private.
                    </p>
                </div>

                {/* Main Columns Content Matrix */}
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 px-2 sm:px-6 lg:px-8">

                    {/* Left Column: Interactive Safety Monitor Display Box */}
                    <div className="lg:col-span-5 flex justify-center w-full">
                        <div className="w-full rounded-[1.75rem] bg-white p-6 shadow-2xl shadow-blue-900/5 flex flex-col gap-4">

                            {/* Header Status Bar */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BF5AF2] text-white">
                                        <Cpu className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#0A2540]">AI Safety Monitor</span>
                                        <span className="text-[10px] text-gray-400 font-normal">Real-time protection active</span>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-[#34C759] shadow-sm animate-pulse" />
                            </div>

                            {/* Status Layer Block 1: Potential Scam Warning */}
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
                                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-bold text-[#1D2E5B]">Potential Scam Detected</span>
                                    <span className="text-[10px] leading-normal text-gray-500 font-normal">
                                        This message may be suspicious. Be careful sharing personal information.
                                    </span>
                                    <div className="rounded-lg bg-white/60 border border-black/3 px-2.5 py-1.5 text-[9px] text-gray-400 font-medium italic">
                                        {"Congratulations! You've won $10,000. Click here to claim your prize..."}
                                    </div>
                                </div>
                            </div>

                            {/* Status Layer Block 2: Suspicious Link Warning */}
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                                <Link className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-[#1D2E5B]">Suspicious Link Detected</span>
                                    <span className="text-[10px] leading-normal text-gray-500 font-normal">
                                        This link may lead to a phishing or malicious website.
                                    </span>
                                </div>
                            </div>

                            {/* Status Layer Block 3: Safe Message Confirmed */}
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-[#1D2E5B]">Message Verified Safe</span>
                                    <span className="text-[10px] leading-normal text-gray-500 font-normal">
                                        No threats detected. This conversation appears secure.
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Information Feature List Cards */}
                    <div className="flex flex-col gap-5 lg:col-span-7 w-full">
                        {safetyFeatures.map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/40"
                                >
                                    <div className="flex items-start gap-5">
                                        {/* Circle Icon Badge */}
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${item.iconBg}`}>
                                            <ItemIcon className="h-5 w-5" strokeWidth={2} />
                                        </div>

                                        {/* Metadata Text Strings */}
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-[15px] font-bold text-[#1A2E5B] tracking-wide">
                                                {item.title}
                                            </h3>
                                            <p className="text-[13px] leading-relaxed text-gray-500 font-normal">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

            </div>
        </section>
    );
}