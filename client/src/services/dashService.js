
import { toast } from 'react-toastify';

import apiClient, { API } from './apiConfig';

export const getUserTeams = async () => {
  try {
    console.log('API endpoint kullanılıyor:', API.auth.userTeams);
    const response = await apiClient.get(API.auth.userTeams);
    console.log('Kullanıcı takımları başarıyla alındı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı takımları alınırken hata oluştu:', error);
    if (error.response) {
      console.error('Sunucu yanıtı:', error.response.status, error.response.data);
    }
    throw error;
  }
};

/**
 * Uçak listesini getirir
 * @returns {Promise<Array>} Uçak listesi
 */
export const getAircraft = async () => {
  try {
    const response = await apiClient.get(API.aircrafts.list);
    console.log('Uçak verileri başarıyla alındı:', response.data);


    return response.data.results || [];
  } catch (error) {
    console.error('Uçak verileri alınırken hata oluştu:', error);
    return [];
  }
};



// Uçak tipi bazında envanter durumunu getirir
export const getInventory = async () => {
  try {
    console.log('API endpoint kullanılıyor:', API.inventory.list);
    const response = await apiClient.get(API.inventory.list);
    const data = response.data;

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Envanter verileri alınırken hata oluştu:', error);
    if (error.response) {
      console.error('Sunucu yanıtı:', error.response.status, error.response.data);
    }
    return [];
  }
  };

export const getPartsCount = async () => {
  try {
    const response = await apiClient.get('http://localhost:8001/api/v1/parts/parcalar/');
    console.log('Parça verileri başarıyla alındı:', response.data);

    // API count formatında dönüyorsa
    return response.data.count || response.data.length || 0;
  } catch (error) {
    console.error('Parça verileri alınırken hata oluştu:', error);
    return 0;
  }
   };
  export const getUserTeamsInfo = async () => {
    try {
      const response = await apiClient.get('/accounts/kullanicilar/takimlarim/');
      console.log('Takım bilgileri başarıyla alındı:', response.data);
      return response.data;
    } catch (error) {
      console.error('Takım bilgileri alınırken hata oluştu:', error);
      return [];
    }
  };
  export const getMissingParts = async () => {
  try {
    const response = await apiClient.get('/inventory/envanter/dusuk_stok/');
    console.log('Eksik parçalar başarıyla alındı:', response.data);
    return response.data;  //  Gelen veriyi döndür
  } catch (error) {
    console.error(' Eksik parçalar alınırken hata oluştu:', error);
    toast.error('Eksik parçalar alınırken hata oluştu.');
    return [];
  }};


  export const getLowStockCount = async () => {
  try {
    const response = await apiClient.get('http://localhost:8001/api/v1/inventory/envanter/dusuk_stok/');
    console.log('Düşük stok verileri başarıyla alındı:', response.data);

    // Gelen liste uzunluğu kadar sayıyı döndür
    return Array.isArray(response.data) ? response.data.length : 0;
  } catch (error) {
    console.error('Düşük stok verileri alınırken hata oluştu:', error);
    return 0;
  }



};