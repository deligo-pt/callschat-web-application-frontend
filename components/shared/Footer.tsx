import { Play, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full bg-white pt-16 pb-8 border-t border-gray-100">
            <div className="container mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">

                {/* Upper Grid Matrix: Branding + Multi-column Navigation Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-16">

                    {/* Left Block: Branding Description & App Store Downloads */}
                    <div className="lg:col-span-5 flex flex-col items-start max-w-sm">
                        {/* Logo Section */}
                        <Link href="#" className="flex items-center -ml-2">
                            <Image src="/call_chats_logo.png" height={70} width={70} alt="CallsChat Logo" priority />
                            <span className="text-2xl font-bold text-[#0A2540] -ml-2">
                                <span className="text-2xl">Calls<span className="text-[#1A62E8]">Chat</span></span>
                            </span>
                        </Link>

                        <p className="mt-5 text-[14px] font-medium leading-relaxed text-gray-500">
                            The future of secure messaging with AI-powered intelligence, real-time translation, and enterprise-grade privacy.
                        </p>

                        {/* App Badges */}
                        <div className="mt-6 flex flex-wrap gap-3">
                            {/* App Store */}
                            <button className="flex items-center gap-2 rounded-xl border border-primary bg-transparent px-3.5 py-1.5 text-left text-gray-800 transition-colors duration-200 hover:bg-gray-50 focus:outline-none w-33.75">
                                {/* Outlined Apple Logo Icon */}
                                <svg fill="#2563EB" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                </svg>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[8px] text-gray-400 font-medium">Download on the</span>
                                    <span className="text-[11px] font-semibold tracking-tight mt-0.5 text-primary">App Store</span>
                                </div>
                            </button>

                            {/* Google Play */}
                            <button className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-left text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:outline-none w-33.75">
                                <Play className="h-3.5 w-3.5 shrink-0 fill-white text-white" />
                                <div className="flex flex-col leading-none">
                                    <span className="text-[8px] text-white/70 font-medium">Get it on</span>
                                    <span className="text-[11px] font-semibold tracking-tight mt-0.5 text-white">Google Play</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right Blocks: Navigation Columns links */}
                    <div className="lg:col-span-7 grid grid-cols-3 gap-6 sm:gap-8 w-full">
                        {/* Product Links */}
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[15px] font-bold text-[#1A62E8]">Product</h4>
                            <ul className="flex flex-col gap-2.5 text-[14px] font-semibold text-gray-600">
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Features</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Business</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">API</Link></li>
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[15px] font-bold text-[#1A62E8]">Company</h4>
                            <ul className="flex flex-col gap-2.5 text-[14px] font-semibold text-gray-600">
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">About</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Partners</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Support Links */}
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[15px] font-bold text-[#1A62E8]">Support</h4>
                            <ul className="flex flex-col gap-2.5 text-[14px] font-semibold text-gray-600">
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Community</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Status</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Documentation</Link></li>
                                <li><Link href="#" className="hover:text-blue-600 transition-colors">Report Abuse</Link></li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* Center Section: Newsletter Subscription Banner Box */}
                <div className="w-full flex justify-center pb-12">
                    <div className="w-full max-w-3xl rounded-3xl bg-[#1A62E8] px-6 py-10 sm:py-12 sm:px-12 text-center text-white shadow-lg shadow-blue-600/5">
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Stay Updated</h3>
                        <p className="mt-2 text-[11px] sm:text-xs text-white/80 font-medium">
                            Get the latest updates, features, and news delivered to your inbox.
                        </p>

                        <form className="mt-6 flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-2 py-1.5 max-w-md mx-auto focus-within:border-white/30 transition-colors">
                            <div className="relative flex-1 flex items-center pl-3">
                                <Mail className="h-4 w-4 text-white/80 shrink-0" />
                                <input
                                    type="email"
                                    placeholder="Enter your mail"
                                    className="w-full bg-transparent pl-2.5 text-xs text-white placeholder-white/60 focus:outline-none border-none outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="shrink-0 rounded-full bg-white px-5 py-2 text-xs font-bold text-[#1A62E8] shadow-sm transition-transform duration-200 hover:bg-gray-50 active:scale-[0.98]"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Social Handle Connections Grid Row */}
                <div className="flex justify-center items-center gap-3.5 pb-10">
                    {/* Facebook */}
                    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A62E8] text-white transition-transform hover:scale-105" aria-label="Facebook">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8.02 9.57v-6.77H7.56v-2.8h2.46V9.86c0-2.43 1.44-3.78 3.66-3.78 1.06 0 2.18.19 2.18.19v2.4h-1.23c-1.21 0-1.58.75-1.58 1.52v1.83h2.7l-.43 2.8h-2.27V21.57C18.56 20.87 22 16.84 22 12z" />
                        </svg>
                    </a>

                    {/* Website Global / Network */}
                    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A62E8] text-white transition-transform hover:scale-105" aria-label="Website">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" x2="22" y1="12" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </a>

                    {/* LinkedIn */}
                    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A62E8] text-white transition-transform hover:scale-105" aria-label="LinkedIn">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                    </a>

                    {/* Instagram */}
                    <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A62E8] text-white transition-transform hover:scale-105" aria-label="Instagram">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                    </a>
                </div>

                {/* Global Structural Copyright Bar Asset Line */}
                <div className="pt-5 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-semibold text-gray-500">
                    <span>© 2026 CallsChat. All rights reserved.</span>
                    <div className="flex items-center gap-5">
                        <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
                        <Link href="/cookie-policy" className="hover:text-blue-600 transition-colors">Cookie Policy</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}