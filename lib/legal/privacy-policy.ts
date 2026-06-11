import type { LegalDocument } from "./types";

// Source: CallsChat_Enhanced_Privacy_Policy_260510_213821.pdf
// Sections 1–24 below are the substantive numbered sections, transcribed
// verbatim. The PDF's section 25 (Contact Information) and 26 (Consent) are
// rendered by the layout as the contact card and consent note.
export const privacyPolicy: LegalDocument = {
    slug: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "CallsChat LLC • United States",
    effectiveDate: "[Insert Date]",
    intro:
        "CallsChat is a privacy-first communication platform that lets users connect using unique CallsChat IDs instead of publicly exposing personal phone numbers.",
    sections: [
        {
            id: "about-callschat",
            heading: "About CallsChat",
            body: "CallsChat is a privacy-first communication platform that allows users to communicate using unique CallsChat IDs instead of publicly exposing personal phone numbers.",
        },
        {
            id: "information-we-collect",
            heading: "Information We Collect",
            body: "CallsChat may collect account details, mobile numbers, profile information, device information, communication metadata, usage analytics, and technical diagnostics required to operate the platform.",
        },
        {
            id: "how-we-use-information",
            heading: "How We Use Information",
            body: "Information is used to authenticate users, provide messaging and calling services, improve security, prevent abuse, personalize user experience, and maintain platform reliability.",
        },
        {
            id: "phone-number-privacy",
            heading: "Phone Number Privacy",
            body: "Phone numbers are used only for verification, authentication, recovery, security, and legal compliance purposes. CallsChat does not publicly display users' phone numbers.",
        },
        {
            id: "messages-calls-and-media",
            heading: "Messages, Calls & Media",
            body: "CallsChat may process communications and related metadata to provide and improve the Service. Encryption technologies may be used where applicable.",
        },
        {
            id: "contact-access",
            heading: "Contact Access",
            body: "If users grant permission, CallsChat may access contact lists to help identify and connect with other CallsChat users.",
        },
        {
            id: "cookies-and-similar-technologies",
            heading: "Cookies & Similar Technologies",
            body: "CallsChat may use cookies, local storage, and related technologies for authentication, analytics, performance optimization, and security purposes.",
        },
        {
            id: "sharing-of-information",
            heading: "Sharing of Information",
            body: "CallsChat does not sell personal information. Information may be shared with trusted providers or authorities when legally required.",
        },
        {
            id: "data-retention",
            heading: "Data Retention",
            body: "Information may be retained for operational, legal, security, fraud prevention, and compliance purposes.",
        },
        {
            id: "security-measures",
            heading: "Security Measures",
            body: "CallsChat uses commercially reasonable safeguards including encryption, monitoring systems, authentication controls, and secure infrastructure.",
        },
        {
            id: "international-data-transfers",
            heading: "International Data Transfers",
            body: "Information may be processed or stored in the United States or other jurisdictions where CallsChat or its providers operate.",
        },
        {
            id: "user-rights-and-choices",
            heading: "User Rights & Choices",
            body: "Depending on applicable laws, users may have rights to access, correct, delete, restrict, or export personal information.",
        },
        {
            id: "childrens-privacy",
            heading: "Children's Privacy",
            body: "CallsChat is not intended for children under 13 years old or the minimum legal age required in the applicable jurisdiction.",
        },
        {
            id: "third-party-services",
            heading: "Third-Party Services",
            body: "CallsChat may integrate with third-party services and is not responsible for external privacy practices or third-party content.",
        },
        {
            id: "california-privacy-rights-ccpa",
            heading: "California Privacy Rights (CCPA)",
            body: "California residents may have rights to request access, correction, or deletion of personal information under applicable law.",
        },
        {
            id: "gdpr-privacy-rights",
            heading: "GDPR Privacy Rights",
            body: "Users in the European Economic Area and related jurisdictions may exercise privacy rights including access, rectification, erasure, portability, and objection to processing.",
        },
        {
            id: "account-deletion",
            heading: "Account Deletion",
            body: "Users may request account deletion through application settings or by contacting support. Certain information may be retained where legally required.",
        },
        {
            id: "ai-moderation-and-abuse-prevention",
            heading: "AI, Moderation & Abuse Prevention",
            body: "CallsChat may use automated systems and moderation technologies to detect spam, scams, abuse, fraud, and harmful activity.",
        },
        {
            id: "business-communications",
            heading: "Business Communications",
            body: "CallsChat may send service announcements, verification messages, security alerts, support notices, and legal communications.",
        },
        {
            id: "data-breach-notification",
            heading: "Data Breach Notification",
            body: "In the event of a significant security incident, CallsChat may notify affected users and authorities where required by law.",
        },
        {
            id: "biometric-and-sensitive-information",
            heading: "Biometric & Sensitive Information",
            body: "CallsChat does not intentionally collect biometric identifiers or highly sensitive information unless required for specific lawful features.",
        },
        {
            id: "law-enforcement-requests",
            heading: "Law Enforcement Requests",
            body: "CallsChat may review and respond to valid legal requests from authorities when required under applicable law.",
        },
        {
            id: "changes-to-ownership",
            heading: "Changes to Ownership",
            body: "If CallsChat LLC is involved in a merger, acquisition, financing, or restructuring, user information may be transferred subject to legal protections.",
        },
        {
            id: "changes-to-this-privacy-policy",
            heading: "Changes to This Privacy Policy",
            body: "CallsChat may update this Privacy Policy periodically. Continued use of the Service after updates constitutes acceptance of the revised policy.",
        },
    ],
    contact: {
        org: "CallsChat LLC",
        location: "United States",
        emails: [
            { label: "Email", address: "privacy@callschat.com" },
            { label: "Support", address: "support@callschat.com" },
        ],
        website: "callschat.com",
    },
    consent:
        "By using CallsChat, users acknowledge that they have read, understood, and agreed to this Privacy Policy.",
};
