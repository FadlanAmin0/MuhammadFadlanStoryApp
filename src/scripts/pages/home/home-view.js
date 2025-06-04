import L from "leaflet";

const HomeView = {
  // Remove the addSkipToContent method

  async showStories(stories) {
    const dbService = new (await import('../../utils/indexed-db.js')).default();
    const storyContainer = document.querySelector("#story-list");
    if (!storyContainer) {
      console.error("❌ Elemen #story-list tidak ditemukan.");
      return;
    }

    if (!stories || stories.length === 0) {
      storyContainer.innerHTML = "<p class='no-stories'>Tidak ada cerita yang tersedia.</p>";
      return;
    }

    storyContainer.innerHTML = stories
      .map((story) => {
        const imageUrl = story.imageUrl || "/src/public/images/placeholder.jpg";

        // Format waktu pembuatan cerita (`createdAt`)
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

        // Tambahkan koordinat ke deskripsi hanya jika koordinat valid
        const coordinates = story.location?.lat && story.location?.lng ? `<p class="story-coordinates"><strong>Koordinat:</strong> (${story.location.lat}, ${story.location.lng})</p>` : "";

        return `          <div class="story-item" data-id="${story.id}">
            <h3 class="story-title">${story.title || "Judul tidak tersedia"}</h3>
            <img src="${imageUrl}" alt="${story.title}" class="story-image" />
            <p class="story-description">${story.description || "Deskripsi tidak tersedia"}</p>
            ${coordinates}
            <p class="story-date"><strong>Dibuat pada:</strong> ${formattedDate}</p>
            <div class="story-actions" style="margin-top: 10px;">
              <button 
                class="save-story-btn" 
                data-story-id="${story.id}"
                style="background-color: lightskyblue; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;"
              >
                💾 Simpan Offline
              </button>
              <button 
                class="delete-story-btn" 
                data-story-id="${story.id}"
                style="background-color: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: none;"
              >
                🗑️ Hapus dari Tersimpan
              </button>
            </div>
            ${story.location?.lat && story.location?.lng ? `<div id="story-map-${story.id}" class="story-map" style="height: 200px; margin-top: 1rem;"></div>` : "<p class='story-no-location'></p>"}
          </div>
        `;
      })
      .join("");

    // Tambahkan peta mini untuk cerita yang memiliki lokasi valid
    stories.forEach((story) => {
      if (story.location?.lat && story.location?.lng) {
        this.showStoryMiniMap(`story-map-${story.id}`, [story.location.lat, story.location.lng]);
      }
    });

    // Setup offline storage buttons
    this._setupOfflineStorageButtons(stories);
  },

  showError(message) {
    const storyContainer = document.querySelector("#story-list");
    if (!storyContainer) {
      console.error("❌ Elemen #story-list tidak ditemukan.");
      return;
    }
    storyContainer.innerHTML = `<p class="error-message">${message}</p>`;
  },

  showStoryDetail(story) {
    // Membuat elemen halaman penuh untuk detail cerita
    const detailPage = document.createElement("div");
    detailPage.classList.add("story-detail-page");

    // Format waktu pembuatan cerita (`createdAt`)
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

    // Tambahkan koordinat hanya jika lokasi valid
    const coordinates = story.location?.lat && story.location?.lng ? `<p class="detail-coordinates"><strong>Koordinat:</strong> (${story.location.lat}, ${story.location.lng})</p>` : "";

    detailPage.innerHTML = `
      <button class="close-page">&times;</button>
      <div class="story-detail-wrapper">
        <div class="story-detail-image">
          <img src="${story.imageUrl}" alt="${story.title}" class="detail-image" />
        </div>
        <div class="story-detail-info">
          <h3 class="detail-title">${story.title}</h3>
          <p class="detail-description">${story.description}</p>
          ${coordinates}
          <p class="detail-date"><strong>Dibuat pada:</strong> ${formattedDate}</p>
          ${story.location?.lat && story.location?.lng ? `<div id="map-fullscreen" class="detail-map"></div>` : "<p class='detail-no-location'>Lokasi tidak tersedia</p>"}
        </div>
      </div>
    `;

    // Menambahkan halaman detail ke DOM
    document.body.appendChild(detailPage);

    // Tombol untuk menutup halaman penuh
    const closeButton = detailPage.querySelector(".close-page");
    closeButton.addEventListener("click", () => {
      // Hapus elemen halaman detail dari DOM tanpa memaksakan scroll ke beranda
      detailPage.remove();
      console.log("✅ Halaman detail ditutup.");
    });

    // Validasi lokasi sebelum memuat peta
    if (story.location?.lat && story.location?.lng) {
      const mapContainer = document.querySelector("#map-fullscreen");
      if (!mapContainer) {
        console.error("❌ Elemen #map-fullscreen tidak ditemukan.");
        return;
      }

      mapContainer.style.height = "400px";
      mapContainer.style.width = "100%";

      const map = L.map("map-fullscreen").setView([story.location.lat, story.location.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.marker([story.location.lat, story.location.lng]).addTo(map).bindPopup(`<strong>${story.title}</strong>`).openPopup();

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }
  },
  _setupStoryClickEvent(stories, onDetailClick) {
    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item) => {
      // Only make the story content area clickable for details
      const storyContent = item.querySelector(".story-title, .story-image, .story-description, .story-coordinates, .story-date");
      if (storyContent) {
        storyContent.style.cursor = 'pointer';
        storyContent.addEventListener("click", (e) => {
          const storyId = item.getAttribute("data-id");
          console.log(`📌 Klik pada cerita dengan ID: ${storyId}`);
          if (onDetailClick) {
            onDetailClick(storyId);
          }
        });
      }
    });
  },

  showStoryMiniMap(mapId, coords) {
    const map = L.map(mapId).setView(coords, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker(coords).addTo(map);
  },

  async _setupOfflineStorageButtons(stories) {
    const dbService = new (await import('../../utils/indexed-db.js')).default();

    // Setup buttons for each story
    for (const story of stories) {
      const saveBtn = document.querySelector(`.save-story-btn[data-story-id="${story.id}"]`);
      const deleteBtn = document.querySelector(`.delete-story-btn[data-story-id="${story.id}"]`);

      if (saveBtn && deleteBtn) {
        // Check if story is already saved
        const isSaved = await dbService.isStorySaved(story.id);
        if (isSaved) {
          saveBtn.style.display = 'none';
          deleteBtn.style.display = 'inline-block';
        }        // Save button click handler
        saveBtn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent event from bubbling up
          try {
            await dbService.saveStory(story);
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'inline-block';
            this._showNotification('Cerita berhasil disimpan!', 'success');
          } catch (error) {
            console.error('Error saving story:', error);
            this._showNotification('Gagal menyimpan cerita', 'error');
          }
        });        // Delete button click handler
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent event from bubbling up
          try {
            await dbService.deleteStory(story.id);
            saveBtn.style.display = 'inline-block';
            deleteBtn.style.display = 'none';
            this._showNotification('Cerita berhasil dihapus dari penyimpanan!', 'success');
          } catch (error) {
            console.error('Error deleting story:', error);
            this._showNotification('Gagal menghapus cerita', 'error');
          }
        });
      }
    }
  },

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
  },
};

export default HomeView;
