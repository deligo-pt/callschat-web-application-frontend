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
        
        const deviceId = localStorage.getItem("deviceId") || "web-" + Date.now();
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
          setRecipientPublicKey(res.data[0].publicKey);
        }
      } catch (err) {
        console.error("Failed to fetch recipient public key", err);
      }
    };
    
    setupKeys();
  }, [recipientId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("chat:join_room", { conversationId });

    const handleReceiveMessage = async (payload: any) => {
      if (payload.conversationId !== conversationId) return;
      
      if (myPrivateKey && recipientPublicKey && payload.ciphertext && payload.nonce) {
        try {
          const text = await decryptMessage(
            payload.ciphertext,
            payload.nonce,
            recipientPublicKey,
            myPrivateKey
          );
          
          setMessages(prev => [...prev, {
            id: payload.id || Date.now().toString(),
            conversationId: payload.conversationId,
            senderId: payload.senderId,
            text,
            createdAt: payload.createdAt || new Date().toISOString()
          }]);
        } catch (err) {
          console.error("Failed to decrypt message", err);
        }
      }
    };

    socket.on("chat:receive_message", handleReceiveMessage);

    return () => {
      socket.off("chat:receive_message", handleReceiveMessage);
    };
  }, [socket, isConnected, conversationId, myPrivateKey, recipientPublicKey]);

  const sendMessage = useCallback(async (text: string, currentUserId: string) => {
    if (!socket || !isConnected || !myPrivateKey || !recipientPublicKey) {
      console.error("Cannot send message. Missing keys or socket connection.");
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
