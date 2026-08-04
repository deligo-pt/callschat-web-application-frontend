import type { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { termsOfService } from "@/lib/legal/terms-of-service";

const description =
    "The terms governing your use of CallsChat — eligibility, accounts, acceptable use, and your rights and responsibilities.";

export const metadata: Metadata = {
    title: "Terms of Service | CallsChat",
    description,
    alternates: { canonical: "/terms-of-service" },
    openGraph: {
        title: "Terms of Service | CallsChat",
        description,
        url: "/terms-of-service",
        type: "website",
    },
};

export default function TermsOfServicePage() {
    return <LegalPageLayout data={termsOfService} />;
}
