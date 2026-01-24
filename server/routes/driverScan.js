const express = require('express');
const router = express.Router();
const BusPass = require('../models/BusPass');
const DayTicket = require('../models/DayTicket');
const DailyAttendance = require('../models/DailyAttendance');
const RouteAnalytics = require('../models/RouteAnalytics');
const { auth, isDriver } = require('../middleware/auth');
const { verifyQR, isSameDay, getTodayString } = require('../utils/qrVerification');

/**
 * UNIFIED DRIVER SCAN ENDPOINT
 * Automatically detects BusPass vs DayTicket and applies appropriate rules
 * 
 * POST /api/driver/scan
 * Body: { qrData, tripType }
 */
router.post('/scan', auth, isDriver, async (req, res) => {
    try {
        const { qrData, tripType } = req.body;
        const driver = req.user;
        const activeShift = driver.shift;

        // ========================================
        // 1. VALIDATE INPUT
        // ========================================
        if (!qrData) {
            return res.status(400).json({ message: 'QR data required' });
        }

        if (!activeShift) {
            return res.status(403).json({ message: 'No shift assigned to driver. Contact admin.' });
        }

        if (!tripType || !['pickup', 'drop'].includes(tripType)) {
            return res.status(400).json({ message: 'Trip type (pickup/drop) required' });
        }

        // ========================================
        // 2. VERIFY QR CODE (SHARED LOGIC)
        // ========================================
        const qrResult = verifyQR(qrData);

        if (!qrResult.valid) {
            return res.status(400).json({ message: qrResult.error });
        }

        const { id, userId, expiry } = qrResult;

        // ========================================
        // 3. AUTO-DETECT: BusPass or DayTicket
        // ========================================
        let pass = await BusPass.findById(id).populate('route');
        let ticket = null;
        let isBusPass = false;
        let isDayTicket = false;

        if (pass) {
            isBusPass = true;
        } else {
            ticket = await DayTicket.findById(id).populate('route');
            if (ticket) {
                isDayTicket = true;
            }
        }

        if (!isBusPass && !isDayTicket) {
            return res.status(400).json({ message: 'Invalid QR code - not found in system' });
        }

        // ========================================
        // 4. BUSPASS LOGIC
        // ========================================
        if (isBusPass) {
            // Check status
            if (pass.status !== 'approved') {
                return res.status(400).json({ message: 'Pass is not approved' });
            }

            if (pass.paymentStatus !== 'completed') {
                return res.status(400).json({ message: 'Payment not completed' });
            }

            // Check route
            if (pass.route._id.toString() !== driver.assignedRoute.toString()) {
                return res.status(403).json({
                    message: 'Wrong route',
                    passRoute: pass.route.routeName,
                    driverRoute: driver.assignedRoute
                });
            }

            // Check shift
            if (pass.shift !== activeShift) {
                return res.status(403).json({
                    message: `Pass valid for ${pass.shift.toUpperCase()} shift only`,
                    passShift: pass.shift,
                    driverShift: activeShift
                });
            }

            // ========================================
            // BUSPASS: 2 SCANS PER DAY LIMIT
            // ========================================
            const todayStr = getTodayString();

            const todayScans = await DailyAttendance.countDocuments({
                passId: id,
                date: todayStr
            });

            if (todayScans >= 2) {
                return res.status(400).json({
                    message: 'Daily scan limit reached for this pass (2 scans/day)',
                    scansToday: todayScans
                });
            }

            // Check duplicate for this trip type
            const existingScan = await DailyAttendance.findOne({
                passId: id,
                date: todayStr,
                tripType: tripType
            });

            if (existingScan) {
                return res.status(400).json({
                    message: `Already scanned for ${tripType === 'pickup' ? 'college' : 'home'} trip today`,
                    time: existingScan.checkInTime
                });
            }

            // Record attendance
            const attendance = await DailyAttendance.create({
                passId: id,
                userId: userId,
                routeId: pass.route._id,
                date: todayStr,
                shift: activeShift,
                tripType: tripType,
                checkInTime: new Date(),
                checkInBy: driver._id,
                status: 'checked-in',
                isDayTicket: false
            });

            // Update analytics
            await RouteAnalytics.findOneAndUpdate(
                { routeId: pass.route._id, date: todayStr, shift: activeShift },
                {
                    $setOnInsert: {
                        routeId: pass.route._id,
                        date: todayStr,
                        busId: driver.assignedBus,
                        shift: activeShift
                    },
                    $inc: {
                        totalPassengers: 1,
                        checkedIn: 1
                    }
                },
                { upsert: true, new: true }
            );

            return res.json({
                success: true,
                type: 'pass',
                message: 'Bus Pass verified successfully',
                student: {
                    name: pass.studentName,
                    enrollment: pass.enrollmentNumber
                },
                route: pass.route.routeName,
                shift: pass.shift,
                tripType: tripType,
                time: attendance.checkInTime,
                scansToday: todayScans + 1,
                maxScansPerDay: 2
            });
        }

        // ========================================
        // 5. DAYTICKET LOGIC
        // ========================================
        if (isDayTicket) {
            // Check status
            if (ticket.status !== 'active') {
                return res.status(400).json({
                    message: `Ticket is ${ticket.status}`,
                    status: ticket.status
                });
            }

            if (ticket.paymentStatus !== 'completed') {
                return res.status(400).json({ message: 'Payment not completed' });
            }

            // Check date (must be today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const ticketDate = new Date(ticket.travelDate);
            ticketDate.setHours(0, 0, 0, 0);

            if (ticketDate.getTime() !== today.getTime()) {
                // Auto-expire if past date
                if (ticketDate < today && ticket.status === 'active') {
                    ticket.status = 'expired';
                    await ticket.save();
                }

                return res.status(400).json({
                    message: `Ticket valid only on ${ticketDate.toLocaleDateString()}`,
                    validDate: ticketDate
                });
            }

            // Check route
            if (ticket.route._id.toString() !== driver.assignedRoute.toString()) {
                return res.status(403).json({
                    message: 'Wrong route',
                    ticketRoute: ticket.route.routeName,
                    driverRoute: driver.assignedRoute
                });
            }

            // Check shift
            if (ticket.shift !== activeShift) {
                return res.status(403).json({
                    message: `Ticket valid for ${ticket.shift.toUpperCase()} shift only`,
                    ticketShift: ticket.shift,
                    driverShift: activeShift
                });
            }

            // ========================================
            // DAYTICKET: SCAN LIMIT ENFORCEMENT
            // ========================================

            // Check if already at scan limit
            if (ticket.scanCount >= ticket.maxScans) {
                if (ticket.status === 'active') {
                    ticket.status = 'used';
                    await ticket.save();
                }

                return res.status(400).json({
                    message: `Ticket fully used (${ticket.scanCount}/${ticket.maxScans} scans)`,
                    scanCount: ticket.scanCount,
                    maxScans: ticket.maxScans
                });
            }

            // Get today's scans for this ticket
            const todayScans = ticket.scans.filter(scan =>
                isSameDay(scan.scannedAt, today)
            );

            // For single trip: only 1 scan allowed
            if (ticket.ticketType === 'single') {
                if (todayScans.length > 0) {
                    return res.status(400).json({
                        message: 'Single trip ticket already used today',
                        scanCount: ticket.scanCount,
                        maxScans: ticket.maxScans
                    });
                }
            }

            // For round trip: 2 scans allowed, but not same tripType twice
            if (ticket.ticketType === 'round') {
                if (todayScans.length >= 2) {
                    return res.status(400).json({
                        message: 'Both trips completed for today',
                        scanCount: ticket.scanCount,
                        maxScans: ticket.maxScans
                    });
                }

                const alreadyScannedThisTrip = todayScans.some(
                    scan => scan.tripType === tripType
                );

                if (alreadyScannedThisTrip) {
                    return res.status(400).json({
                        message: `Already scanned for ${tripType === 'pickup' ? 'college' : 'home'} trip today`,
                        scanCount: ticket.scanCount,
                        maxScans: ticket.maxScans
                    });
                }
            }

            // ========================================
            // RECORD SCAN
            // ========================================
            ticket.scans.push({
                scannedAt: new Date(),
                scannedBy: driver._id,
                tripType: tripType
            });
            ticket.scanCount += 1;

            // Mark as used if limit reached
            if (ticket.scanCount >= ticket.maxScans) {
                ticket.status = 'used';
            }

            await ticket.save();

            // Record attendance
            const attendance = await DailyAttendance.create({
                passId: id,
                userId: userId,
                routeId: ticket.route._id,
                date: getTodayString(),
                shift: activeShift,
                tripType: tripType,
                checkInTime: new Date(),
                checkInBy: driver._id,
                status: 'checked-in',
                isDayTicket: true
            });

            // Update analytics
            await RouteAnalytics.findOneAndUpdate(
                { routeId: ticket.route._id, date: getTodayString(), shift: activeShift },
                {
                    $setOnInsert: {
                        routeId: ticket.route._id,
                        date: getTodayString(),
                        busId: driver.assignedBus,
                        shift: activeShift
                    },
                    $inc: {
                        totalPassengers: 1,
                        checkedIn: 1,
                        revenue: ticket.amount || 0
                    }
                },
                { upsert: true, new: true }
            );

            return res.json({
                success: true,
                type: 'ticket',
                message: 'Day Ticket verified successfully',
                student: {
                    name: ticket.studentName,
                    enrollment: ticket.enrollmentNumber
                },
                route: ticket.route.routeName,
                shift: ticket.shift,
                tripType: tripType,
                ticketType: ticket.ticketType,
                time: attendance.checkInTime,
                scanCount: ticket.scanCount,
                maxScans: ticket.maxScans,
                scansRemaining: ticket.maxScans - ticket.scanCount,
                status: ticket.status
            });
        }

    } catch (error) {
        console.error('Unified scan error:', error);
        return res.status(500).json({ message: 'Scan failed', error: error.message });
    }
});

module.exports = router;
