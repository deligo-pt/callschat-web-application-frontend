"use client";

import React, { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { generateAndStoreKeyPair, generatePreKeyBatch, generateSignedPreKey } from "@/utils/crypto";
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
        privKey = await getUserPrivateKey(currentUserId);
      }

      const deviceId = `web-${currentUserId}`;
      localStorage.setItem("deviceId", deviceId);
      const existingRegId = localStorage.getItem("registrationId") || undefined;
      
      try {
        const res = await chatService.uploadPublicKey(deviceId, pubKey!, existingRegId);
        if (res?.registrationId) {
          localStorage.setItem("registrationId", res.registrationId);
        }
        console.log("✅ [E2EEProvider] Public key uploaded for user:", currentUserId);
      } catch (e) {
        console.error("❌ [E2EEProvider] Failed to upload public key", e);
      }

      // ── X3DH Pre-Key Pool Replenishment (Signal/WhatsApp Architecture) ─────
      try {
        // Always regenerate the signed pre-key so its private key is always
        // stored in IndexedDB — this ensures X3DH receiver decryption works
        // even after a page refresh, browser restart, or cache clear.
        if (privKey) {
          const signedPreKey = await generateSignedPreKey(currentUserId, 1, privKey);

          const preKeyCount = await chatService.fetchPreKeyCount(deviceId);
          console.log("🔑 [E2EEProvider] Current unconsumed OPK count:", preKeyCount);

          if (preKeyCount < 20) {
            console.log("⚡ [E2EEProvider] Replenishing One-Time Prekeys pool...");
            const startId = (Date.now() % 1000000) + Math.floor(Math.random() * 1000);
            const oneTimePreKeys = await generatePreKeyBatch(currentUserId, startId, 50);

            await chatService.uploadPreKeys({
              deviceId,
              signedPreKey,
              oneTimePreKeys,
            });
            console.log("✅ [E2EEProvider] Replenished 50 OPKs & refreshed Signed PreKey!");
          } else {
            // Only refresh the signed pre-key (no new OPKs needed yet)
            await chatService.uploadPreKeys({
              deviceId,
              signedPreKey,
            });
            console.log("✅ [E2EEProvider] Refreshed Signed PreKey (OPK pool sufficient).");
          }
        }
      } catch (preKeyErr) {
        console.warn("⚠️ [E2EEProvider] Prekey check/upload warning:", preKeyErr);
      }
    };

    setupKeys();
  }, [user, isLoading]);

  return <>{children}</>;
}
