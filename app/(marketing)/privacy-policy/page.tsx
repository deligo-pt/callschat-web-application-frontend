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

export default async function PrivacyPolicyPage() {
    const document = await fetchLegalDocument("privacy-policy");
    return <LegalPageLayout data={document} />;
}
