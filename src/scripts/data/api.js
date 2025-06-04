import CONFIG from "../config";

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  REGISTER: `${CONFIG.BASE_URL}/register`,
};

// Helper untuk mendapatkan token dari localStorage
function getAuthToken() {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.");
  return token;
}

// Fungsi untuk validasi respons API
function validateResponse(response) {
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
}

// Ambil semua data cerita dari API
export async function getData() {
  try {
    const token = getAuthToken();

    const response = await fetch(ENDPOINTS.STORIES, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    validateResponse(response);

    const result = await response.json();
    console.log("Data cerita yang diterima:", result);

    if (!Array.isArray(result.listStory)) {
      throw new Error("Data cerita tidak valid atau kosong.");
    }

    return result.listStory.map((story) => ({
      id: story.id,
      title: story.name || "Tanpa Nama",
      description: story.description || "Tanpa Deskripsi",
      imageUrl: story.photoUrl?.startsWith("http") ? story.photoUrl : "/src/public/images/placeholder.jpg",
      createdAt: story.createdAt || null, // Fallback untuk createdAt
      location: {
        lat: typeof story.lat === "number" ? story.lat : null,
        lng: typeof story.lon === "number" ? story.lon : null,
      },
    }));
  } catch (error) {
    console.error("❌ Gagal mengambil data cerita:", error.message);
    return []; // Kembalikan array kosong jika gagal
  }
}

// Ambil detail cerita berdasarkan ID
export async function getDataById(id) {
  try {
    if (!id) {
      throw new Error("ID tidak valid atau kosong. Pastikan parameter ID dikirim dengan benar.");
    }

    const token = getAuthToken();
    const endpoint = `${ENDPOINTS.STORIES}/${id}`;
    console.log("Requesting detail story from:", endpoint);

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error from server:", errorBody); // Log body respons dari server
      throw new Error(`Gagal mengambil detail cerita: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Detail cerita yang diterima:", result);

    if (!result.story) {
      throw new Error("Detail cerita tidak ditemukan di server.");
    }

    return {
      id: result.story.id,
      title: result.story.name || "Tanpa Nama",
      description: result.story.description || "Tanpa Deskripsi",
      imageUrl: result.story.photoUrl?.startsWith("http") ? result.story.photoUrl : "/src/public/images/placeholder.jpg",
      createdAt: result.story.createdAt || null, // Fallback untuk createdAt
      location: {
        lat: typeof result.story.lat === "number" ? result.story.lat : null,
        lng: typeof result.story.lon === "number" ? result.story.lon : null,
      },
    };
  } catch (error) {
    console.error("❌ Error in getDataById:", error.message);
    throw error;
  }
}

// Fungsi login user
export async function loginUser(email, password) {
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    validateResponse(response);

    const result = await response.json();
    console.log("Respon dari API Login:", result);

    if (!result.loginResult?.token) {
      throw new Error("Token tidak ditemukan dalam respon login.");
    }

    return result.loginResult.token;
  } catch (error) {
    console.error("❌ Error saat login:", error.message);
    throw error;
  }
}

// Fungsi registrasi user
export async function registerUser({ name, email, password }) {
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    validateResponse(response);

    const result = await response.json();
    console.log("Respon registrasi:", result);

    return result;
  } catch (error) {
    console.error("❌ Error saat registrasi:", error.message);
    throw error;
  }
}

// Fungsi menambahkan cerita baru
export async function addStory({ description, imageFile, location }) {
  try {
    const token = getAuthToken();

    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", imageFile);
    if (location) {
      formData.append("lat", location.lat);
      formData.append("lon", location.lng);
    }

    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    validateResponse(response);

    const result = await response.json();
    console.log("Cerita berhasil ditambahkan:", result);

    return result;
  } catch (error) {
    console.error("❌ Gagal menambahkan cerita:", error.message);
    throw error;
  }
}
