import apiClient, { API } from './apiConfig';

// Kullanıcı girişi - Tam URL ile istek
// authService.js içindeki login fonksiyonuna ekleyin
export const login = async (username, password) => {
  try {
    console.log("Attempting login with:", { username });

    // Login isteği
    const response = await apiClient.post(API.auth.login, {
      username,
      password
    });

    console.log("Login response:", response.data);

    // Login başarılıysa, yeni bir CSRF token al ve localStorage'a kaydet
    if (response.data) {
      // CSRF token'ı yenile
      const csrfResponse = await apiClient.get('/api/get-csrf-token/');
      document.cookie = `csrftoken=${csrfResponse.data.csrfToken}`;

      // Kullanıcı bilgilerini al
      const userResponse = await apiClient.get(API.auth.currentUser);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      return userResponse.data;
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Kullanıcı çıkışı
export const logout = async () => {
  try {
    await apiClient.post(API.auth.logout);
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Çıkış hatası:', error);
    // Sunucu hatası olsa bile yerel storage'ı temizle
    localStorage.removeItem('user');
    throw error;
  }
};

// Mevcut kullanıcı bilgisini al
export const getCurrentUser = async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    return JSON.parse(storedUser);
  }

  try {
    // Session'dan kullanıcı bilgilerini al
    const response = await apiClient.get(API.auth.currentUser);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı bilgisi alınırken hata:', error);
    localStorage.removeItem('user');
    return null;
  }
};

// Kullanıcının kimlik doğrulamasını kontrol et
export const isAuthenticated = async () => {
  try {
    // Session durumunu kontrol et
    const response = await apiClient.get(API.auth.currentUser);
    return !!response.data; // Kullanıcı bilgisi varsa true, yoksa false döner
  } catch (error) {
    return false; // Hata durumunda kimlik doğrulama başarısız
  }
};

// Kullanıcının takım bilgilerini al
export const getUserTeam = async () => {
  try {
    const response = await apiClient.get(API.auth.userTeam);
    return response.data;
  } catch (error) {
    console.error('Takım bilgisi alınırken hata:', error);
    throw error;
  }
};