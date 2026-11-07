"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Mail, ShieldCheck, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Modal from "./Modal";

export default function Footer() {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [isSubscribed, setIsSubscribed] = useState(false);

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email || !email.includes("@")) {
            toast.error("Please enter a valid email address.");
            return;
        }
        setIsSubscribed(true);
        toast.success("Thank you for subscribing to CallsChat updates!");
        setEmail("");
    };

    return (
        <footer className="w-full bg-[#FCF5EB]/60 dark:bg-[#0C1317] border-t border-[#E2E8F0] dark:border-[#222D34] pt-16 pb-12 text-[#1C1E21] dark:text-[#E9EDEF] overflow-hidden transition-colors duration-200">
            <div className="container mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">

                {/* ── Upper Grid: Brand & Description (left) + 4-Column Sitemap (right) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pb-12">

                    {/* Brand & App Downloads Column (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col items-start space-y-6">
                        {/* Logo */}
                        <Link
                            href="/"
                            className="flex items-center group transition-transform duration-200 hover:scale-[1.02] focus:outline-none select-none -ml-3"
                            aria-label="CallsChat Home"
                        >
                            <Image
                                src="/call_chats_logo.png"
                                alt="CallsChat Logo"
                                width={75}
                                height={54}
                                className="object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs dark:drop-shadow-[0_0_14px_rgba(0,168,132,0.4)]"
                                priority
                            />
                            <span
                                className="inline-block tracking-tight"
                                style={{
                                    fontFamily: "Inter, sans-serif",
                                    fontWeight: 800,
                                    fontSize: 23,
                                    lineHeight: 1,
                                    marginLeft: -10,
                                }}
                            >
                                <span className="text-[#1C1E21] dark:text-white transition-colors duration-200">Calls</span>
                                <span className="text-[#00A884] dark:text-[#25D366] transition-colors duration-200">Chat</span>
                            </span>
                        </Link>

                        <p className="text-[14.5px] leading-relaxed text-[#54656F] dark:text-[#8696A0] max-w-sm">
                            Next-generation secure communication with end-to-end encryption, ultra-low latency voice & video calls, and privacy-first CallsChat IDs.
                        </p>

                        {/* Security Assurance Badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#00A884]/20 bg-[#00A884]/10 dark:bg-[#00A884]/15 px-3.5 py-1 text-xs font-semibold text-[#00803E] dark:text-[#25D366]">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            <span>End-to-End Cryptographically Encrypted</span>
                        </div>

                        {/* App Download Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                            {/* App Store */}
                            <button
                                type="button"
                                onClick={openModal}
                                className="flex items-center justify-center sm:justify-start gap-3 rounded-2xl border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#111B21] px-4 py-2.5 text-left text-[#1C1E21] dark:text-[#E9EDEF] transition-all duration-200 hover:border-[#00A884] dark:hover:border-[#25D366] hover:bg-white/80 dark:hover:bg-[#1A2730] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] shadow-xs cursor-pointer group"
                            >
                                <svg fill="currentColor" width="22px" height="22px" viewBox="0 0 24 24" className="text-[#1C1E21] dark:text-white group-hover:text-[#00A884] dark:group-hover:text-[#25D366] transition-colors">
                                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                </svg>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] text-[#667781] dark:text-[#8696A0] font-medium">Download on the</span>
                                    <span className="text-[13px] font-bold tracking-tight mt-0.5">App Store</span>
                                </div>
                            </button>

                            {/* Google Play */}
                            <button
                                type="button"
                                onClick={openModal}
                                className="flex items-center justify-center sm:justify-start gap-3 rounded-2xl bg-[#111B21] dark:bg-[#202C33] border border-transparent dark:border-[#2A3942] px-4 py-2.5 text-left text-white shadow-xs transition-all duration-200 hover:bg-[#00A884] dark:hover:bg-[#00A884] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884] cursor-pointer group"
                            >
                                <Play className="h-4 w-4 shrink-0 fill-white text-white group-hover:scale-110 transition-transform" />
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] text-white/70 font-medium">Get it on</span>
                                    <span className="text-[13px] font-bold tracking-tight mt-0.5 text-white">Google Play</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 4-Column Structured Navigation Sitemap (8 cols) */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">

                        {/* Column 1: Features */}
                        <div className="flex flex-col space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884]">
                                Features
                            </h3>
                            <ul className="space-y-2.5 text-[14px]">
                                <li>
                                    <Link href="/chats" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Private Chat
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/calls" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Voice & Video Calls
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/live/rooms" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Live Audio Rooms
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/communities" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Group Communities
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/mall" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Diamond Economy
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Column 2: Company */}
                        <div className="flex flex-col space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884]">
                                Company
                            </h3>
                            <ul className="space-y-2.5 text-[14px]">
                                <li>
                                    <Link href="/" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        About CallsChat
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy#security-measures" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Security & Cryptography
                                    </Link>
                                </li>
                                <li>
                                    <button type="button" onClick={openModal} className="text-left text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors cursor-pointer">
                                        Web Desktop App
                                    </button>
                                </li>
                                <li>
                                    <a href="mailto:press@callschat.com" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Press & Media
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Support & Help */}
                        <div className="flex flex-col space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884]">
                                Support
                            </h3>
                            <ul className="space-y-2.5 text-[14px]">
                                <li>
                                    <a href="mailto:support@callschat.com" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Help Center
                                    </a>
                                </li>
                                <li>
                                    <Link href="/privacy-policy#phone-number-privacy" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Phone Number Privacy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy#ai-moderation-and-abuse-prevention" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Safety & Moderation
                                    </Link>
                                </li>
                                <li>
                                    <a href="mailto:abuse@callschat.com" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Report Abuse
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 4: Legal & Compliance */}
                        <div className="flex flex-col space-y-3.5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#00A884]">
                                Legal
                            </h3>
                            <ul className="space-y-2.5 text-[14px]">
                                <li>
                                    <Link href="/privacy-policy" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors font-medium">
                                        Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/terms-of-service" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Terms of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/cookie-policy" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        Cookie Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/privacy-policy#gdpr-privacy-rights" className="text-[#54656F] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] transition-colors">
                                        GDPR & CCPA Rights
                                    </Link>
                                </li>
                            </ul>
                        </div>

                    </div>

                </div>

                {/* ── Middle Band: Sleek Minimalist Newsletter Subscription Bar (Option A) ── */}
                <div className="border-t border-b border-[#E2E8F0] dark:border-[#222D34] py-8 my-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3.5 text-center md:text-left">
                            <div className="h-10 w-10 shrink-0 rounded-2xl bg-[#00A884]/10 dark:bg-[#00A884]/20 flex items-center justify-center text-[#00803E] dark:text-[#25D366]">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-[15px] font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                                    Stay informed with CallsChat
                                </h4>
                                <p className="text-xs text-[#54656F] dark:text-[#8696A0]">
                                    Subscribe to product updates, security advisories, and feature releases.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-md w-full">
                            <div className="relative flex-1">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full rounded-full border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#111B21] px-4 py-2.5 text-xs sm:text-sm text-[#1C1E21] dark:text-[#E9EDEF] placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884] transition-colors shadow-2xs"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="shrink-0 rounded-full bg-[#00A884] hover:bg-[#00803E] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-transform duration-200 active:scale-95 cursor-pointer"
                            >
                                {isSubscribed ? "Subscribed!" : "Subscribe"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Bottom Sub-Footer: Copyright, Status, Socials & Language ── */}
                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-[#667781] dark:text-[#8696A0]">

                    {/* Left: Copyright & Operational Status */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span>© 2026 CallsChat LLC. All rights reserved.</span>
                        <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
                        <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="font-semibold">All Systems Operational</span>
                        </div>
                    </div>

                    {/* Right: Modern Social Handles & Region Selector */}
                    <div className="flex items-center gap-5">
                        {/* Social Icons (Muted hover) */}
                        <div className="flex items-center gap-3">
                            {/* X (formerly Twitter) */}
                            <a
                                href="https://x.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-[#667781] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                aria-label="X (Twitter)"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* Instagram */}
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-[#667781] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                aria-label="Instagram"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                            </a>

                            {/* LinkedIn */}
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-[#667781] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>

                            {/* GitHub */}
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-[#667781] dark:text-[#8696A0] hover:text-[#00A884] dark:hover:text-[#25D366] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                aria-label="GitHub"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                            </a>
                        </div>

                        {/* Region & Language Selector Pill */}
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] dark:border-[#2A3942] bg-white dark:bg-[#111B21] px-3 py-1 text-[11.5px] font-semibold text-[#1C1E21] dark:text-[#E9EDEF] shadow-2xs">
                            <Globe className="h-3.5 w-3.5 text-[#00A884] dark:text-[#25D366]" />
                            <span>English (US)</span>
                        </div>
                    </div>

                </div>

            </div>

            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </footer>
    );
}
