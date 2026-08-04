"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BusinessService, SetupBusinessPayload } from "@/services/business.service";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { Loader2, Briefcase, Building2, Sparkles, Globe, MapPin, FileText } from "lucide-react";

const setupBusinessSchema = z.object({
  companyName: z.string().min(1, "Company name is required").trim(),
  category: z.string().min(1, "Category is required").trim(),
  description: z.string().max(1000, "Description must not exceed 1000 characters").trim().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").trim().optional(),
});

type SetupBusinessFormValues = z.infer<typeof setupBusinessSchema>;

interface SetupBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetupBusinessModal({ isOpen, onClose }: SetupBusinessModalProps) {
  const { updateCurrentMode } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SetupBusinessFormValues>({
    resolver: zodResolver(setupBusinessSchema),
    defaultValues: {
      companyName: "",
      category: "Technology",
      description: "",
      website: "",
      address: "",
    },
  });

  const onSubmit = async (data: SetupBusinessFormValues) => {
    try {
      const payload: SetupBusinessPayload = {
        companyName: data.companyName,
        category: data.category,
        description: data.description || undefined,
        website: data.website || undefined,
        address: data.address || undefined,
      };

      await BusinessService.setupAccount(payload);
      updateCurrentMode("BUSINESS");
      toast.success("Welcome to your Business Account!");
      reset();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error?.message || error.message || "Failed to set up business profile";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] p-6 text-white">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-sm">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Setup Business Profile</DialogTitle>
              <DialogDescription className="text-xs text-purple-100 mt-0.5">
                Unlock professional analytics, team tools & custom branding
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4 bg-white">
          {/* Company Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#8B5CF6]" />
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("companyName")}
              placeholder="e.g. Acme Corp"
              className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
            />
            {errors.companyName && (
              <span className="text-xs font-semibold text-red-500">{errors.companyName.message}</span>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register("category")}
              className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
            >
              <option value="Technology">Technology & Software</option>
              <option value="Retail">Retail & E-commerce</option>
              <option value="Healthcare">Healthcare & Wellness</option>
              <option value="Consulting">Consulting & Agency</option>
              <option value="Education">Education & Training</option>
              <option value="Other">Other Business</option>
            </select>
            {errors.category && (
              <span className="text-xs font-semibold text-red-500">{errors.category.message}</span>
            )}
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-[#8B5CF6]" />
              Website (Optional)
            </label>
            <input
              type="url"
              {...register("website")}
              placeholder="https://example.com"
              className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
            />
            {errors.website && (
              <span className="text-xs font-semibold text-red-500">{errors.website.message}</span>
            )}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#8B5CF6]" />
              Address (Optional)
            </label>
            <input
              {...register("address")}
              placeholder="City, Country or Street Address"
              className="h-[46px] w-full rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] px-4 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
            />
            {errors.address && (
              <span className="text-xs font-semibold text-red-500">{errors.address.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-[#1D2A54] flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-[#8B5CF6]" />
              Description (Optional)
            </label>
            <textarea
              rows={2}
              {...register("description")}
              placeholder="Briefly describe what your business does..."
              className="w-full resize-none rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] p-3 text-[14px] font-semibold text-[#11142D] focus:border-[#8B5CF6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
            />
            {errors.description && (
              <span className="text-xs font-semibold text-red-500">{errors.description.message}</span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[#E6EAFA] bg-[#F4F6FC] py-3 text-[14px] font-bold text-[#8F95B2] hover:bg-[#E6EAFA] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] py-3 text-[14px] font-bold text-white shadow-lg shadow-purple-500/25 hover:from-[#7C3AED] hover:to-[#5B21B6] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create & Switch
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
