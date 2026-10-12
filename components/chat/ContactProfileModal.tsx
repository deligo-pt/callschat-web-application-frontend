import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Phone, Video, Ban, ShieldCheck, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallContext } from "@/components/providers/CallContext";
import { useContacts } from "@/context/ContactsContext";
import { resolveDisplayName } from "@/utils/resolveDisplayName";
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
  onOpenSecurityCode?: () => void;
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
  onOpenSecurityCode,
}: ContactProfileModalProps) {
  const tOptions = useTranslations("options");
  const { initiateCall } = useCallContext();
  const { getContact } = useContacts();

  const contact = peerId ? getContact(peerId) : undefined;
  const resolved = resolveDisplayName(
    {
      userId: peerId,
      phone: phone || contact?.phoneNumber,
      profileDisplayName: contact?.displayName || name,
    },
    contact
  );

  const displayTitle = resolved.title || name;
  const displayAvatar = avatarUrl || contact?.avatarUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        overlayClassName="bg-black/50 dark:bg-black/75 backdrop-blur-xs"
        className="sm:max-w-md bg-white dark:bg-[#111B21] border border-slate-200/80 dark:border-[#222D34] p-0 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-[#1D2A8A] via-[#254BCC] to-[#3B58F5] dark:from-[#0B141A] dark:via-[#15222E] dark:to-[#1E3A8A] relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>
        
        {/* Avatar & Basic Info */}
        <div className="px-6 pb-6 relative -mt-16 flex flex-col items-center">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={getOptimizedImageUrl(displayAvatar)}
                alt={displayTitle}
                className="h-32 w-32 rounded-full border-4 border-white dark:border-[#111B21] object-cover shadow-lg bg-white dark:bg-[#202C33]"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-white dark:border-[#111B21] bg-[#E6EAFA] dark:bg-[#202C33] flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-[#3B58F5] dark:text-[#38BDF8]">
                  {displayTitle.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isOnline && (
              <div className="absolute bottom-2 right-2 h-6 w-6 rounded-full border-[3px] border-white dark:border-[#111B21] bg-emerald-500 shadow-sm" />
            )}
          </div>
          
          <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-[#E9EDEF]">{displayTitle}</h2>
          {resolved.subtitle && (
            <p className="mt-0.5 text-slate-500 dark:text-[#8696A0] font-medium text-[15px]">{resolved.subtitle}</p>
          )}
          {phone ? (
            <p className="mt-1 text-slate-500 dark:text-[#8696A0] font-medium text-[15px]">{phone}</p>
          ) : (
            <p className="mt-1 text-slate-400 dark:text-[#8696A0] font-medium text-[14px]">Phone number hidden</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6 w-full max-w-[280px]">
            <button
              onClick={() => {
                initiateCall(peerId, "AUDIO", displayTitle, displayAvatar || undefined);
                onClose();
              }}
              disabled={isBlocked}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F4F6FC] dark:bg-[#202C33] hover:bg-[#E6EAFA] dark:hover:bg-[#2A3942] py-3 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer border border-transparent dark:border-[#2A3942]/60"
            >
              <Phone className="h-6 w-6 text-[#3B58F5] dark:text-[#38BDF8]" fill="currentColor" />
              <span className="text-[13px] font-bold text-[#3B58F5] dark:text-[#38BDF8]">Audio</span>
            </button>
            <button
              onClick={() => {
                initiateCall(peerId, "VIDEO", displayTitle, displayAvatar || undefined);
                onClose();
              }}
              disabled={isBlocked}
              className="flex-1 flex flex-col items-center justify-center gap-2 bg-[#F4F6FC] dark:bg-[#202C33] hover:bg-[#E6EAFA] dark:hover:bg-[#2A3942] py-3 rounded-2xl transition-colors disabled:opacity-50 cursor-pointer border border-transparent dark:border-[#2A3942]/60"
            >
              <Video className="h-6 w-6 text-[#3B58F5] dark:text-[#38BDF8]" fill="currentColor" />
              <span className="text-[13px] font-bold text-[#3B58F5] dark:text-[#38BDF8]">Video</span>
            </button>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-[#222D34] my-6" />

          {/* Additional Options */}
          <div className="w-full flex flex-col gap-2">
            {onOpenSecurityCode && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSecurityCode();
                }}
                className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-[#F4F6FC] dark:hover:bg-[#202C33] transition-colors group text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#00A884]/15 dark:bg-[#00A884]/20 group-hover:bg-[#00A884]/25 flex items-center justify-center text-[#00A884]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-[#E9EDEF] text-sm block">
                      Encryption
                    </span>
                    <span className="text-xs text-slate-500 dark:text-[#8696A0]">
                      Messages are end-to-end encrypted. Tap to verify.
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-[#8696A0] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {onBlockUser && (
              <button
                onClick={() => {
                  onBlockUser();
                  onClose();
                }}
                className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 transition-colors group cursor-pointer"
              >
                <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-950/40 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 flex items-center justify-center">
                  <Ban className="h-5 w-5 text-red-500 dark:text-red-400" />
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
