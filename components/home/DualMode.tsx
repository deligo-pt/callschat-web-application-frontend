// components/DualMood.tsx
import { 
  Briefcase, 
  User, 
  MessageSquare, 
  Users,  
  BarChart3 
} from "lucide-react";
import ModeCard from "../shared/ModeCard";


export default function DualMood() {
  const personalFeatures = [
    { text: "Casual conversations with friends & family", icon: MessageSquare, iconColor: "#A855F7" },
    { text: "Group chats and social communities", icon: Users, iconColor: "#A855F7" },
    { text: " Hey! Want to grab coffee later?" },
  ];

  const businessFeatures = [
    { text: "Team collaboration and project management", icon: Users, iconColor: "#3B82F6" },
    { text: "Analytics dashboard and insights", icon: BarChart3, iconColor: "#3B82F6" },
    { text: "Real-time response rate tracking and analytics", icon: MessageSquare, iconColor: "#3B82F6" },
  ];

  return (
    <section id="dual-mood" className="w-full bg-[#F8FAFC] px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16">
      <div className="container mx-auto max-w-5xl">
        
        {/* Section Pill Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE7FF] bg-[#EDF3FF] px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            <Briefcase className="h-4 w-4" />
            Dual Mode
          </div>
        </div>

        {/* Section Header Text */}
        <div className="mb-14 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#102A63] sm:text-5xl">
            Personal to Business.<br />
            <span className="text-primary">One seamless switch.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-normal leading-relaxed text-gray-500">
            Toggle between personal conversations and professional communications instantly with dedicated modes for every aspect of your life.
          </p>
        </div>

        {/* Two-Column Mode Layout */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* 1. Personal Mode Card */}
          <ModeCard
            title="Personal Mode"
            icon={User}
            iconBgColor1="#DB55C2"
            iconBgColor2="#9668F4"
            cardBgColor="#F2EAFC"
            borderColor="#E9D5FF"
            titleColor="text-[#1E1B4B]"
            features={personalFeatures}
          >
            {/* Custom Interactive Chat Blocks matching layout graphic */}
            <div className="flex flex-col gap-2.5 mt-2 font-sans">
              <div className="self-end rounded-xl bg-linear-to-br from-[#DB55C2] to-[#9668F4] px-3.5 py-2 text-xs font-semibold text-white shadow-sm max-w-[80%]">
                Sounds great! See you at 3pm
              </div>
            </div>
          </ModeCard>

          {/* 2. Business Mode Card */}
          <ModeCard
            title="Business Mode"
            icon={Briefcase}
            iconBgColor1="#34ABF5"
            iconBgColor2="#2974ED" 
            cardBgColor="#EFF6FF"
            borderColor="#BFDBFE"
            titleColor="text-[#1E3A8A]"
            features={businessFeatures}
          >
            {/* You can inject an analytics mock snippet component here later if needed */}
            <div className="h-10 w-full bg-transparent" />
          </ModeCard>

        </div>

      </div>
    </section>
  );
}