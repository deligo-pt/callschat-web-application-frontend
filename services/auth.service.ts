import apiClient from './api.client';

// ---------------------------------------------------------------------------
// Auth Service
// Handles QR code token generation for the web login flow.
// ---------------------------------------------------------------------------

/**
 * Generates a one-time QR login token from the backend.
 * The browser must first connect to /qr-auth Socket.IO namespace to get a socketId.
 *
 * @param socketId - The socket ID from the /qr-auth namespace connection.
 * @returns { qrToken, expiresIn } — token to render as QR code, TTL in seconds.
 */
export async function generateQrToken(
  socketId: string,
): Promise<{ qrToken: string; expiresIn: number }> {
  const res = await apiClient.get<{
    success: true;
    data: { qrToken: string; expiresIn: number };
  }>('/auth/qr/generate', {
    params: { socketId },
  });
  return res.data.data;
}
