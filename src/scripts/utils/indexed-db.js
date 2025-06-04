class IndexedDBService {
  static DATABASE_NAME = 'app-story-db';
  static DATABASE_VERSION = 1;
  static STORE_NAME = 'saved-stories';

  constructor() {
    this._dbPromise = this._initDb();
  }

  async _initDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBService.DATABASE_NAME, IndexedDBService.DATABASE_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(IndexedDBService.STORE_NAME)) {
          db.createObjectStore(IndexedDBService.STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async saveStory(story) {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDBService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IndexedDBService.STORE_NAME);

      const request = store.put(story);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async deleteStory(storyId) {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDBService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(IndexedDBService.STORE_NAME);

      const request = store.delete(storyId);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getAllStories() {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDBService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(IndexedDBService.STORE_NAME);

      const request = store.getAll();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async isStorySaved(storyId) {
    const db = await this._dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([IndexedDBService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(IndexedDBService.STORE_NAME);

      const request = store.get(storyId);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(!!request.result);
      };
    });
  }
}

export default IndexedDBService;
