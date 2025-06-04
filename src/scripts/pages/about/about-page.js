// src/pages/about/about-page.js
import L from "leaflet";

export default class AboutPage {
  async render() {
    return `
      <section class="container">

        <div class="story-item">
          <h2>Tentang Aplikasi Ini</h2>
          <h3>Fitur-Fitur</h3>
          <ul style="list-style-type: none;">
            <li>🔹 Registrasi dan Login pengguna</li>
            <li>🔹 Menambahkan dan melihat cerita pengguna</li>
            <li>🔹 Lokasi cerita ditampilkan di peta interaktif</li>
            <li>🔹 Responsif dan ringan!</li>
          </ul>
          <br>

          <p>🗺️ Di bawah ini adalah peta interaktif yang dapat Anda geser dan zoom untuk melihat lokasi.</p>
          <div id="map" style="height: 400px; margin-top: 1rem;"></div><br>
          <p class="thanks" style="text-align: center;">Terima kasih sudah menggunakan aplikasi ini! 🚀</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    this.setupSkipToContent(); // Panggil method setelah render
  }

  setupSkipToContent() {
  const mainContent = document.querySelector("#main-content"); 
  const skipLink = document.querySelector(".skip-link"); 

  if (skipLink && mainContent) {
    skipLink.addEventListener("click", function (event) {
      event.preventDefault(); // Mencegah refresh halaman
      skipLink.blur(); // Menghilangkan fokus dari tautan skip
      mainContent.focus(); // Fokus ke konten utama
      mainContent.scrollIntoView(); // Scroll ke konten utama
    });
  }
}
}
