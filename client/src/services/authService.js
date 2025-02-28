import apiClient, { API } from './apiConfig';

// Kullanıcı girişi - Tam URL ile istek
export const login = async (username, password) => {
  try {
    console.log("Attempting login with:", { username });
    console.log("Using API endpoint:", `${apiClient.defaults.baseURL}${API.auth.login}`);

    // API nesnesi üzerinden endpoint alıyoruz
    const response = await apiClient.post(API.auth.login, {
      username,
      password
    });

    console.log("Login response:", response.data);

    // Session tabanlı kimlik doğrulama için kullanıcı bilgilerini saklıyoruz
    if (response.data && response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    } else if (response.data && response.data.success) {
      // Bazı API'ler sadece başarı durumu dönebilir
      const userResponse = await apiClient.get(API.auth.currentUser);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      return userResponse.data;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Request details:', {
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
    });
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