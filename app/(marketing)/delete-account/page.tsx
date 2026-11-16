import type { Metadata } from "next";
import Link from "next/link";
import {
    ShieldCheck,
    Smartphone,
    Globe,
    Trash2,
    Clock,
    Lock,
    FileCheck,
    ExternalLink,
    HelpCircle,
    ArrowRight,
    AlertCircle,
    Database,
    CheckCircle2,
    Shield,
} from "lucide-react";
import AccountDeletionForm from "@/components/legal/AccountDeletionForm";

const description =
    "Request account deletion and permanent data erasure for CallsChat. Compliant with Google Play Store Data Safety policy, GDPR Right to Erasure, and CCPA standards.";

export const metadata: Metadata = {
    title: "Delete Your CallsChat Account | Privacy & Data Safety",
    description,
    alternates: { canonical: "/delete-account" },
    openGraph: {
        title: "Delete Your CallsChat Account | CallsChat Data Safety",
        description,
        url: "/delete-account",
        type: "website",
    },
};

export default function DeleteAccountPublicPage() {
    return (
        <div className="w-full min-h-screen bg-white dark:bg-[#0C1317] text-[#1C1E21] dark:text-[#E9EDEF] transition-colors duration-200">
            {/* ── Hero Section ────────────────────────────────────────────── */}
            <section className="relative w-full border-b border-[#E2E8F0] dark:border-[#222D34] bg-linear-to-b from-[#F0FDF4] via-emerald-50/20 to-white dark:from-[#111B21] dark:via-[#0E171C] dark:to-[#0C1317] px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
                <div className="container mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00A884]/25 bg-[#00A884]/10 dark:bg-[#00A884]/20 px-3.5 py-1 text-xs font-semibold text-[#00803E] dark:text-[#25D366] shadow-2xs">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>CallsChat Data Safety & Policy Compliance</span>
                    </div>

                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1C1E21] dark:text-[#E9EDEF] sm:text-5xl lg:text-[46px]">
                        Delete Your CallsChat Account
                    </h1>

                    <p className="mt-4 text-base sm:text-lg text-[#667781] dark:text-[#8696A0] max-w-2xl mx-auto leading-relaxed">
                        We believe you should have complete control over your personal data. Learn how to initiate account deletion, what information is permanently erased, and our 30-day grace period policy.
                    </p>

                    {/* Quick navigation anchor pills */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold">
                        <a
                            href="#in-app"
                            className="rounded-full border border-gray-200 dark:border-[#2A3942] bg-white dark:bg-[#1A2730] px-4 py-2 text-[#1C1E21] dark:text-[#E9EDEF] hover:border-[#00A884] dark:hover:border-[#25D366] transition-colors shadow-2xs"
                        >
                            In-App Steps
                        </a>
                        <a
                            href="#retention-policy"
                            className="rounded-full border border-gray-200 dark:border-[#2A3942] bg-white dark:bg-[#1A2730] px-4 py-2 text-[#1C1E21] dark:text-[#E9EDEF] hover:border-[#00A884] dark:hover:border-[#25D366] transition-colors shadow-2xs"
                        >
                            Data Purge Scope
                        </a>
                        <a
                            href="#web-request-form"
                            className="rounded-full bg-[#00A884] hover:bg-[#00803E] text-white px-4 py-2 transition-colors shadow-2xs"
                        >
                            Submit Web Request
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Main Body Container ─────────────────────────────────────── */}
            <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">

                {/* ── Fast-Track Card for Active Users ─────────────────────── */}
                <div className="rounded-3xl border border-[#00A884]/30 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-[#00A884]/20 dark:via-[#111B21] dark:to-[#111B21] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#25D366]">
                            <Smartphone className="h-4 w-4" />
                            <span>Still have access to your account?</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#1C1E21] dark:text-white">
                            Fast-Track In-App Account Deletion
                        </h2>
                        <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696A0] max-w-xl">
                            If you still have the CallsChat mobile or web app installed, you can authenticate and delete your account immediately without submitting a manual web ticket.
                        </p>
                    </div>

                    <Link
                        href="/profile/delete-account"
                        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#00A884] hover:bg-[#00803E] text-white px-5 py-3 text-sm font-bold shadow-xs transition-transform duration-200 active:scale-95"
                    >
                        <span>Open In-App Deletion</span>
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* ── Section 1: How to Delete Your Account (2 Pathways) ─── */}
                <section id="in-app" className="space-y-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#25D366]">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Google Play Store Compliance</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E21] dark:text-[#E9EDEF]">
                            How to Request Account Deletion
                        </h2>
                        <p className="text-sm text-[#667781] dark:text-[#8696A0] max-w-2xl leading-relaxed">
                            CallsChat provides two official methods to delete your account and associated personal data, fully satisfying Google Play&apos;s App Account Deletion policy:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Option 1: In-App */}
                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-[#00A884] dark:text-[#25D366] flex items-center justify-center mb-4">
                                    <Smartphone className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold text-[#00803E] dark:text-[#25D366] uppercase tracking-wider">
                                    Method 1 • Instant & Recommended
                                </span>
                                <h3 className="mt-1 text-lg font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                                    Through CallsChat Mobile / Web App
                                </h3>
                                <ol className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-[#667781] dark:text-[#8696A0]">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">1.</span>
                                        <span>Open CallsChat and tap your <strong>Profile avatar</strong> (bottom-right).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">2.</span>
                                        <span>Go to <strong>Settings & Privacy</strong> &gt; <strong>Delete Account</strong>.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">3.</span>
                                        <span>Select your departure reason and confirm. Your account will immediately enter the 30-day grace period.</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#222D34]">
                                <span className="text-[11px] text-[#00803E] dark:text-[#25D366] font-semibold">
                                    ✓ Instant verification with no manual review needed.
                                </span>
                            </div>
                        </div>

                        {/* Option 2: Public Web Form */}
                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-6 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    Method 2 • For Lost Devices / Uninstalled Apps
                                </span>
                                <h3 className="mt-1 text-lg font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                                    Through the Public Web Form Below
                                </h3>
                                <ol className="mt-4 space-y-2.5 text-xs sm:text-[13px] text-[#667781] dark:text-[#8696A0]">
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">1.</span>
                                        <span>Fill out the <strong>Account Deletion Request Form</strong> on this page.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">2.</span>
                                        <span>Provide your registered phone number, country code, and name.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-bold text-[#1C1E21] dark:text-white">3.</span>
                                        <span>Our Trust & Safety system registers your request and activates the 30-day deletion schedule.</span>
                                    </li>
                                </ol>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-[#222D34]">
                                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                                    ✓ Ideal if you no longer have access to your mobile phone.
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Section 2: Data Scope Disclosure (Google Play Mandatory) ─ */}
                <section id="retention-policy" className="space-y-6 pt-6 border-t border-gray-200 dark:border-[#222D34]">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                            <Database className="h-4 w-4" />
                            <span>Data Safety Transparency</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E21] dark:text-[#E9EDEF]">
                            What Data Is Deleted vs. Retained
                        </h2>
                        <p className="text-sm text-[#667781] dark:text-[#8696A0] max-w-2xl leading-relaxed">
                            Under Google Play Store policies, GDPR (Article 17), and CCPA, we provide clear disclosures regarding the categories of personal data affected upon deletion:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* What is Permanently Deleted */}
                        <div className="rounded-2xl border border-red-500/25 bg-red-50/20 dark:bg-red-950/10 p-6 space-y-4">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <Trash2 className="h-5 w-5" />
                                <h3 className="text-base font-bold">Permanently Erased Data</h3>
                            </div>
                            <ul className="space-y-2 text-xs sm:text-[13px] text-[#667781] dark:text-[#8696A0]">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span><strong>Profile Identity:</strong> Avatar image, display name, bio, CallsChat ID, and phone number association.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span><strong>Encrypted Messages:</strong> End-to-end encrypted message stores, voice notes, photos, and file attachments.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span><strong>Call Logs & History:</strong> Records of outgoing and incoming voice and video calls.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span><strong>Communities & Groups:</strong> Group memberships, room moderator statuses, and channels.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    <span><strong>Cryptographic Keys & Sessions:</strong> Signal Protocol pre-keys, active refresh tokens, and device session keys.</span>
                                </li>
                            </ul>
                        </div>

                        {/* What is Retained & Why */}
                        <div className="rounded-2xl border border-amber-500/25 bg-amber-50/20 dark:bg-amber-950/10 p-6 space-y-4">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                                <h3 className="text-base font-bold">Data Retained & Retention Timelines</h3>
                            </div>
                            <ul className="space-y-2 text-xs sm:text-[13px] text-[#667781] dark:text-[#8696A0]">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span><strong>30-Day Recovery Grace Period:</strong> Account data is immediately hidden from other users, but securely held in a dormant state for 30 calendar days to prevent accidental loss. Logging in during this window cancels deletion.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span><strong>Statutory Financial Records:</strong> Anonymized purchase receipts (e.g. Diamond tokens) are retained for statutory tax and financial reporting periods as mandated by applicable law.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span><strong>Abuse & Security Hashes:</strong> One-way cryptographic hashes of banned bad actors are retained solely to enforce safety bans and prevent repeat abuse.</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Link to Full Privacy Policy */}
                    <div className="rounded-xl border border-gray-200 dark:border-[#2A3942] bg-gray-50 dark:bg-[#111B21] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-[#667781] dark:text-[#8696A0]">
                            <FileCheck className="h-4 w-4 text-[#00A884]" />
                            <span>Read our full legal disclosures in the CallsChat Privacy Policy.</span>
                        </div>
                        <Link
                            href="/privacy-policy#account-deletion"
                            className="inline-flex items-center gap-1 font-bold text-[#00A884] dark:text-[#25D366] hover:underline"
                        >
                            <span>Privacy Policy § Account Deletion</span>
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </section>

                {/* ── Section 3: The Public Request Form ───────────────────── */}
                <section id="web-request-form" className="space-y-6 pt-6 border-t border-gray-200 dark:border-[#222D34]">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00803E] dark:text-[#25D366]">
                            <Shield className="h-4 w-4" />
                            <span>Public Erasure Portal</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E21] dark:text-[#E9EDEF]">
                            Submit Your Deletion Request
                        </h2>
                        <p className="text-sm text-[#667781] dark:text-[#8696A0] max-w-2xl leading-relaxed">
                            If you cannot access the app, complete the secure form below. Once submitted, our Trust &amp; Safety system registers your account for 30-day grace period erasure.
                        </p>
                    </div>

                    <AccountDeletionForm />
                </section>

                {/* ── Section 4: Frequently Asked Questions (FAQ) ─────────── */}
                <section className="space-y-6 pt-6 border-t border-gray-200 dark:border-[#222D34]">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#667781] dark:text-[#8696A0]">
                            <HelpCircle className="h-4 w-4 text-[#00A884]" />
                            <span>Common Questions</span>
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1E21] dark:text-[#E9EDEF]">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-5 space-y-2">
                            <h3 className="text-sm font-bold text-[#1C1E21] dark:text-white">
                                Can I cancel my account deletion request?
                            </h3>
                            <p className="text-xs text-[#667781] dark:text-[#8696A0] leading-relaxed">
                                Yes. CallsChat grants a 30-day grace period. If you change your mind, simply log in to your CallsChat app or web portal within 30 days and your deletion will be immediately cancelled.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-5 space-y-2">
                            <h3 className="text-sm font-bold text-[#1C1E21] dark:text-white">
                                What happens to my unique CallsChat ID?
                            </h3>
                            <p className="text-xs text-[#667781] dark:text-[#8696A0] leading-relaxed">
                                After the 30-day grace period expires, your CallsChat ID is detached from your account. In accordance with platform policy, inactive IDs may be recycled or permanently retired.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-5 space-y-2">
                            <h3 className="text-sm font-bold text-[#1C1E21] dark:text-white">
                                What if I no longer have access to my SIM card?
                            </h3>
                            <p className="text-xs text-[#667781] dark:text-[#8696A0] leading-relaxed">
                                Submit the web form with your registered phone number, and contact privacy@callschat.com directly with supplementary identity verification details so our team can securely assist you.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-white dark:bg-[#111B21] p-5 space-y-2">
                            <h3 className="text-sm font-bold text-[#1C1E21] dark:text-white">
                                Will my messages be deleted from other people&apos;s phones?
                            </h3>
                            <p className="text-xs text-[#667781] dark:text-[#8696A0] leading-relaxed">
                                CallsChat deletes your account and server-side encrypted mailboxes. However, messages that were already delivered to other users&apos; devices locally will remain on their devices unless you manually deleted them prior to closing your account.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Section 5: Direct Support Contact ───────────────────── */}
                <section className="rounded-2xl border border-gray-200 dark:border-[#222D34] bg-gray-50 dark:bg-[#111B21] p-6 sm:p-8 text-center space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-full bg-[#00A884]/15 text-[#00A884] dark:text-[#25D366] flex items-center justify-center">
                        <Lock className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1C1E21] dark:text-white">
                        CallsChat Trust, Safety &amp; Legal Affairs
                    </h3>
                    <p className="text-xs sm:text-sm text-[#667781] dark:text-[#8696A0] max-w-md mx-auto">
                        For questions regarding GDPR, CCPA, or Google Play Data Safety compliance, reach out directly to our privacy compliance officers:
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
                        <a
                            href="mailto:privacy@callschat.com"
                            className="rounded-full border border-gray-300 dark:border-[#2A3942] bg-white dark:bg-[#1A2730] px-4 py-2 text-[#00803E] dark:text-[#25D366] hover:underline"
                        >
                            privacy@callschat.com
                        </a>
                        <a
                            href="mailto:support@callschat.com"
                            className="rounded-full border border-gray-300 dark:border-[#2A3942] bg-white dark:bg-[#1A2730] px-4 py-2 text-[#1C1E21] dark:text-[#E9EDEF] hover:underline"
                        >
                            support@callschat.com
                        </a>
                    </div>
                </section>

            </main>
        </div>
    );
}
