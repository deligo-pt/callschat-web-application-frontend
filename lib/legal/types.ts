// Shared content model for the CallsChat legal / policy pages.
// Each policy (Privacy, Terms, Cookie) is described by a single LegalDocument
// object, which the shared <LegalPageLayout /> renders. This keeps all three
// pages structurally identical and the page files thin (data-only).

/** A single numbered section of a policy document. */
export interface LegalSection {
    /** Stable slug used for the anchor id + Table of Contents link. */
    id: string;
    /** Section heading, e.g. "Privacy & Data Protection". */
    heading: string;
    /** One or more paragraphs. Use an array for multi-paragraph sections. */
    body: string | string[];
}

/** A labelled email address shown in the contact card (renders as a mailto link). */
export interface LegalContactEmail {
    label: string;
    address: string;
}

/** The "Contact Information" block that closes each policy. */
export interface LegalContact {
    /** Legal entity name, e.g. "CallsChat LLC". */
    org: string;
    /** Optional jurisdiction line, e.g. "United States". */
    location?: string;
    emails: LegalContactEmail[];
    /** Plain website label, e.g. "callschat.com". */
    website?: string;
}

/** A complete legal document rendered by <LegalPageLayout />. */
export interface LegalDocument {
    /** Route segment, e.g. "privacy-policy" (matches app/<slug>/). */
    slug: string;
    /** Display title, e.g. "Privacy Policy". */
    title: string;
    /** Sub-line under the title, e.g. "CallsChat LLC • United States". */
    subtitle: string;
    /** Effective / last-updated value shown in the header pill. */
    effectiveDate: string;
    /** Short intro sentence shown in the header band. */
    intro: string;
    /** Ordered policy sections. */
    sections: LegalSection[];
    /** Closing contact block. */
    contact: LegalContact;
    /** Closing consent / acceptance sentence. */
    consent: string;
}
