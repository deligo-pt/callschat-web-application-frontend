"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

// Source: CallsChat_FAQ_Complete_260510_215014.pdf — questions and answers
// transcribed verbatim.
const faqs: { question: string; answer: string }[] = [
    {
        question: "What is CallsChat?",
        answer: "CallsChat is a privacy-first communication platform that allows users to chat, call, and connect using unique CallsChat IDs instead of publicly exposing personal phone numbers.",
    },
    {
        question: "How is CallsChat different from other messaging apps?",
        answer: "CallsChat focuses on user privacy by hiding personal phone numbers and enabling communication through unique user IDs rather than public contact numbers.",
    },
    {
        question: "Who owns CallsChat?",
        answer: "CallsChat is owned and operated by CallsChat LLC, a United States-based company.",
    },
    {
        question: "Why do I need a phone number to register?",
        answer: "Phone numbers are used for account verification, authentication, fraud prevention, spam protection, account recovery, and platform security.",
    },
    {
        question: "Can other users see my phone number?",
        answer: "No. CallsChat is designed to keep users' phone numbers private unless users intentionally choose to share them.",
    },
    {
        question: "What is a CallsChat ID?",
        answer: "A CallsChat ID is a unique identifier assigned to every user account that allows users to communicate without exposing personal phone numbers.",
    },
    {
        question: "Can I customize or change my CallsChat ID?",
        answer: "Availability of ID customization or changes may depend on future platform features and platform policies.",
    },
    {
        question: "Is CallsChat free to use?",
        answer: "CallsChat may provide free features as well as optional premium services, subscriptions, or advanced features depending on future platform offerings.",
    },
    {
        question: "Is CallsChat secure?",
        answer: "CallsChat uses commercially reasonable safeguards including authentication systems, encryption technologies, monitoring systems, access controls, and infrastructure protections.",
    },
    {
        question: "Are messages encrypted?",
        answer: "CallsChat may use encryption technologies and secure communication protocols to help protect communications and user information.",
    },
    {
        question: "Does CallsChat sell personal data?",
        answer: "No. CallsChat does not sell users' personal information or phone numbers to advertisers or unrelated third parties.",
    },
    {
        question: "What information does CallsChat collect?",
        answer: "CallsChat may collect account information, mobile numbers, device information, analytics data, security-related data, communication metadata, and technical diagnostics necessary to operate and secure the platform.",
    },
    {
        question: "Can CallsChat monitor suspicious activity?",
        answer: "Yes. CallsChat may use automated systems, AI technologies, moderation systems, and monitoring tools to detect spam, scams, fraud, abuse, and suspicious activity.",
    },
    {
        question: "Can I make voice or video calls?",
        answer: "CallsChat may support voice calls, video calls, and other communication features depending on platform availability and updates.",
    },
    {
        question: "Can I send photos, videos, or documents?",
        answer: "CallsChat may support media sharing including photos, videos, audio files, documents, and other supported content formats.",
    },
    {
        question: "Can I create group chats?",
        answer: "Yes. CallsChat may provide group communication features depending on the platform version and available features.",
    },
    {
        question: "Can I block or report users?",
        answer: "Yes. CallsChat may provide tools to block, mute, report, or restrict unwanted users and suspicious communications.",
    },
    {
        question: "What devices support CallsChat?",
        answer: "CallsChat may support Android devices, iOS devices, desktop platforms, tablets, and web browsers depending on platform releases.",
    },
    {
        question: "Does CallsChat work internationally?",
        answer: "Yes. CallsChat may be available internationally where legally permitted and technically supported.",
    },
    {
        question: "Does CallsChat require internet access?",
        answer: "Yes. CallsChat requires an active internet connection through mobile data, Wi-Fi, or supported network services.",
    },
    {
        question: "Why am I not receiving verification codes?",
        answer: "Possible reasons may include network problems, incorrect numbers, temporary delays, carrier restrictions, spam filtering, or platform security checks.",
    },
    {
        question: "How do I recover my account?",
        answer: "Account recovery options may include phone verification, device recognition systems, authentication procedures, and support assistance where applicable.",
    },
    {
        question: "How do I delete my account?",
        answer: "Users may request account deletion through application settings, account management features, or by contacting support.",
    },
    {
        question: "Can my account be suspended or terminated?",
        answer: "Yes. CallsChat may suspend or terminate accounts involved in spam, fraud, abuse, illegal activity, scams, impersonation, or violations of platform policies.",
    },
    {
        question: "What happens if I lose my phone?",
        answer: "Users should secure their SIM cards, protect verification codes, contact support if necessary, and use account recovery procedures.",
    },
    {
        question: "Does CallsChat use cookies or tracking technologies?",
        answer: "CallsChat may use cookies, device identifiers, SDKs, analytics systems, and security technologies to improve functionality, security, and platform performance.",
    },
    {
        question: "Where is user data stored?",
        answer: "User data may be processed or stored in the United States or other jurisdictions where CallsChat or its service providers operate.",
    },
    {
        question: "Does CallsChat comply with privacy laws?",
        answer: "CallsChat aims to comply with applicable privacy, security, and consumer protection laws where required.",
    },
    {
        question: "Does CallsChat respond to legal requests?",
        answer: "CallsChat may respond to valid legal requests, court orders, or government requests where legally required.",
    },
    {
        question: "Can CallsChat update its policies?",
        answer: "Yes. CallsChat may update its Terms of Service, Privacy Policy, Cookie Policy, Security Statement, or platform rules periodically.",
    },
    {
        question: "How can I report security issues?",
        answer: "Users may report vulnerabilities, suspicious activity, scams, fraud, account compromise, or security concerns through official support or security channels.",
    },
    {
        question: "How can I contact CallsChat support?",
        answer: "Support Email: support@callschat.com · Privacy Team: privacy@callschat.com · Security Team: security@callschat.com · Website: callschat.com",
    },
];

export default function Faq() {
    const prefersReducedMotion = useReducedMotion();
    const baseId = useId();
    // Single-open accordion: first item expanded by default.
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggle = (index: number) =>
        setOpenIndex((prev) => (prev === index ? null : index));

    const headerReveal = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
    };

    return (
        <section
            id="faq"
            className="w-full bg-[#F8FAFF] px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16"
        >
            <div className="container mx-auto max-w-3xl">
                {/* Section header */}
                <motion.div
                    className="mb-12 text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={headerReveal}
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                        <HelpCircle className="h-3.5 w-3.5" />
                        FAQ
                    </span>
                    <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-snug text-gray-500/90">
                        Everything you need to know about CallsChat — privacy, security, accounts, and more.
                    </p>
                </motion.div>

                {/* Accordion — bounded height with internal scroll to keep the
                    section compact even with many questions. */}
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-h-[34rem] space-y-3 overflow-y-auto rounded-2xl pr-1.5"
                >
                    {faqs.map((item, index) => {
                        const isOpen = openIndex === index;
                        const panelId = `${baseId}-panel-${index}`;
                        const buttonId = `${baseId}-button-${index}`;
                        return (
                            <div
                                key={index}
                                className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                                    isOpen ? "border-primary/30" : "border-gray-100"
                                }`}
                            >
                                <h3>
                                    <button
                                        id={buttonId}
                                        type="button"
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        onClick={() => toggle(index)}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                                    >
                                        <span className="text-[15px] font-semibold text-[#102A63]">
                                            {item.question}
                                        </span>
                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </h3>
                                {/* Panel stays mounted (height-animated) so all
                                    answers remain in the DOM for SEO + screen readers. */}
                                <motion.div
                                    id={panelId}
                                    role="region"
                                    aria-labelledby={buttonId}
                                    initial={false}
                                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                                    transition={{
                                        duration: prefersReducedMotion ? 0 : 0.28,
                                        ease: "easeOut",
                                    }}
                                    className="overflow-hidden"
                                >
                                    <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500">
                                        {item.answer}
                                    </p>
                                </motion.div>
                            </div>
                        );
                    })}
                </motion.div>

                {/* Closing notice (FAQ "Final Notice") */}
                <p className="mx-auto mt-6 max-w-2xl text-center text-xs italic leading-relaxed text-gray-400">
                    CallsChat continuously works to improve privacy, platform safety, communication
                    technologies, and security systems. However, no online platform can guarantee
                    absolute security or uninterrupted service.
                </p>
            </div>
        </section>
    );
}
