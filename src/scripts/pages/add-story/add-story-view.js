export default class AddStoryView {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    
    // Delay initialization untuk memastikan DOM sudah ready
    this._initializeElements();
  }

  _initializeElements() {
    // Fungsi untuk mencoba mendapatkan element dengan retry
    const getElementWithRetry = (id, maxRetries = 5) => {
      return new Promise((resolve) => {
        let retries = 0;
        
        const tryGetElement = () => {
          const element = document.getElementById(id);
          if (element) {
            resolve(element);
          } else if (retries < maxRetries) {
            retries++;
            setTimeout(tryGetElement, 100);
          } else {
            console.warn(`⚠️ Element dengan ID '${id}' tidak ditemukan setelah ${maxRetries} percobaan`);
            resolve(null);
          }
        };
        
        tryGetElement();
      });
    };

    // Initialize elements dengan delay
    setTimeout(async () => {
      try {
        console.log("🔧 Menginisialisasi elemen view...");

        this.activateCameraButton = await getElementWithRetry("activate-camera-button");
        this.cameraVideo = await getElementWithRetry("camera-video");
        this.cameraCanvas = await getElementWithRetry("camera-canvas");
        this.cameraTakeButton = await getElementWithRetry("camera-take-button");
        this.cameraOutputList = await getElementWithRetry("camera-list-output");
        this.form = await getElementWithRetry("add-story-form");
        this.descriptionInput = await getElementWithRetry("description");
        this.imageInput = await getElementWithRetry("image");
        this.locationText = await getElementWithRetry("location-coordinates");

        // Simpan referensi elemen untuk debugging
        this.elements = {
          activateCameraButton: this.activateCameraButton,
          cameraVideo: this.cameraVideo,
          cameraCanvas: this.cameraCanvas,
          cameraTakeButton: this.cameraTakeButton,
          cameraOutputList: this.cameraOutputList,
          form: this.form,
          descriptionInput: this.descriptionInput,
          imageInput: this.imageInput,
          locationText: this.locationText
        };

        // Log status inisialisasi
        const elementStatus = Object.entries(this.elements).map(([key, element]) => ({
          [key]: !!element
        }));
        
        console.log("📋 Status elemen view:", elementStatus);

        this.isInitialized = true;
        console.log("✅ View elements berhasil diinisialisasi");

        // Setup additional features
        this._setupImagePreview();
        this._setupFormValidation();

      } catch (error) {
        console.error("❌ Error saat inisialisasi elemen view:", error);
      }
    }, 100);
  }
  _setupImagePreview() {
    if (this.imageInput) {
      this.imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          // Tambahkan kelas untuk styling ketika file dipilih
          this.imageInput.classList.add('file-selected');
          
          // Tampilkan preview gambar
          this._previewUploadedImage(file);
        } else {
          this.imageInput.classList.remove('file-selected');
        }
      });

      // Tambahkan animasi drag-and-drop
      this.imageInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.imageInput.classList.add('file-hover');
      });

      this.imageInput.addEventListener('dragleave', () => {
        this.imageInput.classList.remove('file-hover');
      });
      
      this.imageInput.addEventListener('drop', () => {
        this.imageInput.classList.remove('file-hover');
        setTimeout(() => {
          if (this.imageInput.files.length > 0) {
            this.imageInput.classList.add('file-selected');
          }
        }, 100);
      });
    }
  }
  _setupFormValidation() {
    if (this.descriptionInput) {
      this.descriptionInput.addEventListener('input', (event) => {
        const value = event.target.value;
        const charCount = value.length;
        const maxChars = 500;
        
        // Tambahkan counter karakter
        let counter = document.getElementById('char-counter');
        if (!counter) {
          counter = document.createElement('small');
          counter.id = 'char-counter';
          counter.style.color = charCount > maxChars ? '#dc3545' : '#6c757d';
          this.descriptionInput.parentNode.appendChild(counter);
        }
        
        counter.textContent = `${charCount}/${maxChars} karakter`;
        counter.style.color = charCount > maxChars ? '#dc3545' : '#6c757d';
        
        // Tambahkan class validasi
        if (charCount > 0 && charCount <= maxChars) {
          this.descriptionInput.classList.add('field-valid');
          this.descriptionInput.classList.remove('field-invalid');
        } else if (charCount > maxChars) {
          this.descriptionInput.classList.add('field-invalid');
          this.descriptionInput.classList.remove('field-valid');
        } else {
          this.descriptionInput.classList.remove('field-valid', 'field-invalid');
        }
      });
    }
    
    // Tambahkan efek ripple ke tombol-tombol
    if (this.form) {
      const buttons = this.form.querySelectorAll('button');
      buttons.forEach(button => {
        button.classList.add('ripple');
      });
    }
  }

  _previewUploadedImage(file) {
    if (!this.cameraOutputList) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imagePreview = `
        <li>
          <img src="${e.target.result}" alt="Preview Upload" style="width: 100%; max-width: 300px; border-radius: 8px;" />
          <p style="margin: 5px 0; font-size: 12px; color: #666;">📁 File: ${file.name}</p>
        </li>`;
      this.cameraOutputList.innerHTML = imagePreview;
    };
    reader.readAsDataURL(file);
  }
  onActivateCamera(callback) {
    if (this.activateCameraButton) {
      this.activateCameraButton.addEventListener("click", (event) => {
        // Tambahkan kelas animasi ke seksi kamera
        const cameraSection = event.target.closest('.camera-section');
        if (cameraSection) {
          cameraSection.classList.add('camera-section-active');
        }
        
        // Panggil original callback
        callback(event);
      });
      console.log("✅ Event listener kamera dengan animasi ditambahkan");
    } else {
      console.error("❌ Tombol aktivasi kamera tidak ditemukan");
    }
  }

  onTakePicture(callback) {
    if (this.cameraTakeButton) {
      this.cameraTakeButton.addEventListener("click", callback);
      console.log("✅ Event listener ambil gambar ditambahkan");
    } else {
      console.error("❌ Tombol ambil gambar tidak ditemukan");
    }
  }

  onFormSubmit(callback) {
    if (this.form) {
      this.form.addEventListener("submit", callback);
      console.log("✅ Event listener form submit ditambahkan");
    } else {
      console.error("❌ Form tidak ditemukan");
    }
  }
  showCamera(videoStream) {
    if (!this.cameraVideo) {
      console.error("❌ Element video kamera tidak ditemukan");
      return;
    }

    try {
      this.cameraVideo.srcObject = videoStream;
      this.cameraVideo.style.display = "block";
      this.cameraVideo.style.borderRadius = "8px";
      this.cameraVideo.style.border = "2px solid #06f53e";
      this.cameraVideo.style.boxShadow = "0 0 10px rgba(6, 245, 62, 0.3)";
      this.cameraVideo.style.transform = "scale(0)";
      
      // Tambahkan animasi fade in untuk kamera
      setTimeout(() => {
        this.cameraVideo.style.transition = "all 0.5s ease";
        this.cameraVideo.style.transform = "scale(1)";
      }, 10);
      
      if (this.cameraTakeButton) {
        this.cameraTakeButton.style.display = "block";
        this.cameraTakeButton.textContent = "📸 Ambil Gambar";
        
        // Tambahkan animasi untuk tombol
        this.cameraTakeButton.style.opacity = "0";
        this.cameraTakeButton.style.transform = "translateY(10px)";
        setTimeout(() => {
          this.cameraTakeButton.style.transition = "all 0.3s ease";
          this.cameraTakeButton.style.opacity = "1";
          this.cameraTakeButton.style.transform = "translateY(0)";
        }, 300);
      }

      // Hide activate button
      if (this.activateCameraButton) {
        this.activateCameraButton.style.display = "none";
      }

      console.log("✅ Kamera ditampilkan");
    } catch (error) {
      console.error("❌ Error menampilkan kamera:", error);
    }
  }

  hideCamera() {
    if (this.cameraVideo) {
      this.cameraVideo.srcObject = null;
      this.cameraVideo.style.display = "none";
    }

    if (this.cameraTakeButton) {
      this.cameraTakeButton.style.display = "none";
    }

    // Show activate button again
    if (this.activateCameraButton) {
      this.activateCameraButton.style.display = "block";
    }

    console.log("✅ Kamera disembunyikan");
  }

  drawImageToCanvas() {
    if (!this.cameraCanvas || !this.cameraVideo) {
      console.error("❌ Canvas atau video element tidak ditemukan");
      return false;
    }

    try {
      const context = this.cameraCanvas.getContext("2d");
      
      // Set canvas size sesuai video
      this.cameraCanvas.width = this.cameraVideo.videoWidth;
      this.cameraCanvas.height = this.cameraVideo.videoHeight;
      
      // Draw image ke canvas
      context.drawImage(
        this.cameraVideo, 
        0, 0, 
        this.cameraCanvas.width, 
        this.cameraCanvas.height
      );

      console.log("✅ Gambar berhasil digambar ke canvas", {
        width: this.cameraCanvas.width,
        height: this.cameraCanvas.height
      });

      return true;
    } catch (error) {
      console.error("❌ Error menggambar ke canvas:", error);
      return false;
    }
  }

  async getCanvasBlob() {
    if (!this.cameraCanvas) {
      throw new Error("❌ Canvas element tidak ditemukan");
    }

    return new Promise((resolve, reject) => {
      this.cameraCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("✅ Blob berhasil dibuat", {
              size: blob.size,
              type: blob.type
            });
            resolve(blob);
          } else {
            reject(new Error("❌ Gagal membuat Blob dari canvas"));
          }
        }, 
        "image/jpeg", 
        0.8 // Quality 80%
      );
    });
  }

  previewImage(blob) {
    if (!this.cameraOutputList) {
      console.error("❌ Camera output list tidak ditemukan");
      return;
    }

    try {
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toLocaleString();
      
      const imagePreview = `
        <li style="margin: 10px 0; text-align: center;">
          <img src="${url}" alt="Preview Kamera" style="width: 100%; max-width: 300px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <p style="margin: 5px 0; font-size: 12px; color: #666;">📷 Diambil: ${timestamp}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;">📏 Ukuran: ${(blob.size / 1024).toFixed(1)} KB</p>
        </li>`;
      
      this.cameraOutputList.innerHTML = imagePreview;

      const previewImage = this.cameraOutputList.querySelector("img");
      if (previewImage) {
        previewImage.addEventListener("load", () => {
          URL.revokeObjectURL(url);
          console.log("✅ Preview gambar ditampilkan dan URL direvoke");
        });
      }

    } catch (error) {
      console.error("❌ Error menampilkan preview:", error);
    }
  }  updateLocationText(lat, lng, animate = false) {
    try {
      const locationText = document.getElementById('location-coordinates');
      if (!locationText) {
        console.error("❌ Element location-coordinates tidak ditemukan");
        return;
      }

      locationText.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
      locationText.style.color = "black";
      locationText.style.fontWeight = "bold";
      
      // Tambahkan animasi jika diperlukan
      if (animate) {
        // Hapus class sebelumnya untuk mengizinkan animasi baru
        locationText.classList.remove('updated');
        // Force reflow
        void locationText.offsetWidth;
        // Tambahkan class untuk memulai animasi
        locationText.classList.add('updated');
        
        // Hapus class setelah animasi selesai
        setTimeout(() => {
          locationText.classList.remove('updated');
        }, 1000);
      }
      
      console.log("✅ Koordinat diperbarui:", { lat: lat.toFixed(6), lng: lng.toFixed(6) });
    } catch (error) {
      console.error("❌ Error memperbarui koordinat:", error);
    }
  }

  getFormData() {
    const data = {
      description: this.descriptionInput ? this.descriptionInput.value.trim() : "",
      imageFile: this.imageInput ? this.imageInput.files[0] : null,
    };

    console.log("📋 Data form:", {
      description: data.description ? `${data.description.substring(0, 50)}...` : "kosong",
      imageFile: data.imageFile ? `${data.imageFile.name} (${(data.imageFile.size / 1024).toFixed(1)} KB)` : "tidak ada"
    });

    return data;
  }

  redirectToHome() {
    console.log("🏠 Redirect ke home...");
    window.location.hash = "/";
  }

  // Method untuk validasi form
  validateForm() {
    const { description, imageFile } = this.getFormData();
    const errors = [];

    if (!description || description.length === 0) {
      errors.push("Deskripsi tidak boleh kosong");
    }

    if (description && description.length > 500) {
      errors.push("Deskripsi maksimal 500 karakter");
    }

    if (!imageFile && !this.cameraImageBlob) {
      errors.push("Gambar harus dipilih atau diambil dengan kamera");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Method untuk menampilkan pesan error
  showError(message) {
    // Hapus error sebelumnya
    const existingError = document.getElementById('form-error');
    if (existingError) {
      existingError.remove();
    }

    // Buat elemen error baru
    const errorElement = document.createElement('div');
    errorElement.id = 'form-error';
    errorElement.style.cssText = `
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      margin: 10px 0;
    `;
    errorElement.textContent = message;

    // Tambahkan ke form
    if (this.form) {
      this.form.insertBefore(errorElement, this.form.firstChild);
    }

    // Hapus setelah 5 detik
    setTimeout(() => {
      if (errorElement) {
        errorElement.remove();
      }
    }, 5000);
  }

  // Method untuk debugging
  getElementsStatus() {
    return {
      isInitialized: this.isInitialized,
      elements: Object.entries(this.elements).reduce((acc, [key, element]) => {
        acc[key] = !!element;
        return acc;
      }, {})
    };
  }
}