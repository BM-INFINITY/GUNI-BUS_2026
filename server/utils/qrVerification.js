const crypto = require('crypto');

// ── Safety guard: loud warning if QR_SECRET is missing ──────────────────────
if (!process.env.QR_SECRET) {
    console.error('[QR] ⚠️  WARNING: QR_SECRET is NOT set in .env! All QR verifications will fail silently.');
}

/**
 * Verify QR code signature and extract payload
 * @param {string} qrData - Raw QR code data
 * @returns {Object} { valid, id, userId, expiry, error }
 */
function verifyQR(qrData) {
    try {
        // Trim whitespace / accidental newlines from scanner
        const cleaned = (qrData || '').trim();

        // Parse QR format: GUNI|id|userId|expiry|signature
        const parts = cleaned.split('|');

        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            console.warn('[QR] Format mismatch. parts.length=%d, raw="%s"', parts.length, cleaned.slice(0, 80));
            return { valid: false, error: 'Invalid QR code format' };
        }

        const [, id, userId, expiry, signature] = parts;

        // Rebuild the raw string that was originally signed
        const raw = `${id}|${userId}|${expiry}`;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.QR_SECRET || '')
            .update(raw)
            .digest('hex');

        if (signature !== expectedSignature) {
            // Debug output: helps identify secret/payload mismatch
            console.warn('[QR] Signature mismatch!');
            console.warn('  raw hashed  : "%s"', raw);
            console.warn('  received sig: "%s"', signature);
            console.warn('  expected sig: "%s"', expectedSignature);
            console.warn('  QR_SECRET set: %s', !!process.env.QR_SECRET);
            return { valid: false, error: 'Invalid QR signature' };
        }

        // Check expiry
        const expiryDate = new Date(expiry);
        if (expiryDate < new Date()) {
            return { valid: false, error: 'QR code expired' };
        }

        return { valid: true, id, userId, expiry: expiryDate };

    } catch (error) {
        console.error('[QR] verification error:', error);
        return { valid: false, error: 'QR verification failed' };
    }
}

/**
 * Check if two dates are the same calendar day
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
 */
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

module.exports = { verifyQR, isSameDay, getTodayString };

