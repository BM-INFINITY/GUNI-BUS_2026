const moment = require('moment-timezone');

/**
 * CENTRALIZED TIME PROVIDER
 *
 * Rules:
 * 1. NODE_ENV === 'production' → always uses real IST time (mockTime is IGNORED)
 * 2. NODE_ENV === 'development' → uses req.body.mockTime if provided, else real IST time
 */

const getCurrentTime = (req) => {
    console.log('[TimeProvider] Request Body:', req?.body);

    // In development: honour mockTime from scan request body
    if (process.env.NODE_ENV !== 'production') {
        if (req?.body?.mockTime) {
            const mock = moment(req.body.mockTime);
            if (mock.isValid()) {
                console.info(`[DEV] Using MOCK TIME: ${mock.format('YYYY-MM-DD HH:mm:ss z')} (IST: ${mock.tz('Asia/Kolkata').format('HH:mm')})`);
                return mock.toDate();
            } else {
                console.warn('[TimeProvider] Invalid mockTime format:', req.body.mockTime);
            }
        }
    }

    // Default: Real IST time
    const realTime = moment().tz('Asia/Kolkata').toDate();
    console.info(`[TimeProvider] Using REAL TIME: ${moment(realTime).tz('Asia/Kolkata').format('HH:mm:ss')}`);
    return realTime;
};


/**
 * Get standardized today string YYYY-MM-DD based on current contextual time
 * @param {Object} req - Express request object
 * @returns {string} "YYYY-MM-DD"
 */
const getTodayString = (req) => {
    const now = getCurrentTime(req);
    return moment(now).tz("Asia/Kolkata").format("YYYY-MM-DD");
};

module.exports = {
    getCurrentTime,
    getTodayString
};
