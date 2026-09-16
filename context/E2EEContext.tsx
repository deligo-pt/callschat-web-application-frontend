"use client";

import { createContext, useContext } from "react";

// =============================================================================
// E2EE Context
// Broadcasts crypto readiness and the current user's public key app-wide.
// Produced by E2EEProvider; consumed by useChat and any component that needs
// to gate behaviour on key initialisation being complete.
// =============================================================================

export interface E2EEContextType {
  /** True once E2EEProvider has finished loading (or generating) keys. */
  keysReady: boolean;
  /** The current user's identity public key (Base64), or null while loading. */
  myPublicKey: string | null;
}

export const E2EEContext = createContext<E2EEContextType>({
  keysReady: false,
  myPublicKey: null,
});

export const useE2EE = (): E2EEContextType => useContext(E2EEContext);
