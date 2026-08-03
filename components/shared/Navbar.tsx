"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import Modal from "./Modal";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const router = useRouter();

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

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

    const handleGettingStarted = (e: React.MouseEvent) => {
        e.preventDefault();
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
            router.push("/chats");
        } else {
            router.push("/onboarding");
        }
    };

    const handleMobileGettingStarted = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsOpen(false);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (token) {
            router.push("/chats");
        } else {
            router.push("/onboarding");
        }
    };

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "Dual Mood", href: "/#dual-mood" },
        { label: "Security", href: "/#security" },
        { label: "Live Translation", href: "/#live-translation" },
        { label: "AI Service", href: "/#ai-service" },
        { label: "Videos", href: "/#videos" },
    ];

    // Animation variants for the dropdown panel container
    const menuVariants = {
        hidden: {
            opacity: 0,
            y: -10,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                staggerChildren: 0.05
            }
        }
    };
    
    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 relative">

                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-2 group z-50">
                    <div className="relative overflow-hidden rounded-xl">
                        <Image src="/call_chats_logo.png" height={50} width={50} alt="CallsChat Logo" priority className="transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-[#0A2540] dark:text-foreground">
                        Calls<span className="text-primary">Chat</span>
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden lg:flex items-center gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onMouseEnter={() => setHoveredLink(link.label)}
                            onMouseLeave={() => setHoveredLink(null)}
                            className="relative px-4 py-2 text-sm font-semibold transition-colors text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:text-primary"
                        >
                            <span className="relative z-10">{link.label}</span>
                            {hoveredLink === link.label && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-primary/10 rounded-full z-0"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden lg:flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={openModal}
                        className="rounded-full text-sm font-semibold text-slate-700 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5"
                    >
                        Download
                    </Button>
                    <Button
                        onClick={handleGettingStarted}
                        className="rounded-full bg-primary px-6 py-5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Getting Started
                    </Button>
                </div>

                {/* Mobile Hamburger Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-foreground bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 lg:hidden focus:outline-none transition-colors z-50"
                    aria-label="Toggle Menu"
                >
                    <motion.svg
                        className="h-5 w-5 text-slate-700 dark:text-slate-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        animate={isOpen ? "open" : "closed"}
                    >
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            variants={{
                                closed: { d: "M4 6h16", translateY: 0, rotate: 0 },
                                open: { d: "M4 6h16", translateY: 6, rotate: 45 }
                            }}
                            transition={{ duration: 0.3 }}
                        />
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M4 12h16"
                            variants={{
                                closed: { opacity: 1 },
                                open: { opacity: 0 }
                            }}
                            transition={{ duration: 0.2 }}
                        />
                        <motion.path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            variants={{
                                closed: { d: "M4 18h16", translateY: 0, rotate: 0 },
                                open: { d: "M4 18h16", translateY: -6, rotate: -45 }
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.svg>
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop overlay for closing */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 top-20 z-40 bg-background/50 backdrop-blur-sm lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        <motion.div
                            variants={menuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="absolute top-20 left-0 w-full border-b border-border/40 bg-background/95 px-6 pb-8 pt-4 shadow-2xl backdrop-blur-xl lg:hidden z-50 origin-top"
                        >
                            <div className="flex flex-col gap-3">
                                {navLinks.map((link) => (
                                    <motion.div key={link.label} variants={itemVariants}>
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="block rounded-xl px-4 py-3 text-lg font-semibold text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:bg-white/5"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                
                                <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsOpen(false);
                                            openModal();
                                        }}
                                        className="w-full rounded-xl border-border py-6 text-base font-bold shadow-sm dark:bg-transparent"
                                    >
                                        Download App
                                    </Button>
                                    <Button
                                        onClick={handleMobileGettingStarted}
                                        className="w-full rounded-xl bg-primary py-6 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                                    >
                                        Getting Started
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </nav>
    );
}