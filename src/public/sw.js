const CACHE_NAME = 'story-app-v1';

// Daftar asset yang akan di-cache
const assetsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/app.css',
  '/manifest.json',
  '/favicon.png',
  '/images/logo.png',
  '/images/placeholder.png',
  '/images/icons/icon-48x48.png',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Install event - Cache semua asset
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell and content');
        return cache.addAll(assetsToCache);
      })
      .catch((error) => {
        console.error('❌ Error caching app shell:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - Hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Push event - menangani notifikasi yang masuk
self.addEventListener('push', (event) => {
  console.log('📬 Push event received:', event);
  
  let notificationData = {
    title: 'Story berhasil dibuat',
    body: 'Anda telah membuat story baru',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'story-notification',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Handle different types of push data
  if (event.data) {
    try {
      // Try to parse as JSON first
      const pushData = event.data.json();
      console.log('📨 Push data (JSON):', pushData);
      
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.options?.body || pushData.body || notificationData.body,
        icon: pushData.options?.icon || pushData.icon || notificationData.icon,
        badge: pushData.options?.badge || pushData.badge || notificationData.badge,
        tag: pushData.options?.tag || pushData.tag || notificationData.tag,
        data: pushData.data || notificationData.data
      };
    } catch (jsonError) {
      // If JSON parsing fails, try to get as text
      try {
        const textData = event.data.text();
        console.log('📨 Push data (text):', textData);
        
        // If it's a simple text message, use it as body
        if (textData && textData.trim()) {
          notificationData.body = textData;
        }
      } catch (textError) {
        console.error('❌ Error parsing push data as text:', textError);
      }
    }
  }

  // Show notification
  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'view',
          title: '👀 Lihat'
        },
        {
          action: 'close',
          title: '❌ Tutup'
        }
      ]
    }
  ).catch(error => {
    console.error('❌ Error showing notification:', error);
    
    // Fallback: try to show a simple notification
    return self.registration.showNotification('Story App', {
      body: 'Anda memiliki notifikasi baru',
      tag: 'fallback-notification'
    });
  });

  event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Fetch event - Different strategies for API and static assets
self.addEventListener('fetch', (event) => {
  // Abaikan request dari chrome extension
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For API calls, use network-first strategy
  if (event.request.url.includes('dicoding.dev')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Don't cache API responses
          return networkResponse;
        })
        .catch((error) => {
          console.error('❌ API fetch failed:', error);
          // Try to get from cache if network fails
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return new Response(JSON.stringify({ error: 'Network error' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }

        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Handle 404 images
            if (networkResponse.status === 404 && event.request.url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
              console.log('🖼️ Image not found, using placeholder:', event.request.url);
              return caches.match('/images/placeholder.png');
            }
            
            // Cache successful static asset responses
            if (networkResponse.status === 200) {
              // Don't cache if it's not a GET request
              if (event.request.method === 'GET') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
            }
            return networkResponse;
          });
      })
      .catch((error) => {
        console.error('❌ Fetch failed:', error);
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
          return caches.match('/images/placeholder.png');
        }
        return new Response('Offline - Content not available');
      })
  );
});
