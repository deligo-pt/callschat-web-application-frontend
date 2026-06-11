"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconBgColor: string;
    /** Initial downward Y offset (px) the card slides up FROM — ported from the
     *  Figma "feature" set Default→Variant2 move, where each card travels a
     *  different distance into the grid. */
    offsetY: number;
}

// Ported from Figma (feature set, Default→Variant2): each card slides up from a
// per-card downward offset into its grid slot. No fade (opacity stays 1), EASE_IN
// over 1.1s, all cards moving simultaneously so farther cards travel faster.
const cardVariants = {
    hidden: (offsetY: number) => ({ y: offsetY }),
    visible: {
        y: 0,
        transition: { duration: 1.1, ease: [0.42, 0, 1, 1] as const },
    },
};

export default function FeatureCard({ title, description, icon: Icon, iconBgColor, offsetY }: FeatureCardProps) {
    return (
        <motion.div variants={cardVariants} custom={offsetY} className="w-full">
            <Card className="flex flex-col items-start rounded-[1.75rem] border border-gray-200/80 bg-white p-8 gap-0 shadow-none transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/50 hover:scale-105 h-full">

                {/* Card Header contains the icon box */}
                <CardHeader className="p-0">
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: iconBgColor }}
                    >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                </CardHeader>

                {/* Card Content contains the text parameters */}
                <CardContent className="p-0 mt-5">
                    <CardTitle className="text-xl font-bold text-[#102A63] tracking-normal">
                        {title}
                    </CardTitle>

                    <p className="mt-3 text-[14px] leading-relaxed text-foreground/60 font-normal">
                        {description}
                    </p>
                </CardContent>

            </Card>
        </motion.div>
    );
}