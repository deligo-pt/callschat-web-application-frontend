import { Languages, Mic, Sparkles, Globe } from "lucide-react";

export default function Translation() {
    const translationFeatures = [
        {
            title: "Real-Time Translation",
            description: "Messages are instantly translated as you type, with no delays or waiting.",
            icon: Sparkles,
            // Custom gradient matching the purple/magenta layout look
            iconGradient: "bg-gradient-to-br from-[#A855F7] to-[#EC4899]",
        },
        {
            title: "Voice Translation",
            description: "Speak in your language and have your voice messages automatically translated.",
            icon: Mic,
            // Custom gradient matching the violet/purple layout look
            iconGradient: "bg-gradient-to-br from-[#8B5CF6] to-[#A855F7]",
        },
        {
            title: "Smart Context Detection",
            description: "AI understands context, idioms, and cultural nuances for accurate translations.",
            icon: Globe,
            // Custom gradient matching the magenta/orchid layout look
            iconGradient: "bg-gradient-to-br from-[#D946EF] to-[#8B5CF6]",
        },
    ];

    return (
        <section id="translation" className="w-full bg-white px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16">
            <div className="container mx-auto max-w-7xl">

                {/* Top Header Badge Pill */}
                <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#A7F3D0] bg-[#E6F4EA] px-4 py-1.5 text-xs font-semibold text-[#059669] shadow-sm">
                        <Globe className="h-4 w-4 text-[#10B981]" />
                        Live Translation
                    </div>
                </div>

                {/* Section Typography Headers */}
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-medium tracking-tight text-[#0A2540] sm:text-5xl">
                        Speak any language.<br />
                        <span className="text-[#00B074] block mt-1">Understand everyone.</span>
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-gray-500 font-normal">
                        Break down language barriers with real-time AI-powered translation.<br />
                        Communicate seamlessly with anyone, anywhere, in over 100 languages.
                    </p>
                </div>

                {/* Main Two-Column Content Matrix */}
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 mx-auto w-full px-2 sm:px-6 lg:px-8">

                    {/* Left Column: Interactive Chat App UI Preview */}
                    <div className="lg:col-span-5 flex justify-center w-full">
                        <div className="w-full rounded-4xl border border-gray-100 bg-[#EBF1FA] p-6 shadow-2xl shadow-gray-200/80 flex flex-col gap-5">

                            {/* Message Block 1: Remote User */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-gray-400 overflow-hidden">
                                        <div className="w-full h-full bg-linear-to-tr from-amber-400 to-orange-500" />
                                    </div>
                                    <span className="text-xs font-bold text-[#0A2540]">Zara</span>
                                </div>
                                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm max-w-[85%] border border-black/1">
                                    <p className="text-[13px] font-bold text-[#0A2540] border-b border-gray-300 pb-1.5">Quiero verte mañana.</p>
                                    <p className="text-[11px] text-gray-400 mt-1 italic font-normal">✨ Translated from Spanish</p>
                                </div>
                            </div>

                            {/* Message Block 2: Sender User */}
                            <div className="flex flex-col gap-1.5 items-end">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#0A2540]">You</span>
                                    <div className="h-5 w-5 rounded-full bg-gray-400 overflow-hidden">
                                        <div className="w-full h-full bg-linear-to-tr from-blue-400 to-indigo-500" />
                                    </div>
                                </div>
                                <div className="rounded-2xl rounded-tr-sm bg-[#1A62E8] px-4 py-2.5 text-white shadow-sm max-w-[85%]">
                                    <p className="text-[13px] font-semibold leading-normal">That sounds great! What time works for you?</p>
                                </div>
                            </div>

                            {/* Message Block 3: Remote Audio Waveform Message */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-full bg-gray-400 overflow-hidden">
                                        <div className="w-full h-full bg-linear-to-tr from-amber-400 to-orange-500" />
                                    </div>
                                    <span className="text-xs font-bold text-[#0A2540]">Zara</span>
                                </div>
                                <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm max-w-[85%] border border-black/1">
                                    {/* Mock Audio Waves */}
                                    <div className="flex items-center gap-1 py-1 text-gray-400">
                                        <span className="text-[#1A62E8] text-sm">▶</span>
                                        <div className="flex gap-0.5 items-center h-4 px-1">
                                            <div className="w-0.5 h-2 bg-gray-300 rounded-full"></div>
                                            <div className="w-0.5 h-3 bg-[#1A62E8] rounded-full"></div>
                                            <div className="w-0.5 h-4 bg-[#1A62E8] rounded-full"></div>
                                            <div className="w-0.5 h-2 bg-[#1A62E8] rounded-full"></div>
                                            <div className="w-0.5 h-3 bg-gray-300 rounded-full"></div>
                                            <div className="w-0.5 h-4 bg-gray-300 rounded-full"></div>
                                            <div className="w-0.5 h-2 bg-gray-300 rounded-full"></div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1 italic font-normal">✨ Translated from Bengali</p>
                                </div>
                            </div>

                            {/* Active Bottom Floating Action Status Banner */}
                            <div className="mt-2 rounded-xl border border-[#A7F3D0] bg-[#E6F4EA] px-3.5 py-2.5 flex items-center gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00B074] text-white">
                                    <Languages className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-[#059669]">AI Translation Active</span>
                                    <span className="text-[10px] text-[#059669]/80 font-normal">Messages are being translated in real-time</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Custom Non-Card Info Grid Elements */}
                    <div className="flex flex-col gap-5 lg:col-span-7 w-full">
                        {translationFeatures.map((item, idx) => {
                            const ItemIcon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300/60"
                                >
                                    <div className="flex items-start gap-5">
                                        {/* Dynamic Gradient Circle Asset */}
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${item.iconGradient}`}>
                                            <ItemIcon className="h-5 w-5" strokeWidth={2} />
                                        </div>

                                        {/* Metadata Context Copy */}
                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-[15px] font-bold text-[#0A2540] tracking-wide">
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