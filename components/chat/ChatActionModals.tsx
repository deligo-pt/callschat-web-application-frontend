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
            <AlertDialogTitle>Clear chat history?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear this chat? This action cannot be
              undone on your end.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isClearing}
              onClick={(e) => {
                e.preventDefault();
                handleClearChat();
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isClearing ? "Clearing..." : "Clear Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBlockUserOpen} onOpenChange={setIsBlockUserOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBlockedByMe ? "Unblock this contact?" : "Block this contact?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBlockedByMe
                ? "They will be able to send you messages and call you again."
                : "They will no longer be able to send you messages or call you."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
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
                  ? "Unblocking..."
                  : "Blocking..."
                : isBlockedByMe
                  ? "Unblock User"
                  : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
