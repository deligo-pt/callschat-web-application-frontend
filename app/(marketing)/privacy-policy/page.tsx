import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { fetchLegalDocument } from "@/lib/legal/legal-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const description =
    "How CallsChat collects, uses, and protects your information. Privacy-first communication using unique CallsChat IDs.";

export const metadata: Metadata = {
    title: "Privacy Policy | CallsChat",
    description,
    alternates: { canonical: "/privacy-policy" },
    openGraph: {
        title: "Privacy Policy | CallsChat",
        description,
        url: "/privacy-policy",
        type: "website",
    },
};

interface PrivacyPolicyPageProps {
    searchParams?: Promise<{ app?: string }>;
}

export default async function PrivacyPolicyPage({ searchParams }: PrivacyPolicyPageProps) {
    const params = await searchParams;
    const isBusiness = params?.app?.toLowerCase() === "business";
    const document = await fetchLegalDocument(
        isBusiness ? "business-privacy-policy" : "privacy-policy",
        isBusiness ? "BUSINESS" : "PERSONAL"
    );
    return <LegalPageLayout data={document} />;
}
