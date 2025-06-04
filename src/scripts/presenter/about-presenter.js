// src/scripts/pages/about/about-presenter.js

export default class AboutPresenter {
  constructor(view) {
    this.view = view;
  }

  initializePage() {
    this.initializeMap();
    this.setupAccessibility();
  }

  initializeMap() {
    this.view.initializeMap();
  }

  setupAccessibility() {
    this.view.setupSkipToContent();
  }
}
