import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  MoreVertical,
  User,
  Bell,
  Shield,
  ShieldCheck,
  Languages,
  EyeOff,
  Image as ImageIcon,
  Heart,
  Trash2,
  Ban,
  Search,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { ContactService } from "@/services/contact.service";
import { chatService } from "@/services/chat.service";
import { useContacts } from "@/hooks/useContacts";
import { ChatActionModals } from "./ChatActionModals";
import { DisappearingMessagesModal } from "./DisappearingMessagesModal";
import { useTranslations } from "next-intl";

export interface ChatOptionsMenuProps {
  conversationId: string;
  peerId: string;
  onMediaInfoClick?: () => void;
  onClearSuccess?: () => void;
  blockStatus?: {
    isBlocked: boolean;
    isBlockedByMe: boolean;
    hasBlockedMe: boolean;
  } | null;
  setBlockStatus?: React.Dispatch<
    React.SetStateAction<{
      isBlocked: boolean;
      isBlockedByMe: boolean;
      hasBlockedMe: boolean;
    } | null>
  >;
  /** Current disappear setting fetched from the server (null = off). */
  disappearAfterSeconds?: number | null;
  /** Called after successful update so the parent can re-sync state. */
  onDisappearUpdated?: (newValue: number | null) => void;
  onViewContact?: () => void;
  onSecurityCodeClick?: () => void;
  isMuted?: boolean;
  onMuteToggle?: (newMuteState: boolean) => void;
}

export function ChatOptionsMenu({
  conversationId,
  peerId,
  onMediaInfoClick,
  onClearSuccess,
  blockStatus,
  setBlockStatus,
  disappearAfterSeconds: initialDisappear = null,
  onDisappearUpdated,
  onViewContact,
  onSecurityCodeClick,
  isMuted = false,
  onMuteToggle,
}: ChatOptionsMenuProps) {
  const t = useTranslations("options");
  const tNotif = useTranslations("notifications");
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const [isBlockUserOpen, setIsBlockUserOpen] = useState(false);
  const [isDisappearOpen, setIsDisappearOpen] = useState(false);
  const [disappearValue, setDisappearValue] = useState<number | null>(initialDisappear);

  // Sync when parent prop changes (e.g. after a socket update)
  React.useEffect(() => {
    setDisappearValue(initialDisappear);
  }, [initialDisappear]);

  // Mock states for toggle items
  const [aiProtection, setAiProtection] = useState(true);
  const [liveTranslation, setLiveTranslation] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  const { contacts, fetchContacts } = useContacts();
  const contact = contacts.find((c) => c.userId === peerId);
  const isFavourite = contact?.isFavourite || false;

  const [isFavouriting, setIsFavouriting] = useState(false);
  const [isMuting, setIsMuting] = useState(false);

  const handleToggleMute = async () => {
    if (isMuting) return;
    setIsMuting(true);
    try {
      await chatService.muteConversation(conversationId, !isMuted);
      if (onMuteToggle) {
        onMuteToggle(!isMuted);
      }
      toast.success(!isMuted ? "Notifications muted" : "Notifications unmuted");
    } catch (error: any) {
      console.error("Failed to toggle mute:", error);
      toast.error(error?.response?.data?.message || "Failed to update mute status");
    } finally {
      setIsMuting(false);
    }
  };

  const handleToggleFavourites = async () => {
    if (isFavouriting) return;
    setIsFavouriting(true);
    try {
      await ContactService.toggleFavouriteByUser(peerId, !isFavourite);
      await fetchContacts(); // Refresh to update local state
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent('contactsUpdated'));
      }
      toast.success(isFavourite ? t("remove_from_favorites") : t("add_to_favorites"));
    } catch (error: any) {
      console.error("Failed to toggle favourites:", error);
      toast.error(error?.response?.data?.message || "Failed to update favourite status");
    } finally {
      setIsFavouriting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-testid="chat-options-btn" className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656F] dark:text-[#8696A0] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#00A884] dark:hover:text-[#00A884] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A884]">
            <MoreVertical className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[280px] bg-white dark:bg-[#202C33] text-[#111B21] dark:text-[#E9EDEF] border border-[#E2E8F0] dark:border-[#2A3942] shadow-2xl rounded-2xl p-1.5 font-medium animate-in fade-in zoom-in-95 duration-100 z-50"
        >
          {/* Action Items */}
          <DropdownMenuItem 
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl focus:bg-[#F0F2F5] dark:focus:bg-[#182229]"
            onClick={onViewContact}
          >
            <User
              className="h-[18px] w-[18px] text-[#00A884]"
              strokeWidth={2}
            />
            <span className="text-[14px]">{t("view_contact")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl focus:bg-[#F0F2F5] dark:focus:bg-[#182229]"
            onClick={onSecurityCodeClick}
          >
            <ShieldCheck
              className="h-[18px] w-[18px] text-[#00A884]"
              strokeWidth={2}
            />
            <span className="text-[14px]">Verify security code</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-[#F0F2F5] dark:bg-[#2A3942]" />

          {/* Toggle Items */}
          <div
            data-testid="mute-toggle-btn"
            className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              handleToggleMute();
            }}
          >
            <div className="flex items-center gap-3">
              <Bell
                className="h-[18px] w-[18px] text-[#00A884]"
                strokeWidth={2}
              />
              <span className="text-[14px]">{t("mute_notifications") || "Mute notifications"}</span>
            </div>
            <Switch className="pointer-events-none" checked={isMuted} disabled={isMuting} />
          </div>
          <div
            className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setAiProtection(!aiProtection);
            }}
          >
            <div className="flex items-center gap-3">
              <Shield
                className="h-[18px] w-[18px] text-[#00A884]"
                strokeWidth={2}
              />
              <span className="text-[14px]">{t("ai_protection")}</span>
            </div>
            <Switch className="pointer-events-none" checked={aiProtection} />
          </div>
          <div
            className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setLiveTranslation(!liveTranslation);
            }}
          >
            <div className="flex items-center gap-3">
              <Languages
                className="h-[18px] w-[18px] text-[#00A884]"
                strokeWidth={2}
              />
              <span className="text-[14px]">{t("live_translation")}</span>
            </div>
            <Switch className="pointer-events-none" checked={liveTranslation} />
          </div>
          <div
            className="flex items-center justify-between px-3 py-2.5 hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setPrivacyMode(!privacyMode);
            }}
          >
            <div className="flex items-center gap-3">
              <EyeOff
                className="h-[18px] w-[18px] text-[#FF7A00]"
                strokeWidth={2}
              />
              <span className="text-[14px]">{t("privacy_mode")}</span>
            </div>
            <Switch className="pointer-events-none" checked={privacyMode} />
          </div>

          <DropdownMenuSeparator className="my-1 bg-[#F0F2F5] dark:bg-[#2A3942]" />

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl focus:bg-[#F0F2F5] dark:focus:bg-[#182229]"
            onClick={onMediaInfoClick}
          >
            <ImageIcon
              className="h-[18px] w-[18px] text-[#00A884]"
              strokeWidth={2}
            />
            <span className="text-[14px]">{t("media_info")}</span>
          </DropdownMenuItem>

          {/* ── Disappearing Messages ─────────────────────────────────────── */}
          <DropdownMenuItem
            className="flex items-center justify-between gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl focus:bg-[#F0F2F5] dark:focus:bg-[#182229]"
            onClick={(e) => {
              e.preventDefault();
              setIsDisappearOpen(true);
            }}
          >
            <div className="flex items-center gap-3">
              <Timer
                className="h-[18px] w-[18px] text-purple-600 dark:text-purple-400"
                strokeWidth={2}
              />
              <span className="text-[14px]">{t("disappearing_messages")}</span>
            </div>
            {disappearValue !== null && (
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                {disappearValue === 30 ? "30s"
                  : disappearValue === 60 ? "1m"
                  : disappearValue === 300 ? "5m"
                  : disappearValue === 3600 ? "1h"
                  : disappearValue === 86400 ? "24h"
                  : disappearValue === 604800 ? "7d"
                  : "90d"}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[#F0F2F5] dark:hover:bg-[#182229] rounded-xl focus:bg-[#F0F2F5] dark:focus:bg-[#182229]"
            onClick={handleToggleFavourites}
            disabled={isFavouriting}
          >
            <Heart
              className={`h-[18px] w-[18px] ${isFavourite ? "fill-red-500 text-red-500" : "text-[#54656F] dark:text-[#8696A0]"}`}
              strokeWidth={2}
            />
            <span className="text-[14px]">{isFavouriting ? tNotif("adding") : isFavourite ? t("remove_from_favorites") : t("add_to_favorites")}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1 bg-[#F0F2F5] dark:bg-[#2A3942]" />

          {/* Destructive Items */}
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl focus:bg-red-50 focus:text-red-600 text-red-500 transition-colors"
            onClick={() => setIsClearChatOpen(true)}
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="text-[14px]">{t("clear_chat")}</span>
          </DropdownMenuItem>
          {!blockStatus?.hasBlockedMe && (
            <DropdownMenuItem
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl focus:bg-red-50 focus:text-red-600 text-red-500 transition-colors"
              onClick={() => setIsBlockUserOpen(true)}
            >
              <Ban className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="text-[14px]">
                {blockStatus?.isBlockedByMe ? t("unblock") : t("block")}
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatActionModals
        conversationId={conversationId}
        peerId={peerId}
        isClearChatOpen={isClearChatOpen}
        setIsClearChatOpen={setIsClearChatOpen}
        isBlockUserOpen={isBlockUserOpen}
        setIsBlockUserOpen={setIsBlockUserOpen}
        onClearSuccess={onClearSuccess}
        isBlockedByMe={blockStatus?.isBlockedByMe}
        onBlockSuccess={() => {
          setBlockStatus?.((prev) =>
            prev
              ? {
                  ...prev,
                  isBlockedByMe: !prev.isBlockedByMe,
                  isBlocked: !prev.isBlockedByMe || prev.hasBlockedMe,
                }
              : { isBlocked: true, isBlockedByMe: true, hasBlockedMe: false },
          );
        }}
      />

      <DisappearingMessagesModal
        open={isDisappearOpen}
        onClose={() => setIsDisappearOpen(false)}
        conversationId={conversationId}
        peerId={peerId}
        currentValue={disappearValue}
        onUpdated={(v) => {
          setDisappearValue(v);
          onDisappearUpdated?.(v);
        }}
      />
    </>
  );
}
