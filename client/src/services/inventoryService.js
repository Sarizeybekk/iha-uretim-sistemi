
import apiClient, { API } from './apiConfig';

const inventoryService = {
  // Get all inventory items
  getInventory: async () => {
    try {
      const response = await apiClient.get(API.inventory.list);
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  },

  // Get low stock items
  getLowStockItems: async () => {
    try {
      const response = await apiClient.get(API.inventory.lowStock);
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  },

  // Get status grouped by aircraft type
  getStatusByAircraftType: async () => {
    try {
      const response = await apiClient.get(API.inventory.statusByAircraftType);
      return response.data;
    } catch (error) {
      console.error('Error fetching status by aircraft type:', error);
      throw error;
    }
  },

  // Get specific inventory item
  getInventoryItem: async (id) => {
    try {
      const response = await apiClient.get(API.inventory.detail(id));
      return response.data;
    } catch (error) {
      console.error(`Error fetching inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new inventory item
  createInventoryItem: async (data) => {
    try {
      const response = await apiClient.post(API.inventory.create, data);
      return response.data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  },

  // Update inventory item (partial update)
  updateInventoryItem: async (id, data) => {
    try {
      const response = await apiClient.patch(API.inventory.partialUpdate(id), data);
      return response.data;
    } catch (error) {
      console.error(`Error updating inventory item with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete inventory item
  deleteInventoryItem: async (id) => {
    try {
      await apiClient.delete(API.inventory.delete(id));
      return true;
    } catch (error) {
      console.error(`Error deleting inventory item with ID ${id}:`, error);
      throw error;
    }
  }
};


export default inventoryService;