const assert = require('assert');
const moment = require('moment-timezone');
const { getCurrentTime } = require('../utils/timeProvider');

// Mock Data
const MOCK_TIME_STR = "2026-02-01T08:00:00+05:30";
const MOCK_REQ = {
    body: {
        mockTime: MOCK_TIME_STR
    }
};

console.log("🧪 STARTING TIME PROVIDER TESTS...\n");

// TEST 1: PRODUCTION ENVIRONMENT (Should IGNORE mock)
process.env.NODE_ENV = 'production';
process.env.TIME_MODE = 'MOCK'; // Should be ignored in prod
const prodTime = getCurrentTime(MOCK_REQ);
const realTime = moment().tz("Asia/Kolkata").toDate();

// Allow small delta (1s)
const diffProd = Math.abs(prodTime - realTime);
if (diffProd < 1000) {
    console.log("✅ TEST 1 PASSED: PRODUCTION uses Real Time (Ignored Mock)");
} else {
    console.error("❌ TEST 1 FAILED: PRODUCTION used wrong time");
    console.error(`Expected ~${realTime}, Got ${prodTime}`);
    process.exit(1);
}

// TEST 2: DEV ENVIRONMENT + TIME_MODE=REAL (Should IGNORE mock)
process.env.NODE_ENV = 'development';
process.env.TIME_MODE = 'REAL';
const devRealTimeResult = getCurrentTime(MOCK_REQ);
const diffDevReal = Math.abs(devRealTimeResult - realTime);

if (diffDevReal < 1000) {
    console.log("✅ TEST 2 PASSED: DEV (REAL MODE) uses Real Time");
} else {
    console.error("❌ TEST 2 FAILED: DEV (REAL MODE) used wrong time");
    process.exit(1);
}

// TEST 3: DEV ENVIRONMENT + TIME_MODE=MOCK (Should USE mock)
process.env.NODE_ENV = 'development';
process.env.TIME_MODE = 'MOCK';
const devMockTimeResult = getCurrentTime(MOCK_REQ);
const expectedMock = moment(MOCK_TIME_STR).toDate();

if (devMockTimeResult.getTime() === expectedMock.getTime()) {
    console.log("✅ TEST 3 PASSED: DEV (MOCK MODE) uses Mock Time");
} else {
    console.error("❌ TEST 3 FAILED: DEV (MOCK MODE) did not use mock time");
    console.error(`Expected ${expectedMock}, Got ${devMockTimeResult}`);
    process.exit(1);
}

// TEST 4: DEV ENVIRONMENT + TIME_MODE=MOCK + NO REQ BODY (Should Fallback to Real)
const devFallbackResult = getCurrentTime({});
const diffFallback = Math.abs(devFallbackResult - realTime);

if (diffFallback < 1000) {
    console.log("✅ TEST 4 PASSED: DEV (MOCK MODE) without body falls back to Real Time");
} else {
    console.error("❌ TEST 4 FAILED: DEV (MOCK MODE) without body failed fallback");
    process.exit(1);
}

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
