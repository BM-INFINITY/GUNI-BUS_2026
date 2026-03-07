import api from './api';

/**
 * GET /api/checkpoints/status
 * Returns current trip phase for the driver
 */
export const getCheckpointStatus = async () => {
  const response = await api.get('/checkpoints/status');
  return response.data;
};

/**
 * POST /api/checkpoints/start-shift
 * Body: { odometerReading }
 * Starts the driver's shift and enables boarding scans
 */
export const startShift = async (odometerReading) => {
  const response = await api.post('/checkpoints/start-shift', { odometerReading });
  return response.data;
};

/**
 * POST /api/checkpoints/reached-university
 * Body: { odometerReading }
 * Marks that the bus reached university; disables boarding scans
 */
export const reachedUniversity = async (odometerReading) => {
  const response = await api.post('/checkpoints/reached-university', { odometerReading });
  return response.data;
};

/**
 * POST /api/checkpoints/start-return
 * Body: { odometerReading }
 * Starts the return trip and enables return scans
 */
export const startReturn = async (odometerReading) => {
  const response = await api.post('/checkpoints/start-return', { odometerReading });
  return response.data;
};

/**
 * POST /api/checkpoints/reached-home
 * Body: { odometerReading }
 * Marks trip as complete
 */
export const reachedHome = async (odometerReading) => {
  const response = await api.post('/checkpoints/reached-home', { odometerReading });
  return response.data;
};
