import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { cookiePolicy } from "@/lib/legal/cookie-policy";

const description =
    "The cookies and tracking technologies CallsChat uses for authentication, security, analytics, and performance.";

export const metadata: Metadata = {
    title: "Cookie Policy | CallsChat",
    description,
    alternates: { canonical: "/cookie-policy" },
    openGraph: {
        title: "Cookie Policy | CallsChat",
        description,
        url: "/cookie-policy",
        type: "website",
    },
};

export default function CookiePolicyPage() {
    return <LegalPageLayout data={cookiePolicy} />;
}
