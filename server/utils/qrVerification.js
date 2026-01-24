const crypto = require('crypto');

/**
 * Verify QR code signature and extract payload
 * @param {string} qrData - Raw QR code data
 * @returns {Object} { valid, id, userId, expiry, error }
 */
function verifyQR(qrData) {
    try {
        // Parse QR format: GUNI|id|userId|expiry|signature
        const parts = qrData.split('|');

        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            return { valid: false, error: 'Invalid QR code format' };
        }

        const [, id, userId, expiry, signature] = parts;

        // Verify HMAC SHA256 signature
        const raw = `${id}|${userId}|${expiry}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(raw)
            .digest('hex');

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid QR signature' };
        }

        // Check expiry
        const expiryDate = new Date(expiry);
        if (expiryDate < new Date()) {
            return { valid: false, error: 'QR code expired' };
        }

        return {
            valid: true,
            id,
            userId,
            expiry: expiryDate
        };

    } catch (error) {
        console.error('QR verification error:', error);
        return { valid: false, error: 'QR verification failed' };
    }
}

/**
 * Check if two dates are the same calendar day
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
function isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

/**
 * Get today's date string (YYYY-MM-DD)
 * @returns {string}
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

module.exports = {
    verifyQR,
    isSameDay,
    getTodayString
};
