import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import apiClient from "@/services/api.client";
import { chatService } from "@/services/chat.service";
import { useTranslations } from "next-intl";

export interface ChatActionModalsProps {
  conversationId: string;
  peerId: string;
  isClearChatOpen: boolean;
  setIsClearChatOpen: (v: boolean) => void;
  isBlockUserOpen: boolean;
  setIsBlockUserOpen: (v: boolean) => void;
  onClearSuccess?: () => void;
  onBlockSuccess?: () => void;
  isBlockedByMe?: boolean;
}

export function ChatActionModals({
  conversationId,
  peerId,
  isClearChatOpen,
  setIsClearChatOpen,
  isBlockUserOpen,
  setIsBlockUserOpen,
  onClearSuccess,
  onBlockSuccess,
  isBlockedByMe,
}: ChatActionModalsProps) {
  const t = useTranslations("options");
  const tCommon = useTranslations("common");
  const [isClearing, setIsClearing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleClearChat = async () => {
    setIsClearing(true);
    try {
      // Optimistic UI: immediately wipe the messages on the screen
      onClearSuccess?.();
      setIsClearChatOpen(false);

      await chatService.clearChat(conversationId);
      toast.success("Chat cleared successfully");
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to clear chat history.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleBlockUser = async () => {
    setIsBlocking(true);
    try {
      if (isBlockedByMe) {
        await apiClient.delete(`/user/block/${peerId}`);
        toast.success("Contact unblocked successfully.");
      } else {
        await apiClient.post(`/user/block/${peerId}`);
        toast.success("Contact blocked successfully.");
      }
      setIsBlockUserOpen(false);
      onBlockSuccess?.();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.message ||
          (isBlockedByMe ? "Failed to unblock user." : "Failed to block user."),
      );
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <>
      <AlertDialog open={isClearChatOpen} onOpenChange={setIsClearChatOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111B21] border border-slate-200/80 dark:border-[#222D34] text-slate-900 dark:text-[#E9EDEF]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-[#E9EDEF]">{t("clear_chat_title")}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-[#8696A0]">
              {t("clear_chat_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing} className="dark:bg-[#202C33] dark:text-[#E9EDEF] dark:border-[#2A3942] dark:hover:bg-[#2A3942]">{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              onClick={(e) => {
                e.preventDefault();
                handleClearChat();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isClearing ? t("clearing") : t("clear_chat")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBlockUserOpen} onOpenChange={setIsBlockUserOpen}>
        <AlertDialogContent className="bg-white dark:bg-[#111B21] border border-slate-200/80 dark:border-[#222D34] text-slate-900 dark:text-[#E9EDEF]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-[#E9EDEF]">
              {isBlockedByMe ? t("unblock_title") : t("block_title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 dark:text-[#8696A0]">
              {isBlockedByMe
                ? t("unblock_desc")
                : t("block_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking} className="dark:bg-[#202C33] dark:text-[#E9EDEF] dark:border-[#2A3942] dark:hover:bg-[#2A3942]">{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBlocking}
              onClick={(e) => {
                e.preventDefault();
                handleBlockUser();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isBlocking
                ? isBlockedByMe
                : t("blocking")
                ? isBlockedByMe
                  ? t("unblock_user")
                  : t("block_user")
                : isBlockedByMe
                  ? t("unblock_user")
                  : t("block_user")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
