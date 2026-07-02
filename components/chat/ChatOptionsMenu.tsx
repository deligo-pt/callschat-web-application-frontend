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
  Languages,
  EyeOff,
  Image as ImageIcon,
  Star,
  Trash2,
  Ban,
  Search,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { ContactService } from "@/services/contact.service";
import { ChatActionModals } from "./ChatActionModals";
import { DisappearingMessagesModal } from "./DisappearingMessagesModal";

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
}: ChatOptionsMenuProps) {
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

  const [isFavouriting, setIsFavouriting] = useState(false);

  const handleAddToFavourites = async () => {
    if (isFavouriting) return;
    setIsFavouriting(true);
    try {
      await ContactService.toggleFavouriteByUser(peerId, true);
      toast.success("Added to favourites!");
    } catch (error: any) {
      console.error("Failed to add to favourites:", error);
      toast.error(error?.response?.data?.message || "Failed to add to favourites");
    } finally {
      setIsFavouriting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-0">
            <MoreVertical className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[280px] bg-white text-[#11142D] border border-[#EEF2FF] shadow-2xl rounded-2xl p-2 font-medium"
        >
          {/* Action Items */}
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#F4F6FC] rounded-xl focus:bg-[#F4F6FC]">
            <User
              className="h-[18px] w-[18px] text-[#3B58F5]"
              strokeWidth={2.5}
            />
            <span className="text-[14.5px]">View Contact</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#F4F6FC] rounded-xl focus:bg-[#F4F6FC]">
            <Bell
              className="h-[18px] w-[18px] text-[#3B58F5]"
              strokeWidth={2.5}
            />
            <span className="text-[14.5px]">Unmute Notifications</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5 bg-[#F4F6FC]" />

          {/* Toggle Items */}
          <div
            className="flex items-center justify-between px-3 py-3 hover:bg-[#F4F6FC] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setAiProtection(!aiProtection);
            }}
          >
            <div className="flex items-center gap-3">
              <Shield
                className="h-[18px] w-[18px] text-[#3B58F5]"
                strokeWidth={2.5}
              />
              <span className="text-[14.5px]">AI Protection</span>
            </div>
            <Switch checked={aiProtection} onCheckedChange={setAiProtection} />
          </div>
          <div
            className="flex items-center justify-between px-3 py-3 hover:bg-[#F4F6FC] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setLiveTranslation(!liveTranslation);
            }}
          >
            <div className="flex items-center gap-3">
              <Languages
                className="h-[18px] w-[18px] text-[#00A884]"
                strokeWidth={2.5}
              />
              <span className="text-[14.5px]">Live Translation</span>
            </div>
            <Switch
              checked={liveTranslation}
              onCheckedChange={setLiveTranslation}
            />
          </div>
          <div
            className="flex items-center justify-between px-3 py-3 hover:bg-[#F4F6FC] rounded-xl cursor-pointer transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setPrivacyMode(!privacyMode);
            }}
          >
            <div className="flex items-center gap-3">
              <EyeOff
                className="h-[18px] w-[18px] text-[#FF7A00]"
                strokeWidth={2.5}
              />
              <span className="text-[14.5px]">Privacy Mode</span>
            </div>
            <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
          </div>

          <DropdownMenuSeparator className="my-1.5 bg-[#F4F6FC]" />

          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#F4F6FC] rounded-xl focus:bg-[#F4F6FC]"
            onClick={onMediaInfoClick}
          >
            <ImageIcon
              className="h-[18px] w-[18px] text-[#3B58F5]"
              strokeWidth={2.5}
            />
            <span className="text-[14.5px]">Media Info</span>
          </DropdownMenuItem>

          {/* ── Disappearing Messages ─────────────────────────────────────── */}
          <DropdownMenuItem
            className="flex items-center justify-between gap-3 px-3 py-3 cursor-pointer hover:bg-[#F4F6FC] rounded-xl focus:bg-[#F4F6FC]"
            onClick={(e) => {
              e.preventDefault();
              setIsDisappearOpen(true);
            }}
          >
            <div className="flex items-center gap-3">
              <Timer
                className="h-[18px] w-[18px] text-[#7C3AED]"
                strokeWidth={2.5}
              />
              <span className="text-[14.5px]">Disappearing Messages</span>
            </div>
            {disappearValue !== null && (
              <span className="text-[11px] font-bold text-[#7C3AED] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {disappearValue === 30 ? "30s"
                  : disappearValue === 300 ? "5m"
                  : disappearValue === 3600 ? "1h"
                  : disappearValue === 86400 ? "24h"
                  : disappearValue === 604800 ? "7d"
                  : "90d"}
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#F4F6FC] rounded-xl focus:bg-[#F4F6FC]"
            onClick={handleAddToFavourites}
            disabled={isFavouriting}
          >
            <Star
              className="h-[18px] w-[18px] text-[#FFB020]"
              strokeWidth={2.5}
            />
            <span className="text-[14.5px]">{isFavouriting ? "Adding..." : "Add to Favorites"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5 bg-[#F4F6FC]" />

          {/* Destructive Items */}
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-red-50 rounded-xl focus:bg-red-50 focus:text-red-600 text-red-500 transition-colors"
            onClick={() => setIsClearChatOpen(true)}
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.5} />
            <span className="text-[14.5px]">Clear Chat</span>
          </DropdownMenuItem>
          {!blockStatus?.hasBlockedMe && (
            <DropdownMenuItem
              className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-red-50 rounded-xl focus:bg-red-50 focus:text-red-600 text-red-500 transition-colors"
              onClick={() => setIsBlockUserOpen(true)}
            >
              <Ban className="h-[18px] w-[18px]" strokeWidth={2.5} />
              <span className="text-[14.5px]">
                {blockStatus?.isBlockedByMe ? "Unblock" : "Block"}
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
        currentValue={disappearValue}
        onUpdated={(v) => {
          setDisappearValue(v);
          onDisappearUpdated?.(v);
        }}
      />
    </>
  );
}
