// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// We extract the query parameters from the Service Worker registration URL
// This allows us to pass environment variables without a bundler plugin
const params = new URL(location).searchParams;

const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
};

// Only initialize if we have the config (meaning it was registered with query params)
if (firebaseConfig.apiKey) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const type = payload.data?.type;
      
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions: any = {
        body: payload.notification?.body || '',
        icon: payload.data?.senderAvatar || '/icon.png',
        data: payload.data || {}
      };

      if (type === 'CALL') {
        notificationOptions.requireInteraction = true;
      }

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
  }
}

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  const data = event.notification.data;
  if (!data || !data.routeId) {
    return;
  }

  const routeId = data.routeId;
  const type = data.type; // 'CHAT' | 'GROUP' | 'CALL'

  let targetUrl = '/';
  if (type === 'CHAT') {
    targetUrl = '/chats/' + routeId;
  } else if (type === 'GROUP') {
    targetUrl = '/groups/' + routeId;
  } else if (type === 'CALL') {
    targetUrl = '/'; // Calls usually happen on the main screen overlaid
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          client.focus();
          // Optional: send message to client to force navigation if it's an SPA
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }
      
      // If we couldn't find an open tab for this specific route, just focus any existing app tab and navigate
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: targetUrl });
          return;
        }
      }

      // If no windows are open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
