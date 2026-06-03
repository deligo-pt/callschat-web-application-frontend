import { Play, QrCode } from "lucide-react";

export default function DownloadCTA() {
    return (
        <section id="download" className="w-full bg-[#1A62E8] px-4 py-20 sm:px-6 lg:px-8 text-white">
            <div className="container mx-auto max-w-4xl flex flex-col items-center text-center">

                {/* Main Section Headings */}
                <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    Start Secure Messaging Today
                </h2>
                <p className="mt-4 text-lg font-medium text-white/90">
                    Download CallsChat now and transform how you connect.
                </p>

                {/* App Stores CTA Trigger Buttons */}
                <div className="mt-10 flex flex-wrap justify-center gap-4">

                    {/* iOS Download Trigger */}
                    <button className="flex items-center gap-3 rounded-xl bg-white px-5 py-2.5 text-left text-[#1A62E8] shadow-md transition-transform duration-200 hover:scale-[1.02] focus:outline-none">
                         {/* Outlined Apple Logo Icon */}
                                <svg fill="#1A62E8" width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                </svg>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-gray-500 font-medium">Download on the</span>
                            <span className="text-sm font-bold tracking-tight mt-0.5">App Store</span>
                        </div>
                    </button>

                    {/* Android Download Trigger */}
                    <button className="flex items-center gap-3 rounded-xl border border-white/40 bg-transparent px-5 py-2.5 text-left text-white transition-transform duration-200 hover:scale-[1.02] hover:bg-white/5 focus:outline-none">
                        <Play className="h-5 w-5 shrink-0 text-white" fill="transparent" stroke="currentColor" strokeWidth={2.5} />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-white/70 font-medium">Get it on</span>
                            <span className="text-sm font-bold tracking-tight mt-0.5">Google Play</span>
                        </div>
                    </button>

                </div>

                {/* Central Scan Dashboard Container Panel */}
                <div className="mt-12 w-full max-w-3xl rounded-4xl border border-white/10 bg-white/8 p-8 md:p-10 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 text-left">

                        {/* White QR Code Canvas Frame */}
                        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-white p-4 shadow-xl">
                            {/* Lucide QrCode icon configured to mirror the logo style */}
                            <QrCode className="h-full w-full text-[#1A62E8]" strokeWidth={1.75} />
                        </div>

                        {/* QR Copy Content */}
                        <div className="flex flex-col gap-2 max-w-sm text-center md:text-left">
                            <h3 className="text-2xl font-bold tracking-wide">
                                Scan to Download
                            </h3>
                            <p className="text-sm leading-relaxed text-white/80 font-normal">
                                Open your camera and scan this QR code to download CallsChat on your mobile device.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Bottom Feature Value Properties List */}
                <div className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-sm font-medium text-white/90">
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                        <span>Free to download</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                        <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                        <span>Available worldwide</span>
                    </div>
                </div>

            </div>
        </section>
    );
}