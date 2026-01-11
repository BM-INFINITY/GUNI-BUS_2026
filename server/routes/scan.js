const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const BusPass = require('../models/BusPass');
const DailyAttendance = require('../models/DailyAttendance');
const { auth, isDriver } = require('../middleware/auth');

// Helper: today date string
const todayString = () => new Date().toISOString().split('T')[0];

router.post('/scan-pass', auth, isDriver, async (req, res) => {
    try {
        const { qrData, scanType } = req.body;

        if (!qrData || !scanType) {
            return res.status(400).json({ message: 'QR data and scan type required' });
        }

        // Parse QR
        const parts = qrData.split('|');
        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            return res.status(400).json({ message: 'Invalid QR code' });
        }

        const [, passId, userId, expiry, signature] = parts;

        // Verify signature
        const raw = `${passId}|${userId}|${expiry}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(raw)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid QR signature' });
        }

        // Check expiry
        if (new Date(expiry) < new Date()) {
            return res.status(400).json({ message: 'Pass expired' });
        }

        // Get pass
        const pass = await BusPass.findById(passId).populate('route userId');

        if (!pass || pass.status !== 'approved') {
            return res.status(400).json({ message: 'Invalid or inactive pass' });
        }

        const today = todayString();

        let attendance = await DailyAttendance.findOne({
            passId,
            date: today
        });

        // CHECK-IN
        if (scanType === 'checkin') {

            if (attendance) {
                return res.status(400).json({ message: 'Already checked-in today' });
            }

            attendance = await DailyAttendance.create({
                passId,
                userId,
                routeId: pass.route._id,
                date: today,
                checkInTime: new Date(),
                checkInBy: req.user._id,
                status: 'checked-in'
            });

            return res.json({
                success: true,
                message: 'Check-in successful',
                student: pass.studentName,
                route: pass.route.routeName,
                time: attendance.checkInTime
            });
        }

        // CHECK-OUT
        if (scanType === 'checkout') {

            if (!attendance) {
                return res.status(400).json({ message: 'No check-in found for today' });
            }

            if (attendance.checkOutTime) {
                return res.status(400).json({ message: 'Already checked-out today' });
            }

            attendance.checkOutTime = new Date();
            attendance.checkOutBy = req.user._id;
            attendance.status = 'checked-out';

            await attendance.save();

            return res.json({
                success: true,
                message: 'Check-out successful',
                student: pass.studentName,
                route: pass.route.routeName,
                time: attendance.checkOutTime
            });
        }

        res.status(400).json({ message: 'Invalid scan type' });

    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ message: 'Scan failed' });
    }
});

module.exports = router;
