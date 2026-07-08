"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Hash, Lock, Globe, Shield, Smile, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChannelService } from "@/services/channel.service";

const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .regex(/^[a-z0-9-]+$/, "Must be lowercase alphanumeric or hyphens with no spaces")
    .trim(),
  website: z.string().trim().optional(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().optional(),
  whoCanJoin: z.enum(["ANYONE", "INVITE_ONLY", "REQUIRES_APPROVAL"]).default("ANYONE"),
  whoCanPost: z.enum(["ADMIN_ONLY", "ADMIN_MODERATORS"]).default("ADMIN_ONLY"),
  enableReactions: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string | null;
  onChannelCreated: () => void;
}

const CATEGORIES = [
  "Technology",
  "Business",
  "Education",
  "News",
  "Marketing",
  "Product Updates",
  "Community",
];

export function CreateChannelModal({
  isOpen,
  onClose,
  workspaceId,
  onChannelCreated,
}: CreateChannelModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema) as any,
    defaultValues: {
      name: "",
      website: "",
      description: "",
      category: "Business",
      whoCanJoin: "ANYONE",
      whoCanPost: "ADMIN_ONLY",
      enableReactions: true,
      isPrivate: false,
    },
  });

  const isPrivateValue = watch("isPrivate");
  const whoCanJoinValue = watch("whoCanJoin");
  const whoCanPostValue = watch("whoCanPost");
  const enableReactionsValue = watch("enableReactions");
  const categoryValue = watch("category");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setValue("name", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateChannelFormValues) => {
    try {
      const response = await ChannelService.createChannel(
        {
          name: data.name,
          website: data.website || null,
          description: data.description || null,
          category: data.category || "Business",
          whoCanJoin: data.isPrivate ? "INVITE_ONLY" : data.whoCanJoin,
          whoCanPost: data.whoCanPost,
          enableReactions: data.enableReactions,
          isPrivate: data.isPrivate || data.whoCanJoin === "INVITE_ONLY",
        },
        workspaceId || null
      );

      if (response && response.success) {
        toast.success(`Channel #${data.name} created successfully!`);
        reset();
        setStep(1);
        onChannelCreated();
        onClose();
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.error?.message;

      if (status === 403) {
        toast.error("Permission denied: You cannot create channels here.");
      } else if (status === 409) {
        toast.error(`Channel #${data.name} already exists.`);
      } else {
        toast.error(errorMessage || "Failed to create channel. Please try again.");
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setStep(1);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-white border border-[#E6EAFA] shadow-2xl rounded-2xl p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              {isPrivateValue ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            </div>
            <DialogTitle className="text-xl font-bold text-[#11142D]">
              Create a Direct Business Channel
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#6B7280]">
            Direct Business Channels allow you to broadcast updates to your audience, customers, or community independently of workspaces.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {step === 1 && (
            <>
              {/* Channel Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-[#8F95B2] select-none text-sm">#</span>
                  <Input
                    {...register("name")}
                    onChange={handleNameChange}
                    placeholder="e.g. plan-launch"
                    disabled={isSubmitting}
                    className="h-11 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] pl-8 pr-3 text-sm font-semibold text-[#11142D] focus-visible:border-purple-600 focus-visible:bg-white transition-all lowercase"
                  />
                </div>
                {errors.name && (
                  <span className="text-xs font-bold text-red-500">{errors.name.message}</span>
                )}
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
                  Website <span className="text-[#8F95B2] font-normal">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3 h-4 w-4 text-[#8F95B2]" />
                  <Input
                    {...register("website")}
                    placeholder="https://yourbusiness.com"
                    disabled={isSubmitting}
                    className="h-11 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] pl-9 pr-3 text-sm font-semibold text-[#11142D] focus-visible:border-purple-600 focus-visible:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setValue("category", cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                        categoryValue === cat
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-[#F8FAFC] border border-[#E6EAFA] text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
                  Description <span className="text-[#8F95B2] font-normal">(optional)</span>
                </label>
                <Input
                  {...register("description")}
                  placeholder="What is this channel about?"
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] px-3 text-sm font-medium text-[#11142D] focus-visible:border-purple-600 focus-visible:bg-white transition-all"
                />
              </div>

              <DialogFooter className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl font-semibold border-[#E6EAFA] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!watch("name")) {
                      toast.error("Please enter a channel name");
                      return;
                    }
                    setStep(2);
                  }}
                  className="h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5"
                >
                  <span>Next: Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 2 && (
            <>
              {/* Privacy / Who can join Toggle */}
              <div className="flex flex-col gap-2 rounded-xl border border-[#E6EAFA] bg-[#F8FAFC]/60 p-3.5">
                <span className="text-xs font-extrabold text-[#11142D] uppercase tracking-wider">Who can join?</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "ANYONE", label: "Anyone (Public)" },
                    { val: "INVITE_ONLY", label: "Invite Only" },
                    { val: "REQUIRES_APPROVAL", label: "Approval" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      type="button"
                      onClick={() => {
                        setValue("whoCanJoin", o.val as any);
                        setValue("isPrivate", o.val === "INVITE_ONLY");
                      }}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        whoCanJoinValue === o.val || (o.val === "INVITE_ONLY" && isPrivateValue)
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Who can post Toggle */}
              <div className="flex flex-col gap-2 rounded-xl border border-[#E6EAFA] bg-[#F8FAFC]/60 p-3.5">
                <span className="text-xs font-extrabold text-[#11142D] uppercase tracking-wider">Who can post updates?</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "ADMIN_ONLY", label: "Admin Only" },
                    { val: "ADMIN_MODERATORS", label: "Admin + Moderators" },
                  ].map((o) => (
                    <button
                      key={o.val}
                      type="button"
                      onClick={() => setValue("whoCanPost", o.val as any)}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        whoCanPostValue === o.val
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enable Reactions Switch */}
              <div className="flex items-center justify-between rounded-xl border border-[#E6EAFA] bg-[#F8FAFC]/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Smile className="h-4 w-4 text-purple-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#11142D]">Enable Reactions</span>
                    <span className="text-xs text-[#6B7280]">Allow subscribers to react to posts</span>
                  </div>
                </div>
                <Controller
                  name="enableReactions"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>

              <DialogFooter className="mt-3 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl font-semibold border-[#E6EAFA] hover:bg-[#F8FAFC]"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Channel"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
