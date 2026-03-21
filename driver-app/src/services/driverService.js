import api from './api';

/**
 * Get Driver Dashboard
 * GET /api/driver/dashboard
 * Returns: { driver, analytics, passengers }
 */
export const getDashboard = async () => {
  const response = await api.get('/driver/dashboard');
  return response.data;
};

/**
 * Get Assigned Route Details
 * GET /api/driver/route-details
 * Returns: route object
 */
export const getRouteDetails = async () => {
  const response = await api.get('/driver/route-details');
  return response.data;
};

/**
 * Get Seat Map for Assigned Bus
 * GET /api/seat-reservation/seat-map/:busId/:date/:routeId?direction=...
 */
export const getSeatMap = async (busId, date, routeId, direction) => {
  const response = await api.get(
    `/seat-reservation/seat-map/${busId}/${date}/${routeId}?direction=${direction}`
  );
  return response.data;
};
