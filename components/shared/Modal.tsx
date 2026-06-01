"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export default function Modal({ isOpen, onClose, title = "Web App Coming Soon!" }: ModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open : boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-md rounded-2xl bg-background p-8 text-center shadow-2xl border border-background/80 gap-0">

                {/* Brand/Notification Icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background">
                    <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>

                {/* Header containing Title and Description for Screen Readers */}
                <DialogHeader className="space-y-0 text-center">
                    <DialogTitle className="text-2xl font-bold text-[#102A63] tracking-normal">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="mt-3 text-sm leading-relaxed text-gray-500 text-center">
                        We are putting the finishing touches on our secure desktop web client.
                        Experience seamless, cross-platform communication with end-to-end encryption very soon!
                    </DialogDescription>
                </DialogHeader>

                {/* Action Button */}
                <div className="mt-6">
                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-background transition-all hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Got it, thanks!
                    </button>
                </div>

            </DialogContent>
        </Dialog>
    );
}