import axios from 'axios';

// Backend URL'sini açıkça belirtiyoruz
const BASE_URL = 'http://localhost:8001';

// CSRF token'ı cookie'den almak için yardımcı fonksiyon
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// CSRF token'ı güncel al
const csrftoken = getCookie('csrftoken');

// Axios instance oluşturma - doğrudan URL kullanılarak
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // CSRF token varsa ekle
    ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {})
  },
  withCredentials: true, // CORS için cookie gönderimi önemli
});

// Her istekte CSRF token'ı kontrol et ve ekle
apiClient.interceptors.request.use(
  (config) => {
    // Her istek öncesi token'ı güncel al
    const token = getCookie('csrftoken');
    if (token) {
      config.headers['X-CSRFToken'] = token;
    }

    // Debug amaçlı URL loglaması
    console.log('Making request to:', `${config.baseURL}${config.url}`);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt alma sırasında hata kontrolü - Güncellenmiş hali
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Daha detaylı hata logu
    console.error('API Error:', {
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers,
      errorMessage: error.message
    });

    // 401 veya 403 hatası durumunda login sayfasına YÖNLENDİRMEYİ KALDIRDIK
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('Yetkilendirme hatası tespit edildi:', error.response.status);
      console.warn('Login sayfasına yönlendirme devre dışı bırakıldı');

      // Yönlendirmeyi iptal ettik
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API = {
  auth: {
    login: '/api/accounts/login/',
    logout: '/api/accounts/logout/',
    currentUser: '/api/accounts/kullanicilar/profile/',
    userTeam: '/api/accounts/team/',
  },
  // Diğer API endpointleri
  teams: {
    list: '/api/teams/takimlar/',
    detail: (id) => `/api/teams/takimlar/${id}/`,
    members: (id) => `/api/teams/takimlar/${id}/uyeler/`,
    userTeams: '/api/teams/kullanici-takimlar/',
    addUser: (id) => `/api/teams/takimlar/${id}/uyeler/`,
    removeUser: (teamId, userId) => `/api/teams/takimlar/${teamId}/uyeler/${userId}/`,
    stats: '/api/teams/takimlar/istatistikler/',
  },
    parts: {
        list: '/api/parts/parcalar/',  // Tüm parçaları listeleme
        create: '/api/parts/parcalar/', // Yeni parça oluşturma
        detail: (id) => `/api/parts/parcalar/${id}/`, // Belirli bir parçayı alma
        update: (id) => `/api/parts/parcalar/${id}/`, // Parçayı güncelleme
        delete: (id) => `/api/parts/parcalar/${id}/`, // Parçayı silme
        totalCount: '/api/parts/parcalar/toplam_parca_sayisi/', // Toplam parça sayısı
        types: '/api/parts/parca-tipleri/', // Parça tiplerini çekme
        status: '/api/parts/parca-durumlari/', // Parça durumlarını çekme
  },
    inventory: {
        list: '/api/inventory/envanter/',
        lowStock: '/api/inventory/envanter/dusuk_stok/',
        detail: (id) => `/api/inventory/envanter/${id}/`,
        update: (id) => `/api/inventory/envanter/${id}/`,
        delete: (id) => `/api/inventory/envanter/${id}/`,
  }

};

export default apiClient;