import api from './api';

/**
 * Driver: Report a found item on the bus
 * POST /api/lost-found/items
 * Body: { itemName, category, description, foundDate, imageBase64?, storageLocation? }
 * Backend auto-links the driver's assigned bus and route.
 */
export const reportFoundItem = async (payload) => {
  const response = await api.post('/lost-found/items', payload);
  return response.data;
};

/**
 * Driver: Get all found items (including ones reported by this driver)
 * GET /api/lost-found/items/all
 */
export const getMyFoundItems = async () => {
  const response = await api.get('/lost-found/items/all');
  return response.data;
};

/**
 * Public board of active found items (visible to all authenticated users)
 * GET /api/lost-found/board/found
 */
export const getFoundBoard = async () => {
  const response = await api.get('/lost-found/board/found');
  return response.data;
};
