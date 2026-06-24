import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { groupService } from "@/services/group.service";
import { chatService } from "@/services/chat.service";
import { encryptGroupMessage, decryptGroupMessage, decryptMessage } from "@/utils/crypto";

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "document" | null;
  sender?: {
    profile?: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
}

export const useGroupChat = (groupId: string, currentUserId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Keep plaintext group key in a ref so listeners always have it
  const groupKeyRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>(currentUserId);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // ── Setup: Fetch & Decrypt Symmetric Group Key ─────────────────────────────
  useEffect(() => {
    if (!groupId || !currentUserId) return;

    const setupGroupKey = async () => {
      try {
        setIsReady(false);
        setError(null);

        // 1. Fetch group details to find the creator
        const groupRes = await groupService.fetchGroupDetails(groupId);
        if (!groupRes.success || !groupRes.data) {
          throw new Error("Failed to load group details");
        }
        const creatorId = groupRes.data.createdBy;

        // 2. Fetch the user's encrypted group key
        const keyRes = await groupService.fetchGroupKey(groupId);
        if (!keyRes.success || !keyRes.data?.encryptedGroupKey) {
          throw new Error("You do not have a cryptographic key for this group");
        }
        const { encryptedGroupKey, keyNonce } = keyRes.data;

        // 3. Fetch creator's public key
        const creatorKeyRes = await chatService.fetchRecipientKey(creatorId);
        let creatorPubKey: string;
        if (creatorKeyRes?.data && Array.isArray(creatorKeyRes.data) && creatorKeyRes.data.length > 0) {
          creatorPubKey = creatorKeyRes.data[creatorKeyRes.data.length - 1].publicKey;
        } else if (creatorKeyRes?.success && creatorKeyRes?.data?.publicKey) {
          creatorPubKey = creatorKeyRes.data.publicKey;
        } else {
          throw new Error("Could not find creator's public key to decrypt group key");
        }

        // 4. Fetch my private key
        const privKeyName = `privateKey_${currentUserId}`;
        const myPrivKey = localStorage.getItem(privKeyName);
        if (!myPrivKey) {
          throw new Error("Missing local private key");
        }

        // 5. Decrypt the group key
        const plaintextGroupKey = await decryptMessage(
          encryptedGroupKey,
          keyNonce,
          creatorPubKey,
          myPrivKey
        );

        groupKeyRef.current = plaintextGroupKey;

        // 6. Load History
        const historyRes = await groupService.fetchGroupMessages(groupId);
        if (historyRes.success && Array.isArray(historyRes.data)) {
          const decryptedHistory = await Promise.all(
            historyRes.data.map(async (msg: any) => {
              try {
                if (!msg.ciphertext || !msg.nonce) {
                  return {
                    ...msg,
                    text: msg.mediaUrl ? "" : "🔒 Missing cipher data",
                    groupId: msg.groupId || msg.conversationId,
                  };
                }
                const text = await decryptGroupMessage(
                  msg.ciphertext,
                  msg.nonce,
                  plaintextGroupKey
                );
                return {
                  id: msg.id,
                  groupId: msg.groupId || msg.conversationId,
                  senderId: msg.senderId,
                  text,
                  createdAt: msg.createdAt,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  sender: msg.sender,
                };
              } catch (err) {
                return {
                  id: msg.id,
                  groupId: msg.groupId || msg.conversationId,
                  senderId: msg.senderId,
                  text: "🔒 Encrypted Message (Decryption Failed)",
                  createdAt: msg.createdAt,
                  mediaUrl: msg.mediaUrl,
                  mediaType: msg.mediaType,
                  sender: msg.sender,
                };
              }
            })
          );
          
          decryptedHistory.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setMessages(decryptedHistory);
        }

        setIsReady(true);
      } catch (err: any) {
        console.error("Failed to setup group chat:", err);
        setError(err.message || "Failed to unlock group keys");
      }
    };

    setupGroupKey();
  }, [groupId, currentUserId]);

  // ── Socket: Join Room ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    console.log("🔌 [Socket] Joining group room:", groupId);
    socket.emit("group:join_room", { groupId });

    const handleJoinedRoom = (payload: any) => {
      console.log("✅ [Socket] Successfully joined group room:", payload);
    };

    socket.on("group:joined_room", handleJoinedRoom);

    return () => {
      socket.off("group:joined_room", handleJoinedRoom);
    };
  }, [socket, isConnected, groupId]);

  // ── Socket: Receive Messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected || !groupId) return;

    const handleReceiveMessage = async (payload: any) => {
      console.log("📥 [Socket] Received group:receive_message:", payload);

      if (payload.groupId !== groupId) return;

      const gKey = groupKeyRef.current;
      if (!gKey) {
        console.error("⚠️ [Socket] Missing group key — cannot decrypt incoming message");
        return;
      }

      if (payload.ciphertext && payload.nonce) {
        try {
          const text = await decryptGroupMessage(
            payload.ciphertext,
            payload.nonce,
            gKey
          );

          setMessages((prev) => {
            const hasRealId = prev.some((m) => m.id === payload.id);
            if (hasRealId) return prev;

            const optimisticIdx = prev.map((m) => m.id).lastIndexOf(
              prev.slice().reverse().find((m) => m.id.startsWith("optimistic-"))?.id ?? ""
            );
            
            if (optimisticIdx !== -1 && payload.senderId === currentUserIdRef.current) {
              const updated = [...prev];
              updated[optimisticIdx] = {
                id: payload.id,
                groupId: payload.groupId,
                senderId: payload.senderId,
                text,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                sender: payload.sender,
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                groupId: payload.groupId,
                senderId: payload.senderId,
                text,
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                sender: payload.sender,
              },
            ];
          });
        } catch (err) {
          console.error("❌ [Socket] Failed to decrypt group message:", err);
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [
              ...prev,
              {
                id: payload.id || Date.now().toString(),
                groupId: payload.groupId,
                senderId: payload.senderId || "unknown",
                text: "🔒 Encrypted group message (Decryption Failed)",
                createdAt: payload.createdAt || new Date().toISOString(),
                mediaUrl: payload.mediaUrl,
                mediaType: payload.mediaType,
                sender: payload.sender,
              },
            ];
          });
        }
      } else if (payload.mediaUrl || payload.mediaType) {
        // Media-only message without text
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [
            ...prev,
            {
              id: payload.id || Date.now().toString(),
              groupId: payload.groupId,
              senderId: payload.senderId || "unknown",
              text: "",
              createdAt: payload.createdAt || new Date().toISOString(),
              mediaUrl: payload.mediaUrl,
              mediaType: payload.mediaType,
              sender: payload.sender,
            },
          ];
        });
      }
    };

    const handleGroupError = (err: any) => {
      console.error("🚨 [Socket] Group Chat Error:", err);
    };

    socket.on("group:receive_message", handleReceiveMessage);
    socket.on("group:error", handleGroupError);

    return () => {
      socket.off("group:receive_message", handleReceiveMessage);
      socket.off("group:error", handleGroupError);
    };
  }, [socket, isConnected, groupId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, file: File | null = null) => {
      const gKey = groupKeyRef.current;
      if (!socket || !isConnected || !gKey || !groupId) {
        console.error("Cannot send: missing group key, socket, or groupId");
        return;
      }

      const optimisticId = `optimistic-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          groupId,
          senderId: currentUserIdRef.current,
          text: file ? "Uploading media..." : text,
          createdAt: new Date().toISOString(),
          // Don't populate sender so it looks like "You"
        },
      ]);

      try {
        let mediaUrl;
        let mediaType;

        if (file) {
          setIsUploading(true);
          const uploadRes = await groupService.uploadGroupMedia(groupId, file);
          if (uploadRes.success && uploadRes.data) {
            mediaUrl = uploadRes.data.mediaUrl;
            mediaType = uploadRes.data.mediaType;
          }
          setIsUploading(false);
        }

        let ciphertext, nonce;
        if (text) {
          const encrypted = await encryptGroupMessage(text, gKey);
          ciphertext = encrypted.ciphertext;
          nonce = encrypted.nonce;
        }

        const payload = { groupId, ciphertext, nonce, mediaUrl, mediaType };
        socket.emit("group:send_message", payload);
        
        if (!text) {
          // If media only, optimistic message will be replaced by socket echo
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        }
      } catch (err) {
        console.error("Failed to encrypt and send group message:", err);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setIsUploading(false);
      }
    },
    [socket, isConnected, groupId]
  );

  return {
    messages,
    sendMessage,
    isReady,
    error,
    isUploading,
    getGroupKey: () => groupKeyRef.current,
  };
};
