"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";
import Modal from "./Modal";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    const openModal = () => setIsDownloadModalOpen(true);
    const closeModal = () => setIsDownloadModalOpen(false);

    const navLinks = [
        { label: "Features", href: "#features" },
        { label: "Dual Mood", href: "#dual-mood" },
        { label: "Security", href: "#security" },
        { label: "Live Translation", href: "#live-translation" },
        { label: "AI Service", href: "#ai-service" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-background/80 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-20 items-center justify-between px-2 sm:px-6 lg:px-8">

                {/* Logo Section */}
                <Link href="#" className="flex items-center">
                    <Image src="/call_chats_logo.png" height={70} width={70} alt="CallsChat Logo" priority />
                    <span className="text-2xl font-bold text-[#0A2540]">
                        <span className="text-2xl">Calls<span className="text-[#1A62E8]">Chat</span></span>
                    </span>
                </Link>

                {/* Desktop Navigation Links */}
                <div className="hidden items-center gap-8 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`text-base font-medium transition-colors duration-200 rounded-md px-3 py-1 hover:bg-primary/10 text-[#102A63] hover:text-primary`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop Download Button */}
                <div className="hidden lg:block">
                    <Button
                        onClick={openModal}
                        className="rounded-xl bg-primary px-6 py-2.5 text-base font-medium text-background shadow-md shadow-blue-500/20 transition-all duration-200 hover:bg-primary/80 hover:shadow-lg"
                    >
                        Download
                    </Button>
                </div>

                {/* Mobile Hamburger Menu Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-background lg:hidden focus:outline-none"
                    aria-label="Toggle Menu"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isOpen && (
                <div className="border-b border-background bg-background px-6 py-4 shadow-inner lg:hidden">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`text-lg font-medium  transition-colors inline-block rounded-md px-3 py-1 text-[#102A63] hover:text-primary`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="my-2 border-background" />
                        <Button
                            onClick={() => {
                                setIsOpen(false);
                                openModal();
                            }}
                            className="w-full rounded-xl bg-primary py-3 text-center font-medium text-background shadow-md"
                        >
                            Download
                        </Button>
                    </div>
                </div>
            )}

            <Modal isOpen={isDownloadModalOpen} onClose={closeModal} />
        </nav>
    );
}