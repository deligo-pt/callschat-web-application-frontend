import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { fetchLegalDocument } from "@/lib/legal/legal-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const description =
    "How CallsChat Business manages enterprise workspaces, team governance, merchant data, and customer privacy compliance.";

export const metadata: Metadata = {
    title: "Business Privacy Policy | CallsChat Business",
    description,
    alternates: { canonical: "/privacy-policy/business" },
    openGraph: {
        title: "Business Privacy Policy | CallsChat Business",
        description,
        url: "/privacy-policy/business",
        type: "website",
    },
};

export default async function BusinessPrivacyPolicyPage() {
    const document = await fetchLegalDocument("business-privacy-policy", "BUSINESS");
    return <LegalPageLayout data={document} />;
}
