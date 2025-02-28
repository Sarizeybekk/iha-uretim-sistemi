import axios from 'axios';

// Backend URL'sini açıkça belirtiyoruz
const BASE_URL = 'http://localhost:8001';

// Axios instance oluşturma - doğrudan URL kullanılarak
export const apiClient = axios.create({
  baseURL: BASE_URL, // Düzeltme: URL'yi açıkça belirtiyoruz
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS için cookie gönderimi önemli
});

// Interceptor artık token eklemeyecek - session cookie'ler otomatik olarak gönderilir
apiClient.interceptors.request.use(
  (config) => {
    // Session tabanlı auth için token eklemiyoruz
    // Debug amaçlı URL loglaması
    console.log('Making request to:', `${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Yanıt alma sırasında hata kontrolü
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detaylı hata logu
    console.error('API Error:', {
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    // 401 veya 403 hatası durumunda login sayfasına yönlendir
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API = {
  auth: {
    // Endpoint'lerin başına / eklenmediğinden emin oluyoruz
    login: '/api/accounts/login/',
    logout: '/api/accounts/logout/',
    currentUser: '/api/accounts/kullanicilar/profile/',
    userTeam: '/api/accounts/team/',
  },
  parts: {
    list: '/api/parts/parcalar/',
    detail: (id) => `/api/parts/parcalar/${id}/`,
    types: '/api/parts/parca-tipleri/',
    recycle: (id) => `/api/parts/parcalar/${id}/geri_donusum/`,
  },
  aircrafts: {
    list: '/api/aircrafts/ucaklar/',
    assemble: '/api/aircrafts/ucaklar/',
    types: '/api/aircrafts/ucak-tipleri/',
    deliver: (id) => `/api/aircrafts/ucaklar/${id}/teslim_et/`,
    status: '/api/aircrafts/ucak-durumlari/',
  },
  inventory: {
    list: '/api/inventory/envanter/',
    checkAvailability: '/api/inventory/envanter/eksik_parca_kontrol/',
    checkMissingParts: '/api/inventory/envanter/eksik_parca_kontrol/',
    lowStock: '/api/inventory/envanter/dusuk_stok/',
  },
  teams: {
    list: '/api/teams/takimlar/',
    members: (id) => `/api/teams/takimlar/${id}/members/`,
    userTeams: '/api/teams/kullanici-takimlar/',
    addUser: (id) => `/api/teams/takimlar/${id}/add_user/`,
    removeUser: (id) => `/api/teams/takimlar/${id}/remove_user/`,
  },
};

export default apiClient;