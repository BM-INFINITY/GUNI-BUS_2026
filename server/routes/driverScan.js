const express = require('express');
const router = express.Router();
const BusPass = require('../models/BusPass');
const DayTicket = require('../models/DayTicket');
const DailyAttendance = require('../models/DailyAttendance');
const RouteAnalytics = require('../models/RouteAnalytics'); // Shared Analytics
const { auth, isDriver } = require('../middleware/auth');
const { verifyQR, isSameDay } = require('../utils/qrVerification');
const { validateTimeWindow, getTimeString } = require('../utils/timeUtils');
const { getCurrentTime, getTodayString } = require('../utils/timeProvider');

/**
 * UNIFIED DRIVER SCAN ENDPOINT (TIME-BASED)
 * 
 * Rules:
 * 1. Morning Boarding: < 08:30 AM
 * 2. Morning Return: > 02:10 PM
 * 3. Afternoon Boarding: < 11:40 AM
 * 4. Afternoon Return: > 05:10 PM
 * 5. Strict Shift Isolation
 * 6. Strict Driver Authorization
 */
router.post('/', auth, isDriver, async (req, res) => {
    try {
        const { qrData } = req.body; // NO tripType input
        const driver = req.user;
        const activeShift = driver.shift;

        // 1. VALIDATION
        if (!qrData) return res.status(400).json({ message: 'QR data required' });
        if (!activeShift) return res.status(403).json({ message: 'No shift assigned to driver' });
        if (!driver.assignedRoute) return res.status(403).json({ message: 'No route assigned to driver' });

        // 2. VERIFY QR
        const qrResult = verifyQR(qrData);
        if (!qrResult.valid) return res.status(400).json({ message: qrResult.error });
        const { id, userId, expiry } = qrResult;

        // 3. AUTO-DETECT TYPE
        let pass = await BusPass.findById(id).populate('route');
        let ticket = null;
        let isBusPass = false;
        let isDayTicket = false;

        if (pass) {
            isBusPass = true;
        } else {
            ticket = await DayTicket.findById(id).populate('route');
            if (ticket) isDayTicket = true;
        }

        if (!isBusPass && !isDayTicket) return res.status(400).json({ message: 'Invalid QR code - not found' });

        // 4. COMMON AUTHORIZATION (Route & Shift)
        const entity = isBusPass ? pass : ticket;
        const entityRouteId = entity.route._id.toString();
        const entityShift = entity.shift;
        const studentName = isBusPass ? pass.studentName : ticket.studentName;
        const enrollment = isBusPass ? pass.enrollmentNumber : ticket.enrollmentNumber;
        const studentPhoto = isBusPass ? pass.studentPhoto : ticket.studentPhoto;
        const studentDOB = isBusPass ? pass.dateOfBirth : ticket.dateOfBirth;
        const studentMobile = isBusPass ? pass.mobile : ticket.mobile;

        if (entityRouteId !== driver.assignedRoute.toString()) {
            return res.status(403).json({
                message: 'Wrong Route',
                expected: driver.assignedRoute,
                actual: entity.route.routeName
            });
        }

        if (entityShift !== activeShift) {
            return res.status(403).json({
                message: `Shift Mismatch. Student is ${entityShift}, Bus is ${activeShift}`,
                passShift: entityShift
            });
        }

        if (isBusPass && pass.status !== 'approved') return res.status(400).json({ message: 'Pass not active' });
        if (isDayTicket && ticket.status !== 'active') return res.status(400).json({ message: 'Ticket not active' });


        // 5. DETERMINE SCAN PHASE (Time-Based)
        const todayStr = getTodayString(req); // Use Provider-aware date string

        // Count existing scans for TODAY
        let scanCount = 0;
        let scans = [];

        if (isBusPass) {
            scanCount = await DailyAttendance.countDocuments({ passId: id, date: todayStr });
        } else {
            // For DayTicket, trust the DB Array for count (handle edge cases)
            scanCount = await DailyAttendance.countDocuments({ passId: id, date: todayStr });
        }

        // 6. VALIDATE TIME WINDOW
        // We calculate phase based on 'scanCount' AND 'Time'.
        // If scanCount == 0 -> Must be Boarding Phase (Check Time < Cutoff)
        // If scanCount == 1 -> Must be Return Phase (Check Time > Start)

        // If scanCount == 1 -> Must be Return Phase (Check Time > Start)

        // Use CENTRALIZED TIME for validation
        const currentTime = getCurrentTime(req);
        const validation = validateTimeWindow(activeShift, scanCount, currentTime);

        if (!validation.allowed) {
            // Check if it's already maxed out
            if (scanCount >= 2) {
                return res.status(400).json({
                    message: 'Daily limit reached (2 scans completed)',
                    scanCount: scanCount,
                    maxScans: 2
                });
            }
            return res.status(400).json({ message: validation.error });
        }

        const scanPhase = validation.phase; // 'boarding' or 'return'

        // Auto-map to Legacy tripType for DB Index Compatibility
        const tripType = scanPhase === 'boarding' ? 'pickup' : 'drop';

        // 7. SPECIFIC RULES

        // DayTicket: Single Trip Check
        if (isDayTicket && ticket.ticketType === 'single') {
            if (scanCount >= 1) { // Current count before this scan
                return res.status(400).json({ message: 'Single Ticket already used' });
            }
            // Allow Boarding phase (count 0)
        }

        // Duplicate Check (Sanity Check - Should fall under 'scanCount' validation usually)
        const existing = await DailyAttendance.findOne({ passId: id, date: todayStr, tripType: tripType });
        if (existing) {
            return res.status(400).json({
                message: `Already scanned for ${scanPhase}`,
                time: existing.checkInTime
            });
        }

        // 8. EXECUTE SCAN

        // Update DayTicket State
        if (isDayTicket) {
            ticket.scans.push({
                scannedAt: getCurrentTime(req),
                scannedBy: driver._id,
                tripType: tripType // Legacy
            });
            ticket.scanCount += 1;

            if (ticket.scanCount >= ticket.maxScans) {
                ticket.status = 'used';
            }
            await ticket.save();
        }

        // Create Attendance Record
        const attendance = await DailyAttendance.create({
            passId: id,
            userId: userId,
            routeId: entity.route._id,
            date: todayStr,
            shift: activeShift,
            tripType: tripType, // Legacy Index Requirement
            scanPhase: scanPhase, // New Field
            checkInTime: getCurrentTime(req),
            checkInBy: driver._id,
            status: 'checked-in'
        });

        // Update Analytics
        await RouteAnalytics.findOneAndUpdate(
            { routeId: entity.route._id, date: todayStr, shift: activeShift },
            {
                $setOnInsert: {
                    routeId: entity.route._id,
                    date: todayStr,
                    busId: driver.assignedBus,
                    shift: activeShift
                },
                $inc: {
                    totalPassengers: 1,
                    checkedIn: 1,
                    revenue: isDayTicket ? (ticket.amount || 0) : 0
                }
            },
            { upsert: true, new: true }
        );

        // 9. RESPONSE
        return res.json({
            success: true,
            type: isBusPass ? 'pass' : 'ticket',
            message: `${scanPhase === 'boarding' ? 'Boarding' : 'Return'} Verified`,
            student: {
                name: studentName,
                enrollment: enrollment,
                photo: studentPhoto,
                dob: studentDOB,
                mobile: studentMobile
            },
            route: entity.route.routeName,
            shift: entityShift,
            scanPhase: scanPhase, // Frontend can show "Boarding" or "Return"
            scanCount: scanCount + 1,
            maxScans: isDayTicket ? ticket.maxScans : 2
        });

    } catch (error) {
        console.error('Time-Based Scan Error:', error);
        return res.status(500).json({ message: 'Scan failed', error: error.message });
    }
});

module.exports = router;
