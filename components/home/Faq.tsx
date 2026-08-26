"use client";

import { useState, useId, useMemo } from "react";
import {
    HelpCircle,
    Search,
    ChevronDown,
    Lock,
    UserCheck,
    Phone,
    Briefcase,
    ShieldCheck,
    Sparkles,
    Mail,
    X,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface FAQItem {
    id: string;
    category: "privacy" | "id" | "calls" | "enterprise";
    question: string;
    answer: string;
}

const faqDataset: FAQItem[] = [
    {
        id: "e2ee-encryption",
        category: "privacy",
        question: "Are messages and voice calls end-to-end encrypted?",
        answer: "Yes. CallsChat employs 256-bit Signal Protocol encryption with Double Ratchet cryptography and Perfect Forward Secrecy. Every message, voice memo, and video call is encrypted directly on your device. Zero cloud copies or decryption backdoors exist.",
    },
    {
        id: "callschat-id-privacy",
        category: "id",
        question: "What is a CallsChat ID and how does it protect my identity?",
        answer: "A CallsChat ID is a sovereign username that allows you to connect, chat, and call without ever revealing your personal phone number. Other users only see your verified CallsChat ID.",
    },
    {
        id: "phone-registration",
        category: "id",
        question: "Why is a phone number needed during initial registration?",
        answer: "Phone numbers are used exclusively for one-time cryptographic SMS verification, bot prevention, and account recovery. Your phone number is strictly hidden and never exposed to other contacts or third parties.",
    },
    {
        id: "data-monetization",
        category: "privacy",
        question: "Does CallsChat sell personal data or metadata to advertisers?",
        answer: "No. CallsChat operates on a strict zero-knowledge architecture. We do not sell, monetize, or log communication metadata, contact lists, or personal information.",
    },
    {
        id: "screenshot-shield",
        category: "privacy",
        question: "How does Screenshot & Screen Recording Blocking work?",
        answer: "In Secret Mode, CallsChat leverages Android FLAG_SECURE and Apple Secure Enclave protections to actively block screenshots, screen recordings, AirPlay mirroring, and unauthorized clipboard snooping.",
    },
    {
        id: "ai-translation",
        category: "calls",
        question: "How does real-time AI speech and voice translation work?",
        answer: "Our AI Speech Engine automatically detects and translates spoken voice messages and text across 100+ languages in real time with sub-80ms latency, enabling effortless global communication.",
    },
    {
        id: "dual-mode-workspaces",
        category: "enterprise",
        question: "What is Dual Mode and how does it separate work from personal life?",
        answer: "Dual Mode provides two completely isolated environments in one app: a private 1v1 encrypted personal space and an enterprise workspace equipped with shared team inboxes, multi-agent routing, and SLA tracking.",
    },
    {
        id: "hd-video-calls",
        category: "calls",
        question: "What audio and video quality does CallsChat deliver?",
        answer: "CallsChat is powered by LiveKit WebRTC architecture, providing crystal-clear 4K Ultra-HD video and 48 kHz studio audio with intelligent background noise suppression and sub-30ms global latency.",
    },
    {
        id: "ephemeral-timers",
        category: "privacy",
        question: "How do Disappearing Messages and self-destruct timers work?",
        answer: "You can set custom self-destruct timers from 5 seconds to 24 hours. Once the timer expires, messages, photos, and voice notes are permanently purged from all participating devices with zero cloud residue.",
    },
    {
        id: "enterprise-integrations",
        category: "enterprise",
        question: "Can organizations integrate CallsChat with SAML SSO and CRMs?",
        answer: "Yes. CallsChat Enterprise supports SAML 2.0 / Okta SSO, custom REST webhooks, audit logging, and automated ticket dispatching for customer support workflows.",
    },
];

export default function Faq() {
    const t = useTranslations("faq_section");
    const baseId = useId();

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<"all" | "privacy" | "id" | "calls" | "enterprise">("all");
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const categories = [
        { id: "all", label: t("cat_all"), icon: Sparkles },
        { id: "privacy", label: t("cat_privacy"), icon: Lock },
        { id: "id", label: t("cat_id"), icon: UserCheck },
        { id: "calls", label: t("cat_calls"), icon: Phone },
        { id: "enterprise", label: t("cat_enterprise"), icon: Briefcase },
    ];

    const filteredFaqs = useMemo(() => {
        return faqDataset.filter((item) => {
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
            const matchesSearch =
                searchTerm.trim() === "" ||
                item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.answer.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);

    const toggleAccordion = (idx: number) => {
        setOpenIndex((prev) => (prev === idx ? null : idx));
    };

    return (
        <section
            id="faq"
            className="relative w-full bg-slate-50/70 dark:bg-slate-950 px-4 py-24 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden border-t border-slate-200/80 dark:border-slate-800"
        >
            {/* Ambient Background Radial Glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-blue-500/5 via-indigo-500/5 to-purple-500/5 blur-3xl -z-10 rounded-full"
            />

            <div className="container mx-auto max-w-6xl">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-14">
                    {/* Badge Pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/80 dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md"
                    >
                        <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{t("badge")}</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h2
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight"
                    >
                        {t("title_start")}{" "}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {t("title_highlight")}
                        </span>
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed"
                    >
                        {t("subtitle")}
                    </motion.p>
                </div>

                {/* Instant Search Bar */}
                <div className="max-w-2xl mx-auto mb-8 relative">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("search_placeholder")}
                            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id as any);
                                    setOpenIndex(0);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 hover:text-blue-600"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* 2-Column Responsive Accordion Grid */}
                {filteredFaqs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {filteredFaqs.map((faq, index) => {
                            const isOpen = openIndex === index;
                            const panelId = `${baseId}-panel-${index}`;
                            const buttonId = `${baseId}-button-${index}`;

                            const categoryBadgeColor = {
                                privacy: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40",
                                id: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40",
                                calls: "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-800/40",
                                enterprise: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/40",
                            }[faq.category];

                            return (
                                <div
                                    key={faq.id}
                                    className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900/90 shadow-sm overflow-hidden ${
                                        isOpen
                                            ? "border-blue-500/50 shadow-md shadow-blue-500/5"
                                            : "border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                                >
                                    <h3>
                                        <button
                                            id={buttonId}
                                            type="button"
                                            aria-expanded={isOpen}
                                            aria-controls={panelId}
                                            onClick={() => toggleAccordion(index)}
                                            className="flex w-full items-start justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                        >
                                            <div className="space-y-1.5 flex-1">
                                                <span
                                                    className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${categoryBadgeColor}`}
                                                >
                                                    {faq.category}
                                                </span>
                                                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                                                    {faq.question}
                                                </p>
                                            </div>
                                            <div
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-300 ${
                                                    isOpen
                                                        ? "bg-blue-600 text-white rotate-180"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                                }`}
                                            >
                                                <ChevronDown className="h-4 w-4" />
                                            </div>
                                        </button>
                                    </h3>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                id={panelId}
                                                role="region"
                                                aria-labelledby={buttonId}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                                                    {faq.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty Search State */
                    <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 max-w-xl mx-auto">
                        <MessageSquare className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {t("empty_search_title")}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t("empty_search_desc")}
                        </p>
                        <button
                            onClick={() => {
                                setSearchTerm("");
                                setSelectedCategory("all");
                            }}
                            className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            {t("reset_search_btn")}
                        </button>
                    </div>
                )}

                {/* 24/7 OFFICIAL SUPPORT CONTACT HUB BANNER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-16 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-blue-50/80 via-white dark:from-slate-900/90 dark:via-slate-900/90 dark:to-blue-950/40 p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6"
                >
                    <div className="flex items-start gap-4 text-center lg:text-left">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 mx-auto lg:mx-0">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                {t("support_title")}
                            </h4>
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                {t("support_desc")}
                            </p>
                        </div>
                    </div>

                    {/* Email Action Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                        <a
                            href="mailto:support@callschat.com"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 transition-all shadow-xs"
                        >
                            <span>support@callschat.com</span>
                        </a>
                        <a
                            href="mailto:security@callschat.com"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-xs"
                        >
                            <span>security@callschat.com</span>
                        </a>
                        <a
                            href="mailto:privacy@callschat.com"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:text-purple-600 transition-all shadow-xs"
                        >
                            <span>privacy@callschat.com</span>
                        </a>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
