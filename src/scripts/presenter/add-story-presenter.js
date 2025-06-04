import { addStory } from "../data/api";
import AddStoryView from "../pages/add-story/add-story-view";
import L from "leaflet";

export default class AddStoryPresenter {
  constructor() {
    this.view = new AddStoryView();
    this.selectedLatLng = { lat: -6.2, lng: 106.8 };
    this.cameraImageBlob = null;
    this.cameraStream = null;
    this.map = null;
    this.marker = null;
    this.form = document.getElementById('add-story-form');
    this.loadingIndicator = document.getElementById('loading-indicator');
    this.isSubmitting = false; // Flag untuk mencegah multiple submission
  }
  async init() {
    // Tunggu sebentar untuk memastikan DOM sudah ready
    await this._waitForDOM();
    
    // Tambahkan delay untuk memastikan container map sudah siap
    setTimeout(() => {
      this._initMap();
      this._initCamera();
      this._initForm();
    }, 500);

    // Cleanup saat navigasi
    window.addEventListener("hashchange", () => {
      this._stopCamera();
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.marker = null;
      }
    });
  }

  async _waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        // Tunggu sebentar untuk memastikan elemen sudah ter-render
        setTimeout(resolve, 100);
      }
    });
  }

  _initMap() {
    try {
      const mapElement = document.getElementById("map");
      
      if (!mapElement) {
        console.error("❌ Map element dengan ID 'map' tidak ditemukan");
        return;
      }

      console.log("🗺️ Menginisialisasi peta...");

      // Fix untuk Leaflet default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Inisialisasi peta
      this.map = L.map("map").setView([this.selectedLatLng.lat, this.selectedLatLng.lng], 10);
      
      // Tambahkan tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
        minZoom: 1
      }).addTo(this.map);

      // Tambahkan marker
      this.marker = L.marker([this.selectedLatLng.lat, this.selectedLatLng.lng], { 
        draggable: true 
      }).addTo(this.map);

      const updateCoordinates = () => {
        const { lat, lng } = this.selectedLatLng;
        this.view.updateLocationText(lat, lng);
        console.log("📍 Koordinat diperbarui:", { lat, lng });
      };      // Event listener untuk drag marker
      this.marker.on("dragend", (e) => {
        const position = e.target.getLatLng();
        this.selectedLatLng = { lat: position.lat, lng: position.lng };
        this.view.updateLocationText(position.lat, position.lng, true);
        console.log("🖱️ Marker dipindahkan ke:", this.selectedLatLng);
      });

      // Event listener untuk klik peta
      this.map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        this.selectedLatLng = { lat, lng };
        this.marker.setLatLng([lat, lng]);
        this.view.updateLocationText(lat, lng, true);
        console.log("🖱️ Peta diklik di:", this.selectedLatLng);
      });

      // Update koordinat awal
      updateCoordinates();

      // Force resize peta setelah delay singkat
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log("✅ Peta berhasil diinisialisasi");
        }
      }, 200);

      // Tambahkan tombol untuk mendapatkan lokasi saat ini
      this._addLocationButton();

    } catch (error) {
      console.error("❌ Error saat menginisialisasi peta:", error);
      alert("Gagal memuat peta. Pastikan koneksi internet stabil.");
    }
  }

  _addLocationButton() {
    try {
      // Buat tombol untuk mendapatkan lokasi saat ini
      const locationButton = L.control({ position: 'topright' });
      
      locationButton.onAdd = () => {
        const button = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
        button.innerHTML = '📍';
        button.title = 'Gunakan lokasi saat ini';
        button.style.backgroundColor = 'white';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.cursor = 'pointer';
        
        button.onclick = () => {
          this._getCurrentLocation();
        };
        
        return button;
      };
      
      locationButton.addTo(this.map);
    } catch (error) {
      console.error("❌ Error menambahkan tombol lokasi:", error);
    }
  }  async createStory(storyData) {
    try {
      const apiData = {
        description: storyData.description,
        imageFile: storyData.photo
      };

      // Tambahkan lokasi jika ada
      if (this.selectedLatLng) {
        apiData.location = this.selectedLatLng;
      }

      // Panggil API untuk menambah story
      const result = await addStory(apiData);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error creating story:', error);
      return { success: false, message: error.message };
    }
  }

  async _getCurrentLocation() {
    try {
      console.log("📍 Mendapatkan lokasi saat ini...");
      
      if (!navigator.geolocation) {
        throw new Error('Geolocation tidak didukung browser ini');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lng: longitude };
      
      console.log("✅ Lokasi ditemukan:", newLocation);
      
      // Update peta dan marker
      this.selectedLatLng = newLocation;
      this.map.setView([latitude, longitude], 15);
      this.marker.setLatLng([latitude, longitude]);
      
      // Update koordinat di UI
      this.view.updateLocationText(latitude, longitude);
      
      alert("✅ Lokasi berhasil diperbarui!");
      
    } catch (error) {
      console.error("❌ Error mendapatkan lokasi:", error);
      alert("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.");
    }
  }

  _initCamera() {
    this.view.onActivateCamera(async () => {
      try {
        console.log("📷 Mengaktifkan kamera...");
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment' // Gunakan kamera belakang jika tersedia
          } 
        });
        this.view.showCamera(this.cameraStream);
        console.log("✅ Kamera berhasil diaktifkan");
      } catch (err) {
        console.error("❌ Kamera tidak dapat diakses:", err);
        alert("Gagal mengakses kamera. Pastikan Anda memberikan izin dan kamera tidak digunakan aplikasi lain.");
      }
    });

    this.view.onTakePicture(async () => {
      try {
        if (!this.cameraStream || this.view.cameraVideo.readyState < 2) {
          alert("❌ Video belum siap. Tunggu sebentar dan coba lagi.");
          return;
        }

        console.log("📸 Mengambil gambar...");
        this.view.drawImageToCanvas();

        this.cameraImageBlob = await this.view.getCanvasBlob();
        this.view.previewImage(this.cameraImageBlob);
        console.log("✅ Gambar berhasil diambil dan ditampilkan.");
        
        // Hentikan kamera setelah mengambil gambar
        this._stopCamera();
        
      } catch (error) {
        console.error("❌ Error mengambil gambar:", error);
        alert("Gagal mengambil gambar. Coba lagi.");
      }
    });
  }

  _stopCamera() {
    if (this.cameraStream) {
      console.log("📷 Menghentikan kamera...");
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
      this.view.hideCamera();
      console.log("✅ Kamera dihentikan");
    }
  }  _initForm() {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Cek jika form sedang disubmit
      if (this.isSubmitting) {
        console.log('Form submission in progress, please wait...');
        return;
      }

      try {
        this.isSubmitting = true;
        this.loadingIndicator.style.display = 'block';
        
        const formData = new FormData(this.form);
        const description = formData.get('description');
        const imageFile = formData.get('image');

        if (!description || (!imageFile && !this.cameraImageBlob)) {
          throw new Error('Mohon lengkapi deskripsi dan gambar');
        }

        const storyData = {
          description,
          photo: imageFile || this.cameraImageBlob,
          lat: this.selectedLatLng?.lat,
          lng: this.selectedLatLng?.lng
        };

        const result = await this.createStory(storyData);
          if (result.success) {
          window.alert('Cerita berhasil ditambahkan!');
          window.location.hash = '#/';
        } else {
          throw new Error(result.message || 'Gagal menambahkan cerita');
        }
      } catch (error) {
        console.error('Error creating story:', error);
        window.alert(error.message || 'Gagal menambahkan cerita');
      } finally {
        this.isSubmitting = false;
        this.loadingIndicator.style.display = 'none';
      }
    });
  }

  // Method untuk debugging
  getMapInfo() {
    return {
      map: this.map,
      marker: this.marker,
      selectedLocation: this.selectedLatLng,
      cameraStream: this.cameraStream,
      cameraBlob: this.cameraImageBlob
    };
  }

  // Method untuk set lokasi secara manual
  setLocation(lat, lng) {
    this.selectedLatLng = { lat, lng };
    if (this.map && this.marker) {
      this.map.setView([lat, lng], 15);
      this.marker.setLatLng([lat, lng]);
      this.view.updateLocationText(lat, lng);
      console.log("📍 Lokasi diset ke:", { lat, lng });
    }
  }
}