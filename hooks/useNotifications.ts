import { useState, useEffect, useCallback, useRef } from 'react';
import NotificationService, { AppNotification } from '@/services/notification.service';
import { messaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { useSocket } from '@/components/providers/SocketProvider';
import { playNotificationSound } from '@/utils/sounds';
import { toast } from 'sonner';
import { ContactService } from '@/services/contact.service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // States for handling inline mutual contact actions
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [actionTakenIds, setActionTakenIds] = useState<Set<string>>(new Set());

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

    const handleWorkspaceChange = () => {
      setPage(1);
      fetchNotifications(1, filter, false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('workspaceModeChanged', handleWorkspaceChange);
      return () => window.removeEventListener('workspaceModeChanged', handleWorkspaceChange);
    }
  }, [filter, fetchNotifications]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter, true);
    }
  }, [isLoading, hasMore, page, filter, fetchNotifications]);

  const { socket } = useSocket();

  // Live Socket.IO Updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: AppNotification) => {
      // 3. Optimistically unshift the new notification
      if (filter === 'all' || filter === 'unread') {
        setNotifications((prev) => [notification, ...prev]);
      }
      
      // Increment unread count instantly
      setUnreadCount((prev) => prev + 1);
      
      // Play sound
      playNotificationSound('message');
    };

    // 2. Listen for the event
    socket.on('notification:new', handleNewNotification);

    // 4. Cleanup listener
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, filter]);

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

  const handleAcceptContact = async (notificationId: string, issuerId: string) => {
    try {
      // Optimistically mark as read
      handleMarkAsRead(notificationId);
      
      // Set loading state for this specific notification
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notificationId);
        return newSet;
      });

      await ContactService.addMutualContact(issuerId);
      
      toast.success('Contact added!');
      
      // Flag as resolved to hide the button
      setActionTakenIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notificationId);
        return newSet;
      });
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.info('User is already in your contacts.');
        setActionTakenIds(prev => {
          const newSet = new Set(prev);
          newSet.add(notificationId);
          return newSet;
        });
      } else {
        toast.error('Failed to add contact.');
        console.error(error);
      }
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
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
    handleAcceptContact,
    processingIds,
    actionTakenIds,
  };
}
