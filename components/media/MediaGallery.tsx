"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Film, PlayCircle } from "lucide-react";

type Orientation = "landscape" | "portrait";

interface MediaItem {
    src: string;
    title: string;
    description: string;
    orientation: Orientation;
}

// Files live in /public/videos. encodeURI() is applied at render time so the
// spaces / parentheses in the filenames produce valid URLs.
const videos: MediaItem[] = [
    {
        src: "/videos/CallsChat Brand Introduction_1080p.mp4",
        title: "CallsChat Brand Introduction",
        description: "A short introduction to CallsChat and what makes it different.",
        orientation: "landscape",
    },
    {
        src: "/videos/CallsChat_ The Future of Connection_1080p.mp4",
        title: "The Future of Connection",
        description: "See how CallsChat reimagines the way people stay connected.",
        orientation: "landscape",
    },
    {
        src: "/videos/CallsChat - The Future of Communication_1080p (1).mp4",
        title: "The Future of Communication",
        description: "Privacy-first messaging, designed for the way you really talk.",
        orientation: "portrait",
    },
];

export default function MediaGallery() {
    const prefersReducedMotion = useReducedMotion();

    const reveal = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
    };

    return (
        <div className="w-full bg-white">
            {/* ---------- Header band ---------- */}
            <section className="w-full border-b border-gray-100 bg-linear-to-b from-[#F5F8FF] to-white px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="container mx-auto max-w-3xl text-center"
                >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
                        <Film className="h-3.5 w-3.5" />
                        Media
                    </span>

                    <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0A2540] sm:text-5xl">
                        Watch CallsChat in Motion
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#102A63]">
                        Brand films and product stories — see how CallsChat brings private,
                        intelligent communication to life.
                    </p>
                </motion.div>
            </section>

            {/* ---------- Video gallery ---------- */}
            <section className="px-4 py-16 sm:px-6 lg:px-8">
                <div className="container mx-auto flex max-w-5xl flex-col gap-12 sm:gap-16">
                    {videos.map((video) => (
                        <motion.figure
                            key={video.src}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-80px" }}
                            variants={reveal}
                            className="flex flex-col items-center"
                        >
                            <div
                                className={`relative w-full overflow-hidden rounded-3xl border border-gray-100 bg-[#0A2540] shadow-xl shadow-blue-900/5 ${
                                    video.orientation === "landscape"
                                        ? "aspect-video"
                                        : "mx-auto aspect-[9/16] max-w-[19rem] sm:max-w-[21rem]"
                                }`}
                            >
                                <video
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="h-full w-full object-cover"
                                >
                                    <source src={encodeURI(video.src)} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>

                            <figcaption className="mt-5 max-w-xl text-center">
                                <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-[#0A2540]">
                                    <PlayCircle className="h-5 w-5 text-primary" />
                                    {video.title}
                                </h2>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                                    {video.description}
                                </p>
                            </figcaption>
                        </motion.figure>
                    ))}
                </div>
            </section>
        </div>
    );
}
