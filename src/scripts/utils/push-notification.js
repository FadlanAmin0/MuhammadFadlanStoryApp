export default class PushNotificationService {
  constructor() {
    this.vapidPublicKey = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
    this.baseUrl = 'https://story-api.dicoding.dev/v1';
    this.isSubscribed = false;
    this.swRegistration = null;
  }

  async initializeServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready:', this.swRegistration);
        return true;
      } else {
        console.warn('⚠️ Service Worker not supported');
        return false;
      }
    } catch (error) {
      console.error('❌ Service Worker initialization failed:', error);
      return false;
    }
  }

  async requestNotificationPermission() {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ Browser tidak mendukung notifikasi');
        return false;
      }

      console.log('🔔 Current notification permission:', Notification.permission);

      if (Notification.permission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }

      if (Notification.permission === 'denied') {
        console.warn('❌ Notifikasi ditolak oleh user');
        alert('Notifikasi diblokir. Silakan aktifkan notifikasi di pengaturan browser untuk fitur ini.');
        return false;
      }

      // Request permission
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.warn('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async subscribeToPushNotification() {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker belum terdaftar');
      }

      // Check permission first
      if (Notification.permission !== 'granted') {
        const permissionGranted = await this.requestNotificationPermission();
        if (!permissionGranted) {
          throw new Error('Permission notifikasi diperlukan untuk fitur ini');
        }
      }

      console.log('🔔 Attempting to subscribe to push notifications...');

      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('ℹ️ Already subscribed, updating server...');
        await this.sendSubscriptionToServer(existingSubscription);
        this.isSubscribed = true;
        localStorage.setItem('pushSubscribed', 'true');
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('✅ Push subscription created:', subscription);

      // Send to server
      await this.sendSubscriptionToServer(subscription);
      this.isSubscribed = true;
      localStorage.setItem('pushSubscribed', 'true');
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to push notification:', error);
      throw error;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token tidak ditemukan. Silakan login kembali.');
      }

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
        }
      };

      console.log('📤 Sending subscription to server:', {
        endpoint: subscriptionData.endpoint,
        keys: 'hidden for security'
      });

      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Subscription sent to server successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending subscription to server:', error);
      throw error;
    }
  }

  async unsubscribeFromPushNotification() {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker belum terdaftar');
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        console.log('ℹ️ Tidak ada subscription aktif');
        this.isSubscribed = false;
        localStorage.removeItem('pushSubscribed');
        return;
      }

      // Remove from server first
      await this.removeSubscriptionFromServer(subscription);

      // Then unsubscribe from browser
      await subscription.unsubscribe();
      
      this.isSubscribed = false;
      localStorage.removeItem('pushSubscribed');
      
      console.log('✅ Berhasil unsubscribe dari push notification');
    } catch (error) {
      console.error('❌ Error unsubscribing from push notification:', error);
      throw error;
    }
  }

  async removeSubscriptionFromServer(subscription) {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server response error:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Subscription removed from server:', result);
      return result;
    } catch (error) {
      console.error('❌ Error removing subscription from server:', error);
      throw error;
    }
  }

  async checkSubscriptionStatus() {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = !!subscription;
      
      console.log('ℹ️ Subscription status:', this.isSubscribed);
      return this.isSubscribed;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing push notification service...');
      
      // Initialize service worker
      const swInitialized = await this.initializeServiceWorker();
      if (!swInitialized) {
        console.error('❌ Service Worker initialization failed');
        return false;
      }

      // Check subscription status
      await this.checkSubscriptionStatus();

      console.log('✅ Push notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notification:', error);
      return false;
    }
  }

  // Test notification method
  async testNotification() {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'Ini adalah test notifikasi lokal',
          icon: '/icons/icon-192x192.png',
          tag: 'test-notification'
        });
        return true;
      } else {
        console.warn('⚠️ Notification permission not granted');
        return false;
      }
    } catch (error) {
      console.error('❌ Error showing test notification:', error);
      return false;
    }
  }
}
