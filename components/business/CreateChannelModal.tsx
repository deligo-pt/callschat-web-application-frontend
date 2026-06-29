"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Hash, Lock, Globe } from "lucide-react";

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
    .regex(/^[a-z0-9]+$/, "Must be lowercase alphanumeric with no spaces")
    .trim(),
  description: z.string().max(1000).trim().optional(),
  isPrivate: z.boolean(),
});

type CreateChannelFormValues = z.infer<typeof createChannelSchema>;

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onChannelCreated: () => void;
}

export function CreateChannelModal({
  isOpen,
  onClose,
  workspaceId,
  onChannelCreated,
}: CreateChannelModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateChannelFormValues>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const isPrivateValue = watch("isPrivate");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setValue("name", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateChannelFormValues) => {
    try {
      const response = await ChannelService.createChannel(workspaceId, {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
      });

      if (response && response.success) {
        toast.success(`Channel #${data.name} created successfully!`);
        reset();
        onChannelCreated();
        onClose();
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.error?.message;

      if (status === 403) {
        toast.error("Permission denied: Only Workspace Owners and Admins can create channels.");
      } else if (status === 409) {
        toast.error(`Channel #${data.name} already exists in this workspace.`);
      } else {
        toast.error(errorMessage || "Failed to create channel. Please try again.");
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E6EAFA] shadow-2xl rounded-2xl p-6">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              {isPrivateValue ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            </div>
            <DialogTitle className="text-xl font-bold text-[#11142D]">
              Create a channel
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#6B7280]">
            Channels are where your team communicates. They’re best when organized around a topic — #marketing, #sales, for example.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-2">
          {/* Channel Name */}
          <div className="flex flex-col gap-1.5">
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
                className="h-11 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] pl-8 pr-3 text-sm font-semibold text-[#11142D] focus-visible:border-purple-600 focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-purple-600/15 transition-all lowercase"
              />
            </div>
            {errors.name && (
              <span className="text-xs font-bold text-red-500">{errors.name.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#1D2A54] uppercase tracking-wider">
              Description <span className="text-[#8F95B2] font-normal">(optional)</span>
            </label>
            <Input
              {...register("description")}
              placeholder="What is this channel about?"
              disabled={isSubmitting}
              className="h-11 rounded-xl border-[#E6EAFA] bg-[#F8FAFC] px-3 text-sm font-medium text-[#11142D] focus-visible:border-purple-600 focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-purple-600/15 transition-all"
            />
            <span className="text-[11px] text-[#8F95B2]">What sets this channel apart?</span>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#E6EAFA] bg-[#F8FAFC]/60 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs border border-[#E6EAFA]">
                {isPrivateValue ? (
                  <Lock className="h-4 w-4 text-amber-600" />
                ) : (
                  <Globe className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#11142D]">Make private</span>
                <span className="text-xs text-[#6B7280]">
                  {isPrivateValue
                    ? "Only invited members can view or join this channel."
                    : "Anyone in the workspace can view and join this channel."}
                </span>
              </div>
            </div>
            <Controller
              name="isPrivate"
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
