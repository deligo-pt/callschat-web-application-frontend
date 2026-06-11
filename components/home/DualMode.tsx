"use client";

import {
  Briefcase,
  User,
  MessageSquare,
  Users,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
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

  // Per the Figma prototype, this whole section simply FADES IN (no slide, no
  // zoom) — badge, header and both cards fade together over 0.8s EASE_IN.
  const easeIn = [0.42, 0, 1, 1] as const;

  const badgeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: easeIn } },
  };

  const headerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8, ease: easeIn } },
  };

  // The two cards each slide in as one unit (left from the left, right from the
  // right) and fade — no stagger, they animate together over the same 0.8s.
  const layoutGridVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0 } },
  };

  return (
    <section id="dual-mood" className="w-full bg-[#F8FAFC] px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16 overflow-hidden">
      <div className="container mx-auto max-w-5xl">

        {/* Section Pill Badge */}
        <motion.div
          className="flex justify-center mb-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={badgeVariants}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE7FF] bg-[#EDF3FF] px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            <Briefcase className="h-4 w-4" />
            Dual Mode
          </div>
        </motion.div>

        {/* Section Header Text */}
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={headerVariants}
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-[#102A63] sm:text-5xl">
            Personal to Business.<br />
            <span className="text-primary">One seamless switch.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base font-normal leading-relaxed text-gray-500">
            Toggle between personal conversations and professional communications instantly with dedicated modes for every aspect of your life.
          </p>
        </motion.div>

        {/* Two-Column Mode Layout */}
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={layoutGridVariants}
        >

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
            offsetX={0}
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
            offsetX={0}
          >
            {/* Optional element buffer placeholder slot */}
            <div className="h-10 w-full bg-transparent" />
          </ModeCard>

        </motion.div>

      </div>
    </section>
  );
}