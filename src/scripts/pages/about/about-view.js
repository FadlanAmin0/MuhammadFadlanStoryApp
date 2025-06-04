// src/scripts/pages/about/abou-view.js
import L from "leaflet";
import AboutPresenter from "../../presenter/about-presenter.js";

export default class AboutView {
  constructor() {
    this.presenter = new AboutPresenter(this);
  }

  render() {
    return `
      <section class="container">
        <h1>About Page</h1>

        <div class="story-item">
          <h3>isi curhatan saat membuat project: </h3> 
          <p>
            Aplikasi ini merupakan Single Page Application (SPA) berbasis JavaScript yang memungkinkan pengguna untuk membuat cerita (story) lengkap dengan gambar dan lokasi secara interaktif yang bisa dilihat sama orang lain yang menggunakan aplikasi ini.
          </p>
          <ul>
            <li>Pada Project ini saya menggunakan webpack</li>
            <li>Dan untuk peta saya menggunakan leaflet</li>
            <li>Menggunakan API Dicoding Story sebagai backend untuk menyimpan dan mengambil data cerita.</li>
            <li>Untuk styling saya menggunakan CSS</li>
            <li>Saya selalu gagal terus saat menyambungkan API dan akhirnya sekarang bisa</li>
            <li>Butuh waktu 9 hari untuk menyelesaikan ini  :( </li>
          </ul>

          <p>🗺️ Di bawah ini adalah peta interaktif yang dapat Anda geser dan zoom untuk melihat lokasi.</p>
          <div id="map" style="height: 400px; margin-top: 1rem;"></div>
        </div>
      </section>
    `;
  }

  afterRender() {
    this.presenter.initializePage();
  }

  initializeMap() {
    const map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return map;
  }

  setupSkipToContent() {
    const mainContent = document.querySelector("#main-content"); 
    const skipLink = document.querySelector(".skip-link"); 

    if (skipLink && mainContent) {
      skipLink.addEventListener("click", function (event) {
        event.preventDefault();
        skipLink.blur();
        mainContent.focus();
        mainContent.scrollIntoView();
      });
    }
  }
}
