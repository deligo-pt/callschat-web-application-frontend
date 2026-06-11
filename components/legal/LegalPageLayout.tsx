"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ChevronRight, FileText, Mail, Globe } from "lucide-react";
import type { LegalDocument } from "@/lib/legal/types";
import { legalPages } from "@/lib/legal/registry";

interface LegalPageLayoutProps {
    data: LegalDocument;
}

/**
 * Shared, content-driven layout for all CallsChat legal pages (Privacy,
 * Terms, Cookie). Renders a branded header band, a sticky Table of Contents
 * (desktop) / collapsible jump menu (mobile), the numbered policy sections,
 * a contact card, the consent note, and cross-links to the other policies.
 *
 * The visual language intentionally mirrors the marketing home page:
 * white background, navy headings (#0A2540 / #102A63), primary-blue accents
 * (#2563EB / #1A62E8), gray-500 body text, Geist font, and subtle
 * framer-motion reveals.
 */
export default function LegalPageLayout({ data }: LegalPageLayoutProps) {
    const prefersReducedMotion = useReducedMotion();
    const [activeId, setActiveId] = useState<string>(data.sections[0]?.id ?? "");
    const [showTopButton, setShowTopButton] = useState(false);

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
        const onScroll = () => setShowTopButton(window.scrollY > 600);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollToTop = () =>
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

    const sectionReveal = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
    };

    const siblings = legalPages.filter((page) => page.slug !== data.slug);

    return (
        <div className="w-full bg-white">
            {/* ---------- Header band ---------- */}
            <section className="w-full border-b border-gray-100 bg-linear-to-b from-[#F5F8FF] to-white px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="container mx-auto max-w-4xl text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                        <FileText className="h-3.5 w-3.5" />
                        Legal
                    </span>

                    <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0A2540] sm:text-5xl">
                        {data.title}
                    </h1>

                    <p className="mt-3 text-sm font-medium text-gray-500">{data.subtitle}</p>

                    {data.intro && (
                        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#102A63]">
                            {data.intro}
                        </p>
                    )}

                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        Effective Date:&nbsp;
                        <span className="text-[#1A62E8]">{data.effectiveDate}</span>
                    </div>
                </motion.div>
            </section>

            {/* ---------- Body ---------- */}
            <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-12">
                    {/* Table of Contents (desktop sticky) */}
                    <aside className="hidden lg:col-span-4 lg:block">
                        <nav
                            aria-label="Table of contents"
                            className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto"
                        >
                            <h2 className="mb-4 text-[15px] font-bold text-[#1A62E8]">
                                On this page
                            </h2>
                            <ul className="space-y-1 border-l border-gray-100">
                                {data.sections.map((section, index) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            aria-current={activeId === section.id ? "true" : undefined}
                                            className={`block border-l-2 px-4 py-1.5 text-[13px] font-medium transition-colors rounded-r-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                                                activeId === section.id
                                                    ? "border-primary text-primary"
                                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-[#102A63]"
                                            }`}
                                        >
                                            <span className="text-gray-400">{index + 1}.</span>{" "}
                                            {section.heading}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    {/* Mobile "Jump to section" disclosure */}
                    <details className="group mb-8 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 lg:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-bold text-[#1A62E8] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md">
                            Jump to section
                            <ChevronRight className="h-4 w-4 text-primary transition-transform group-open:rotate-90" />
                        </summary>
                        <nav aria-label="Table of contents" className="mt-3">
                            <ul className="space-y-1">
                                {data.sections.map((section, index) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="block rounded-md px-2 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-primary/5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                                        >
                                            {index + 1}. {section.heading}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </details>

                    {/* Sections */}
                    <main className="lg:col-span-8">
                        <div className="space-y-10">
                            {data.sections.map((section, index) => (
                                <motion.section
                                    key={section.id}
                                    id={section.id}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-80px" }}
                                    variants={sectionReveal}
                                    className="scroll-mt-28 border-b border-gray-100 pb-10 last:border-b-0"
                                >
                                    <h2 className="text-xl font-bold text-[#1A62E8] sm:text-2xl">
                                        <span className="text-gray-300">{index + 1}.</span>{" "}
                                        {section.heading}
                                    </h2>
                                    <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-gray-600">
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

                        {/* Contact card */}
                        <div className="mt-12 rounded-3xl border border-primary/15 bg-[#F5F8FF] p-8">
                            <h2 className="text-lg font-bold text-[#0A2540]">Contact Information</h2>
                            <div className="mt-4 space-y-1.5 text-[15px] text-gray-600">
                                <p className="font-semibold text-[#102A63]">{data.contact.org}</p>
                                {data.contact.location && <p>{data.contact.location}</p>}
                            </div>
                            <div className="mt-4 space-y-2.5">
                                {data.contact.emails.map((email) => (
                                    <a
                                        key={email.address}
                                        href={`mailto:${email.address}`}
                                        className="flex w-fit items-center gap-2.5 rounded-md text-[15px] font-medium text-gray-600 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span className="text-gray-500">{email.label}:</span>
                                        <span className="text-[#1A62E8]">{email.address}</span>
                                    </a>
                                ))}
                                {data.contact.website && (
                                    <div className="flex items-center gap-2.5 text-[15px] font-medium text-gray-600">
                                        <Globe className="h-4 w-4 text-primary" />
                                        <span className="text-gray-500">Website:</span>
                                        <span className="text-[#1A62E8]">{data.contact.website}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Consent note */}
                        {data.consent && (
                            <p className="mt-8 text-sm italic leading-relaxed text-gray-500">
                                {data.consent}
                            </p>
                        )}

                        {/* Cross-links to the other policies */}
                        <div className="mt-12 border-t border-gray-100 pt-8">
                            <h2 className="text-[15px] font-bold text-[#1A62E8]">See also</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {siblings.map((page) => (
                                    <Link
                                        key={page.slug}
                                        href={`/${page.slug}`}
                                        className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 text-[15px] font-semibold text-[#102A63] transition-colors hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    >
                                        {page.title}
                                        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* Back-to-top */}
            {showTopButton && (
                <button
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <ArrowUp className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
