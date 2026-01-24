const moment = require('moment-timezone');

/**
 * CENTRALIZED TIME PROVIDER
 * 
 * Rules:
 * 1. NODE_ENV === 'production' -> INDISPUTABLE REAL TIME (IST)
 * 2. NODE_ENV === 'development' ->
 *      a. TIME_MODE === 'MOCK' && req.body.mockTime -> Use mockTime
 *      b. Otherwise -> Use REAL TIME (IST)
 */

/**
 * Get the current time for the request context
 * @param {Object} req - Express request object
 * @returns {Date} Javascript Date object (equivalent to new Date())
 */
const getCurrentTime = (req) => {
    // 1. SAFETY: REAL TIME IS DEFAULT
    // (Production check removed per user request for DEMO purposes)

    // 2. CHECK FOR MOCK MODE
    // if (process.env.NODE_ENV === 'development') { // Check removed to allow PROD Usage
    console.log('[TimeProvider] Request Body:', req?.body); // DEBUG LOG
    // Check if MOCK mode is explicitly enabled
    if (process.env.TIME_MODE === 'MOCK') {
        // Check if request has valid mockTime
        if (req && req.body && req.body.mockTime) {
            const mock = moment(req.body.mockTime);
            if (mock.isValid()) {
                console.info(`[DEV] Using MOCK TIME: ${mock.format()}`);
                return mock.toDate();
            } else {
                console.warn('[TimeProvider] Invalid mockTime format:', req.body.mockTime);
            }
        } else {
            console.log('[TimeProvider] No mockTime in request');
        }
    }
    // }

    // Default: Real Time
    return moment().tz("Asia/Kolkata").toDate();
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
