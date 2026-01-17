const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const BusPass = require('../models/BusPass');
const DailyAttendance = require('../models/DailyAttendance');
const { auth, isDriver } = require('../middleware/auth');
const RouteAnalytics = require('../models/RouteAnalytics');

// Helper: today date string
const todayString = () => new Date().toISOString().split('T')[0];

// =========================================
// 1. SCAN PASS (Entry Only)
// =========================================
router.post('/scan-pass', auth, isDriver, async (req, res) => {
    try {
        const { qrData, tripType } = req.body;
        const driver = req.user;

        // 1. Automated Shift Logic based on Driver Assignment
        const activeShift = driver.shift;

        if (!qrData) return res.status(400).json({ message: 'QR data required' });
        if (!activeShift) return res.status(403).json({ message: 'No Shift Assigned to Driver. Contact Admin.' });
        if (!tripType || !['pickup', 'drop'].includes(tripType)) {
            return res.status(400).json({ message: 'Trip Type (Pickup/Drop) Required' });
        }

        // A. Verify QR
        const parts = qrData.split('|');
        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            return res.status(400).json({ message: 'Invalid QR code format' });
        }

        const [, passId, userId, expiry, signature] = parts;
        const raw = `${passId}|${userId}|${expiry}`;
        const expectedSignature = crypto.createHmac('sha256', process.env.QR_SECRET).update(raw).digest('hex');

        if (signature !== expectedSignature) return res.status(400).json({ message: 'Invalid signature' });
        if (new Date(expiry) < new Date()) return res.status(400).json({ message: 'Pass expired' });

        // B. Fetch Pass & Authorize
        const pass = await BusPass.findById(passId).populate('route');
        if (!pass || pass.status !== 'approved') return res.status(400).json({ message: 'Invalid/Inactive pass' });

        if (pass.route._id.toString() !== driver.assignedRoute.toString()) {
            return res.status(403).json({ message: 'Wrong Route', passRoute: pass.route.routeName });
        }

        // C. STRICT SHIFT CHECKING
        // activeShift (Driver's Profile) vs pass.shift (Student's Profile)
        // If Driver is 'morning', only 'morning' students can enter.
        if (pass.shift !== activeShift) {
            return res.status(403).json({
                message: `Pass Valid for ${pass.shift.toUpperCase()} Shift Only`,
                passShift: pass.shift
            });
        }

        // D. Check Existing Attendance
        const today = todayString();

        // Check duplication based on Trip Type (Pickup vs Drop)
        // A student can board ONCE for Pickup and ONCE for Drop each day.

        const existing = await DailyAttendance.findOne({
            passId,
            date: today,
            tripType: tripType
        });

        if (existing) {
            return res.status(400).json({
                alreadyScanned: true,
                message: `Already Boarded for ${tripType === 'pickup' ? 'College' : 'Home'}`,
                student: pass.studentName,
                passShift: pass.shift,
                time: existing.checkInTime
            });
        }

        // Create Record
        const attendance = await DailyAttendance.create({
            passId,
            userId,
            routeId: pass.route._id,
            date: today,
            shift: activeShift,   // 'morning' or 'afternoon'
            tripType: tripType,   // 'pickup' or 'drop'
            checkInTime: new Date(),
            checkInBy: driver._id,
            status: 'checked-in'
        });

        // E. Update Analytics
        // We update the Analytics for the DRIVER'S ASSIGNED SHIFT.
        // Because "RouteAnalytics" tracks the specific Shift Bus performance.
        await RouteAnalytics.findOneAndUpdate(
            { routeId: pass.route._id, date: today, shift: activeShift },
            {
                $setOnInsert: { routeId: pass.route._id, date: today, busId: driver.assignedBus, shift: activeShift },
                $inc: {
                    totalPassengers: 1,
                    checkedIn: 1
                }
            },
            { upsert: true, new: true }
        );

        return res.json({
            success: true,
            message: 'Boarded Successfully',
            tripType: tripType, // Echo back logic
            passShift: pass.shift,
            student: pass.studentName,
            enrollment: pass.enrollmentNumber,
            route: pass.route.routeName,
            time: attendance.checkInTime
        });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ message: 'Scan failed' });
    }
});

// =========================================
// 2. END TRIP (Reset Occupancy)
// =========================================
router.post('/end-trip', auth, isDriver, async (req, res) => {
    try {
        const driver = req.user;
        const activeShift = driver.shift; // Auto-detect from profile

        if (!driver.assignedRoute) return res.status(400).json({ message: 'No route assigned' });
        if (!activeShift) return res.status(400).json({ message: 'No Shift Assigned to Driver' });

        const today = todayString();

        // Reset ONLY the active shift's occupancy
        await RouteAnalytics.findOneAndUpdate(
            { routeId: driver.assignedRoute, date: today, shift: activeShift },
            { $set: { checkedIn: 0 } }
        );

        res.json({ success: true, message: `Trip ended for ${activeShift} batch. Occupancy reset.` });

    } catch (error) {
        console.error("End trip error:", error);
        res.status(500).json({ message: "Failed to end trip" });
    }
});

module.exports = router;