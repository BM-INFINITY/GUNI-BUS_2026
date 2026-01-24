const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const BusPass = require('../models/BusPass');
const DailyAttendance = require('../models/DailyAttendance');
const { auth, isDriver } = require('../middleware/auth');


// ==========================
// Get My Attendance History (Student)
// ==========================
router.get('/my-history', auth, async (req, res) => {
    try {
        // Calculate date 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD format

        const logs = await DailyAttendance.find({
            userId: req.user._id,
            date: { $gte: threeDaysAgoStr } // Only logs from last 3 days
        })
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1, createdAt: -1 })
            .limit(50); // Fetch last 50 records

        console.log(`[Attendance] User ${req.user._id} requested history. Found ${logs.length} records from last 3 days (since ${threeDaysAgoStr}).`);
        res.json(logs);
    } catch (error) {
        console.error('Get my attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================
// Scan QR (Driver Only)
// ==========================
router.post('/scan', auth, isDriver, async (req, res) => {
    try {
        const { qrData, action } = req.body;
        // action = "checkin" | "checkout"

        if (!qrData || !action) {
            return res.status(400).json({ message: 'QR data and action required' });
        }

        // QR Format: GUNI|passId|userId|expiry|signature
        const parts = qrData.split('|');

        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            return res.status(400).json({ message: 'Invalid QR format' });
        }

        const passId = parts[1];
        const userId = parts[2];
        const expiry = parts[3];
        const signature = parts[4];

        // Verify expiry
        if (new Date(expiry) < new Date()) {
            return res.status(400).json({ message: 'Pass expired' });
        }

        // Verify signature
        const rawData = `${passId}|${userId}|${expiry}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(rawData)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({ message: 'Invalid QR signature' });
        }

        const pass = await BusPass.findById(passId).populate('route');

        if (!pass || pass.status !== 'approved') {
            return res.status(404).json({ message: 'Invalid or inactive pass' });
        }

        // Today's date
        const today = new Date().toISOString().split('T')[0];

        let attendance = await DailyAttendance.findOne({
            passId: pass._id,
            date: today
        });

        // ================= Check-In =================
        if (action === 'checkin') {
            if (attendance && attendance.checkInTime) {
                return res.status(400).json({ message: 'Already checked in today' });
            }

            if (!attendance) {
                attendance = new DailyAttendance({
                    passId: pass._id,
                    userId: pass.userId,
                    route: pass.route._id,
                    date: today,
                    checkInTime: new Date(),
                    driverId: req.user._id
                });
            } else {
                attendance.checkInTime = new Date();
            }

            await attendance.save();

            return res.json({
                message: 'Check-in successful',
                student: pass.studentName,
                route: pass.route.routeName,
                time: attendance.checkInTime
            });
        }

        // ================= Check-Out =================
        if (action === 'checkout') {
            if (!attendance || !attendance.checkInTime) {
                return res.status(400).json({ message: 'No check-in found for today' });
            }

            if (attendance.checkOutTime) {
                return res.status(400).json({ message: 'Already checked out today' });
            }

            attendance.checkOutTime = new Date();
            await attendance.save();

            return res.json({
                message: 'Check-out successful',
                student: pass.studentName,
                route: pass.route.routeName,
                time: attendance.checkOutTime
            });
        }

        return res.status(400).json({ message: 'Invalid action' });

    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
