/**
 * E2EE Outbox Service
 *
 * Manages outgoing messages that are temporarily deferred because the recipient
 * device has not yet uploaded its PreKey bundle (e.g. mobile app closed/backgrounded).
 *
 * Lifecycle:
 * 1. Sender attempts to send -> Backend dispatches silent FCM wake-up to recipient device.
 * 2. Message is enqueued here with status 'WAITING_FOR_PEER_KEY'.
 * 3. A 30-second countdown begins.
 * 4. When recipient device comes online and uploads keys, backend emits 'e2ee:peer_key_updated'.
 * 5. useChat/useGlobalKeySync picks up the event, fetches the queue via getPendingForPeer(peerId),
 *    encrypts, and sends each message.
 * 6. If 30 seconds elapse without keys, message transitions to 'FAILED' with retry capability.
 */

export interface PendingOutboxMessage {
  optimisticId: string;
  conversationId: string;
  peerId: string;
  text?: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  replyToId?: string | null;
  queuedAt: number;
  status: 'WAITING_FOR_PEER_KEY' | 'FAILED';
}

const STORAGE_KEY = 'calls_e2ee_pending_outbox';
const TIMEOUT_MS = 30_000; // 30 seconds

class E2EEOutboxService {
  private queue: Map<string, PendingOutboxMessage> = new Map();
  private timers: Map<string, any> = new Map();
  private isHydrated = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.hydrate();
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      const items = Array.from(this.queue.values());
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[E2EEOutbox] Failed to persist outbox to sessionStorage:', e);
    }
  }

  public hydrate() {
    if (this.isHydrated || typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: PendingOutboxMessage[] = JSON.parse(raw);
        const now = Date.now();
        for (const item of items) {
          this.queue.set(item.optimisticId, item);
          const elapsed = now - item.queuedAt;
          if (item.status === 'WAITING_FOR_PEER_KEY') {
            const remaining = Math.max(0, TIMEOUT_MS - elapsed);
            if (remaining > 0) {
              this.startTimer(item.optimisticId, remaining);
            } else {
              item.status = 'FAILED';
            }
          }
        }
      }
      this.isHydrated = true;
    } catch (e) {
      console.warn('[E2EEOutbox] Failed to hydrate outbox:', e);
    }
  }

  private startTimer(optimisticId: string, durationMs: number = TIMEOUT_MS) {
    if (this.timers.has(optimisticId)) {
      clearTimeout(this.timers.get(optimisticId));
    }

    const timer = setTimeout(() => {
      this.handleTimeout(optimisticId);
    }, durationMs);

    this.timers.set(optimisticId, timer);
  }

  private handleTimeout(optimisticId: string) {
    this.timers.delete(optimisticId);
    const item = this.queue.get(optimisticId);
    if (!item) return;

    if (item.status === 'WAITING_FOR_PEER_KEY') {
      item.status = 'FAILED';
      this.persist();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('e2ee:outbox_status_changed', {
            detail: {
              optimisticId,
              conversationId: item.conversationId,
              peerId: item.peerId,
              status: 'FAILED',
            },
          })
        );
      }
    }
  }

  public enqueue(
    msg: Omit<PendingOutboxMessage, 'queuedAt' | 'status'>
  ): PendingOutboxMessage {
    const item: PendingOutboxMessage = {
      ...msg,
      queuedAt: Date.now(),
      status: 'WAITING_FOR_PEER_KEY',
    };

    this.queue.set(item.optimisticId, item);
    this.persist();
    this.startTimer(item.optimisticId, TIMEOUT_MS);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('e2ee:outbox_status_changed', {
          detail: {
            optimisticId: item.optimisticId,
            conversationId: item.conversationId,
            peerId: item.peerId,
            status: 'WAITING_FOR_PEER_KEY',
          },
        })
      );
    }

    return item;
  }

  public getPendingForPeer(peerId: string): PendingOutboxMessage[] {
    return Array.from(this.queue.values()).filter(
      (m) => m.peerId === peerId && m.status === 'WAITING_FOR_PEER_KEY'
    );
  }

  public getPendingForConversation(conversationId: string): PendingOutboxMessage[] {
    return Array.from(this.queue.values()).filter(
      (m) => m.conversationId === conversationId
    );
  }

  public getMessage(optimisticId: string): PendingOutboxMessage | undefined {
    return this.queue.get(optimisticId);
  }

  public remove(optimisticId: string) {
    if (this.timers.has(optimisticId)) {
      clearTimeout(this.timers.get(optimisticId));
      this.timers.delete(optimisticId);
    }
    const removed = this.queue.delete(optimisticId);
    if (removed) {
      this.persist();
    }
  }

  public markRetrying(optimisticId: string): boolean {
    const item = this.queue.get(optimisticId);
    if (!item) return false;

    item.status = 'WAITING_FOR_PEER_KEY';
    item.queuedAt = Date.now();
    this.persist();
    this.startTimer(optimisticId, TIMEOUT_MS);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('e2ee:outbox_status_changed', {
          detail: {
            optimisticId,
            conversationId: item.conversationId,
            peerId: item.peerId,
            status: 'WAITING_FOR_PEER_KEY',
          },
        })
      );
    }
    return true;
  }

  public clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.queue.clear();
    this.persist();
  }
}

export const e2eeOutboxService = new E2EEOutboxService();
