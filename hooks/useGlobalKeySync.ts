"use client";

import { useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  getSignalProtocolStore,
  createSignalAddress,
  base64ToArrayBuffer,
  buildSessionFromBundle,
} from "@/utils/signalCrypto";
import { chatService } from "@/services/chat.service";

export interface PeerKeyUpdatedPayload {
  userId: string;
  deviceId: string;
  registrationId?: string | null;
  publicKey?: string;
  signedPreKey?: {
    keyId: number;
    publicKey: string;
  };
  updatedAt: string;
  type?: "identity" | "prekeys";
}

/**
 * useGlobalKeySync
 *
 * Attaches to the global Socket.io instance and listens for 'e2ee:peer_key_updated'
 * events emitted by the backend to user rooms.
 *
 * When a contact rotates their key or registers a new device:
 * 1. Invalidates the stale Signal Protocol Double Ratchet session and cached identities.
 * 2. Saves the new trusted identity into SignalProtocolStore.
 * 3. Pre-emptively builds a fresh Signal session from the peer's new Pre-Key Bundle.
 * 4. Dispatches a window-level 'e2ee:peer_key_updated' event so that:
 *    - useChat updates its active references and adds an inline safety number change notice.
 *    - useGroupChat re-distributes group Sender Keys wrapped for the peer's new key.
 */
export function useGlobalKeySync(socket: Socket | null, currentUserId: string | null) {
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handlePeerKeyUpdated = async (payload: PeerKeyUpdatedPayload) => {
      if (!payload || !payload.userId || payload.userId === currentUserId) return;

      console.log("🔑 [GlobalKeySync] Received e2ee:peer_key_updated for peer:", payload.userId, payload);

      try {
        const store = getSignalProtocolStore(currentUserId);
        const remoteAddress = createSignalAddress(payload.userId, 1);

        // 1. Invalidate stale Signal Double Ratchet session for this peer
        await store.removeSession(remoteAddress.toString());
        console.log(`[GlobalKeySync] Cleared stale Signal session for ${payload.userId}`);

        // 2. If new public key provided, update trusted identity
        if (payload.publicKey) {
          await store.saveIdentity(
            remoteAddress.toString(),
            base64ToArrayBuffer(payload.publicKey)
          );
          if (typeof window !== "undefined") {
            localStorage.setItem(`peer_pub_${payload.userId}`, payload.publicKey);
            if (payload.registrationId) {
              localStorage.setItem(`calls_registration_id_${payload.userId}`, String(payload.registrationId));
            }
          }
        }

        // 3. Pre-emptively fetch peer's new Pre-Key Bundle and establish fresh session
        try {
          const bundleRes = await chatService.fetchPreKeyBundle(payload.userId);
          const bundle = bundleRes?.data;
          if (bundle?.identityKey && bundle?.signedPreKey?.publicKey) {
            await buildSessionFromBundle(currentUserId, payload.userId, bundle, 1);
            console.log(`⚡ [GlobalKeySync] Successfully pre-established fresh Signal session with ${payload.userId}`);
          }
        } catch (fetchErr) {
          console.warn(`[GlobalKeySync] Could not pre-establish session with ${payload.userId}:`, fetchErr);
        }

        // 4. Dispatch window event for active chat and group views
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("e2ee:peer_key_updated", { detail: payload })
          );
        }
      } catch (err) {
        console.error(`[GlobalKeySync] Error handling peer key update for ${payload.userId}:`, err);
      }
    };

    socket.on("e2ee:peer_key_updated", handlePeerKeyUpdated);

    return () => {
      socket.off("e2ee:peer_key_updated", handlePeerKeyUpdated);
    };
  }, [socket, currentUserId]);
}
