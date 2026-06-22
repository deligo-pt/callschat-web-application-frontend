import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { chatService } from "@/services/chat.service";
import { encryptMessage, decryptMessage, generateAndStoreKeyPair } from "@/utils/crypto";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export const useChat = (conversationId: string, recipientId: string) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [myPrivateKey, setMyPrivateKey] = useState<string | null>(null);

  useEffect(() => {
    const setupKeys = async () => {
      if (typeof window === "undefined") return;

      let privKey = localStorage.getItem("privateKey");
      let pubKey = localStorage.getItem("publicKey");
      
      if (!privKey || !pubKey) {
        pubKey = await generateAndStoreKeyPair();
        privKey = localStorage.getItem("privateKey");
        
        // Use a consistent deviceId so it overwrites old keys if local storage is cleared
        const deviceId = localStorage.getItem("deviceId") || "web-client";
        localStorage.setItem("deviceId", deviceId);
        try {
          await chatService.uploadPublicKey(deviceId, pubKey!);
        } catch (e) {
          console.error("Failed to upload public key", e);
        }
      }
      
      setMyPrivateKey(privKey);

      try {
        const res = await chatService.fetchRecipientKey(recipientId);
        if (res?.success && res?.data?.publicKey) {
          setRecipientPublicKey(res.data.publicKey);
        } else if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          // Grab the last key in the array (most recently inserted)
          setRecipientPublicKey(res.data[res.data.length - 1].publicKey);
        }
      } catch (err) {
        console.error("Failed to fetch recipient public key", err);
      }
    };
    
    setupKeys();
  }, [recipientId]);

  useEffect(() => {
    if (!conversationId || !myPrivateKey || !recipientPublicKey) return;

    const loadHistory = async () => {
      try {
        const historyRes = await chatService.fetchHistory(conversationId);
        if (historyRes?.success && historyRes?.data) {
          const rawMessages = Array.isArray(historyRes.data) ? historyRes.data : historyRes.data.messages;
          if (Array.isArray(rawMessages)) {
            const decryptedHistory = await Promise.all(
              rawMessages.map(async (msg: any) => {
                try {
                  const text = await decryptMessage(
                    msg.ciphertext,
                    msg.nonce,
                    recipientPublicKey,
                    myPrivateKey
                  );
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text,
                    createdAt: msg.createdAt,
                  };
                } catch (e) {
                  return {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    senderId: msg.senderId,
                    text: "🔒 Encrypted Message",
                    createdAt: msg.createdAt,
                  };
                }
              })
            );
            // Sort by createdAt ascending
            decryptedHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setMessages(decryptedHistory);
          }
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };

    loadHistory();
  }, [conversationId, myPrivateKey, recipientPublicKey]);

  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    socket.emit("chat:join_room", { conversationId });

    const handleReceiveMessage = async (payload: any) => {
      console.log("📥 [Socket] Received chat:receive_message payload:", payload);
      
      if (payload.conversationId !== conversationId) {
        console.log("⚠️ [Socket] Ignored message for different conversation:", payload.conversationId, "Expected:", conversationId);
        return;
      }
      
      if (!myPrivateKey) console.error("⚠️ [Socket] Missing myPrivateKey");
      if (!recipientPublicKey) console.error("⚠️ [Socket] Missing recipientPublicKey");
      
      if (myPrivateKey && recipientPublicKey && payload.ciphertext && payload.nonce) {
        try {
          const text = await decryptMessage(
            payload.ciphertext,
            payload.nonce,
            recipientPublicKey,
            myPrivateKey
          );
          
          console.log("✅ [Socket] Successfully decrypted message:", text);
          
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) {
               console.log("🔄 [Socket] Message already exists, ignoring duplicate");
               return prev;
            }
            
            return [...prev, {
              id: payload.id || Date.now().toString(),
              conversationId: payload.conversationId,
              senderId: payload.senderId,
              text,
              createdAt: payload.createdAt || new Date().toISOString()
            }];
          });
        } catch (err) {
          console.error("❌ [Socket] Failed to decrypt message", err);
        }
      } else {
        console.log("⚠️ [Socket] Missing keys or ciphertext/nonce in payload");
      }
    };

    const handleChatError = (err: any) => {
      console.error("🚨 [Socket] Chat Error:", err);
    };

    const handleJoinedRoom = (payload: any) => {
      console.log("✅ [Socket] Successfully joined room:", payload);
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("chat:error", handleChatError);
    socket.on("chat:joined_room", handleJoinedRoom);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("chat:error", handleChatError);
      socket.off("chat:joined_room", handleJoinedRoom);
    };
  }, [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey]);

  const sendMessage = useCallback(async (text: string, currentUserId: string) => {
    if (!socket || !isConnected || !myPrivateKey || !recipientPublicKey || !conversationId) {
      console.error("Cannot send message. Missing keys, socket connection, or conversationId.");
      return;
    }

    try {
      const { ciphertext, nonce } = await encryptMessage(text, recipientPublicKey, myPrivateKey);
      
      const payload = {
        conversationId,
        ciphertext,
        nonce
      };
      
      socket.emit("chat:send_message", payload);

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        conversationId,
        senderId: currentUserId,
        text,
        createdAt: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Failed to encrypt and send message", err);
    }
  }, [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey]);

  return {
    messages,
    sendMessage,
    isReady: !!(myPrivateKey && recipientPublicKey && isConnected)
  };
};
