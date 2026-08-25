"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ChevronDown,
    ArrowDown,
    MessageSquare,
    PhoneCall,
    Layers,
    Languages,
    ShieldCheck,
    ChevronRight,
    HelpCircle
} from "lucide-react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

export default function Navbar() {
    const t = useTranslations("landing_nav");
    const [isOpen, setIsOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
    const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navContainerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    // Dynamic scroll sensing for WhatsApp-style border & background elevation
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const handleLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
            router.push("/chats");
        } else {
            router.push("/connect");
        }
    };

    const handleMobileLogin = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(false);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
            router.push("/chats");
        } else {
            router.push("/connect");
        }
    };

    const navLinks = [
        { id: "features", label: t("features"), href: "/#features", hasDropdown: true },
        { id: "privacy", label: t("privacy"), href: "/#security", hasDropdown: false },
        { id: "dual_mode", label: t("dual_mode"), href: "/#dual-mood", hasDropdown: false },
        { id: "ai_service", label: t("ai_service"), href: "/#ai-service", hasDropdown: false },
        { id: "faq", label: t("faq"), href: "/#faq", hasDropdown: false },
    ];

    const featureSubItems = [
        {
            title: "Messaging",
            description: "Private 1v1 and group chats with end-to-end encryption",
            href: "/#features",
            icon: MessageSquare,
            badge: "Encrypted",
        },
        {
            title: "Voice & Video Calls",
            description: "Ultra-low latency HD audio & video huddles",
            href: "/#features",
            icon: PhoneCall,
            badge: "HD 4K",
        },
        {
            title: "Dual Mode",
            description: "Personal and Business accounts with isolated workspaces",
            href: "/#dual-mood",
            icon: Layers,
            badge: "Workspace",
        },
        {
            title: "Live Translation",
            description: "Real-time speech-to-speech translation in 100+ languages",
            href: "/#live-translation",
            icon: Languages,
            badge: "AI Powered",
        },
        {
            title: "AI Safety Layer",
            description: "Intelligent protection against scams, phishing, and toxic messages",
            href: "/#ai-service",
            icon: ShieldCheck,
            badge: "Active Shield",
        },
    ];

    const mobileMenuVariants: Variants = {
        hidden: {
            opacity: 0,
            y: -10,
            transition: { duration: 0.2, ease: "easeInOut" },
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.25, ease: "easeOut", staggerChildren: 0.05 },
        },
    };

    const mobileItemVariants: Variants = {
        hidden: { opacity: 0, x: -16 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" } },
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                isScrolled
                    ? "bg-[#FCF5EB]/95 dark:bg-[#111b21]/95 backdrop-blur-md shadow-sm border-b border-[#E9EDEF] dark:border-slate-800"
                    : "bg-[#FCF5EB] dark:bg-[#111b21] border-b border-transparent"
            }`}
        >
            <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
                
                {/* Brand Logo (Left) */}
                <Link href="/" className="flex items-center gap-2.5 group select-none">
                    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
                        <Image
                            src="/call_chats_logo.png"
                            height={40}
                            width={40}
                            alt="CallsChat Logo"
                            priority
                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-[#111b21] dark:text-white">
                        CallsChat
                    </span>
                </Link>

                {/* Navigation Links (Center - WhatsApp Style with Gliding Blue Underline Effect) */}
                <nav
                    ref={navContainerRef}
                    onMouseLeave={() => {
                        setHoveredLink(null);
                        setIsFeaturesOpen(false);
                    }}
                    className="hidden lg:flex items-center gap-8 relative"
                >
                    {navLinks.map((link) => {
                        const isHovered = hoveredLink === link.id;

                        return (
                            <div
                                key={link.id}
                                className="relative py-2"
                                onMouseEnter={() => {
                                    setHoveredLink(link.id);
                                    if (link.hasDropdown) {
                                        setIsFeaturesOpen(true);
                                    } else {
                                        setIsFeaturesOpen(false);
                                    }
                                }}
                            >
                                {link.hasDropdown ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                                        className={`group flex items-center gap-1 text-[15px] font-medium transition-colors duration-200 cursor-pointer ${
                                            isHovered || isFeaturesOpen
                                                ? "text-blue-600 dark:text-blue-400 font-semibold"
                                                : "text-[#111b21] dark:text-[#E9EDEF]"
                                        }`}
                                    >
                                        <span>{link.label}</span>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform duration-200 ${
                                                isFeaturesOpen
                                                    ? "rotate-180 text-blue-600 dark:text-blue-400"
                                                    : isHovered
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-[#54656F] dark:text-slate-400"
                                            }`}
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        href={link.href}
                                        onClick={() => {
                                            setHoveredLink(null);
                                            setIsFeaturesOpen(false);
                                        }}
                                        className={`flex items-center text-[15px] font-medium transition-colors duration-200 ${
                                            isHovered
                                                ? "text-blue-600 dark:text-blue-400 font-semibold"
                                                : "text-[#111b21] dark:text-[#E9EDEF]"
                                        }`}
                                    >
                                        <span>{link.label}</span>
                                    </Link>
                                )}

                                {/* WhatsApp Blue Underline Animation */}
                                {isHovered && (
                                    <motion.div
                                        layoutId="whatsapp-blue-nav-underline"
                                        className="absolute -bottom-0.5 left-0 right-0 h-[2.5px] bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.45)] pointer-events-none"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 28,
                                        }}
                                    />
                                )}

                                {/* Floating Mega Menu Dropdown for Features */}
                                {link.hasDropdown && (
                                    <AnimatePresence>
                                        {isFeaturesOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                                transition={{ duration: 0.18, ease: "easeOut" }}
                                                className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[360px] rounded-2xl bg-white dark:bg-[#1f2c34] p-3 shadow-2xl border border-[#E9EDEF] dark:border-slate-700/60 z-50"
                                            >
                                                <div className="space-y-1">
                                                    {featureSubItems.map((item) => {
                                                        const IconComp = item.icon;
                                                        return (
                                                            <Link
                                                                key={item.title}
                                                                href={item.href}
                                                                onClick={() => {
                                                                    setIsFeaturesOpen(false);
                                                                    setHoveredLink(null);
                                                                }}
                                                                className="flex items-start gap-3.5 rounded-xl p-3 hover:bg-blue-50/80 dark:hover:bg-[#111b21] transition-colors group/item"
                                                            >
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 transition-colors group-hover/item:bg-blue-600 group-hover/item:text-white">
                                                                    <IconComp className="h-5 w-5" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm font-semibold text-[#111b21] dark:text-white group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400">
                                                                            {item.title}
                                                                        </span>
                                                                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                                                            {item.badge}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-[#54656F] dark:text-slate-400 mt-0.5 line-clamp-1">
                                                                        {item.description}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Right Action Buttons (WhatsApp Style: Outline Log In + Green Download) */}
                <div className="hidden lg:flex items-center gap-3.5">
                    
                    {/* Log In Outline Pill */}
                    <button
                        onClick={handleLogin}
                        className="flex items-center gap-1.5 rounded-full border border-[#111b21] dark:border-white px-5 py-2.5 text-sm font-semibold text-[#111b21] dark:text-white transition-all hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                        <span>{t("login")}</span>
                        <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                    </button>

                    {/* Green Signature Download Button */}
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20BD5A] px-6 py-2.5 text-sm font-bold text-[#111b21] transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <span>{t("download")}</span>
                        <ArrowDown className="h-4 w-4 stroke-[2.5]" />
                    </button>
                </div>

                {/* Mobile Menu Hamburger (Right) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#111b21] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 lg:hidden focus:outline-none transition-colors"
                    aria-label="Toggle Navigation Menu"
                >
                    <motion.svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        animate={isOpen ? "open" : "closed"}
                    >
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.2}
                            variants={{
                                closed: { d: "M4 7h16", translateY: 0, rotate: 0 },
                                open: { d: "M4 7h16", translateY: 5, rotate: 45 },
                            }}
                            transition={{ duration: 0.25 }}
                        />
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.2}
                            d="M4 12h16"
                            variants={{
                                closed: { opacity: 1 },
                                open: { opacity: 0 },
                            }}
                            transition={{ duration: 0.15 }}
                        />
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.2}
                            variants={{
                                closed: { d: "M4 17h16", translateY: 0, rotate: 0 },
                                open: { d: "M4 17h16", translateY: -5, rotate: -45 },
                            }}
                            transition={{ duration: 0.25 }}
                        />
                    </motion.svg>
                </button>
            </div>

            {/* Mobile Dropdown Sheet (WhatsApp Style) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 top-20 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Mobile Drawer */}
                        <motion.div
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="absolute top-full left-0 w-full border-b border-[#E9EDEF] dark:border-slate-800 bg-[#FCF5EB] dark:bg-[#111b21] px-6 pb-8 pt-4 shadow-2xl lg:hidden z-50 origin-top max-h-[calc(100vh-5rem)] overflow-y-auto"
                        >
                            <div className="flex flex-col gap-2">
                                
                                {/* Mobile Features Accordion */}
                                <motion.div variants={mobileItemVariants} className="border-b border-[#E9EDEF] dark:border-slate-800/80 pb-2">
                                    <button
                                        onClick={() => setIsMobileFeaturesOpen(!isMobileFeaturesOpen)}
                                        className="flex w-full items-center justify-between py-3 text-lg font-semibold text-[#111b21] dark:text-white"
                                    >
                                        <span>{t("features")}</span>
                                        <ChevronDown
                                            className={`h-5 w-5 text-[#54656F] transition-transform duration-200 ${
                                                isMobileFeaturesOpen ? "rotate-180 text-blue-600" : ""
                                            }`}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isMobileFeaturesOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden space-y-2 pl-3 pt-1 pb-3"
                                            >
                                                {featureSubItems.map((sub) => {
                                                    const SubIcon = sub.icon;
                                                    return (
                                                        <Link
                                                            key={sub.title}
                                                            href={sub.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className="flex items-center gap-3 py-2 text-sm font-medium text-[#54656F] dark:text-slate-300 hover:text-blue-600"
                                                        >
                                                            <SubIcon className="h-4 w-4 text-blue-600" />
                                                            <span>{sub.title}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Privacy Link */}
                                <motion.div variants={mobileItemVariants}>
                                    <Link
                                        href="/#security"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-3 text-lg font-semibold text-[#111b21] dark:text-white border-b border-[#E9EDEF] dark:border-slate-800/80 hover:text-blue-600"
                                    >
                                        {t("privacy")}
                                    </Link>
                                </motion.div>

                                {/* Dual Mode Link */}
                                <motion.div variants={mobileItemVariants}>
                                    <Link
                                        href="/#dual-mood"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-3 text-lg font-semibold text-[#111b21] dark:text-white border-b border-[#E9EDEF] dark:border-slate-800/80 hover:text-blue-600"
                                    >
                                        {t("dual_mode")}
                                    </Link>
                                </motion.div>

                                {/* AI Safety Link */}
                                <motion.div variants={mobileItemVariants}>
                                    <Link
                                        href="/#ai-service"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-3 text-lg font-semibold text-[#111b21] dark:text-white border-b border-[#E9EDEF] dark:border-slate-800/80 hover:text-blue-600"
                                    >
                                        {t("ai_service")}
                                    </Link>
                                </motion.div>

                                {/* Help Center Link */}
                                <motion.div variants={mobileItemVariants}>
                                    <Link
                                        href="/#faq"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-3 text-lg font-semibold text-[#111b21] dark:text-white border-b border-[#E9EDEF] dark:border-slate-800/80 hover:text-blue-600"
                                    >
                                        {t("faq")}
                                    </Link>
                                </motion.div>

                                {/* Mobile CTA Action Buttons */}
                                <motion.div
                                    variants={mobileItemVariants}
                                    className="mt-6 flex flex-col gap-3"
                                >
                                    {/* Log In Outline Button */}
                                    <button
                                        onClick={handleMobileLogin}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#111b21] dark:border-white text-base font-bold text-[#111b21] dark:text-white transition-colors hover:bg-black/5"
                                    >
                                        <span>{t("login")}</span>
                                        <ChevronRight className="h-4 w-4 stroke-[2.5]" />
                                    </button>

                                    {/* Download Signature Green Button */}
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            openModal();
                                        }}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-bold text-[#111b21] shadow-md hover:bg-[#20BD5A] transition-colors"
                                    >
                                        <span>{t("download")}</span>
                                        <ArrowDown className="h-4 w-4 stroke-[2.5]" />
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </header>
    );
}