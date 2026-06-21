"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Rocket, ShieldCheck, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SlideData {
  image: string;
  pill?: {
    icon: React.ElementType;
    label: string;
  };
  title: string;
  description: string;
  buttonText: string;
  buttonIcon: React.ElementType;
}

const ONBOARDING_SLIDES: SlideData[] = [
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3ivxF7EVdwFWb8K8UhGcQSmhigAEndTAWfRSHxx4o-LTANEQ3sHVZ4TGc6gLK_gtlfc027bKqP5gnjMAcntxOTNZTOQCAIIdajJsh--QtzD8MiGFsZzkFaeVvdK5NVd3c6UUdkri62_3CQPfjQthmip7w6YPHuvdfL9kP4J46LfRpy9Bt-FdxjlEcQKNdGgzcJla78aQHsE9BaUUaVk160J-ap-SiNKd33tVZsqcw5vrQYQC-2gqHpVgfhyZw-fnIz3t7I-bLKNYg",
    pill: {
      icon: Shield,
      label: "End-to-End Encrypted",
    },
    title: "Secure Messaging",
    description: "End-to-end encrypted communication keeps your conversations completely private and secure. Built for high-stakes professional environments.",
    buttonText: "Next",
    buttonIcon: ArrowRight,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5fPKkw4-OiCUgvfxUevlMo2lQiFlb7z1pok19InWaTfQe8JcLdCPvseL2ytnCvcWk_llTez_xGNcjTxP0468oMrT_q0pIaB-6Dt-8gdDPaCXD_-qrmhOqY-8BMa1XB2lBSUFcNC3a202-B-bg7N8b_CB6rbDjjFhybxwUqTgp8QpTxAVepIYmLSNmZ6_iknL8xheGhaGdqPdw922DsyjCNM5fyhyHJFAfAVSQr1x7HO97annKooupRjJTBjlScJK26kc7EcW4TeOU",
    title: "Private Groups",
    description: "Create groups with hidden member information protection. Your privacy is our priority, ensuring confidential team collaboration.",
    buttonText: "Next",
    buttonIcon: ArrowRight,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBl0Vv2BgPI-UQ8VF6kXlLpNiohNuEZX7P9gSZfR7-P5NXMWfirJF-XqmBznfEJz1rHc3k4XppQtBRZ75EYawkxYKxJzwkWIWcQZTJowQyn04NURLigGsbfpOwWAQGzk6iOAWCNp0aBmptV22gXYWcq659ZEcsUXX1KfD9emKKW1zOQE0I8GqbyQubBxk9YefwTzBzSO1EINrxRqduclj942L0q6_AGCUJGKWv0yTtVsBX15YxOHlQdBvDGGGBVotVUHjDly0zGBaaP",
    title: "AI-Powered Tools",
    description: "Smart productivity features and AI communication tools to enhance your experience without compromising data integrity.",
    buttonText: "Next",
    buttonIcon: ArrowRight,
  },
  {
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPVdxRebh_ivZyHui-87lndeWhGSmjRtPm1w9xc_l3g_TCkKY3uatQ26A6MFmy6RzKryoKceBWdqh-xL6HixhLX1TVWVhUDUdmp3S_oO_JQD0BeJcPpvvb-0NygCXk9Vevs7TTZ07cHThFSuPg2wiFeHuGWbfFczixVX8iGa2DBjYGwxetxHjWWWPmhGNWewAUWaEmGQ0rzbT2HYEXSk8VroBc_ncWJOr0_Sd40DuY2GRLlu4crVWVZ1nP9UCcbE2jV0yPtGaV9cX7",
    title: "Business & Personal",
    description: "Manage both business and personal communication seamlessly in one powerful, unified platform designed for efficiency.",
    buttonText: "Get Started",
    buttonIcon: Rocket,
  }
];

export default function OnboardingSlider() {
  const router = useRouter();
  const [mounted, setMounted] = React.useState<boolean>(false);
  const [activeIndex, setActiveIndex] = React.useState<number>(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      router.push("/login");
    }
  };

  // Prevent Hydration Layout Shift
  if (!mounted) {
    return <div className="flex min-h-screen flex-col bg-background" />;
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="text-xl font-bold tracking-tight text-primary">
            Aura Professional
          </div>
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-5 w-5 cursor-pointer text-muted-foreground transition-opacity hover:opacity-80 active:scale-95" />
            <HelpCircle className="h-5 w-5 cursor-pointer text-muted-foreground transition-opacity hover:opacity-80 active:scale-95" />
          </div>
        </div>
      </header>

      {/* Main Carousel Canvas */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-6 py-12 lg:px-8">
        {/* Background Decorative Element */}
        <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[80px]" />
        </div>
        
        <div className="relative flex min-h-[600px] w-full items-center justify-center">
          {ONBOARDING_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;
            const Icon = slide.buttonIcon;
            const PillIcon = slide.pill?.icon;

            return (
              <div 
                key={index} 
                className={cn(
                  "absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-8 transition-all duration-700 ease-in-out md:flex-row md:gap-16",
                  isActive 
                    ? "pointer-events-auto relative translate-y-0 opacity-100" 
                    : "pointer-events-none absolute translate-y-8 opacity-0"
                )}
              >
                {/* Image Side */}
                <div className="order-1 flex h-[40vh] w-full items-center justify-center md:order-2 md:h-full md:w-1/2">
                  <div className="relative aspect-[0.5] h-full max-h-[500px] w-full overflow-hidden rounded-[2rem] border-[6px] border-muted shadow-2xl shadow-primary/10">
                    <img 
                      className="h-full w-full object-cover" 
                      src={slide.image} 
                      alt={slide.title} 
                    />
                  </div>
                </div>
                
                {/* Text Side */}
                <div className="order-2 flex w-full max-w-md flex-col items-center text-center md:order-1 md:items-start md:text-left">
                  {slide.pill && PillIcon && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
                      <PillIcon className="h-4 w-4 animate-pulse text-primary" />
                      <span className="text-xs font-medium uppercase tracking-wider text-primary">
                        {slide.pill.label}
                      </span>
                    </div>
                  )}
                  
                  <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    {slide.title}
                  </h2>
                  <p className="mb-8 text-base text-muted-foreground md:text-lg">
                    {slide.description}
                  </p>
                  
                  <Button 
                    onClick={handleNext}
                    size="lg"
                    className="group w-full rounded-xl px-8 py-6 text-sm font-semibold uppercase tracking-wider shadow-md md:w-auto"
                  >
                    {slide.buttonText}
                    <Icon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Indicators */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeIndex 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </main>
    </div>
  );
}