import AddStoryPresenter from "../../presenter/add-story-presenter";

export default class AddStoryPage {
  constructor() {}

  async render() {
    return `      <section class="container">
        <h1 style="text-align: center; font-size: 2.5rem; margin-bottom: 1.5rem; color: #254D70; text-shadow: 1px 1px 3px rgba(0,0,0,0.1);">💥 Tambah Cerita Baru 💥</h1><form id="add-story-form">
          <label for="description">Deskripsi:</label>
          <textarea id="description" name="description" placeholder="Ceritakan pengalamanmu di sini..." required></textarea><br />

          <label for="image">Gambar (unggah atau gunakan kamera):</label>
          <input type="file" id="image" name="image" accept="image/*" /><br />          <div class="camera-section">
            <button type="button" id="activate-camera-button">Aktifkan Kamera</button><br />
            <video id="camera-video" autoplay playsinline style="width: 100%; max-width: 400px; display: none;"></video><br />
            <button type="button" id="camera-take-button" style="display: none;">Ambil Gambar</button><br />
            <canvas id="camera-canvas" style="display: none;"></canvas>
            <ul id="camera-list-output"></ul>
          </div><br /><label for="location">Lokasi (klik atau geser marker):</label>
          <div id="map" style="height: 400px; width: 100%; margin: 20px 0; border-radius: 8px; z-index: 0;"></div>
          <p id="location-coordinates">Latitude: -, Longitude: -</p><br />

          <button type="submit">Tambah Cerita</button>
        </form>        <!-- Loading indicator -->
        <div id="loading-indicator" style="display: none; text-align: center; margin-top: 20px;">
          <p>✨ Sedang membuat cerita kamu...</p>
        </div>
      </section>
    `;
  }
  async afterRender() {
    // Inisialisasi presenter untuk form dan map
    const presenter = new AddStoryPresenter();
    await presenter.init();
  }
}