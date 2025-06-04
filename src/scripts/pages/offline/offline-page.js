import IndexedDBService from '../../utils/indexed-db.js';
import L from "leaflet";

class OfflinePage {
  constructor() {
    this._dbService = new IndexedDBService();
  }

  async render() {
    return `
      <main id="main-content" tabindex="-1" role="main">
        <section class="container">
          <h1>Cerita Tersimpan</h1>
          <div class="story-list" id="offline-story-list">
            <p>Memuat cerita tersimpan...</p>
          </div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    await this._loadSavedStories();
  }

  showStoryMiniMap(mapId, coords) {
    const map = L.map(mapId).setView(coords, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker(coords).addTo(map);
  }

  async _loadSavedStories() {
    try {
      const stories = await this._dbService.getAllStories();
      const storyListContainer = document.getElementById('offline-story-list');

      if (stories.length === 0) {
        storyListContainer.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p style="color: #666; font-size: 1.1em;">Tidak ada cerita tersimpan</p>
            <p style="color: #888;">Simpan cerita dari beranda untuk melihatnya secara offline</p>
          </div>`;
        return;
      }

      const storyCards = stories.map(story => this._createStoryCard(story)).join('');
      storyListContainer.innerHTML = storyCards;

      // Initialize maps for stories with location
      stories.forEach(story => {
        if (story.location?.lat && story.location?.lng) {
          this.showStoryMiniMap(
            `offline-map-${story.id}`, 
            [story.location.lat, story.location.lng]
          );
        }

        // Add delete button event listener
        const deleteBtn = document.getElementById(`delete-${story.id}`);
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            await this._deleteStory(story.id);
          });
        }
      });

    } catch (error) {
      console.error('Error loading saved stories:', error);
      const storyListContainer = document.getElementById('offline-story-list');
      storyListContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #dc3545;">
          <p>Error memuat cerita tersimpan</p>
          <small>${error.message}</small>
        </div>`;
    }
  }
  _createStoryCard(story) {
    const imageUrl = story.imageUrl || "/src/public/images/placeholder.jpg";
    
    // Format waktu pembuatan cerita
    const formattedDate = story.createdAt
      ? new Date(story.createdAt).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Tanggal tidak tersedia";

    // Tambahkan koordinat jika ada
    const coordinates = story.location?.lat && story.location?.lng 
      ? `<p class="story-coordinates"><strong>Koordinat:</strong> (${story.location.lat}, ${story.location.lng})</p>` 
      : "";

    return `
      <div class="story-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 class="story-title" style="margin-top: 0; color: #333;">${story.title || 'Untitled'}</h3>
        <img src="${imageUrl}" alt="${story.title}" class="story-image" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin: 10px 0;" />
        <p class="story-description" style="color: #666; line-height: 1.6;">${story.description || ''}</p>
        ${coordinates}
        <p class="story-date" style="color: #666;"><strong>Dibuat pada:</strong> ${formattedDate}</p>
        <p class="story-author" style="color: #666;"><strong>Oleh:</strong> ${story.name || 'Anonymous'}</p>
        ${story.location?.lat && story.location?.lng 
          ? `<div id="offline-map-${story.id}" class="story-map" style="height: 200px; margin: 1rem 0;"></div>` 
          : ""}
        <div style="margin-top: 15px;">
          <button 
            id="delete-${story.id}"
            class="delete-btn"
            style="background-color: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: background-color 0.3s;"
            onmouseover="this.style.backgroundColor='#c82333'"
            onmouseout="this.style.backgroundColor='#dc3545'"
          >
            🗑️ Hapus dari Tersimpan
          </button>
        </div>
      </div>
    `;
  }

  async _deleteStory(storyId) {
    try {
      await this._dbService.deleteStory(storyId);
      this._showNotification('Cerita berhasil dihapus!', 'success');
      await this._loadSavedStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      this._showNotification('Gagal menghapus cerita', 'error');
    }
  }

  _showNotification(message, type = 'info') {
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
      default:
        messageElement.style.backgroundColor = '#17a2b8';
    }

    messageElement.style.display = 'block';
    setTimeout(() => {
      messageElement.style.display = 'none';
    }, 3000);
  }
}

export default OfflinePage;
