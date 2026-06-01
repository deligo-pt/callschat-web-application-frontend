
import { LucideIcon } from "lucide-react";
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
}

export default function FeatureCard({ title, description, icon: Icon, iconBgColor }: FeatureCardProps) {
    return (
        <Card className="flex flex-col items-start rounded-[1.75rem] border border-gray-200/80 bg-white p-8 gap-0 shadow-none transition-all duration-300 hover:shadow-lg hover:shadow-gray-100/50 hover:scale-105">

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
    );
}