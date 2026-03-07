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
