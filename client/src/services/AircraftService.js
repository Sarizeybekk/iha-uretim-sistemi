import apiClient, { API } from './apiConfig';

const AircraftService = {
  getAircraftTypes: async () => {
    const response = await apiClient.get(API.aircrafts.types);
    return response.data;
  },
  getAssembledAircrafts: async () => {
    const response = await apiClient.get(API.aircrafts.assemblyStatus);
    return response.data;
  },
  assembleAircraft: async (data) => {
    const response = await apiClient.post(API.aircrafts.assemble, data);
    return response.data;
  }
};

export default AircraftService;
