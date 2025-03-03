import apiClient, { API } from './apiConfig';

const PartsService = {
  // Uçak tiplerini getir
  getAircraftTypes: async () => {
    const response = await apiClient.get(API.aircrafts.types);
    console.log('API Yanıtı (Uçak Tipleri):', response.data.results);
    return response.data.results;
  },

  // Tüm parçaları getir
  getAllParts: async () => {
    const response = await apiClient.get(API.parts.list);
    console.log('API Yanıtı (Parçalar):', response.data.results);
    return response.data.results;
  },

  //  Parça tiplerini getir
  getPartTypes: async () => {
    const response = await apiClient.get(API.parts.types);
    console.log('API Yanıtı (Parça Tipleri):', response.data.results);
    return response.data.results;
  },

  // Parça durumlarını getir
  getPartStatuses: async () => {
    const response = await apiClient.get(API.parts.status);
    console.log('API Yanıtı (Durumlar):', response.data.results);
    return response.data.results;
  },
  createPart: async (partData) => {
    console.log("API İstek Verileri:", partData);
    const response = await apiClient.post(API.parts.create, partData);
    console.log("API Yanıtı:", response);
    return response.data;
  },
   deletePart: async (id) => {
   const response = await apiClient.delete(API.parts.delete(id));
   return response.data;
 },



};

export default PartsService;