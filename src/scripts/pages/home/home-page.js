import HomePresenter from "../../presenter/home-presenter.js";
import HomeView from "./home-view.js";

export default class HomePage {
  constructor() {
    console.log("HomePresenter diinisialisasi dengan HomeView:");
    this.presenter = new HomePresenter({ view: HomeView });
  }

  async render() {
    return `
      <main id="main-content" tabindex="-1" role="main">
        <section class="container">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1 style="margin: 0;">Daftar Cerita</h1>
            <div class="notification-controls" style="display: flex; align-items: center; gap: 10px; position: relative; z-index: 5;">
              <button id="subscribe-btn" type="button" style="display: none; padding: 8px 18px; background-color: #254D70; color: #fff; border: 2px solid #254D70; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 8px rgba(37,77,112,0.10); transition: background 0.2s, color 0.2s, border 0.2s;">
                <span style='font-size:1.2em;'>🔔</span> Aktifkan Notifikasi
              </button>
              <button id="unsubscribe-btn" type="button" style="display: none; padding: 8px 18px; background-color: #fff; color: #254D70; border: 2px solid #254D70; border-radius: 8px; cursor: pointer; font-weight: bold; box-shadow: 0 2px 8px rgba(37,77,112,0.10); transition: background 0.2s, color 0.2s, border 0.2s;">
                <span style='font-size:1.2em;'>🔕</span> Matikan Notifikasi
              </button>
              <p id="notification-status" style="margin: 0; min-width: 200px;"></p>
            </div>
          </div>
          <div class="story-list" id="story-list">
            <p>Memuat cerita...</p>
          </div>
          <div id="story-modal" class="modal"></div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    try {
      console.log("🔄 Memulai inisialisasi halaman...");
      await this.presenter.init();
      await this._initializeNotificationControls();

      const onDetailClick = async (storyId) => {
        try {
          console.log("🔄 Memuat detail cerita dengan ID:", storyId);
          await this.presenter.fetchAndShowDetail(storyId);
        } catch (error) {
          console.error("❌ Gagal memuat detail cerita:", error.message);
        }
      };

      HomeView._setupStoryClickEvent(await this.presenter.getStories(), onDetailClick);
    } catch (error) {
      console.error("❌ Error pada afterRender:", error.message);
    }
  }

  async _initializeNotificationControls() {
    try {
      const { default: PushNotificationService } = await import('../../utils/push-notification.js');
      const pushNotificationService = new PushNotificationService();

      const subscribeBtn = document.querySelector('#subscribe-btn');
      const unsubscribeBtn = document.querySelector('#unsubscribe-btn');
      const statusElement = document.querySelector('#notification-status');

      // Inisialisasi push notification service
      const initialized = await pushNotificationService.initialize();
      
      if (!initialized) {
        statusElement.textContent = '❌ Browser tidak mendukung notifikasi push';
        statusElement.style.color = '#dc3545';
        return;
      }

      // Update UI berdasarkan status subscription
      const updateUI = async () => {
        const isSubscribed = await pushNotificationService.checkSubscriptionStatus();

        if (isSubscribed) {
          subscribeBtn.style.display = 'none';
          unsubscribeBtn.style.display = 'inline-block';
          statusElement.textContent = '✅ Notifikasi Aktif';
          statusElement.style.cssText = `
            color: #28a745;
            font-weight: bold;
            font-size: 16px;
            padding: 8px 12px;
            background-color: #e8f5e9;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 5px;
          `;
        } else {
          subscribeBtn.style.display = 'inline-block';
          unsubscribeBtn.style.display = 'none';
          statusElement.textContent = '🔕 Notifikasi Tidak Aktif';
          statusElement.style.cssText = `
            color: #6c757d;
            font-weight: bold;
            font-size: 16px;
            padding: 8px 12px;
            background-color: #f8f9fa;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 5px;
          `;
        }
      };

      await updateUI();

      // Event listener untuk subscribe
      subscribeBtn.addEventListener('click', async () => {
        try {
          subscribeBtn.disabled = true;
          subscribeBtn.textContent = 'Mengaktifkan...';
          
          await pushNotificationService.subscribeToPushNotification();
          await updateUI();
          
        } catch (error) {
          console.error('Error subscribing:', error);
          this._showNotificationMessage('Gagal mengaktifkan notifikasi: ' + error.message, 'error');
        } finally {
          subscribeBtn.disabled = false;
          subscribeBtn.textContent = '🔔 Aktifkan Notifikasi';
        }
      });

      // Event listener untuk unsubscribe
      unsubscribeBtn.addEventListener('click', async () => {
        try {
          unsubscribeBtn.disabled = true;
          unsubscribeBtn.textContent = 'Menonaktifkan...';
          
          await pushNotificationService.unsubscribeFromPushNotification();
          await updateUI();
          
          this._showNotificationMessage('Notifikasi berhasil dinonaktifkan!', 'success');
        } catch (error) {
          console.error('Error unsubscribing:', error);
          this._showNotificationMessage('Gagal menonaktifkan notifikasi: ' + error.message, 'error');
        } finally {
          unsubscribeBtn.disabled = false;
          unsubscribeBtn.textContent = '🔕 Matikan Notifikasi';
        }
      });

    } catch (error) {
      console.error('Error initializing notification controls:', error);
      const statusElement = document.querySelector('#notification-status');
      if (statusElement) {
        statusElement.textContent = '❌ Gagal menginisialisasi notifikasi';
        statusElement.style.color = '#dc3545';
      }
    }
  }

  _showNotificationMessage(message, type = 'info') {
    let messageElement = document.querySelector('#notification-message');
    
    if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'notification-message';
      messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
      `;
      document.body.appendChild(messageElement);
    }

    messageElement.textContent = message;
    
    switch (type) {
      case 'success':
        messageElement.style.backgroundColor = '#28a745';
        break;
      case 'error':
        messageElement.style.backgroundColor = '#dc3545';
        break;
      case 'warning':
        messageElement.style.backgroundColor = '#ffc107';
        messageElement.style.color = '#212529';
        break;
      default:
        messageElement.style.backgroundColor = '#17a2b8';
    }

    messageElement.style.display = 'block';

    setTimeout(() => {
      if (messageElement) {
        messageElement.style.display = 'none';
      }
    }, 5000);
  }
}
