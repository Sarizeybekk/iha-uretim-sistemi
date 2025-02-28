// inventoryService.js
import apiClient from './apiConfig';

// Servisin içindeki tüm fonksiyonları içeren bir nesne
const inventoryService = {
  // Tüm envanter öğelerini getir
  getInventory: async () => {
    try {
      const response = await apiClient.get('/api/inventory/envanter/');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Düşük stok öğelerini getir
  getLowStockItems: async () => {
    try {
      const response = await apiClient.get('/api/inventory/envanter/dusuk_stok/');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Belirli bir envanter öğesini getir
  getInventoryItem: async (id) => {
    try {
      const response = await apiClient.get(`/api/inventory/envanter/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  // Envanter öğesini güncelle (kısmi güncelleme)
  updateInventoryItem: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/inventory/envanter/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  // Envanter öğesini sil
  deleteInventoryItem: async (id) => {
    try {
      await apiClient.delete(`/api/inventory/envanter/${id}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting inventory item with ID ${id}:`, error);
      throw error;
    }
  }
};

// Varsayılan olarak tüm servis nesnesini dışa aktar
export default inventoryService;