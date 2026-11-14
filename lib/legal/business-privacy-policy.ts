import type { LegalDocument } from "./types";

export const businessPrivacyPolicy: LegalDocument = {
    slug: "business-privacy-policy",
    appType: "BUSINESS",
    title: "Business Privacy Policy",
    subtitle: "CallsChat LLC • Business & Corporate Solutions • United States",
    effectiveDate: "January 1, 2026",
    intro:
        "CallsChat Business provides professional communication, corporate workspaces, and merchant solutions designed for enterprises, teams, and customer engagement while maintaining rigorous data protection standards.",
    sections: [
        {
            id: "about-callschat-business",
            heading: "About CallsChat Business",
            body: "CallsChat Business allows companies, merchants, and professional organizations to manage corporate communications, publish verified business profiles, interact with customers, and collaborate within isolated team workspaces.",
        },
        {
            id: "roles-controller-processor",
            heading: "Roles: Data Controller vs. Data Processor",
            body: "For corporate workspace data, customer message logs, and member directory records, the subscribing Business Organization acts as the Data Controller. CallsChat acts as the Data Processor / Service Provider, processing corporate data exclusively under the organization's instructions and terms.",
        },
        {
            id: "workspaces-governance",
            heading: "Corporate Workspaces & Team Governance",
            body: "Workspaces are strictly isolated organizational containers. Workspace Owners and Administrators maintain oversight over workspace channels, member roles (Owner, Admin, Member, Agent), audit logs, and enterprise message histories.",
        },
        {
            id: "business-profiles-catalog",
            heading: "Business Profiles & Public Catalog",
            body: "Information designated as public by your organization—such as verified business name, corporate email, official telephone, operating hours, website, and product catalog items—is visible to customers and search directories.",
        },
        {
            id: "customer-communications",
            heading: "Customer Communications & Support",
            body: "When customers communicate with a Business account, messages, media, and interaction history are processed within the business workspace to enable order fulfillment, customer support, and CRM workflows.",
        },
        {
            id: "team-member-privacy",
            heading: "Personal Privacy Safeguards for Team Members",
            body: "The personal phone numbers of individual employees and workspace agents are never exposed to customers. All customer interactions occur under the corporate brand identity or agent pseudonym.",
        },
        {
            id: "audit-logging",
            heading: "Audit Logging & Compliance Trails",
            body: "To fulfill enterprise compliance standards, CallsChat Business maintains immutable audit trails of workspace logins, permission modifications, role changes, verification requests, and administrative actions.",
        },
        {
            id: "third-party-integrations",
            heading: "Third-Party Integrations & APIs",
            body: "Organizations may connect authorized third-party services, CRM systems, webhooks, and automation bots. The collection and use of data by third-party integrations is governed by the respective provider's terms.",
        },
        {
            id: "security-access-controls",
            heading: "Security, Access Controls & Session Isolation",
            body: "CallsChat Business enforces enterprise security standards including role-based access control (RBAC), multi-factor authentication, session isolation, and remote session revocation for lost or decommissioned devices.",
        },
        {
            id: "data-retention-termination",
            heading: "Data Retention & Workspace Termination",
            body: "Organizations configure message retention and archival policies according to their legal requirements. Upon workspace termination, corporate data is decommissioned and deleted according to the Business Agreement.",
        },
        {
            id: "regulatory-compliance",
            heading: "Regulatory Compliance (GDPR & CCPA)",
            body: "CallsChat complies with GDPR Article 28 data processing obligations and provides standard contractual clauses (SCCs) and Data Processing Addendums (DPAs) for corporate customers operating in regulated markets.",
        },
        {
            id: "contact-business-compliance",
            heading: "Contact Information for Business Compliance",
            body: "For enterprise compliance, DPA execution, or business privacy inquiries, organizations can contact our dedicated corporate legal desk at business-privacy@callschat.com.",
        },
    ],
    contact: {
        org: "CallsChat Business Solutions LLC",
        location: "United States",
        emails: [
            { label: "Business Privacy", address: "business-privacy@callschat.com" },
            { label: "Corporate Compliance", address: "compliance@callschat.com" },
            { label: "Enterprise Support", address: "business-support@callschat.com" },
        ],
        website: "callschat.com/business",
    },
    consent:
        "By accessing or operating a CallsChat Business Workspace, the organization agrees to this Business Privacy Policy.",
};
