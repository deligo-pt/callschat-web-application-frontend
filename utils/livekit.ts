/**
 * Resolves the LiveKit WebSocket server URL based on the current execution environment.
 * Handles:
 *  1. LAN IP / Hostname dynamic mapping (e.g., when accessing via 192.168.x.x from mobile/other devices)
 *  2. HTTPS / Mixed Content protocol upgrading (ws:// -> wss://)
 *  3. Fallback to NEXT_PUBLIC_LIVEKIT_URL or local default
 */
export function resolveLivekitUrl(rawUrl?: string): string {
  let url = rawUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  if (typeof window !== "undefined") {
    const isHttps = window.location.protocol === "https:";
    const hostname = window.location.hostname;

    // 1. Upgrade ws:// to wss:// if page is loaded over HTTPS to prevent Mixed Content security block
    if (isHttps && url.startsWith("ws://")) {
      url = url.replace(/^ws:\/\//i, "wss://");
    }

    // 2. If client is on a LAN IP / custom hostname and URL points to localhost, rewrite with actual host
    if (
      hostname &&
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      (url.includes("localhost") || url.includes("127.0.0.1"))
    ) {
      url = url.replace("localhost", hostname).replace("127.0.0.1", hostname);
    }
  }

  return url;
}
