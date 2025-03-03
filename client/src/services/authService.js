
import apiClient, { API } from './apiConfig';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
export const login = async (username, password) => {
  try {
    const csrfToken = getCookie('csrftoken');
    const response = await apiClient.post(API.auth.login, {
      username,
      password
    }, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      }
    });

    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};


export const logout = async () => {
  try {
    // CSRF token'ı al
    const csrfToken = getCookie('csrftoken');

    // Çıkış isteği gönder
    const response = await apiClient.post(API.auth.logout, {}, {
      headers: {
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/json'
      }
    });

    // Başarılıysa localStorage temizle
    if (response.status === 204 || response.status === 200) { // 204 No Content veya 200 OK
      localStorage.removeItem('user');
      console.log('Çıkış başarılı');
    } else {
      console.error('Beklenmedik cevap:', response);
    }
  } catch (error) {
    console.error('Çıkış hatası:', error);
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
