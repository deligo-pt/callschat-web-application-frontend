import { useState, useEffect, useCallback, useRef } from 'react';
import NotificationService, { AppNotification } from '@/services/notification.service';
import { messaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Ref to track if we've initialized the first fetch to prevent strict mode double fetching
  const initialized = useRef(false);

  const fetchNotifications = useCallback(async (pageNum: number, currentFilter: 'all' | 'unread', isLoadMore = false) => {
    try {
      setIsLoading(true);
      const response = await NotificationService.getNotifications(pageNum, 20, currentFilter);
      
      if (isLoadMore) {
        setNotifications((prev) => [...prev, ...response.data.notifications]);
      } else {
        setNotifications(response.data.notifications);
      }
      
      setUnreadCount(response.data.unreadCount);
      setHasMore(response.data.notifications.length === 20); // Limit is 20
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and filter change
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, filter, false);
  }, [filter, fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter, true);
    }
  }, [isLoading, hasMore, page, filter, fetchNotifications]);

  // Live FCM Updates
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      const data = payload.data || {};
      const type = data.type; // 'chat_message', 'CALL' etc.
      
      // Determine the routeId and AppNotification type based on the FCM data
      let appType: AppNotification['type'] = 'SYSTEM';
      let routeId: string | null = null;

      if (type === 'chat_message') {
        appType = 'MESSAGE';
        routeId = data.conversationId || null;
      } else if (type === 'CALL') {
        appType = 'CALL_MISSED'; // Assuming call pushes might be missed calls or we generalize
        routeId = data.routeId || null;
      } else if (type === 'GROUP') {
        appType = 'MESSAGE';
        routeId = data.routeId || null;
      }

      const tempId = `live-${Date.now()}`;
      
      const newNotification: AppNotification = {
        id: tempId,
        userId: 'me', // doesn't matter for local state
        issuerId: data.senderId || null,
        type: appType,
        content: payload.notification?.body || 'New notification',
        routeId,
        isRead: false,
        createdAt: new Date().toISOString(),
        issuer: {
          id: data.senderId || tempId,
          profile: {
            displayName: payload.notification?.title || 'Someone',
            username: 'user',
            avatarUrl: data.senderAvatar || null,
          }
        }
      };

      // Optimistically add to state if it matches the current filter
      if (filter === 'all' || filter === 'unread') {
        setNotifications((prev) => [newNotification, ...prev]);
      }
      
      setUnreadCount((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Don't call API for temporary live notifications since they aren't in DB yet
      // Wait, live notifications ARE in DB because backend persists them before firing FCM.
      // So we can call the API safely, but if the ID is fake, it might 404.
      // Let's just catch and ignore 404s if it was a temp ID.
      await NotificationService.markAsRead(id);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Failed to mark as read', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    filter,
    setFilter,
    loadMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
  };
}
