import type { LegalDocument } from "./types";

// Source: CallsChat_Terms_of_Service_260510_213014.pdf
// Sections 1–15 below are the substantive numbered sections, transcribed
// verbatim. The PDF's section 16 (Contact Information) and 17 (Acceptance)
// are rendered by the layout as the contact card and consent note.
export const termsOfService: LegalDocument = {
    slug: "terms-of-service",
    title: "Terms of Service",
    subtitle: "CallsChat LLC • United States",
    effectiveDate: "[Insert Date]",
    intro:
        "These Terms govern your use of CallsChat — a privacy-first platform to chat, call, and connect using a unique CallsChat ID instead of exposing your personal phone number.",
    sections: [
        {
            id: "about-callschat",
            heading: "About CallsChat",
            body: "CallsChat is a privacy-first communication platform that allows users to chat, call, and connect using a unique CallsChat ID instead of exposing personal phone numbers. Users register using a valid mobile number for authentication and account security purposes. Phone numbers are never publicly displayed to other users.",
        },
        {
            id: "eligibility",
            heading: "Eligibility",
            body: "To use CallsChat, users must be at least 13 years old or the minimum legal age required in their jurisdiction, provide accurate information, and comply with applicable laws.",
        },
        {
            id: "account-registration",
            heading: "Account Registration",
            body: "Users must register with a valid mobile number and are responsible for maintaining account confidentiality and all activities conducted through their account.",
        },
        {
            id: "privacy-and-data-protection",
            heading: "Privacy & Data Protection",
            body: "CallsChat is designed to keep users' phone numbers hidden from other users. Phone numbers are used only for authentication, recovery, security, and legal compliance where required.",
        },
        {
            id: "acceptable-use",
            heading: "Acceptable Use",
            body: "Users may not use CallsChat for harassment, fraud, spam, illegal activity, malware distribution, impersonation, or any abusive or unlawful behavior.",
        },
        {
            id: "user-content-and-communications",
            heading: "User Content & Communications",
            body: "Users are responsible for all messages, calls, media, and content shared through the platform. CallsChat may process content solely for operating and improving the Service.",
        },
        {
            id: "security",
            heading: "Security",
            body: "CallsChat implements commercially reasonable security measures but cannot guarantee absolute protection against unauthorized access or cyber threats.",
        },
        {
            id: "prohibited-conduct",
            heading: "Prohibited Conduct",
            body: "Users may not reverse engineer the platform, use bots without permission, interfere with platform operations, or misuse the service for unlawful purposes.",
        },
        {
            id: "account-suspension-and-termination",
            heading: "Account Suspension & Termination",
            body: "CallsChat may suspend or terminate accounts that violate these Terms, create security risks, or engage in illegal or harmful conduct.",
        },
        {
            id: "intellectual-property",
            heading: "Intellectual Property",
            body: "All software, branding, logos, trademarks, and platform materials are owned by CallsChat LLC or its licensors and may not be copied or distributed without permission.",
        },
        {
            id: "third-party-services",
            heading: "Third-Party Services",
            body: "CallsChat may integrate with third-party services and is not responsible for the content, privacy practices, or operations of external providers.",
        },
        {
            id: "service-availability",
            heading: "Service Availability",
            body: "CallsChat may update, modify, suspend, or discontinue features or services at any time without notice.",
        },
        {
            id: "disclaimer-of-warranties",
            heading: "Disclaimer of Warranties",
            body: "The Service is provided on an 'AS IS' and 'AS AVAILABLE' basis without warranties of any kind.",
        },
        {
            id: "limitation-of-liability",
            heading: "Limitation of Liability",
            body: "CallsChat LLC shall not be liable for indirect damages, loss of profits, data loss, business interruption, or unauthorized access resulting from platform use.",
        },
        {
            id: "governing-law",
            heading: "Governing Law",
            body: "These Terms shall be governed by the laws of the United States and the applicable state jurisdiction where CallsChat LLC is registered.",
        },
    ],
    contact: {
        org: "CallsChat LLC",
        emails: [
            { label: "Email", address: "legal@callschat.com" },
            { label: "Support", address: "support@callschat.com" },
        ],
        website: "callschat.com",
    },
    consent:
        "By using CallsChat, users acknowledge that they have read, understood, and agreed to these Terms of Service.",
};
