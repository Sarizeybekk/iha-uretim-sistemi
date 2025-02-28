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
    members: (id) => `/api/teams/takimlar/${id}/uyeler/`,
    userTeams: '/api/teams/kullanici-takimlar/',
    addUser: (id) => `/api/teams/takimlar/${id}/uyeler/`,
    removeUser: (id, userId) => `/api/teams/takimlar/${id}/uyeler/${userId}/`,
    stats: '/api/teams/takimlar/istatistikler/',
  },
};

// PARÇA SERVİSLERİ
export const getParts = async () => {
  try {
    const response = await apiClient.get(API.parts.list);
    return response.data;
  } catch (error) {
    console.error('Parçalar alınırken hata:', error);
    throw error;
  }
};

export const getPartsByTeam = async (teamId) => {
  try {
    const response = await apiClient.get(`${API.parts.list}?takim=${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Takım parçaları alınırken hata:', error);
    throw error;
  }
};

export const createPart = async (partData) => {
  try {
    const response = await apiClient.post(API.parts.list, partData);
    return response.data;
  } catch (error) {
    console.error('Parça oluşturulurken hata:', error);
    throw error;
  }
};

export const updatePart = async (partId, partData) => {
  try {
    const response = await apiClient.put(API.parts.detail(partId), partData);
    return response.data;
  } catch (error) {
    console.error('Parça güncellenirken hata:', error);
    throw error;
  }
};

export const deletePart = async (partId) => {
  try {
    await apiClient.delete(API.parts.detail(partId));
    return true;
  } catch (error) {
    console.error('Parça silinirken hata:', error);
    throw error;
  }
};

// Parça geri dönüşüm fonksiyonu
export const recyclePartAPI = async (partId) => {
  try {
    const response = await apiClient.post(API.parts.recycle(partId));
    return response.data;
  } catch (error) {
    console.error('Parça geri dönüşüme gönderilirken hata:', error);
    throw error;
  }
};

// Parça tipleri listesi
export const getPartTypes = async () => {
  try {
    const response = await apiClient.get(API.parts.types);
    return response.data;
  } catch (error) {
    console.error('Parça tipleri alınırken hata:', error);
    throw error;
  }
};

// UÇAK SERVİSLERİ
export const getAircraft = async () => {
  try {
    const response = await apiClient.get(API.aircrafts.list);
    return response.data;
  } catch (error) {
    console.error('Uçaklar alınırken hata:', error);
    throw error;
  }
};

export const assembleAircraft = async (aircraftData) => {
  try {
    const response = await apiClient.post(API.aircrafts.assemble, aircraftData);
    return response.data;
  } catch (error) {
    console.error('Uçak montajı yapılırken hata:', error);
    throw error;
  }
};

// Uçak tipleri getirme fonksiyonu
export const getAircraftTypes = async () => {
  try {
    const response = await apiClient.get(API.aircrafts.types);
    return response.data;
  } catch (error) {
    console.error('Uçak tipleri alınırken hata:', error);
    throw error;
  }
};

// Uçak teslim etme fonksiyonu
export const deliverAircraft = async (aircraftId) => {
  try {
    const response = await apiClient.post(API.aircrafts.deliver(aircraftId));
    return response.data;
  } catch (error) {
    console.error('Uçak teslim edilirken hata:', error);
    throw error;
  }
};

// ENVANTER SERVİSLERİ
export const getInventory = async () => {
  try {
    const response = await apiClient.get(API.inventory.list);
    return response.data;
  } catch (error) {
    console.error('Envanter alınırken hata:', error);
    throw error;
  }
};

export const checkPartAvailability = async (aircraftType) => {
  try {
    const response = await apiClient.get(`${API.inventory.checkAvailability}?aircraft=${aircraftType}`);
    return response.data;
  } catch (error) {
    console.error('Parça uygunluğu kontrol edilirken hata:', error);
    throw error;
  }
};

// Eksik parçaları kontrol etme fonksiyonu
export const checkMissingParts = async (aircraftType) => {
  try {
    const response = await apiClient.post(API.inventory.checkMissingParts, {
      ucak_tipi: aircraftType
    });
    return response.data;
  } catch (error) {
    console.error('Eksik parçalar kontrol edilirken hata:', error);
    throw error;
  }
};

// Düşük stok öğelerini getirme fonksiyonu
export const getLowStockItems = async () => {
  try {
    const response = await apiClient.get(API.inventory.lowStock);
    return response.data;
  } catch (error) {
    console.error('Düşük stok öğeleri alınırken hata:', error);
    throw error;
  }
};

export const getTeams = async () => {
  try {
    const response = await apiClient.get(API.teams.list);
    return response.data;
  } catch (error) {
    console.error('Takımlar alınırken hata:', error);
    throw error;
  }
};

export const getTeamById = async (id) => {
  try {
    const response = await apiClient.get(API.teams.detail(id));
    return response.data;
  } catch (error) {
    console.error(`Takım (ID: ${id}) alınırken hata:`, error);
    throw error;
  }
};

export const getTeamMembers = async (teamId) => {
  try {
    const response = await apiClient.get(API.teams.members(teamId));
    return response.data;
  } catch (error) {
    console.error('Takım üyeleri alınırken hata:', error);
    throw error;
  }
};

export const getUserTeams = async () => {
  try {
    const response = await apiClient.get(API.teams.userTeams);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı takımları alınırken hata:', error);
    throw error;
  }
};

export const getTeamStats = async () => {
  try {
    const response = await apiClient.get(API.teams.stats);
    return response.data;
  } catch (error) {
    console.error('Takım istatistikleri alınırken hata:', error);
    throw error;
  }
};

export const createTeam = async (teamData) => {
  try {
    const response = await apiClient.post(API.teams.list, teamData);
    return response.data;
  } catch (error) {
    console.error('Takım oluşturulurken hata:', error);
    throw error;
  }
};

export const updateTeam = async (teamId, teamData) => {
  try {
    const response = await apiClient.put(API.teams.detail(teamId), teamData);
    return response.data;
  } catch (error) {
    console.error('Takım güncellenirken hata:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId) => {
  try {
    await apiClient.delete(API.teams.detail(teamId));
    return true;
  } catch (error) {
    console.error('Takım silinirken hata:', error);
    throw error;
  }
};

export const addUserToTeam = async (teamId, userData) => {
  try {
    const response = await apiClient.post(API.teams.addUser(teamId), userData);
    return response.data;
  } catch (error) {
    console.error('Takıma kullanıcı eklenirken hata:', error);
    throw error;
  }
};

export const removeUserFromTeam = async (teamId, userId) => {
  try {
    const response = await apiClient.delete(API.teams.removeUser(teamId, userId));
    return response.data;
  } catch (error) {
    console.error('Takımdan kullanıcı çıkarılırken hata:', error);
    throw error;
  }
};
export default apiClient;