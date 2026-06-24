import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import NotificationService from '@/services/notification.service';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';
import { playNotificationSound } from '@/utils/sounds';
import React from 'react';

export const useFCM = () => {
  const pathname = usePathname();
  const router = useRouter();

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
          // This allows the SW to access the config without a bundler plugin
          const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}&authDomain=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}&projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}&storageBucket=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}&messagingSenderId=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`;
          
          const registration = await navigator.serviceWorker.register(swUrl);
          
          // 3. Get FCM Token
          const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
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
      } catch (error) {
        console.error('[FCM] An error occurred while retrieving token or requesting permission.', error);
      }
    };

    setupFCM();

    // 5. Set up the foreground listener
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Received foreground message', payload);
        
        const data = payload.data || {};
        const type = data.type; // 'CHAT' | 'GROUP' | 'CALL'
        const routeId = data.routeId;

        // Call Interception: bypass the standard toast and trigger our full-screen Ringing UI
        if (type === 'CALL') {
          // Check if it's already active via sockets by giving sockets a tiny bit of priority,
          // but we can just trigger the fallback event and let the CallSignaling hook handle deduplication.
          playNotificationSound('call');
          window.dispatchEvent(new CustomEvent('fcm:incoming_call', { detail: data }));
          return;
        }

        // The Mute Check
        if (type === 'CHAT' && pathname === `/chats/${routeId}`) {
          playNotificationSound('message');
          return;
        }
        if (type === 'GROUP' && pathname === `/groups/${routeId}`) {
          playNotificationSound('message');
          return;
        }

        // Custom Toast for other pages
        playNotificationSound('message');
        
        if (payload.notification) {
          const title = payload.notification.title || 'New Message';
          const body = payload.notification.body || '';
          const senderAvatar = data.senderAvatar;

          toast(title, {
            description: body,
            icon: senderAvatar ? React.createElement('img', { src: senderAvatar, alt: 'avatar', className: 'w-8 h-8 rounded-full object-cover' }) : undefined,
            action: {
              label: 'Open',
              onClick: () => {
                if (type === 'CHAT') router.push(`/chats/${routeId}`);
                else if (type === 'GROUP') router.push(`/groups/${routeId}`);
                else router.push('/');
              }
            },
            classNames: {
              toast: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
              title: 'group-[.toast]:font-semibold',
              description: 'group-[.toast]:text-muted-foreground',
              actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            }
          });
        }
      });

      // Cleanup listener on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [pathname, router]);
};
