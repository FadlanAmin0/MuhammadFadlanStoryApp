import { getData, getDataById } from "../data/api";

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async init() {
    try {
      console.log("🔄 Memulai pengambilan cerita...");

      //  Promise.all = mengoptimalkan pengambilan data
      const stories = await getData();

      if (!stories || stories.length === 0) {
        this.view.showError("Tidak ada cerita yang tersedia.");
        return;
      }

      // Validasi atribut sebelum ditampilkan
      const validatedStories = stories.map((story) => ({
        ...story,
        createdAt: story.createdAt || new Date().toISOString(),
      }));

      this.view.showStories(validatedStories);
      console.log("✅ Cerita berhasil dimuat.");
    } catch (error) {
      console.error("❌ Error saat memuat cerita:", error.message);
      this.view.showError("Gagal memuat cerita. Silakan coba lagi nanti.");
    }
  }

  async fetchAndShowDetail(storyId) {
    try {
      console.log(`🔄 Mengambil detail cerita dengan ID: ${storyId}`);
      const story = await getDataById(storyId);

      // Validasi data lokasi
      if (!story.location || typeof story.location.lat !== "number" || typeof story.location.lng !== "number") {
        console.warn(`⚠️ Cerita dengan ID ${storyId} tidak memiliki lokasi valid.`);
      }

      // Validasi dan tambahkan fallback untuk createdAt
      story.createdAt = story.createdAt || new Date().toISOString();

      this.view.showStoryDetail(story);
      console.log("✅ Detail cerita berhasil dimuat.");
    } catch (error) {
      console.error("❌ Error saat memuat detail cerita:", error.message);
      this.view.showError("Gagal memuat detail cerita.");
    }
  }

  async getStories() {
    try {
      console.log("📡 Mengambil daftar cerita...");
      const stories = await getData();

      if (!stories.length) {
        console.warn("❌ Tidak ada cerita yang tersedia.");
        return [];
      }

      return stories.map((story) => ({
        ...story,
        createdAt: story.createdAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("❌ Error saat mendapatkan daftar cerita:", error.message);
      throw error;
    }
  }
}
