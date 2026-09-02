"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useFCM } from "@/hooks/useFCM";
import { useGlobalNotifications } from "@/hooks/useGlobalNotifications";

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
      // If server forcibly disconnected or auth failed, try connecting again
      if (reason === "io server disconnect") {
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      // Ensure the latest token is present for the next attempt
      const latestToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      socketInstance.auth = { token: latestToken };
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
