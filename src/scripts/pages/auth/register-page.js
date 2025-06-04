import RegisterPresenter from '../../presenter/register-presenter';
import { registerUser } from "../../data/api";

export default class RegisterPage {
  constructor() {
    this.presenter = new RegisterPresenter(this, { registerUser });
  }

  async render() {
    return `
      <section class="auth-form-section">
        <h1>Daftar</h1>
        <form id="register-form">
          <label for="name">Nama:</label>
          <input type="text" id="name" name="name" required />
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required />
          <label for="password">Kata Sandi:</label>
          <input type="password" id="password" name="password" required minlength="8" />
          <button type="submit">Daftar</button>
        </form>
        <p>Sudah punya akun? <a href="#/login">Masuk di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    this._initializeElements();
    this._initializeListeners();
  }

  _initializeElements() {
    this.form = document.querySelector("#register-form");
  }

  _initializeListeners() {
    this.form.addEventListener("submit", this._handleRegister.bind(this));
  }

  async _handleRegister(event) {
    event.preventDefault();
    const userData = {
      name: document.querySelector("#name").value,
      email: document.querySelector("#email").value,
      password: document.querySelector("#password").value,
    };

    const result = await this.presenter.handleRegister(userData);
    if (result.success) {
      alert("Registrasi berhasil! Silakan login.");
      window.location.hash = "/login";
    } else {
      alert("Registrasi gagal: " + result.message);
    }
  }
}
