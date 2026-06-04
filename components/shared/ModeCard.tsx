"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ModeCardProps {
    title: string;
    icon: LucideIcon;
    iconBgColor1: string;
    iconBgColor2: string;
    cardBgColor: string;
    borderColor: string;
    titleColor?: string;
    features: {
        text: string;
        icon?: LucideIcon;
        iconColor?: string;
    }[];
    children?: ReactNode;
}

export default function ModeCard({
    title,
    icon: Icon,
    iconBgColor1,
    iconBgColor2,
    cardBgColor,
    borderColor,
    titleColor = "text-[#0A2540]",
    features,
    children,
}: ModeCardProps) {

    // Main column entries sliding upward slightly
    const cardContainerVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                easeOut: true,
                staggerChildren: 0.12, // Staggers the internal horizontal row blocks cleanly
                delayChildren: 0.15
            }
        }
    };

    // Sequential reveal for feature entries inside the card body
    const individualRowVariants = {
        hidden: { opacity: 0, x: -15 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.4, easeOut: true }
        }
    };

    return (
        <motion.div variants={cardContainerVariants} className="w-full h-full">
            <Card
                className="flex flex-col rounded-4xl border p-8 md:p-10 shadow-none min-h-95 md:min-h-110 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/30 gap-0 hover:scale-[1.02] h-full"
                style={{ backgroundColor: cardBgColor, borderColor: borderColor }}
            >
                {/* Card Header with Top Rounded Icon */}
                <CardHeader className="p-0 flex-row items-center gap-4">
                    <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundImage: `linear-gradient(135deg, ${iconBgColor1}, ${iconBgColor2})` }}
                    >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className={`text-xl font-bold ${titleColor}`}>
                        {title}
                    </h3>
                </CardHeader>

                {/* Card Content containing dynamic features list & optional elements */}
                <CardContent className="p-0 mt-8 flex-1 flex flex-col justify-between">
                    <div className="flex flex-col gap-5 w-full">
                        {features.map((item, idx) => {
                            const FeatureIcon = item.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    variants={individualRowVariants}
                                    className="flex items-center gap-3 rounded-xl bg-white/90 px-4 py-2.5 shadow-xs border border-black/3"
                                >
                                    {FeatureIcon && (
                                        <FeatureIcon className="h-4 w-4 shrink-0" style={{ color: item.iconColor }} strokeWidth={2} />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                        {item.text}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Custom Child Components Placement (Chat/Analytics elements) */}
                    {children && (
                        <motion.div
                            className="mt-6 w-full"
                            variants={{
                                hidden: { opacity: 0, scale: 0.95 },
                                visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
                            }}
                        >
                            {children}
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}