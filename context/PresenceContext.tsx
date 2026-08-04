"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { getActiveUsers, type ActiveUser } from "@/services/presence.service";

// =============================================================================
// PresenceContext
// Location: context/PresenceContext.tsx
//
// Architecture:
//   - activeUsers[]       — ordered array of ActiveUser objects for the tray UI.
//   - onlineIds (Set ref) — O(1) membership test; stored as a ref so badge
//     lookups never trigger a global re-render.
//   - onlineIdsState      — mirrored Set exposed for reactive consumers (e.g.
//     components that need to re-render when presence changes).
//
// Lifecycle:
//   1. On mount: GET /user/active → populate both structures.
//   2. Socket event `user:online`  → SADD userId; push to activeUsers if known.
//   3. Socket event `user:offline` → SREM userId; filter from activeUsers.
//   4. Cleanup: socket.off both listeners on unmount or socket change.
//
// Re-render strategy:
//   isUserOnline() reads from a ref — safe to call in render without causing
//   cascading re-renders.  Components that need to react to changes (e.g. the
//   badge on the chat list) subscribe via the `onlineIdsState` Set which only
//   updates when the set's contents actually change.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresenceContextValue {
  /** Ordered list of online contacts for the Active Now tray. */
  activeUsers: ActiveUser[];
  /** Reactive Set of online user IDs — use for badge rendering. */
  onlineIds: Set<string>;
  /** O(1) presence check — safe to call inline in render. */
  isUserOnline: (userId: string) => boolean;
  /** True while the initial REST call is in-flight. */
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PresenceContext = createContext<PresenceContextValue>({
  activeUsers: [],
  onlineIds: new Set(),
  isUserOnline: () => false,
  isLoading: true,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [onlineIdsState, setOnlineIdsState] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Mutable ref for O(1) lookups without re-renders.
  const onlineIdsRef = useRef<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Helper: sync the ref AND the state atom together atomically.
  // We derive the next Set from the previous one to avoid stale closures.
  // ---------------------------------------------------------------------------
  const commitOnlineIds = useCallback((next: Set<string>) => {
    onlineIdsRef.current = next;
    setOnlineIdsState(new Set(next)); // new Set to trigger reference equality check
  }, []);

  // ---------------------------------------------------------------------------
  // Initial load — runs once on mount (no dependency on socket so it fires
  // even if the socket connects slightly later).
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const users = await getActiveUsers();
        if (cancelled) return;

        const ids = new Set(users.map((u) => u.id));
        setActiveUsers(users);
        commitOnlineIds(ids);
      } catch (err) {
        console.error("[Presence] Initial load failed:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [commitOnlineIds]);

  // ---------------------------------------------------------------------------
  // Socket event subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const handleUserOnline = ({ userId }: { userId: string }) => {
      // 1. Always add to the fast-lookup set immediately so badges update.
      const next = new Set(onlineIdsRef.current);
      next.add(userId);
      commitOnlineIds(next);

      // 2. If this user isn't in the tray yet (they came online AFTER page
      //    load so the initial REST call missed them), re-fetch the full list
      //    to pull in their name + avatar for the Active Now tray.
      setActiveUsers((prev) => {
        const alreadyInTray = prev.some((u) => u.id === userId);
        if (!alreadyInTray) {
          // Fire the refresh asynchronously; when it resolves the tray
          // will re-render with the new user included.
          getActiveUsers().then((freshList) => {
            setActiveUsers(freshList);
            // Also sync onlineIds with the freshly fetched set so the two
            // sources of truth stay consistent.
            const freshIds = new Set(freshList.map((u) => u.id));
            // Merge: keep any IDs already tracked via socket that may not
            // yet be in the REST response due to propagation delay.
            onlineIdsRef.current.forEach((id) => freshIds.add(id));
            commitOnlineIds(freshIds);
          }).catch((err) => {
            console.error("[Presence] Re-fetch on user:online failed:", err);
          });
        }
        return prev; // return prev unchanged for now; async update follows
      });
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      // Remove from the fast-lookup set.
      const next = new Set(onlineIdsRef.current);
      next.delete(userId);
      commitOnlineIds(next);

      // Remove from the visual tray array.
      setActiveUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket, commitOnlineIds]);

  // ---------------------------------------------------------------------------
  // isUserOnline — ref-backed for zero-cost reads in render
  // ---------------------------------------------------------------------------
  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineIdsRef.current.has(userId);
  }, []);

  return (
    <PresenceContext.Provider
      value={{
        activeUsers,
        onlineIds: onlineIdsState,
        isUserOnline,
        isLoading,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

/**
 * Access the global presence state from any client component.
 *
 * @example
 *   const { isUserOnline, activeUsers } = usePresence();
 *   const online = isUserOnline(contact.id);
 */
export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error("usePresence must be used inside a <PresenceProvider>");
  }
  return ctx;
}
