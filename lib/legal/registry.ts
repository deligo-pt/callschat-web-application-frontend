// Lightweight registry of the legal pages. Used for cross-linking between
// policies (the "See also" row at the bottom of each page). Kept separate from
// the full document data so the layout can list siblings without importing all
// three (potentially large) content files.

export interface LegalPageRef {
    slug: string;
    title: string;
    category?: "personal" | "business" | "general";
}

export const legalPages: LegalPageRef[] = [
    { slug: "privacy-policy", title: "Personal Privacy Policy", category: "personal" },
    { slug: "privacy-policy/business", title: "Business Privacy Policy", category: "business" },
    { slug: "terms-of-service", title: "Terms of Service", category: "general" },
    { slug: "cookie-policy", title: "Cookie Policy", category: "general" },
];
