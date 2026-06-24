import { useEffect, useRef } from 'react';
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
          
          const title = payload.notification?.title || 'New Message';
          const body = payload.notification?.body || '';
          const senderAvatar = data.senderAvatar;

          // Trigger a custom sonner toast
          toast.custom((t) => (
            <div 
              className="flex items-center gap-3 p-4 bg-background border border-border shadow-lg rounded-xl cursor-pointer hover:bg-muted/50 transition-colors w-[356px]"
              onClick={() => {
                toast.dismiss(t);
                routerRef.current.push(messageRoute);
              }}
            >
              {senderAvatar ? (
                <img src={senderAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
                  <span className="text-primary font-semibold">{title.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 flex flex-col overflow-hidden">
                <span className="font-semibold text-foreground text-sm truncate">{title}</span>
                <span className="text-muted-foreground text-sm line-clamp-2">{body}</span>
              </div>
            </div>
          ));
        }
      });

      // Cleanup listener on unmount
      return () => {
        unsubscribe();
      };
    }
  }, []); // Empty dependency array prevents re-registering FCM on every navigation!
};
