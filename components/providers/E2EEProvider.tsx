"use client";

import React, { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { generateAndStoreKeyPair } from "@/utils/crypto";
import { chatService } from "@/services/chat.service";

export function E2EEProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  useEffect(() => {
    const setupKeys = async () => {
      if (typeof window === "undefined" || !user?.id || isLoading) return;

      const currentUserId = user.id;
      const privKeyName = `privateKey_${currentUserId}`;
      const pubKeyName = `publicKey_${currentUserId}`;

      let privKey = localStorage.getItem(privKeyName);
      let pubKey = localStorage.getItem(pubKeyName);

      if (!privKey || !pubKey) {
        pubKey = await generateAndStoreKeyPair(currentUserId);
        privKey = localStorage.getItem(privKeyName);
      }

      const deviceId = `web-${currentUserId}`;
      localStorage.setItem("deviceId", deviceId);
      
      try {
        await chatService.uploadPublicKey(deviceId, pubKey!);
        console.log("✅ [E2EEProvider] Public key uploaded for user:", currentUserId);
      } catch (e) {
        console.error("❌ [E2EEProvider] Failed to upload public key", e);
      }
    };

    setupKeys();
  }, [user, isLoading]);

  return <>{children}</>;
}
