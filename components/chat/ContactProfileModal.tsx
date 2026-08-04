import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Phone, Video, Ban } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallContext } from "@/components/providers/CallContext";
import { getOptimizedImageUrl } from "@/utils/image";

export interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  name: string;
  avatarUrl?: string;
  isOnline?: boolean;
  phone?: string;
  isBlocked?: boolean;
  isBlockedByMe?: boolean;
  onBlockUser?: () => void;
}

export function ContactProfileModal({
  isOpen,
  onClose,
  peerId,
  name,
  avatarUrl,
  isOnline,
  phone,
  isBlocked,
  isBlockedByMe,
  onBlockUser,
}: ContactProfileModalProps) {
  const tOptions = useTranslations("options");
  const { initiateCall } = useCallContext();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-none p-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-[#1D2A8A] via-[#254BCC] to-[#3B58F5] relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>
        
        {/* Avatar & Basic Info */}
        <div className="px-6 pb-6 relative -mt-16 flex flex-col items-center">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={getOptimizedImageUrl(avatarUrl)}
                alt={name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg bg-white"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-white bg-[#E6EAFA] flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-[#3B58F5]">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
            )}
          </div>
          
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{name}</h2>
          {phone ? (
            <p className="mt-1 text-slate-500 font-medium text-[15px]">{phone}</p>
          ) : (
            <p className="mt-1 text-slate-400 font-medium text-[14px]">Phone number hidden</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 w-full max-w-[280px]">
            <button
              onClick={() => {
                initiateCall(peerId, "AUDIO", name, avatarUrl);
                onClose();
              }}
              disabled={isBlocked}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F4F6FC] hover:bg-[#E6EAFA] py-3 rounded-2xl transition-colors disabled:opacity-50"
            >
              <Phone className="h-6 w-6 text-[#3B58F5]" fill="currentColor" />
              <span className="text-[13px] font-bold text-[#3B58F5]">Audio</span>
            </button>
            <button
              onClick={() => {
                initiateCall(peerId, "VIDEO", name, avatarUrl);
                onClose();
              }}
              disabled={isBlocked}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F4F6FC] hover:bg-[#E6EAFA] py-3 rounded-2xl transition-colors disabled:opacity-50"
            >
              <Video className="h-6 w-6 text-[#3B58F5]" fill="currentColor" />
              <span className="text-[13px] font-bold text-[#3B58F5]">Video</span>
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 my-6" />

          {/* Additional Options */}
          <div className="w-full flex flex-col gap-2">
            {onBlockUser && (
              <button
                onClick={() => {
                  onBlockUser();
                  onClose();
                }}
                className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-red-50 text-red-500 transition-colors group"
              >
                <div className="h-10 w-10 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center">
                  <Ban className="h-5 w-5" />
                </div>
                <span className="font-semibold">
                  {isBlockedByMe ? tOptions("unblock_user") : tOptions("block_user")}
                </span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
