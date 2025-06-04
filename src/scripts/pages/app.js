// src/scripts/app.js
import routes from "../routes/routes";
import { getActivePathname } from "../routes/url-parser";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupLogout();
    this._toggleLogoutButton();
  }

  _setupDrawer() {
    if (this.#drawerButton && this.#navigationDrawer) {
      this.#drawerButton.addEventListener("click", () => {
        this.#navigationDrawer.classList.toggle("active");
        // Update aria-expanded
        const isExpanded = this.#drawerButton.getAttribute("aria-expanded") === "true";
        this.#drawerButton.setAttribute("aria-expanded", !isExpanded);
      });

      document.body.addEventListener("click", (event) => {
        if (
          this.#navigationDrawer &&
          this.#drawerButton &&
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove("active");
          this.#drawerButton.setAttribute("aria-expanded", "false");
        }
        if (this.#navigationDrawer) {
          this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
            if (link.contains(event.target)) {
              this.#navigationDrawer.classList.remove("active");
              this.#drawerButton.setAttribute("aria-expanded", "false");
            }
          });
        }
      });
    }
  }

  _setupLogout() {
    const logoutButton = document.querySelector("#logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => this.logout());
    }
  }

  _toggleLogoutButton() {
    const logoutButton = document.querySelector("#logout-button");
    if (logoutButton) {
      if (localStorage.getItem("authToken")) {
        logoutButton.style.display = "block";
      } else {
        logoutButton.style.display = "none";
      }
    }
  }

  async logout() {
    localStorage.removeItem("authToken");
    alert("Logout berhasil! Anda akan diarahkan ke halaman login.");
    window.location.hash = "/login";
  }

  async renderPage() {
    const pathname = getActivePathname();
    console.log("Pathname aktif:", pathname);

    const publicRoutes = ["/login", "/register"];
    const isAuthenticated = !!localStorage.getItem("authToken");

    if (!isAuthenticated && pathname !== "/login" && pathname !== "/register") {
      alert("Silakan login terlebih dahulu untuk mengakses halaman ini.");
      window.location.hash = "/login";
      return;
    }

    const PageClass = routes[pathname];

    if (!PageClass) {
      this.#content.innerHTML = "<h1>Halaman tidak ditemukan.</h1>";
      return;
    }

    const page = new PageClass();

    if (!document.startViewTransition) {
      console.warn("View Transition API tidak didukung. Menggunakan fallback DOM update.");
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      this._toggleLogoutButton();
      return;
    }

    const transition = document.startViewTransition(async () => {
      try {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this._toggleLogoutButton();
      } catch (err) {
        console.error("Error in view transition:", err);
        this.#content.innerHTML = "<h1>Terjadi error saat memuat halaman.</h1>";
      }
    });

    transition.ready.then(() => {
      console.log("View transition siap dijalankan.");
    });

    transition.finished.then(() => {
      console.log("View transition telah selesai.");
    });
  }
}

export default App;
