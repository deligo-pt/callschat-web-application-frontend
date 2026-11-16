"use client";

import { useState } from "react";
import {
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Send,
    RotateCcw,
    Mail,
    Phone,
    User,
    FileText,
    HelpCircle,
} from "lucide-react";

interface DeletionFormData {
    countryCode: string;
    phone: string;
    fullName: string;
    email: string;
    reason: string;
    additionalNotes: string;
    agreed: boolean;
}

const COMMON_COUNTRY_CODES = [
    { code: "+1", country: "United States / Canada" },
    { code: "+44", country: "United Kingdom" },
    { code: "+351", country: "Portugal" },
    { code: "+880", country: "Bangladesh" },
    { code: "+91", country: "India" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+39", country: "Italy" },
    { code: "+55", country: "Brazil" },
    { code: "+61", country: "Australia" },
    { code: "+971", country: "United Arab Emirates" },
    { code: "+966", country: "Saudi Arabia" },
];

const DELETION_REASONS = [
    "Switching to another device or phone number",
    "Privacy, security, or data handling concerns",
    "Temporary break (I may return in the future)",
    "No longer using the application",
    "Account created by mistake",
    "Other / Prefer not to say",
];

export default function AccountDeletionForm() {
    const [formData, setFormData] = useState<DeletionFormData>({
        countryCode: "+1",
        phone: "",
        fullName: "",
        email: "",
        reason: DELETION_REASONS[0],
        additionalNotes: "",
        agreed: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState<{
        referenceId: string;
        submittedAt: string;
        fullPhone: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const cleanPhone = formData.phone.trim().replace(/\D/g, "");
        if (!cleanPhone || cleanPhone.length < 5) {
            setErrorMessage("Please enter a valid phone number associated with your CallsChat account.");
            return;
        }

        if (!formData.fullName.trim()) {
            setErrorMessage("Please enter your full name or CallsChat display name.");
            return;
        }

        if (!formData.agreed) {
            setErrorMessage("You must acknowledge the account deletion terms and 30-day grace period to proceed.");
            return;
        }

        setIsSubmitting(true);

        // Simulate network processing and secure dispatch
        await new Promise((resolve) => setTimeout(resolve, 800));

        const randomHex = Math.floor(100000 + Math.random() * 900000).toString();
        const referenceId = `REQ-DEL-${Date.now().toString().slice(-4)}-${randomHex}`;
        const fullPhone = `${formData.countryCode} ${cleanPhone}`;

        setSubmittedTicket({
            referenceId,
            submittedAt: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
            fullPhone,
        });

        setIsSubmitting(false);
    };

    const handleReset = () => {
        setSubmittedTicket(null);
        setFormData({
            countryCode: "+1",
            phone: "",
            fullName: "",
            email: "",
            reason: DELETION_REASONS[0],
            additionalNotes: "",
            agreed: false,
        });
        setErrorMessage(null);
    };

    if (submittedTicket) {
        const mailtoSubject = encodeURIComponent(
            `[Deletion Request Verification] Reference: ${submittedTicket.referenceId}`
        );
        const mailtoBody = encodeURIComponent(
            `Hello CallsChat Safety Team,\n\nI have submitted an account deletion request through the web portal.\n\nReference ID: ${submittedTicket.referenceId}\nRegistered Phone: ${submittedTicket.fullPhone}\nName: ${formData.fullName}\nReason: ${formData.reason}\n\nPlease confirm processing of my request.\n\nThank you.`
        );

        return (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 sm:p-10 shadow-lg transition-all">
                <div className="flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-[#00A884] dark:text-[#25D366] flex items-center justify-center mb-5 ring-8 ring-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <span className="text-xs font-bold uppercase tracking-wider text-[#00A884] dark:text-[#25D366]">
                        Request Successfully Logged
                    </span>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#1C1E21] dark:text-[#E9EDEF]">
                        Account Deletion Request Received
                    </h3>
                    <p className="mt-3 text-sm text-[#667781] dark:text-[#8696A0] max-w-lg leading-relaxed">
                        Your request to delete the CallsChat account associated with{" "}
                        <span className="font-semibold text-[#1C1E21] dark:text-white">
                            {submittedTicket.fullPhone}
                        </span>{" "}
                        has been securely recorded by our automated safety pipeline.
                    </p>

                    {/* Reference Card */}
                    <div className="mt-6 w-full max-w-md rounded-2xl border border-emerald-500/25 bg-white dark:bg-[#111B21] p-5 text-left shadow-xs">
                        <div className="flex items-center justify-between text-xs pb-3 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-[#667781] dark:text-[#8696A0]">Reference Ticket ID</span>
                            <span className="font-mono font-bold text-[#00A884] dark:text-[#25D366]">
                                {submittedTicket.referenceId}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-800">
                            <span className="text-[#667781] dark:text-[#8696A0]">Logged Timestamp</span>
                            <span className="font-medium text-[#1C1E21] dark:text-[#E9EDEF]">
                                {submittedTicket.submittedAt}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-3">
                            <span className="text-[#667781] dark:text-[#8696A0]">Grace Period Status</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                <span>30-Day Recovery Window Active</span>
                            </span>
                        </div>
                    </div>

                    {/* Next Steps List */}
                    <div className="mt-6 w-full max-w-md text-left text-xs sm:text-[13px] text-[#667781] dark:text-[#8696A0] space-y-2.5 bg-gray-50 dark:bg-[#1A2730]/60 p-4 rounded-xl border border-gray-200 dark:border-[#2A3942]">
                        <p className="font-semibold text-[#1C1E21] dark:text-white">Next Steps & Policy Notice:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>
                                Your account data is scheduled for permanent purge after 30 calendar days.
                            </li>
                            <li>
                                If you regain device access and log in with this phone number within 30 days, your deletion request will be canceled automatically.
                            </li>
                            <li>
                                A confirmation notification will be dispatched to your registered credentials.
                            </li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                        <a
                            href={`mailto:privacy@callschat.com?subject=${mailtoSubject}&body=${mailtoBody}`}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#00A884] hover:bg-[#00803E] text-white px-5 py-3 text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                            <Mail className="h-4 w-4" />
                            <span>Email Privacy Team Directly</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-[#2A3942] bg-white dark:bg-[#1A2730] px-5 py-3 text-sm font-semibold text-[#1C1E21] dark:text-[#E9EDEF] hover:bg-gray-50 dark:hover:bg-[#202C33] transition-colors cursor-pointer"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span>Submit Another</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 sm:p-10 shadow-sm transition-all"
        >
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100 dark:border-[#222D34]">
                <div className="h-11 w-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                        Submit Account Deletion Request
                    </h3>
                    <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696A0]">
                        Use this form if you have uninstalled CallsChat or cannot access the in-app deletion settings.
                    </p>
                </div>
            </div>

            {errorMessage && (
                <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 p-3.5 text-xs text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="mt-6 space-y-5">
                {/* Phone Number Field with Country Code */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1E21] dark:text-[#E9EDEF] mb-2">
                        Registered Mobile Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative sm:w-48">
                            <select
                                value={formData.countryCode}
                                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                className="w-full appearance-none rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] px-3.5 py-2.5 text-sm text-[#1C1E21] dark:text-white focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
                            >
                                {COMMON_COUNTRY_CODES.map((item) => (
                                    <option key={item.code} value={item.code}>
                                        {item.code} ({item.country})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8696A0]">
                                <Phone className="h-4 w-4" />
                            </div>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. 912 345 678"
                                className="w-full rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] pl-10 pr-4 py-2.5 text-sm text-[#1C1E21] dark:text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
                            />
                        </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#667781] dark:text-[#8696A0]">
                        Enter the phone number used when signing up for CallsChat.
                    </p>
                </div>

                {/* Full Name / CallsChat Display Name */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1E21] dark:text-[#E9EDEF] mb-2">
                        Full Name / CallsChat Display Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8696A0]">
                            <User className="h-4 w-4" />
                        </div>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Your name or CallsChat ID (e.g. John Doe / @johndoe)"
                            className="w-full rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] pl-10 pr-4 py-2.5 text-sm text-[#1C1E21] dark:text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
                        />
                    </div>
                </div>

                {/* Email Address (Optional) */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1E21] dark:text-[#E9EDEF] mb-2">
                        Contact Email <span className="text-xs font-normal text-[#8696A0]">(Optional)</span>
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#8696A0]">
                            <Mail className="h-4 w-4" />
                        </div>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="To receive confirmation and ticket updates (optional)"
                            className="w-full rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] pl-10 pr-4 py-2.5 text-sm text-[#1C1E21] dark:text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
                        />
                    </div>
                </div>

                {/* Reason for Deletion */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1E21] dark:text-[#E9EDEF] mb-2">
                        Primary Reason for Deletion
                    </label>
                    <div className="relative">
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full appearance-none rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] px-4 py-2.5 text-sm text-[#1C1E21] dark:text-white focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884]"
                        >
                            {DELETION_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                    {reason}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Additional Notes (Optional) */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1E21] dark:text-[#E9EDEF] mb-2">
                        Additional Information or Comments <span className="text-xs font-normal text-[#8696A0]">(Optional)</span>
                    </label>
                    <textarea
                        rows={3}
                        value={formData.additionalNotes}
                        onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                        placeholder="Provide any additional context or note if your SIM card is no longer active..."
                        className="w-full rounded-xl border border-gray-300 dark:border-[#2A3942] bg-gray-50 dark:bg-[#1A2730] p-3.5 text-sm text-[#1C1E21] dark:text-white placeholder-[#8696A0] focus:border-[#00A884] focus:outline-none focus:ring-1 focus:ring-[#00A884] resize-none"
                    />
                </div>

                {/* Agreement Checkbox */}
                <div className="rounded-xl border border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/15 p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            required
                            checked={formData.agreed}
                            onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00A884] focus:ring-[#00A884]"
                        />
                        <span className="text-xs sm:text-sm text-[#1C1E21] dark:text-[#E9EDEF] leading-relaxed">
                            <span className="font-semibold text-red-600 dark:text-red-400">Mandatory Acknowledgement:</span>{" "}
                            I confirm that I am the authorized owner of this CallsChat account. I understand that submitting this request initiates account deletion with a 30-day grace period, after which all my profile data, message histories, and encryption keys will be permanently destroyed per CallsChat Privacy Policy.
                        </span>
                    </label>
                </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#222D34] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-[#667781] dark:text-[#8696A0]">
                    <HelpCircle className="h-4 w-4 text-[#00A884]" />
                    <span>Need immediate help? Contact support@callschat.com</span>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-7 py-3 text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? "Logging Request..." : "Submit Deletion Request"}</span>
                </button>
            </div>
        </form>
    );
}
