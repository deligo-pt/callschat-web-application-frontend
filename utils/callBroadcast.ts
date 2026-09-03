/**
 * Cross-window broadcast communication engine for CallsChat Calling Subsystem.
 * Synchronizes call state between the main chat window and standalone popup windows.
 */

import { ActiveCall } from "@/hooks/useCallSignaling";

export const CALL_SYNC_CHANNEL = "callschat_call_sync";
export const CALL_POPOUT_STORAGE_KEY = "callschat_popout_active_call";

export type CallBroadcastEvent =
  | { type: "WINDOW_READY" }
  | { type: "SYNC_ACTIVE_CALL"; payload: ActiveCall }
  | { type: "RETURN_TO_MAIN" }
  | { type: "HANGUP"; callId?: string }
  | { type: "CALL_ENDED" };

class CallBroadcastManager {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: CallBroadcastEvent) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(CALL_SYNC_CHANNEL);
        this.channel.onmessage = (event: MessageEvent<CallBroadcastEvent>) => {
          this.listeners.forEach((listener) => listener(event.data));
        };
      } catch (err) {
        console.warn("BroadcastChannel not supported or failed to initialize", err);
      }
    }
  }

  public subscribe(callback: (event: CallBroadcastEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public send(event: CallBroadcastEvent) {
    try {
      if (this.channel) {
        this.channel.postMessage(event);
      }
    } catch (err) {
      console.warn("Failed to send broadcast event", err);
    }
  }

  public saveActiveCall(call: ActiveCall | null) {
    if (typeof window === "undefined") return;
    try {
      if (call) {
        localStorage.setItem(CALL_POPOUT_STORAGE_KEY, JSON.stringify(call));
      } else {
        localStorage.removeItem(CALL_POPOUT_STORAGE_KEY);
      }
    } catch (err) {
      console.warn("Failed to save popout call to localStorage", err);
    }
  }

  public getSavedActiveCall(): ActiveCall | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(CALL_POPOUT_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn("Failed to retrieve popout call from localStorage", err);
      return null;
    }
  }
}

export const callBroadcast = new CallBroadcastManager();
