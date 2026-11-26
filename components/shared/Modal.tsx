"use client";

import { useEffect, useState } from "react";
import { Briefcase, Download, Smartphone, User } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    appReleaseService,
    type LatestPublicReleases,
} from "@/services/app-release.service";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title = "Download CallsChat for Android",
}: ModalProps) {
    const [releases, setReleases] = useState<LatestPublicReleases>({
        personal: null,
        business: null,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        setIsLoading(true);
        appReleaseService
            .getLatestPublicReleases()
            .then((data) => {
                if (active) setReleases(data);
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg rounded-2xl bg-white dark:bg-[#111B21] p-6 sm:p-8 shadow-2xl border border-[#E9EDEF] dark:border-[#222D34] gap-0">
                {/* Brand Icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50">
                    <Smartphone className="h-7 w-7 text-blue-600 dark:text-[#00A884]" />
                </div>

                {/* Header */}
                <DialogHeader className="space-y-0 text-center">
                    <DialogTitle className="text-2xl font-bold text-[#102A63] dark:text-[#E9EDEF] tracking-normal">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[#8696A0] text-center">
                        Choose your CallsChat Android app below to download the latest official APK directly.
                    </DialogDescription>
                </DialogHeader>

                {/* Two APK Download Options */}
                <div className="mt-6 space-y-3">
                    {/* CallsChat (Personal) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-slate-50/80 dark:bg-[#182229] p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {releases.personal?.appName || "CallsChat (Personal)"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {releases.personal
                                        ? `v${releases.personal.versionName} (Code ${releases.personal.versionCode}) · ${appReleaseService.formatApkFileSize(
                                              releases.personal.fileSizeBytes
                                          )} · ${releases.personal.minOsVersion || "Android 8.0+"}`
                                        : isLoading
                                        ? "Checking latest release..."
                                        : "APK coming soon"}
                                </p>
                            </div>
                        </div>

                        {releases.personal ? (
                            <a
                                href={appReleaseService.getApkDownloadUrl("PERSONAL")}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2.5 shadow-sm transition-colors"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </a>
                        ) : (
                            <span className="shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-3 py-2">
                                Unavailable
                            </span>
                        )}
                    </div>

                    {/* CallsChat Business */}
                    <div className="rounded-2xl border border-slate-200 dark:border-[#222D34] bg-slate-50/80 dark:bg-[#182229] p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {releases.business?.appName || "CallsChat Business"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {releases.business
                                        ? `v${releases.business.versionName} (Code ${releases.business.versionCode}) · ${appReleaseService.formatApkFileSize(
                                              releases.business.fileSizeBytes
                                          )} · ${releases.business.minOsVersion || "Android 8.0+"}`
                                        : isLoading
                                        ? "Checking latest release..."
                                        : "APK coming soon"}
                                </p>
                            </div>
                        </div>

                        {releases.business ? (
                            <a
                                href={appReleaseService.getApkDownloadUrl("BUSINESS")}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2.5 shadow-sm transition-colors"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </a>
                        ) : (
                            <span className="shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold px-3 py-2">
                                Unavailable
                            </span>
                        )}
                    </div>
                </div>

                {/* Close Action */}
                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-slate-100 dark:bg-[#202C33] py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-[#2A3942] cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
