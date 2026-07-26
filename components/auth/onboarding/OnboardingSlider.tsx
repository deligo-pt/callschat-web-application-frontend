"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, Bot, Briefcase, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideData {
  title: string;
  description: string;
  icon: React.ElementType;
  gradientClass: string;
  buttonText: string;
}

const SLIDES: SlideData[] = [
  {
    title: "Secure Messaging",
    description:
      "End-to-end encrypted communication keeps your conversations completely private and secure.",
    icon: Shield,
    gradientClass: "from-[#4F6EF7] via-[#3B52E8] to-[#2538D4] shadow-blue-500/30",
    buttonText: "Next",
  },
  {
    title: "Private Groups",
    description:
      "Create groups with hidden member information protection. Your privacy is our priority.",
    icon: Users,
    gradientClass: "from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] shadow-purple-500/30",
    buttonText: "Next",
  },
  {
    title: "AI-Powered Tools",
    description:
      "Smart productivity features and AI communication tools to enhance your experience.",
    icon: Bot,
    gradientClass: "from-[#E040FB] via-[#D946EF] to-[#9333EA] shadow-fuchsia-500/30",
    buttonText: "Next",
  },
  {
    title: "Business & Personal",
    description:
      "Manage both business and personal communication seamlessly in one powerful platform.",
    icon: Briefcase,
    gradientClass: "from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] shadow-pink-500/30",
    buttonText: "Next",
  },
];

export default function OnboardingSlider() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const [slideDir, setSlideDir] = React.useState<"left" | "right">("left");

  const goTo = (idx: number) => {
    if (animating || idx === currentSlide) return;
    setSlideDir(idx > currentSlide ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setCurrentSlide(idx);
      setAnimating(false);
    }, 220);
  };

  const handleNext = () => {
    if (currentSlide === SLIDES.length - 1) {
      router.push("/permissions");
    } else {
      goTo(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    router.push("/permissions");
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar with Skip Button */}
      <div className="absolute top-0 left-0 w-full flex h-20 items-center justify-end px-6 sm:px-12 pt-4 z-30">
        <button
          onClick={handleSkip}
          className="text-sm sm:text-base font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Area */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 z-10 min-h-[calc(100vh-160px)]">
        <div
          className={cn(
            "flex flex-col items-center text-center max-w-lg mx-auto py-8 w-full",
            "transition-all duration-200 ease-out",
            animating
              ? slideDir === "left"
                ? "opacity-0 -translate-x-10"
                : "opacity-0 translate-x-10"
              : "opacity-100 translate-x-0"
          )}
        >
          {/* Large Icon Circle */}
          <div
            className={cn(
              "mb-10 sm:mb-12 flex h-[200px] w-[200px] sm:h-[220px] sm:w-[220px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl transition-all duration-500",
              slide.gradientClass
            )}
          >
            <Icon className="h-24 w-24 sm:h-28 sm:w-28 text-white" strokeWidth={1.75} />
          </div>

          {/* Typography */}
          <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A2540]">
            {slide.title}
          </h2>
          <p className="max-w-[440px] px-4 text-base sm:text-lg font-medium leading-relaxed text-[#64748B]">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="flex w-full shrink-0 flex-col items-center pb-12 sm:pb-16 px-6 max-w-md mx-auto z-20">
        {/* Pagination Dots */}
        <div className="mb-8 sm:mb-10 flex items-center justify-center gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none",
                idx === currentSlide
                  ? "w-8 bg-[#2563EB] shadow-sm shadow-blue-500/30"
                  : "w-2 bg-[#E2E8F0] hover:bg-[#CBD5E1]"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="group flex w-full max-w-[380px] items-center justify-center rounded-2xl bg-[#2563EB] py-4 sm:py-5 text-base sm:text-lg font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:bg-[#1D4ED8] hover:shadow-2xl hover:shadow-blue-600/35 active:scale-[0.98] cursor-pointer"
        >
          {slide.buttonText}
          <ChevronRight
            className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </button>
      </div>
    </div>
  );
}
