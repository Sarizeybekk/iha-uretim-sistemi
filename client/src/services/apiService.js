import apiClient, { API } from './apiConfig';

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
    const response = await apiClient.get(`${API.parts.list}?team=${teamId}`);
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

// TAKIM SERVİSLERİ
export const getTeams = async () => {
  try {
    const response = await apiClient.get(API.teams.list);
    return response.data;
  } catch (error) {
    console.error('Takımlar alınırken hata:', error);
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

// Kullanıcının takımlarını getirme fonksiyonu
export const getUserTeams = async () => {
  try {
    const response = await apiClient.get(API.teams.userTeams);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı takımları alınırken hata:', error);
    throw error;
  }
};

// Takıma kullanıcı ekleme fonksiyonu
export const addUserToTeam = async (teamId, userId) => {
  try {
    const response = await apiClient.post(API.teams.addUser(teamId), { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Takıma kullanıcı eklenirken hata:', error);
    throw error;
  }
};

// Takımdan kullanıcı çıkarma fonksiyonu
export const removeUserFromTeam = async (teamId, userId) => {
  try {
    const response = await apiClient.post(API.teams.removeUser(teamId), { user_id: userId });
    return response.data;
  } catch (error) {
    console.error('Takımdan kullanıcı çıkarılırken hata:', error);
    throw error;
  }
};