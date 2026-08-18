"use client";

import React, { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { generateAndStoreKeyPair } from "@/utils/crypto";
import { getUserPrivateKey, getUserPublicKey } from "@/utils/keyStore";
import { chatService } from "@/services/chat.service";

export function E2EEProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  useEffect(() => {
    const setupKeys = async () => {
      if (typeof window === "undefined" || !user?.id || isLoading) return;

      const currentUserId = user.id;
      let privKey = await getUserPrivateKey(currentUserId);
      let pubKey = await getUserPublicKey(currentUserId);

      if (!privKey || !pubKey) {
        pubKey = await generateAndStoreKeyPair(currentUserId);
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
