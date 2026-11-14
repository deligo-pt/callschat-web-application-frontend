"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
    ArrowUp,
    Building2,
    ChevronRight,
    FileText,
    Globe,
    Mail,
    ShieldCheck,
    User,
} from "lucide-react";
import type { LegalDocument } from "@/lib/legal/types";
import { legalPages } from "@/lib/legal/registry";

interface LegalPageLayoutProps {
    data: LegalDocument;
}

/**
 * Shared, content-driven layout for CallsChat legal pages (Privacy, Terms, Cookie).
 * Fully aligned with CallsChat / WhatsApp design tokens (PRIVACY_POLICY/DESIGN.md).
 *
 * Supports comprehensive Dark & Light themes:
 * - Light: Crisp pure white (#FFFFFF) canvas with subtle emerald ambient hero (#F0FDF4), cool slate cards (#F8FAFC), WhatsApp emerald accents (#00A884 / #00803E), dark slate headings (#1C1E21).
 * - Dark: High-contrast night surfaces (#0C1317 / #111B21 / #202C33), vibrant emerald (#25D366 / #00A884), light text (#E9EDEF).
 * - Meets WCAG 2.2 AA accessibility standards with full keyboard and focus indicators.
 */
export default function LegalPageLayout({ data }: LegalPageLayoutProps) {
    const prefersReducedMotion = useReducedMotion();
    const [activeId, setActiveId] = useState<string>(data.sections[0]?.id ?? "");
    const [showTopButton, setShowTopButton] = useState(false);

    const isPrivacyPolicy = data.slug.includes("privacy") || data.appType !== undefined;
    const currentApp = data.appType || (data.slug.includes("business") ? "BUSINESS" : "PERSONAL");

    // Highlight the section currently in view within the Table of Contents.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            // Bias the observation window below the sticky navbar (h-20 = 80px).
            { rootMargin: "-96px 0px -65% 0px", threshold: 0 }
        );

        data.sections.forEach((section) => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [data.sections]);

    // Reveal the back-to-top control after the user scrolls down.
    useEffect(() => {
        const onScroll = () => setShowTopButton(window.scrollY > 500);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () =>
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

    const sectionReveal = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
    };

    const normalizedCurrent = currentApp === "BUSINESS" ? "privacy-policy/business" : data.slug;
    const siblings = legalPages.filter(
        (page) => page.slug !== normalizedCurrent && page.slug !== data.slug
    );

    return (
        <div className="w-full min-h-screen bg-white dark:bg-[#0C1317] text-[#1C1E21] dark:text-[#E9EDEF] transition-colors duration-200">
            {/* ── Branded Header Hero Band ─────────────────────────────────── */}
            <section className="relative w-full border-b border-[#E2E8F0] dark:border-[#222D34] bg-linear-to-b from-[#F0FDF4] via-emerald-50/20 to-white dark:from-[#111B21] dark:via-[#0E171C] dark:to-[#0C1317] px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="container mx-auto max-w-4xl text-center"
                >
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00A884]/25 bg-[#00A884]/10 dark:bg-[#00A884]/20 px-3.5 py-1 text-xs font-semibold text-[#00803E] dark:text-[#25D366] shadow-2xs">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>CallsChat Legal & Compliance</span>
                    </div>

                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1C1E21] dark:text-[#E9EDEF] sm:text-5xl lg:text-[46px]">
                        {data.title}
                    </h1>

                    <p className="mt-3 text-sm font-medium text-[#667781] dark:text-[#8696A0]">
                        {data.subtitle}
                    </p>

                    {/* Dual-App Tab Toggle (Personal vs Business) */}
                    {isPrivacyPolicy && (
                        <div className="mt-7 flex justify-center">
                            <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-[#111B21] border border-[#E2E8F0] dark:border-[#2A3942] shadow-xs">
                                <Link
                                    href="/privacy-policy"
                                    aria-current={currentApp === "PERSONAL" ? "page" : undefined}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] ${
                                        currentApp === "PERSONAL"
                                            ? "bg-[#00A884] text-white shadow-xs"
                                            : "text-[#54656F] dark:text-[#8696A0] hover:text-[#1C1E21] dark:hover:text-[#E9EDEF]"
                                    }`}
                                >
                                    <User className="h-4 w-4" />
                                    <span>Personal App</span>
                                </Link>
                                <Link
                                    href="/privacy-policy/business"
                                    aria-current={currentApp === "BUSINESS" ? "page" : undefined}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] ${
                                        currentApp === "BUSINESS"
                                            ? "bg-[#00A884] text-white shadow-xs"
                                            : "text-[#54656F] dark:text-[#8696A0] hover:text-[#1C1E21] dark:hover:text-[#E9EDEF]"
                                    }`}
                                >
                                    <Building2 className="h-4 w-4" />
                                    <span>Business App</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {data.intro && (
                        <p className="mx-auto mt-6 max-w-2xl text-[15px] sm:text-base leading-relaxed text-[#3B4A54] dark:text-[#D1D7DB]">
                            {data.intro}
                        </p>
                    )}

                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#111B21] px-4 py-1.5 text-xs font-medium text-[#54656F] dark:text-[#8696A0] shadow-xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A884] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00A884]"></span>
                        </span>
                        <span>Effective Date:</span>
                        <span className="font-semibold text-[#00803E] dark:text-[#25D366]">
                            {data.effectiveDate}
                        </span>
                    </div>
                </motion.div>
            </section>

            {/* ── Main Policy Content Body ───────────────────────────────────── */}
            <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                    {/* Desktop Sticky Table of Contents */}
                    <aside className="hidden lg:col-span-4 lg:block">
                        <nav
                            aria-label="Table of contents"
                            className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
                        >
                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E2E8F0] dark:border-[#222D34]">
                                <FileText className="h-4 w-4 text-[#00A884] dark:text-[#25D366]" />
                                <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884]">
                                    Table of Contents
                                </h2>
                            </div>
                            <ul className="space-y-1 border-l border-[#E2E8F0] dark:border-[#222D34]">
                                {data.sections.map((section, index) => {
                                    const isCurrent = activeId === section.id;
                                    return (
                                        <li key={section.id}>
                                            <a
                                                href={`#${section.id}`}
                                                aria-current={isCurrent ? "true" : undefined}
                                                className={`block border-l-2 px-3.5 py-1.5 text-[13px] font-medium transition-all rounded-r-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] ${
                                                    isCurrent
                                                        ? "border-[#00A884] dark:border-[#25D366] text-[#00803E] dark:text-[#25D366] bg-[#00A884]/10 dark:bg-[#00A884]/15 font-semibold"
                                                        : "border-transparent text-[#667781] dark:text-[#8696A0] hover:text-[#1C1E21] dark:hover:text-[#E9EDEF] hover:border-[#CBD5E1] dark:hover:border-[#3B4A54] hover:bg-[#F0F2F5]/50 dark:hover:bg-[#202C33]/40"
                                                }`}
                                            >
                                                <span className="text-[#8696A0] dark:text-[#667781] mr-1.5 font-normal">
                                                    {index + 1}.
                                                </span>
                                                {section.heading}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </aside>

                    {/* Mobile "Jump to section" Drawer */}
                    <details className="group mb-8 rounded-2xl border border-[#E2E8F0] dark:border-[#222D34] bg-[#F8FAFC] dark:bg-[#111B21] p-4 lg:hidden shadow-xs transition-colors">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-[14.5px] font-bold text-[#00803E] dark:text-[#25D366] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] rounded-lg">
                            <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Jump to section ({data.sections.length})
                            </span>
                            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                        </summary>
                        <nav aria-label="Mobile table of contents" className="mt-3 pt-3 border-t border-[#F0F2F5] dark:border-[#202C33]">
                            <ul className="space-y-1">
                                {data.sections.map((section, index) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="block rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-[#54656F] dark:text-[#8696A0] hover:bg-[#00A884]/10 hover:text-[#00803E] dark:hover:text-[#25D366] transition-colors"
                                        >
                                            <span className="font-semibold mr-1">{index + 1}.</span> {section.heading}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </details>

                    {/* Policy Substantive Sections */}
                    <main className="lg:col-span-8">
                        <div className="space-y-10 sm:space-y-12">
                            {data.sections.map((section, index) => (
                                <motion.section
                                    key={section.id}
                                    id={section.id}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-70px" }}
                                    variants={sectionReveal}
                                    className="scroll-mt-28 border-b border-[#E2E8F0] dark:border-[#222D34] pb-9 last:border-b-0"
                                >
                                    <h2 className="flex items-baseline text-lg sm:text-2xl font-bold text-[#1C1E21] dark:text-[#E9EDEF] tracking-tight">
                                        <span className="text-[#00A884] dark:text-[#25D366] font-mono mr-2.5 text-base sm:text-xl">
                                            {index + 1}.
                                        </span>
                                        <span>{section.heading}</span>
                                    </h2>
                                    <div className="mt-4 space-y-3.5 text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#3B4A54] dark:text-[#D1D7DB]">
                                        {(Array.isArray(section.body)
                                            ? section.body
                                            : [section.body]
                                        ).map((paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                </motion.section>
                            ))}
                        </div>

                        {/* Contact Information Card */}
                        <div className="mt-12 rounded-3xl border border-[#00A884]/20 dark:border-[#2A3942] bg-[#F8FAFC] dark:bg-[#111B21] p-6 sm:p-8 shadow-xs transition-colors">
                            <div className="flex items-center gap-2 text-[#00803E] dark:text-[#25D366] mb-3">
                                <Mail className="h-5 w-5" />
                                <h2 className="text-lg font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                                    Contact & Inquiries
                                </h2>
                            </div>
                            <p className="text-xs text-[#667781] dark:text-[#8696A0]">
                                For legal requests, CCPA/GDPR data subject inquiries, or privacy concerns:
                            </p>
                            <div className="mt-4 space-y-1 text-[14.5px] text-[#3B4A54] dark:text-[#D1D7DB]">
                                <p className="font-semibold text-[#1C1E21] dark:text-[#E9EDEF]">{data.contact.org}</p>
                                {data.contact.location && <p className="text-sm text-[#667781] dark:text-[#8696A0]">{data.contact.location}</p>}
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                {data.contact.emails.map((email) => (
                                    <a
                                        key={email.address}
                                        href={`mailto:${email.address}`}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#202C33] px-3.5 py-2 text-xs font-semibold text-[#1C1E21] dark:text-[#E9EDEF] transition-all hover:border-[#00A884] dark:hover:border-[#25D366] hover:text-[#00803E] dark:hover:text-[#25D366]"
                                    >
                                        <Mail className="h-3.5 w-3.5 text-[#00A884] dark:text-[#25D366]" />
                                        <span className="text-[#667781] dark:text-[#8696A0]">{email.label}:</span>
                                        <span>{email.address}</span>
                                    </a>
                                ))}
                                {data.contact.website && (
                                    <a
                                        href={`https://${data.contact.website.replace(/^https?:\/\//, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#202C33] px-3.5 py-2 text-xs font-semibold text-[#1C1E21] dark:text-[#E9EDEF] transition-all hover:border-[#00A884] dark:hover:border-[#25D366] hover:text-[#00803E] dark:hover:text-[#25D366]"
                                    >
                                        <Globe className="h-3.5 w-3.5 text-[#00A884] dark:text-[#25D366]" />
                                        <span>{data.contact.website}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Consent Note */}
                        {data.consent && (
                            <div className="mt-6 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#2A3942] p-4 bg-[#F8FAFC] dark:bg-[#111B21]/50 text-xs italic leading-relaxed text-[#667781] dark:text-[#8696A0]">
                                {data.consent}
                            </div>
                        )}

                        {/* Cross-links to Sibling Legal Policies */}
                        <div className="mt-12 border-t border-[#E2E8F0] dark:border-[#222D34] pt-8">
                            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884] mb-4">
                                Related Legal Agreements
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {siblings.map((page) => (
                                    <Link
                                        key={page.slug}
                                        href={`/${page.slug}`}
                                        className="group flex items-center justify-between rounded-2xl border border-[#E2E8F0] dark:border-[#222D34] bg-[#F8FAFC] dark:bg-[#111B21] px-5 py-4 text-[14.5px] font-semibold text-[#1C1E21] dark:text-[#E9EDEF] transition-all hover:border-[#00A884]/40 hover:bg-[#00A884]/5 dark:hover:border-[#00A884]/40 dark:hover:bg-[#00A884]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]"
                                    >
                                        <span>{page.title}</span>
                                        <ChevronRight className="h-4 w-4 text-[#8696A0] transition-transform group-hover:translate-x-1 group-hover:text-[#00A884] dark:group-hover:text-[#25D366]" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Back-to-top Floating Button */}
            {showTopButton && (
                <button
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#00A884] hover:bg-[#00803E] text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:ring-offset-2 dark:focus:ring-offset-[#0C1317] cursor-pointer"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
