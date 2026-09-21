"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useFCM } from "@/hooks/useFCM";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";
import { useGlobalKeySync } from "@/hooks/useGlobalKeySync";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Decode userId from JWT — same pattern used in chat page
  const currentUserId = (() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.sub || payload.id || null;
    } catch {
      return null;
    }
  })();

  // Initialize FCM when the user is authenticated
  useFCM();
  // Global socket notification listener — works from any page
  useGlobalNotifications(socket, currentUserId);
  // Global E2EE key sync listener — invalidates stale sessions and rebuilds on peer key updates
  useGlobalKeySync(socket, currentUserId);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      console.warn("[Socket] No accessToken in localStorage — skipping connection");
      return;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_BASE_URL?.replace("/api/v1", "") ||
      "http://localhost:8000";

    console.log("[Socket] Connecting to", socketUrl);

    const socketInstance = io(socketUrl, {
      auth: (cb) => {
        const currentToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        cb({ token: currentToken });
      },
      transports: ["websocket", "polling"], // allow polling fallback
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Connected — socket.id:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
      setIsConnected(false);
      // Only attempt reconnect if auth token still exists in storage
      const tokenExists = typeof window !== "undefined" && !!localStorage.getItem("accessToken");
      if (reason === "io server disconnect" && tokenExists) {
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      // Ensure the latest token is present for the next attempt
      const latestToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      socketInstance.auth = { token: latestToken };
    });

    // Handle real-time eviction when user logs in on another browser or device
    socketInstance.on("session:revoked", (data: { sessionId?: string; reason?: string; message?: string }) => {
      console.warn("[Socket] Session revoked by server:", data);
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token && data?.sessionId) {
          try {
            const payloadBase64 = token.split(".")[1];
            if (payloadBase64) {
              const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
              // If this revocation event is explicitly for a DIFFERENT session, ignore it
              if (decoded.sessionId && decoded.sessionId !== data.sessionId) {
                return;
              }
            }
          } catch {
            // If decoding fails, proceed with revocation as a safe fallback
          }
        }

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentMode");
        sessionStorage.removeItem("auth_account_mode");
        // Forcibly close socket to prevent reconnection loops
        socketInstance.disconnect();
        const reasonMsg = encodeURIComponent(
          data?.message || "You have been logged out because CallsChat Web was opened in another browser or window."
        );
        window.location.href = `/login?reason=session_revoked&message=${reasonMsg}`;
      }
    });

    // Backend emits this on successful auth
    socketInstance.on("connected", (data) => {
      console.log("[Socket] Auth confirmed by server:", data);
      socketInstance.emit("chat:sync_delivery");
      socketInstance.emit("group:sync_delivery");
    });

    // Reconnect immediately when window/tab is focused or network comes online
    const handleWindowFocus = () => {
      if (socketInstance.disconnected) {
        console.log("[Socket] Window focused & disconnected — reconnecting...");
        const latestToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        socketInstance.auth = { token: latestToken };
        socketInstance.connect();
      } else {
        socketInstance.emit("chat:sync_delivery");
        socketInstance.emit("group:sync_delivery");
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleWindowFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    setSocket(socketInstance);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
