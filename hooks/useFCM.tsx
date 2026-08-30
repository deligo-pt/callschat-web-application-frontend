import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import NotificationService from '@/services/notification.service';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { playNotificationSound } from '@/utils/sounds';
import { WhatsAppNotificationCard } from '@/components/notifications/WhatsAppNotificationCard';
import React from 'react';

export const useFCM = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Use refs so the onMessage closure always has the latest path without re-running the effect
  const currentPathRef = useRef(pathname);
  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const setupFCM = async () => {
      // 1. Ensure this hook only runs if the user is authenticated.
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) return;

      if (!messaging) {
        console.warn('Firebase messaging is not supported or initialized.');
        return;
      }

      try {
        // 2. Request Notification permissions
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Register the Service Worker manually to pass the environment variables as URL parameters
          // This allows the SW to access the config without a bundler plugin. We add a version string to force bypass cache.
          const swUrl = `/firebase-messaging-sw.js?v=2&apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&authDomain=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&storageBucket=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;
          
          await navigator.serviceWorker.register(swUrl);
          
          // Wait for the service worker to become active
          const activeRegistration = await navigator.serviceWorker.ready;
          
          // 3. Get FCM Token
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: activeRegistration,
          });

          if (currentToken) {
            // 4. Sync token to the backend
            await NotificationService.syncFCMToken(currentToken);
            console.log('[FCM] Token synchronized successfully');
          } else {
            console.log('[FCM] No registration token available.');
          }
        } else {
          console.log('[FCM] Notification permission not granted.');
        }
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.message?.includes('push service error') || error?.code === 'messaging/permission-blocked') {
          console.debug('[FCM] Push notifications not available or blocked in this environment (' + (error?.message || error) + ')');
        } else {
          console.warn('[FCM] Could not initialize push notifications:', error?.message || error);
        }
      }
    };

    setupFCM();

    // 5. Set up the foreground listener
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Received foreground message', payload);
        
        const data = payload.data || {};
        const type = data.type; // 'CHAT' | 'GROUP' | 'CALL' | 'incoming_call'
        const routeId = data.routeId;

        // Call Interception: bypass the standard toast and trigger our full-screen Ringing UI
        const isIncomingCall =
          type === 'CALL' ||
          type === 'incoming_call' ||
          type === 'GROUP_CALL' ||
          Boolean(data.call_id || data.callId);

        if (isIncomingCall) {
          playNotificationSound('call');
          window.dispatchEvent(new CustomEvent('fcm:incoming_call', { detail: data }));
          return;
        }

        const currentPath = currentPathRef.current;
        const messageRoute = type === 'GROUP' 
          ? `/groups/${routeId}` 
          : `/chats/${routeId}`;
        
        const isCurrentlyInThisChat = currentPath === messageRoute;

        if (isCurrentlyInThisChat) {
          // The user is actively staring at this exact conversation.
          // Do NOT show a toast. Just play a soft in-chat pop.
          playNotificationSound('message');
        } else {
          // The user is somewhere else in the application.
          // Play the alert sound
          playNotificationSound('message');
          
          const isGroup = type === 'GROUP';
          const title = payload.notification?.title || data.senderName || (isGroup ? 'Group Message' : 'New Message');
          const body = payload.notification?.body || data.message || data.body || '';
          const senderAvatar = data.senderAvatar || null;
          const senderName = data.senderName;

          // Trigger WhatsApp style sonner toast
          toast.custom(
            (t) => (
              <WhatsAppNotificationCard
                title={title}
                senderName={isGroup ? senderName : undefined}
                isGroup={isGroup}
                displayText={body || 'New message'}
                avatarUrl={senderAvatar}
                timestamp="Just now"
                onClick={() => {
                  toast.dismiss(t);
                  routerRef.current.push(messageRoute);
                }}
                onClose={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toast.dismiss(t);
                }}
              />
            ),
            {
              duration: 5000,
            }
          );
        }
      });

      // Cleanup listener on unmount
      return () => {
        unsubscribe();
      };
    }
  }, []); // Empty dependency array prevents re-registering FCM on every navigation!
};
