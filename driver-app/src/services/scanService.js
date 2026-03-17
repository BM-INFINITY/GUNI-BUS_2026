import api from './api';

/**
 * Scan a student QR code.
 *
 * The backend expects the raw QR string in this exact format:
 *   GUNI|passId|userId|validUntil|signature
 *
 * POST /api/driver/scan
 * Body: { qrData: <raw trimmed string from QR code>, mockTime?: <ISO string> }
 * Returns: { success, message, student, route, shift, scanPhase, scanCount, maxScans }
 *
 * @param {string} rawData   - Raw string extracted from the QR code scan result
 * @param {string|null} mockTime - DEV ONLY: ISO datetime string to override server time.
 *                                 Ignored in production (server-side guard).
 *                                 Pass null / undefined to use real time.
 */
export const scanQR = async (rawData, mockTime = null) => {
  const payload = { qrData: rawData.trim() }; // trim whitespace, never modify QR content

  // DEV ONLY: attach mockTime so backend timeProvider.js uses it instead of real IST time
  if (mockTime) {
    payload.mockTime = mockTime;
  }

  const response = await api.post('/driver/scan', payload);
  return response.data;
};

