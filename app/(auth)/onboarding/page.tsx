import OnboardingSlider from "@/components/auth/onboarding/OnboardingSlider";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | CallsChat",
  description: "Welcome to CallsChat. Secure messaging, private groups, and AI-powered tools.",
};

export default function OnboardingPage() {
  return <OnboardingSlider />;
}
