const moment = require('moment-timezone');

// CONSTANTS FOR CUTOFF TIMES (IST)
const TIME_RULES = {
    morning: {
        boardingEnd: "08:30", // AM
        returnStart: "14:10"  // 02:10 PM
    },
    afternoon: {
        boardingEnd: "11:40", // AM
        returnStart: "17:10"  // 05:10 PM
    }
};

/**
 * Get current time in Indian Standard Time
 * @returns {Date} Date object set to IST
 */
function getISTDate() {
    return moment().tz("Asia/Kolkata").toDate();
}

/**
 * Get simple time string HH:mm from Date object
 * @param {Date} date 
 * @returns {string} "HH:mm" (24-hour format)
 */
function getTimeString(date) {
    // Use moment-timezone to correctly extract HH:mm in IST
    // Do NOT use date.getHours() — it reads the OS local timezone (UTC on most servers)
    return moment(date).tz('Asia/Kolkata').format('HH:mm');
}

/**
 * Validate if scan is allowed based on Scan Count and Shift Window
 * @param {string} shift - 'morning' or 'afternoon'
 * @param {number} currentScanCount - 0 for Boarding, 1 for Return
 * @param {Date} currentTime - Optional: Explicit time to validate against (defaults to current IST)
 * @returns {Object} { allowed: boolean, phase: 'boarding'|'return', error: string }
 */
function validateTimeWindow(shift, currentScanCount, currentTime) {
    // Use provided time or fallback to current IST (for backward compatibility/safety)
    const nowIST = currentTime || getISTDate();
    const timeStr = getTimeString(nowIST);
    const rules = TIME_RULES[shift];

    if (!rules) return { allowed: false, error: "Invalid shift configuration" };

    // CASE 1: FIRST SCAN (Boarding) -> Count is 0
    if (currentScanCount === 0) {
        if (timeStr <= rules.boardingEnd) {
            return { allowed: true, phase: 'boarding' };
        } else {
            return {
                allowed: false,
                error: `Boarding time over. First scan allowed only before ${rules.boardingEnd}`
            };
        }
    }

    // CASE 2: SECOND SCAN (Return) -> Count is 1
    if (currentScanCount === 1) {
        if (timeStr >= rules.returnStart) {
            return { allowed: true, phase: 'return' };
        } else {
            return {
                allowed: false,
                error: `Too early for return trip. Second scan allowed only after ${rules.returnStart}`
            };
        }
    }

    return { allowed: false, error: "Daily scan limit reached" };
}

module.exports = {
    getISTDate,
    getTimeString,
    validateTimeWindow,
    TIME_RULES
};
