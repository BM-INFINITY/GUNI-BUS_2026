import api from './api';

/**
 * Scan a student QR code
 * POST /api/driver/scan
 * Body: { qrData }  — qrData is the raw string from the QR code
 * Returns: { success, student, route, shift, scanPhase, scanCount, maxScans }
 */
export const scanQR = async (qrData) => {
  const response = await api.post('/driver/scan', { qrData });
  return response.data;
};
