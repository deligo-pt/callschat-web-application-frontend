"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { E2EEContext } from "@/context/E2EEContext";
import { initSignalIdentity, getOrGenerateSignedPreKey, generatePreKeyBatch, getSignalProtocolStore } from "@/utils/signalCrypto";
import { getUserPrivateKey, getUserPublicKey } from "@/utils/keyStore";
import { chatService } from "@/services/chat.service";
import { KeyRestoreModal } from "@/components/settings/KeyRestoreModal";

export function E2EEProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [keysReady, setKeysReady] = useState(false);
  const [myPublicKey, setMyPublicKey] = useState<string | null>(null);
  const [restoreBackupData, setRestoreBackupData] = useState<any | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const initKeys = useCallback(async (skipCloudCheck = false) => {
    if (typeof window === "undefined" || !user?.id || isLoading) return;

    const currentUserId = user.id;

    // 1. Check for cloud key backup if fresh device/browser
    const privKey = await getUserPrivateKey(currentUserId);
    const pubKey = await getUserPublicKey(currentUserId);

    if (!privKey || !pubKey) {
      if (!skipCloudCheck) {
        try {
          const cloudBackup = await chatService.fetchKeyBackup();
          if (cloudBackup && cloudBackup.encryptedVault) {
            setRestoreBackupData(cloudBackup);
            setShowRestoreModal(true);
            return; // Wait for user to enter PIN — keysReady stays false
          }
        } catch (backupCheckErr) {
          console.warn('[E2EEProvider] Cloud backup check warning:', backupCheckErr);
        }
      }
    }

    // 2. Initialize official Signal Protocol Identity (33-byte DJB Identity Key + Registration ID)
    const signalIdentity = await initSignalIdentity(currentUserId);

    const deviceId = `web-${currentUserId}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('deviceId', deviceId);
      localStorage.setItem('registrationId', String(signalIdentity.registrationId));
    }

    // 3. Register Signal Identity Key with Backend Directory
    try {
      const res = await chatService.uploadPublicKey(
        deviceId,
        signalIdentity.identityKeyBase64,
        String(signalIdentity.registrationId)
      );
      if (res?.registrationId && typeof window !== 'undefined') {
        localStorage.setItem('registrationId', String(res.registrationId));
      }
    } catch (e) {
      console.error('[E2EEProvider] Failed to upload public key to directory:', e);
    }

    // 4. X3DH Pre-Key Pool Replenishment (Signal Protocol Architecture)
    try {
      const signedPreKey = await getOrGenerateSignedPreKey(currentUserId, 1);
      const store = getSignalProtocolStore(currentUserId);
      const localOpkCount = await store.getLocalPreKeyCount();
      const serverPreKeyCount = await chatService.fetchPreKeyCount(deviceId);

      // If either local store or server pool has fewer than 20 OPKs, regenerate a fresh batch of 50 OPKs
      if (localOpkCount < 20 || serverPreKeyCount < 20) {
        const startId = (Date.now() % 1000000) + Math.floor(Math.random() * 1000);
        const oneTimePreKeys = await generatePreKeyBatch(currentUserId, startId, 50);

        await chatService.uploadPreKeys({
          deviceId,
          signedPreKey,
          oneTimePreKeys,
        });
      } else {
        await chatService.uploadPreKeys({
          deviceId,
          signedPreKey,
        });
      }
    } catch (preKeyErr) {
      console.warn('[E2EEProvider] Pre-key check/upload warning:', preKeyErr);
    }

    // 5. Broadcast keysReady with Signal Identity Public Key
    setMyPublicKey(signalIdentity.identityKeyBase64);
    setKeysReady(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("e2ee:keys_restored"));
    }
  }, [user, isLoading]);

  useEffect(() => {
    initKeys(false);
  }, [initKeys]);

  const handleRestored = async () => {
    setShowRestoreModal(false);
    setRestoreBackupData(null);
    await initKeys(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("e2ee:keys_restored"));
    }
  };

  const handleSkipRestore = () => {
    setShowRestoreModal(false);
    setRestoreBackupData(null);
    initKeys(true);
  };

  return (
    <E2EEContext.Provider value={{ keysReady, myPublicKey }}>
      <>
        {children}
        {showRestoreModal && restoreBackupData && user?.id && (
          <KeyRestoreModal
            isOpen={showRestoreModal}
            userId={user.id}
            backupData={restoreBackupData}
            onRestored={handleRestored}
            onSkip={handleSkipRestore}
          />
        )}
      </>
    </E2EEContext.Provider>
  );
}
