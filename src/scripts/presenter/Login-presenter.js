export default class LoginPresenter {
  constructor(view, loginService, authModel) {
    this.view = view;
    this.loginService = loginService;
    this.authModel = authModel;
  }

  async handleLogin(email, password) {
    try {
      const token = await this.loginService.loginUser(email, password);
      if (token) {
        this.authModel.setAuthToken(token);
        return { success: true };
      }
      return { success: false, message: "Login gagal: Periksa kredensial Anda" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  handleLogout() {
    this.authModel.clearAuthToken();
    return { success: true };
  }

  isAuthenticated() {
    return this.authModel.isAuthenticated();
  }

  getAuthToken() {
    return this.authModel.getAuthToken();
  }
}
