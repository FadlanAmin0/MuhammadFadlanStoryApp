import LoginPresenter from '../../presenter/Login-presenter.js';
import AuthModel from '../../data/login-auth.js';
import { loginUser } from "../../data/api.js";

export default class LoginPage {
  constructor() {
    this.authModel = new AuthModel();
    this.presenter = new LoginPresenter(this, { loginUser }, this.authModel);
  }

  async render() {
    return `
      <section class="auth-form-section">
        <h1>Masuk</h1>
        <form id="login-form">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required />
          <label for="password">Kata Sandi:</label>
          <input type="password" id="password" name="password" required />
          <button type="submit">Masuk</button>
        </form>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
        <button id="logout-button" style="display:none;">Keluar</button>
      </section>
    `;
  }

  async afterRender() {
    this._initializeElements();
    this._initializeListeners();
  }

  _initializeElements() {
    this.form = document.querySelector("#login-form");
    this.logoutButton = document.querySelector("#logout-button");
    
    // Gunakan presenter untuk mengecek authentication
    if (this.presenter.isAuthenticated()) {
      this.logoutButton.style.display = "block";
    }
  }

  _initializeListeners() {
    this.form.addEventListener("submit", this._handleLogin.bind(this));
    
    // Gunakan presenter untuk mengecek authentication
    if (this.presenter.isAuthenticated()) {
      this.logoutButton.addEventListener("click", this._handleLogout.bind(this));
    }
  }

  async _handleLogin(event) {
    event.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    
    const result = await this.presenter.handleLogin(email, password);
    if (result.success) {
      alert("Login berhasil!");
      window.location.hash = "/";
    } else {
      alert(result.message);
    }
  }

  async _handleLogout() {
    const result = this.presenter.handleLogout();
    if (result.success) {
      alert("Logout berhasil! Anda akan diarahkan ke halaman login.");
      window.location.hash = "/login";
    }
  }
}
