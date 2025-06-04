export default class AuthModel {
  constructor() {
    this.tokenKey = "authToken";
  }

  setAuthToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getAuthToken() {
    return localStorage.getItem(this.tokenKey);
  }

  clearAuthToken() {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }
}
