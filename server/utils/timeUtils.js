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
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Validate if scan is allowed based on Scan Count and Shift Window
 * @param {string} shift - 'morning' or 'afternoon'
 * @param {number} currentScanCount - 0 for Boarding, 1 for Return
 * @returns {Object} { allowed: boolean, phase: 'boarding'|'return', error: string }
 */
function validateTimeWindow(shift, currentScanCount) {
    const nowIST = getISTDate();
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
