
import axios from 'axios';

// Backend URL'sini açıkça belirtiyoruz
const BASE_URL = 'http://localhost:8001/api/v1'; // ➡️ Yeni API URL

// Axios instance oluşturma
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken'
});
// CSRF token alma fonksiyonu
const getCSRFToken = () => {
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='));

  return csrfCookie ? csrfCookie.split('=')[1] : '';
};
apiClient.interceptors.request.use((config) => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});



// API endpoints
export const API = {
  auth: {
    login: '/accounts/auth/login/',
    logout: '/accounts/auth/logout/',
    register: '/accounts/auth/register/',
    currentUser: '/accounts/kullanicilar/me/',
    userTeams: '/accounts/kullanicilar/takimlarim/',
    userDetail: (id) => `/accounts/kullanicilar/${id}/`,
  },
  teams: {
    list: '/teams/takimlar/',
    detail: (id) => `/teams/takimlar/${id}/`,
    members: (id) => `/teams/takimlar/${id}/uyeler/`,
    userTeams: '/teams/kullanici-takimlar/',
    addUser: '/teams/kullanici-takimlar/',
    createUserTeam: '/teams/kullanici-takimlar/',
    updateUserTeam: (id) => `/teams/kullanici-takimlar/${id}/`,
    partialUpdateUserTeam: (id) => `/teams/kullanici-takimlar/${id}/`,
    deleteUserTeam: (id) => `/teams/kullanici-takimlar/${id}/`,

  },
  parts: {
    list: '/parts/parcalar/',
    create: '/parts/parcalar/',
    detail: (id) => `/parts/parcalar/${id}/`,
    update: (id) => `/parts/parcalar/${id}/`,
    partialUpdate: (id) => `/parts/parcalar/${id}/`,
    delete: (id) => `/parts/parcalar/${id}/`,
    recycle: (id) => `/parts/parcalar/${id}/geri_donusum/`,
    types: '/parts/parca-tipleri/',
    typeDetail: (id) => `/parts/parca-tipleri/${id}/`,
    status: '/parts/parca-durumlari/',
    statusDetail: (id) => `/parts/parca-durumlari/${id}/`,
  },
  inventory: {
    list: '/inventory/envanter/',
    create: '/inventory/envanter/',
    detail: (id) => `/inventory/envanter/${id}/`,
    update: (id) => `/inventory/envanter/${id}/`,
    partialUpdate: (id) => `/inventory/envanter/${id}/`,
    delete: (id) => `/inventory/envanter/${id}/`,
    lowStock: '/inventory/envanter/dusuk_stok/',
    statusByAircraftType: '/inventory/envanter/ucak_tipi_bazinda_durum/',
  },
  aircrafts: {
    assemblyStatus: '/aircrafts/montaj/montaj_durumu/',
    assemble: '/aircrafts/montaj/montaj/',
    statuses: '/aircrafts/ucak-durumlari/',
    statusDetail: (id) => `/aircrafts/ucak-durumlari/${id}/`,
    types: '/aircrafts/ucak-tipleri/',
    typeDetail: (id) => `/aircrafts/ucak-tipleri/${id}/`,
    list: '/aircrafts/ucaklar/',
    detail: (id) => `/aircrafts/ucaklar/${id}/`,
   getAircraftTypes: '/aircrafts/ucak-tipleri/',
  },
};

export default apiClient;
