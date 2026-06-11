import type { Metadata } from "next";
import MediaGallery from "@/components/media/MediaGallery";

const description =
    "Watch CallsChat brand films and product stories — see private, intelligent, privacy-first communication in motion.";

export const metadata: Metadata = {
    title: "Media | CallsChat",
    description,
    alternates: { canonical: "/media" },
    openGraph: {
        title: "Media | CallsChat",
        description,
        url: "/media",
        type: "website",
    },
};

export default function MediaPage() {
    return <MediaGallery />;
}
