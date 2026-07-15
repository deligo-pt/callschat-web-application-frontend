"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Bell, Contact, MapPin, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionSlide {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const PERMISSIONS: PermissionSlide[] = [
  {
    title: "Phone & Calls",
    description: "Allow App to make and manage phone calls so you can reach anyone directly seamlessly.",
    icon: Phone,
    gradient: "from-[#4F6EF7] via-[#3B52E8] to-[#2538D4] shadow-blue-500/30",
  },
  {
    title: "Notifications",
    description: "Allow App to send you instant notifications for new messages, calls, and important updates.",
    icon: Bell,
    gradient: "from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] shadow-purple-500/30",
  },
  {
    title: "Contacts",
    description: "Allow App to access your contacts to easily connect with friends, family, and colleagues.",
    icon: Contact,
    gradient: "from-[#E040FB] via-[#D946EF] to-[#9333EA] shadow-fuchsia-500/30",
  },
  {
    title: "Location Access",
    description: "Allow App to access your location so you can share your live location with trusted friends.",
    icon: MapPin,
    gradient: "from-[#EC4899] via-[#8B5CF6] to-[#3B82F6] shadow-pink-500/30",
  }
];

export default function PermissionsSlider() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAction = () => {
    if (currentSlide === PERMISSIONS.length - 1) {
      router.push("/choose-mode");
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    } else {
      router.push("/onboarding");
    }
  };

  if (!isMounted) {
    return <div className="flex min-h-screen w-full bg-[#F8FAFC]" />;
  }

  const slide = PERMISSIONS[currentSlide];
  const Icon = slide.icon;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 80 : -80,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar with Back and Skip */}
      <div className="absolute top-0 left-0 w-full flex h-20 items-center justify-between px-6 sm:px-12 pt-4 z-30">
        <button 
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button 
          onClick={() => router.push("/choose-mode")}
          className="text-sm sm:text-base font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
        >
          Skip All
        </button>
      </div>

      {/* Main Slide Area */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 z-10 min-h-[calc(100vh-180px)]">
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
            className="flex flex-col items-center text-center max-w-lg mx-auto py-8"
          >
            {/* Icon Circle */}
            <div 
              className={cn(
                "mb-10 sm:mb-12 flex h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl transition-all duration-500",
                slide.gradient
              )}
            >
              <Icon className="h-20 w-20 sm:h-24 sm:w-24 text-white" strokeWidth={1.75} />
            </div>

            {/* Typography */}
            <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0A2540]">
              {slide.title}
            </h2>
            <p className="max-w-[440px] px-4 text-base sm:text-lg font-medium leading-relaxed text-[#64748B]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Action Area */}
      <div className="flex w-full shrink-0 flex-col items-center pb-12 sm:pb-16 px-6 max-w-md mx-auto z-20">
        
        {/* Pagination Dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {PERMISSIONS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setDirection(idx > currentSlide ? 1 : -1);
                setCurrentSlide(idx);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none",
                idx === currentSlide 
                  ? "w-8 bg-[#2563EB] shadow-sm shadow-blue-500/30" 
                  : "w-2 bg-[#E2E8F0] hover:bg-[#CBD5E1]"
              )}
              aria-label={`Go to permission ${idx + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full max-w-[380px]">
          <button
            onClick={handleAction}
            className="w-full rounded-2xl bg-[#2563EB] py-4 sm:py-4.5 text-base sm:text-lg font-bold text-white shadow-xl shadow-blue-600/25 transition-all hover:bg-[#1D4ED8] hover:shadow-2xl hover:shadow-blue-600/35 active:scale-[0.98] cursor-pointer"
          >
            Allow Permission
          </button>
          <button
            onClick={handleAction}
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 sm:py-4.5 text-base font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98] cursor-pointer"
          >
            Don&apos;t Allow
          </button>
        </div>
      </div>
    </div>
  );
}
