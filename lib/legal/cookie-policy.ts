import type { LegalDocument } from "./types";

// Source: CallsChat_Enhanced_Cookie_Policy_260510_214502.pdf
// Sections 1–21 below are the substantive numbered sections, transcribed
// verbatim. The PDF's section 22 (Contact Information) and 23 (Consent) are
// rendered by the layout as the contact card and consent note.
export const cookiePolicy: LegalDocument = {
    slug: "cookie-policy",
    title: "Cookie Policy",
    subtitle: "CallsChat LLC • United States",
    effectiveDate: "[Insert Date]",
    intro:
        "This Cookie Policy explains the cookies and tracking technologies CallsChat uses to authenticate users, improve security, and optimize platform performance.",
    sections: [
        {
            id: "what-are-cookies",
            heading: "What Are Cookies?",
            body: "Cookies are small data files and tracking technologies stored on devices to authenticate users, improve security, maintain sessions, personalize settings, and optimize application performance.",
        },
        {
            id: "technologies-used-by-callschat",
            heading: "Technologies Used by CallsChat",
            body: "CallsChat may use cookies, local storage, web beacons, mobile SDKs, pixels, session tokens, device identifiers, analytics tools, and server-side technologies.",
        },
        {
            id: "why-callschat-uses-cookies",
            heading: "Why CallsChat Uses Cookies",
            body: "These technologies help provide authentication, fraud prevention, spam detection, analytics, diagnostics, infrastructure monitoring, personalization, and legal compliance.",
        },
        {
            id: "strictly-necessary-cookies",
            heading: "Strictly Necessary Cookies",
            body: "Necessary technologies support account login, session management, security verification, load balancing, and core platform functionality.",
        },
        {
            id: "functional-cookies",
            heading: "Functional Cookies",
            body: "Functional technologies may remember language preferences, accessibility settings, notification choices, and interface customizations.",
        },
        {
            id: "analytics-and-performance-technologies",
            heading: "Analytics & Performance Technologies",
            body: "CallsChat may use analytics systems to monitor feature usage, engagement, app performance, crash reports, diagnostics, and reliability improvements.",
        },
        {
            id: "security-and-fraud-prevention",
            heading: "Security & Fraud Prevention",
            body: "Security systems may detect suspicious activity, prevent scams, identify bots, monitor abuse, protect infrastructure, and prevent unauthorized access.",
        },
        {
            id: "advertising-and-marketing-technologies",
            heading: "Advertising & Marketing Technologies",
            body: "Limited marketing technologies may be used for campaign measurement, promotional analytics, and service-related announcements in compliance with applicable law.",
        },
        {
            id: "third-party-providers",
            heading: "Third-Party Providers",
            body: "CallsChat may work with trusted cloud hosting providers, analytics providers, security services, infrastructure vendors, and support platforms.",
        },
        {
            id: "mobile-sdks-and-device-technologies",
            heading: "Mobile SDKs & Device Technologies",
            body: "Mobile applications may use SDKs, push notification tokens, operating system identifiers, crash reporting tools, and app analytics technologies.",
        },
        {
            id: "ip-addresses-and-log-information",
            heading: "IP Addresses & Log Information",
            body: "CallsChat may automatically collect IP addresses, browser types, operating systems, connection information, timestamps, and session diagnostics.",
        },
        {
            id: "data-retention",
            heading: "Data Retention",
            body: "Cookie-related data may be retained based on operational, legal, analytics, security, and compliance requirements.",
        },
        {
            id: "managing-cookies",
            heading: "Managing Cookies",
            body: "Users may manage or disable cookies through browser settings, device settings, operating system controls, or application permissions.",
        },
        {
            id: "do-not-track-signals",
            heading: "Do Not Track Signals",
            body: "Because there is no universal standard for Do Not Track requests, CallsChat may not consistently respond to browser DNT signals.",
        },
        {
            id: "international-data-transfers",
            heading: "International Data Transfers",
            body: "Information collected through cookies may be processed or stored in the United States or other jurisdictions where CallsChat or its providers operate.",
        },
        {
            id: "gdpr-privacy-rights",
            heading: "GDPR Privacy Rights",
            body: "Users located in the EEA, UK, or similar jurisdictions may have rights including access, correction, deletion, portability, and restriction of processing.",
        },
        {
            id: "california-privacy-rights-ccpa",
            heading: "California Privacy Rights (CCPA)",
            body: "California residents may request access, correction, or deletion of personal information under applicable privacy laws.",
        },
        {
            id: "childrens-privacy",
            heading: "Children's Privacy",
            body: "CallsChat does not knowingly use tracking technologies to collect personal information from children under 13 without appropriate authorization.",
        },
        {
            id: "data-security",
            heading: "Data Security",
            body: "CallsChat uses commercially reasonable safeguards including encryption, monitoring systems, authentication technologies, and infrastructure protections.",
        },
        {
            id: "legal-compliance",
            heading: "Legal Compliance",
            body: "CallsChat may disclose information when legally required to comply with laws, protect users, enforce policies, or defend legal rights.",
        },
        {
            id: "changes-to-this-cookie-policy",
            heading: "Changes to This Cookie Policy",
            body: "CallsChat may update this Cookie Policy periodically. Continued use of the Service after updates constitutes acceptance of the revised policy.",
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
        "By using CallsChat, users acknowledge that they have read, understood, and agreed to this Cookie Policy.",
};
