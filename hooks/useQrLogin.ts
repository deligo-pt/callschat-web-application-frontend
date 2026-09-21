"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { generateQrToken } from "@/services/auth.service";
import {
  generateEphemeralKeyPair,
  decryptKeyFromMobile,
  derivePublicKeyFromPrivate,
  normalizeCurve25519Key,
  base64ToBytes,
  bytesToBase64,
} from "@/utils/crypto";
import { chatService } from "@/services/chat.service";
import { storeUserKeys } from "@/utils/keyStore";

// ---------------------------------------------------------------------------
// QR Login State Machine
// ---------------------------------------------------------------------------

export type QrLoginStatus =
  | "connecting"   // Establishing /qr-auth socket connection
  | "generating"   // Fetching token from backend
  | "ready"        // QR code is displayed, waiting for scan
  | "scanned"      // Mobile app has scanned, waiting for server confirmation
  | "success"      // Tokens received — logging in
  | "expired"      // Token TTL exceeded before scan
  | "error";       // Network or unexpected error

interface QrLoginState {
  status: QrLoginStatus;
  /** The full JSON-encoded QR code value: { t: qrToken, k: webEphPub }
   * This is what gets rendered inside <QRCode value={qrValue} /> */
  qrValue: string | null;
  countdown: number;      // Seconds remaining before token refresh
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const QR_TTL_SECONDS = 60;

const SOCKET_URL =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_BASE_URL?.replace("/api/v1", ""))) ||
  "http://localhost:8000";

export function useQrLogin() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The ephemeral private key stays in a ref — NEVER in state (not serialised/stored)
  const webEphPrivRef = useRef<string | null>(null);
  // The ephemeral public key needs to be accessible during token fetch refresh cycles
  const webEphPubRef = useRef<string | null>(null);

  const [state, setState] = useState<QrLoginState>({
    status: "connecting",
    qrValue: null,
    countdown: QR_TTL_SECONDS,
    errorMessage: null,
  });

  // ---------------------------------------------------------------------------
  // Token generation + countdown management
  // ---------------------------------------------------------------------------

  const fetchAndDisplayToken = useCallback(async (socketId: string) => {
    setState((prev) => ({ ...prev, status: "generating", qrValue: null, countdown: QR_TTL_SECONDS }));

    // Clear any running timers from the previous cycle
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

    try {
      // Fetch the backend token
      const { qrToken, expiresIn } = await generateQrToken(socketId);

      // Build the QR code value as JSON containing BOTH:
      //   t = the qrToken (64-char hex) — used by backend to look up this session
      //   k = the web ephemeral public key  — used by Android to encrypt the private key
      // The Android app parses this JSON to extract both values.
      const qrValue = JSON.stringify({ t: qrToken, k: webEphPubRef.current });

      setState((prev) => ({ ...prev, status: "ready", qrValue, countdown: expiresIn }));

      // Countdown timer — ticks every second
      countdownTimerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.countdown <= 1) {
            return { ...prev, countdown: 0, status: "expired" };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);

      // Auto-refresh slightly before expiry (at 55s) to avoid the gap.
      // On refresh we generate a FRESH ephemeral keypair so each QR cycle
      // uses independent key material.
      refreshTimeoutRef.current = setTimeout(async () => {
        if (socketRef.current?.id) {
          // New ephemeral keypair for this new QR cycle
          const freshKp = await generateEphemeralKeyPair();
          webEphPrivRef.current = freshKp.privateKey;
          webEphPubRef.current = freshKp.publicKey;
          fetchAndDisplayToken(socketRef.current.id);
        }
      }, (expiresIn - 5) * 1000);
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Failed to generate QR code. Please refresh the page.",
      }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Socket setup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/qr-auth`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Backend will immediately emit 'connected' with socketId
    });

    socket.on("connected", async ({ socketId }: { socketId: string }) => {
      // Generate the ephemeral keypair ONCE when the socket connects.
      // webEphPub → encoded into QR code (safe to share)
      // webEphPriv → held in memory only (used to decrypt on success)
      const kp = await generateEphemeralKeyPair();
      webEphPrivRef.current = kp.privateKey;
      webEphPubRef.current = kp.publicKey;

      fetchAndDisplayToken(socketId);
    });

    // ---------------------------------------------------------------------------
    // THE KEY EVENT: emitted by the backend when mobile app scans the QR
    // ---------------------------------------------------------------------------
    socket.on(
      "qr-auth-success",
      async (data: {
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
        // Optional — present if Android app supports key sync (Option A)
        encryptedPrivKey?: string;
        mobileEphPub?: string;
        encryptionNonce?: string;
      }) => {
        // Clear timers — no more refreshes needed
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

        setState((prev) => ({ ...prev, status: "success" }));

        // Persist JWT tokens (same as normal login flow)
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=2592000`;
        if (data.refreshToken) {
          document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=2592000`;
        }

        // ── Key Sync (Option A) ──────────────────────────────────────────────
        // If the Android app sent the encrypted private key, decrypt it now
        // using the ephemeral private key we generated when the QR code was shown.
        if (data.encryptedPrivKey && data.mobileEphPub && data.encryptionNonce && webEphPrivRef.current) {
          try {
            const privKey = await decryptKeyFromMobile(
              data.encryptedPrivKey,
              data.mobileEphPub,
              data.encryptionNonce,
              webEphPrivRef.current,
            );
            const pubKey = await derivePublicKeyFromPrivate(privKey);

            // Decode userId from the JWT to name the key correctly
            const userId = (() => {
              try {
                const b64 = data.accessToken.split(".")[1];
                const payload = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
                return payload.sub as string | null;
              } catch { return null; }
            })();

            if (userId) {
              try {
                const res = await chatService.fetchRecipientKey(userId);
                
                // Helper: Normalize 32-byte or 33-byte Curve25519 public key (strips 0x05 prefix if present)
                const toNormalizedBase64 = (keyStr: string): string => {
                  try {
                    const bytes = base64ToBytes(keyStr.trim());
                    const normalized = normalizeCurve25519Key(bytes);
                    return bytesToBase64(normalized);
                  } catch {
                    return keyStr.trim();
                  }
                };

                const normalizedDerivedPub = toNormalizedBase64(pubKey);

                let isKeyMatch = false;

                // Server returns list of public keys for all devices registered to the user
                if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                  // Check if the synced key matches any registered device public key in normalized form
                  isKeyMatch = res.data.some((device: { publicKey: string }) =>
                    toNormalizedBase64(device.publicKey) === normalizedDerivedPub
                  );

                  // Fallback: If only previous web companion keys exist (no mobile key uploaded yet),
                  // accept the master identity key from the authenticated mobile scanner
                  const hasRegisteredMobileDevice = res.data.some((device: { deviceId?: string }) =>
                    device.deviceId && !device.deviceId.startsWith("web-")
                  );
                  if (!isKeyMatch && !hasRegisteredMobileDevice) {
                    console.info("[QR Login] No mobile device key was previously stored on backend. Accepting synced mobile key.");
                    isKeyMatch = true;
                  }
                } else if (res?.data?.publicKey) {
                  isKeyMatch = toNormalizedBase64(res.data.publicKey) === normalizedDerivedPub;
                } else if (typeof res?.data === "string") {
                  isKeyMatch = toNormalizedBase64(res.data) === normalizedDerivedPub;
                } else {
                  // If no key was previously stored on the backend, this key is valid
                  isKeyMatch = true;
                }

                if (!isKeyMatch) {
                  throw new Error("Key signature mismatch: derived public key does not match any registered keys.");
                }
              } catch (validationErr) {
                console.error("[QR Login] Key validation failed:", validationErr);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setState((prev) => ({
                  ...prev,
                  status: "error",
                  errorMessage: "Security mismatch: the synchronized key does not match your account. Login aborted."
                }));
                webEphPrivRef.current = null;
                webEphPubRef.current = null;
                socketRef.current?.disconnect();
                return;
              }
              
              await storeUserKeys(userId, privKey, pubKey);
            }
            // Only store user-specific keys
            console.log("[QR Login] ✅ Encryption keypair synced from mobile device.");
          } catch (err) {
            // Key decryption failed — not fatal. User can still use the app
            // but old encrypted messages won't be readable on this session.
            console.warn("[QR Login] ⚠️ Key sync failed — old messages may not decrypt:", err);
          }
        } else {
          // Android app doesn't support key sync yet (Phase 3 not done).
          // Log a friendly message — the app still works, old messages just can't be decrypted.
          console.info("[QR Login] ℹ️ No key sync data received. Encrypted message history unavailable until Android app implements key sync.");
        }

        // Clear the ephemeral private key from memory — it has served its purpose
        webEphPrivRef.current = null;
        webEphPubRef.current = null;

        // Short delay to let the success UI render, then navigate
        setTimeout(() => {
          router.push("/chats");
        }, 1200);
      }
    );

    socket.on("connect_error", () => {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: "Could not connect to server. Please check your connection.",
      }));
    });

    socket.on("disconnect", () => {
      setState((prev) => {
        if (prev.status === "ready" || prev.status === "generating") {
          return { ...prev, status: "error", errorMessage: "Connection lost. Please refresh." };
        }
        return prev;
      });
    });

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      // Clear sensitive material on unmount
      webEphPrivRef.current = null;
      webEphPubRef.current = null;
      socket.disconnect();
    };
  }, [fetchAndDisplayToken]);

  // ---------------------------------------------------------------------------
  // Manual refresh (user clicks "Refresh QR")
  // ---------------------------------------------------------------------------

  const refreshQrCode = useCallback(async () => {
    if (socketRef.current?.id) {
      // Generate fresh ephemeral keypair on manual refresh too
      const freshKp = await generateEphemeralKeyPair();
      webEphPrivRef.current = freshKp.privateKey;
      webEphPubRef.current = freshKp.publicKey;
      fetchAndDisplayToken(socketRef.current.id);
    }
  }, [fetchAndDisplayToken]);

  return { ...state, refreshQrCode };
}
