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
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("clear_chat_title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("clear_chat_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>{tCommon("cancel")}</AlertDialogCancel>
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
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBlockedByMe ? t("unblock_title") : t("block_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBlockedByMe
                ? t("unblock_desc")
                : t("block_desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>{tCommon("cancel")}</AlertDialogCancel>
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
                  ? t("unblocking")
                  : t("blocking")
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
