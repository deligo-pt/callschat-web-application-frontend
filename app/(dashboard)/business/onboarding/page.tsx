"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Briefcase, Sparkles, Building2, AtSign, ArrowRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkspaceService } from "@/services/workspace.service";
import { useUser } from "@/context/UserContext";

const onboardingSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters").trim(),
  businessId: z
    .string()
    .min(2, "Business ID must be at least 2 characters")
    .regex(/^[a-z0-9]+$/, "Business ID must be lowercase alphanumeric with no spaces")
    .trim(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function BusinessOnboardingPage() {
  const router = useRouter();
  const { setWorkspace } = useUser();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      businessId: "",
    },
  });

  const businessIdValue = watch("businessId");

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setValue("businessId", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      const response = await WorkspaceService.createWorkspace({
        name: data.name,
        businessId: data.businessId,
      });

      if (response && response.success) {
        setWorkspace(response.data);
        toast.success("Workspace created successfully! Welcome aboard.");
        router.push("/business/dashboard");
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errorCode = error?.response?.data?.error?.code;
      const errorMessage = error?.response?.data?.error?.message;

      if (status === 409 || errorCode === "CONFLICT") {
        setError("businessId", {
          type: "manual",
          message: "This Business ID is already taken.",
        });
      } else {
        toast.error(errorMessage || "Failed to create workspace. Please try again.");
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FB] to-[#E6EAFA] p-4">
      {/* Decorative background glow */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-0 shadow-[0_20px_50px_rgba(139,92,246,0.15)] rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl p-2">
          {/* Top Banner Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#4F46E5] rounded-t-2xl" />

          <CardHeader className="pt-8 pb-4 px-8 text-center flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 mb-4 transform hover:scale-105 transition-transform">
              <Briefcase className="h-8 w-8" strokeWidth={2.2} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Workspace Setup
            </div>
            <CardTitle className="text-2xl md:text-3xl font-extrabold text-[#11142D] tracking-tight">
              Create your Business Workspace
            </CardTitle>
            <CardDescription className="text-sm font-medium text-[#6B7280] mt-1.5 max-w-sm">
              Your isolated container for team messaging, enterprise tools, and professional branding.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Company Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1D2A54] flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#8B5CF6]" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Acme Corporation"
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl border-[#E6EAFA] bg-[#F8FAFC] px-4 text-base font-semibold text-[#11142D] focus-visible:border-[#8B5CF6] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/15 transition-all"
                />
                {errors.name ? (
                  <span className="text-xs font-bold text-red-500 animate-in fade-in">
                    {errors.name.message}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#8F95B2]">
                    The official name displayed to your team and customers.
                  </span>
                )}
              </div>

              {/* Custom Handle Input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#1D2A54] flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-[#8B5CF6]" />
                  CallsChat Business Handle <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-bold text-[#8F95B2] select-none text-base">@</span>
                  <Input
                    {...register("businessId")}
                    onChange={handleHandleChange}
                    placeholder="acmecorp"
                    disabled={isSubmitting}
                    className="h-12 rounded-2xl border-[#E6EAFA] bg-[#F8FAFC] pl-9 pr-4 text-base font-bold text-[#8B5CF6] placeholder:font-semibold placeholder:text-[#CBD5E1] focus-visible:border-[#8B5CF6] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#8B5CF6]/15 transition-all lowercase"
                  />
                </div>
                {errors.businessId ? (
                  <span className="text-xs font-bold text-red-500 animate-in fade-in">
                    {errors.businessId.message}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#8F95B2]">
                    Your unique @handle for business identification (e.g., callschat.com/@
                    {businessIdValue || "acmecorp"}).
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-14 w-full rounded-2xl bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#4F46E5] text-base font-bold text-white shadow-xl shadow-purple-500/25 hover:from-[#7C3AED] hover:to-[#4338CA] transition-all active:scale-[0.99] cursor-pointer group flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Workspace</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
