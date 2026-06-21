"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    description: "End-to-end encrypted communication keeps your conversations completely private and secure.",
    icon: Shield,
    gradientClass: "from-[#5D7BFF] to-[#3E4DEB] shadow-[#5D7BFF]/30",
    buttonText: "Next",
  },
  {
    title: "Private Groups",
    description: "Create groups with hidden member information protection. Your privacy is our priority.",
    icon: Users,
    gradientClass: "from-[#A155FF] to-[#7435FF] shadow-[#A155FF]/30",
    buttonText: "Next",
  },
  {
    title: "AI-Powered Tools",
    description: "Smart productivity features and AI communication tools to enhance your experience.",
    icon: Bot,
    gradientClass: "from-[#DF4AEF] to-[#A035EC] shadow-[#DF4AEF]/30",
    buttonText: "Next",
  },
  {
    title: "Business & Personal",
    description: "Manage both business and personal communication seamlessly in one powerful platform.",
    icon: Briefcase,
    gradientClass: "from-[#C436D6] to-[#4F4CE7] shadow-[#C436D6]/30",
    buttonText: "Get Started",
  }
];

export default function OnboardingSlider() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNext = () => {
    if (currentSlide === SLIDES.length - 1) {
      router.push("/permissions");
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    router.push("/permissions");
  };

  if (!isMounted) {
    return <div className="flex min-h-screen bg-zinc-100" />;
  }

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 sm:p-6">
      {/* Mobile constraint container simulating the 412x851 Figma dimensions on desktop */}
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Top Bar */}
        <div className="flex h-16 w-full shrink-0 items-center justify-end px-6 pt-4 z-20">
          {currentSlide < SLIDES.length - 1 && (
            <button 
              onClick={handleSkip}
              className="text-sm font-medium text-[#8F95B2] transition-colors hover:text-gray-800"
            >
              Skip
            </button>
          )}
        </div>

        {/* Main Content Area with Framer Motion */}
        <div className="relative flex flex-1 flex-col items-center px-8 z-10">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 flex flex-col items-center text-center pt-[15%]"
            >
              {/* Large Icon Circle */}
              <div 
                className={cn(
                  "mb-12 flex h-[180px] w-[180px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-xl",
                  slide.gradientClass
                )}
              >
                <Icon className="h-[72px] w-[72px] text-white" strokeWidth={1.5} />
              </div>

              {/* Text Content */}
              <h2 className="mb-4 text-[26px] font-bold tracking-tight text-[#11142D]">
                {slide.title}
              </h2>
              <p className="px-4 text-[15px] font-medium leading-[1.6] text-[#8F95B2]">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Area */}
        <div className="flex w-full shrink-0 flex-col items-center px-6 pb-12 z-20 bg-white">
          
          {/* Pagination Dots */}
          <div className="mb-10 flex items-center justify-center gap-2">
            {SLIDES.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentSlide 
                    ? "w-5 bg-[#3151EC]" 
                    : "w-1.5 bg-[#E4E6F0]"
                )}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="group flex w-full items-center justify-center rounded-[1rem] bg-[#2E54EB] py-[18px] text-[15px] font-semibold text-white shadow-lg shadow-[#2E54EB]/25 transition-all hover:bg-[#2546D2] active:scale-[0.98]"
          >
            {slide.buttonText}
            <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={3} />
          </button>
        </div>

      </div>
    </div>
  );
}