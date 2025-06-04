export default class RegisterPresenter {
  constructor(view, registerService) {
    this.view = view;
    this.registerService = registerService;
  }

  async handleRegister(userData) {
    try {
      await this.registerService.registerUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
