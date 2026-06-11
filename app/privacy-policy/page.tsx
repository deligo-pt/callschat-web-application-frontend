import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { privacyPolicy } from "@/lib/legal/privacy-policy";

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

export default function PrivacyPolicyPage() {
    return <LegalPageLayout data={privacyPolicy} />;
}
