// src/scripts/index.js
import "../styles/styles.css";
import App from "./pages/app";

// Register Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered successfully:', registration);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 New service worker found');
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New service worker installed');
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.log('⚠️ Service Worker not supported in this browser');
    return null;
  }
};

// Fungsi skip to content
function setupSkipToContent() {
  const mainContent = document.querySelector("#main-content");
  const skipLink = document.querySelector(".skip-link");

  if (!mainContent || !skipLink) return;

  skipLink.addEventListener("click", function (event) {
    event.preventDefault();
    skipLink.blur();
    mainContent.focus();
    mainContent.scrollIntoView();
  });
}

// Initialize Push Notification Service
const initializePushNotification = async () => {
  try {
    // Tunggu service worker ready
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
      console.log('🔔 Service Worker ready for push notifications');
    }
  } catch (error) {
    console.error('❌ Error initializing push notification:', error);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  console.log('🚀 Application starting...');

  // Register Service Worker first
  await registerServiceWorker();

  // Initialize app
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  // Setup accessibility
  setupSkipToContent(); // Jalankan saat pertama kali load
  
  // Render initial page
  await app.renderPage();

  // Initialize push notifications after app is ready
  await initializePushNotification();

  // Handle hash changes
  window.addEventListener("hashchange", async () => {
    console.log("🔁 Hash changed");
    await app.renderPage();
    setupSkipToContent(); // Ulangi setup skip setiap render halaman baru
  });

  console.log('✅ Application initialized successfully');
});

// Handle page load event (fallback)
window.addEventListener('load', async () => {
  console.log('📄 Page loaded');
  
  // Ensure service worker is registered even if DOMContentLoaded already fired
  if (!navigator.serviceWorker.controller) {
    await registerServiceWorker();
  }
});

// Handle service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from service worker:', event.data);
    
    // Handle different message types
    switch (event.data.type) {
      case 'NOTIFICATION_CLICKED':
        console.log('🔔 Notification was clicked');
        break;
      case 'PUSH_RECEIVED':
        console.log('📬 Push notification received');
        break;
      default:
        console.log('📨 Unknown message type:', event.data.type);
    }
  });
}

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('🌐 App is online');
});

window.addEventListener('offline', () => {
  console.log('📴 App is offline');
});

// Export for debugging purposes
window.debugApp = {
  registerServiceWorker,
  setupSkipToContent,
  initializePushNotification
};
