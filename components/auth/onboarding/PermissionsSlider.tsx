"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Bell, Contact, MapPin } from "lucide-react";

interface PermissionSlide {
  title: string;
  description: string;
  icon: React.ElementType;
}

const PERMISSIONS: PermissionSlide[] = [
  {
    title: "Phone & Calls",
    description: "Allow App to make and manage phone calls so you can reach anyone directly.",
    icon: Phone,
  },
  {
    title: "Notifications",
    description: "Allow App to send you notifications for new messages, calls, and important updates.",
    icon: Bell,
  },
  {
    title: "Contacts",
    description: "Allow App to access your contacts to help you connect with friends and family.",
    icon: Contact,
  },
  {
    title: "Location",
    description: "Allow App to access your location so you can share your live location with friends and discover nearby people.",
    icon: MapPin,
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
      router.push("/mode");
    } else {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  if (!isMounted) {
    return <div className="flex min-h-screen bg-zinc-100" />;
  }

  const slide = PERMISSIONS[currentSlide];
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
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#EEF2F9] shadow-2xl sm:h-[851px] sm:w-[412px] sm:rounded-[2.5rem]">
        
        {/* Top Spacer */}
        <div className="flex-1" />

        {/* Bottom Sheet Area */}
        <div className="relative h-[400px] w-full shrink-0">
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
              className="absolute bottom-0 w-full rounded-t-[2.5rem] bg-white px-8 pb-12 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
            >
              {/* Icon Square */}
              <div className="mx-auto mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.25rem] bg-[#3B58F5] shadow-lg shadow-[#3B58F5]/30">
                <Icon className="h-8 w-8 text-white" strokeWidth={2} />
              </div>

              {/* Text Content */}
              <h2 className="mb-3 text-center text-[22px] font-bold tracking-tight text-[#11142D]">
                {slide.title}
              </h2>
              <p className="mb-8 text-center text-[14px] font-medium leading-[1.6] text-[#8F95B2]">
                {slide.description}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAction}
                  className="w-full rounded-[1rem] bg-[#3B58F5] py-[16px] text-[15px] font-bold text-white shadow-lg shadow-[#3B58F5]/25 transition-all hover:bg-[#2C48B8] active:scale-[0.98]"
                >
                  Allow
                </button>
                <button
                  onClick={handleAction}
                  className="w-full rounded-[1rem] bg-[#B2B8C2] py-[16px] text-[15px] font-bold text-[#1C2433] transition-all hover:bg-[#A1A8B2] active:scale-[0.98]"
                >
                  Don't allow
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
