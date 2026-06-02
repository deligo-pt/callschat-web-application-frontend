// components/ModeCard.tsx
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
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
    return (
        <Card
            className="flex flex-col rounded-4xl border p-8 md:p-10 shadow-none min-h-95 md:min-h-110 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/30 gap-0"
            style={{ backgroundColor: cardBgColor, borderColor: borderColor }}
        >
            {/* Card Header with Top Rounded Icon */}
            <CardHeader className="p-0 flex-row items-center gap-4">
                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm bg-linear-to-bl from-[${iconBgColor1}] to-[${iconBgColor2}]`}
                    // style={{ backgroundColor: iconBgColor }}
                >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className={`text-xl font-bold ${titleColor}`}>
                    {title}
                </h3>
            </CardHeader>

            {/* Card Content containing dynamic features list & optional elements */}
            <CardContent className="p-0 mt-8 flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-7 w-full">
                    {features.map((item, idx) => {
                        const FeatureIcon = item.icon;
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-3 rounded-xl bg-white/90 px-4 py-2 shadow-sm border border-black/2"
                            >
                                {FeatureIcon && (
                                    <FeatureIcon className="h-4 w-4 shrink-0" style={{ color: item.iconColor }} strokeWidth={2} />
                                )}
                                <span className="text-sm font-medium text-gray-700">
                                    {item.text}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Custom Child Components Placement (Chat/Analytics elements) */}
                {children && (
                    <div className="mt-6 w-full">
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}