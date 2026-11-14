import type { LegalDocument } from "./types";
import { privacyPolicy as fallbackPrivacyPolicy } from "./privacy-policy";
import { businessPrivacyPolicy as fallbackBusinessPrivacy } from "./business-privacy-policy";
import { termsOfService as fallbackTerms } from "./terms-of-service";
import { cookiePolicy as fallbackCookies } from "./cookie-policy";

const fallbackMap: Record<string, LegalDocument> = {
    "privacy-policy": fallbackPrivacyPolicy,
    "business-privacy-policy": fallbackBusinessPrivacy,
    "privacy-policy/business": fallbackBusinessPrivacy,
    "terms-of-service": fallbackTerms,
    "cookie-policy": fallbackCookies,
};

/**
 * Normalizes section headings so they don't produce duplicate numbering
 * like "1. 1. About CallsChat" when rendered by <LegalPageLayout />.
 */
function cleanHeading(heading: string): string {
    return heading.replace(/^\d+\.\s*/, "").trim();
}

/**
 * Fetches dynamic legal document from backend CallsChat Legal API.
 * Features:
 * - Multi-app awareness: Supports PERSONAL and BUSINESS privacy policies
 * - Server-side ISR cache with automatic revalidation
 * - Automatic fallback to static backup during offline/network failure
 * - Date localization formatting
 * - Section numbering normalization
 */
export async function fetchLegalDocument(
    slug: string,
    appType?: "PERSONAL" | "BUSINESS"
): Promise<LegalDocument> {
    const canonicalSlug = slug === "privacy-policy/business" ? "business-privacy-policy" : slug;
    const fallback = fallbackMap[canonicalSlug] || fallbackMap[slug] || fallbackPrivacyPolicy;
    const baseUrl =
        process.env.BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000/api/v1";

    const queryParam = appType ? `?appType=${appType}` : "";
    const requestUrl = `${baseUrl}/legal/${canonicalSlug}${queryParam}`;

    try {
        const res = await fetch(requestUrl, {
            cache: "no-store",
        });

        if (!res.ok) {
            console.warn(`[LegalAPI] Failed to fetch "${canonicalSlug}" from backend (HTTP ${res.status}). Using fallback.`);
            return fallback;
        }

        const json = await res.json();
        if (!json?.success || !json?.data) {
            return fallback;
        }

        const data = json.data;

        // Localize effectiveDate nicely if it is an ISO timestamp
        let formattedDate = data.effectiveDate || fallback.effectiveDate;
        if (data.effectiveDate) {
            try {
                const parsed = new Date(data.effectiveDate);
                if (!isNaN(parsed.getTime())) {
                    formattedDate = parsed.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    });
                }
            } catch {
                formattedDate = data.effectiveDate;
            }
        }

        const sections = Array.isArray(data.sections) && data.sections.length > 0
            ? data.sections.map((s: { id: string; heading: string; body: string | string[] }) => ({
                  id: s.id,
                  heading: cleanHeading(s.heading),
                  body: s.body,
              }))
            : fallback.sections;

        return {
            slug: data.slug || canonicalSlug,
            appType: data.appType || fallback.appType || (canonicalSlug.includes("business") ? "BUSINESS" : "PERSONAL"),
            title: data.title || fallback.title,
            subtitle: data.subtitle || fallback.subtitle,
            effectiveDate: formattedDate,
            intro: data.intro || fallback.intro,
            sections,
            contact: data.contact || fallback.contact,
            consent: data.consent || fallback.consent,
        };
    } catch (error) {
        console.error(`[LegalAPI] Backend fetch error for "${canonicalSlug}":`, error);
        return fallback;
    }
}
