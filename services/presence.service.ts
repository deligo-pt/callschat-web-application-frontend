import apiClient from './api.client';

// =============================================================================
// Presence Service
// Location: services/presence.service.ts
//
// Fetches the initial list of online contacts from the backend REST endpoint.
// Real-time updates after this point are delivered via Socket.IO events
// (user:online / user:offline) handled in the PresenceProvider.
// =============================================================================

/**
 * Minimal shape returned by GET /api/v1/user/active.
 * Matches the backend ActiveUserDto exactly.
 */
export interface ActiveUser {
  id: string;
  name: string;
  avatar: string | null;
}

/**
 * Fetches the list of currently-online contacts for the authenticated user.
 *
 * The endpoint is protected by JWT; the Authorization header is automatically
 * injected by the apiClient request interceptor.
 *
 * Returns an empty array on any failure so the UI degrades gracefully.
 */
export async function getActiveUsers(): Promise<ActiveUser[]> {
  try {
    const response = await apiClient.get<{ success: boolean; data: ActiveUser[] }>(
      '/user/active',
    );
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (err) {
    console.error('[PresenceService] Failed to fetch active users:', err);
    return [];
  }
}
