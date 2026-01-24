const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const DayTicket = require('../models/DayTicket');
const { auth, isDriver } = require('../middleware/auth');
const { getCurrentTime, getTodayString } = require('../utils/timeProvider');

// Helper: today date string (REMOVED LOCAL HELPER)

// ===============================
// Scan Day Ticket (Driver)
// SAME SECURITY AS BUS PASS SCAN
// ===============================
router.post('/scan-ticket', auth, isDriver, async (req, res) => {
    try {
        const { qrData, tripType } = req.body;
        const driver = req.user;

        const activeShift = driver.shift;

        if (!qrData) return res.status(400).json({ message: 'QR data required' });
        if (!activeShift) return res.status(403).json({ message: 'No Shift Assigned to Driver. Contact Admin.' });
        if (!tripType || !['pickup', 'drop'].includes(tripType)) {
            return res.status(400).json({ message: 'Trip Type (Pickup/Drop) Required' });
        }

        // A. Verify QR (SAME FORMAT AS BUS PASS)
        const parts = qrData.split('|');
        if (parts.length !== 5 || parts[0] !== 'GUNI') {
            return res.status(400).json({ message: 'Invalid QR code format' });
        }

        const [, ticketId, userId, expiry, signature] = parts;
        const raw = `${ticketId}|${userId}|${expiry}`;
        const expectedSignature = crypto.createHmac('sha256', process.env.QR_SECRET).update(raw).digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Check expiry
        const now = getCurrentTime(req);
        if (new Date(expiry) < now) {
            return res.status(400).json({ message: 'Ticket expired' });
        }

        // B. Fetch Ticket
        const ticket = await DayTicket.findById(ticketId).populate('route');

        if (!ticket) {
            return res.status(400).json({ message: 'Invalid ticket' });
        }

        // C. Validate ticket status
        if (ticket.status !== 'active') {
            return res.status(400).json({
                message: `Ticket is ${ticket.status}`,
                status: ticket.status
            });
        }

        if (ticket.paymentStatus !== 'completed') {
            return res.status(400).json({ message: 'Payment not completed' });
        }

        // D. Check if ticket is for today
        const today = getCurrentTime(req);
        today.setHours(0, 0, 0, 0);

        const ticketDate = new Date(ticket.travelDate);
        ticketDate.setHours(0, 0, 0, 0);

        if (ticketDate.getTime() !== today.getTime()) {
            // Auto-expire if date has passed
            if (ticketDate < today && ticket.status === 'active') {
                ticket.status = 'expired';
                await ticket.save();
            }
            return res.status(400).json({
                message: `Ticket valid only on ${ticketDate.toLocaleDateString()}`,
                validDate: ticketDate
            });
        }

        // E. Route Check
        if (ticket.route._id.toString() !== driver.assignedRoute.toString()) {
            return res.status(403).json({
                message: 'Wrong Route',
                ticketRoute: ticket.route.routeName
            });
        }

        // F. Shift Check
        if (ticket.shift !== activeShift) {
            return res.status(403).json({
                message: `Ticket Valid for ${ticket.shift.toUpperCase()} Shift Only`,
                ticketShift: ticket.shift
            });
        }

        // G. Check scan limit (UNIQUE TO DAY TICKET)
        if (ticket.scanCount >= ticket.maxScans) {
            // Mark as used if not already
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

        // H. Check if already scanned for this trip type today
        const alreadyScannedForTrip = ticket.scans.some(scan => {
            const scanDate = new Date(scan.scannedAt);
            scanDate.setHours(0, 0, 0, 0);
            return scanDate.getTime() === today.getTime() && scan.tripType === tripType;
        });

        if (alreadyScannedForTrip) {
            return res.status(400).json({
                message: `Already scanned for ${tripType === 'pickup' ? 'College' : 'Home'} trip today`,
                scanCount: ticket.scanCount,
                maxScans: ticket.maxScans
            });
        }

        // I. Record scan
        ticket.scans.push({
            scannedAt: getCurrentTime(req),
            scannedBy: driver._id,
            tripType: tripType
        });
        ticket.scanCount += 1;

        // J. Mark as used if limit reached
        if (ticket.scanCount >= ticket.maxScans) {
            ticket.status = 'used';
        }

        await ticket.save();

        return res.json({
            success: true,
            message: 'Ticket Verified Successfully',
            tripType: tripType,
            ticketShift: ticket.shift,
            student: ticket.studentName,
            enrollment: ticket.enrollmentNumber,
            route: ticket.route.routeName,
            ticketType: ticket.ticketType,
            scansRemaining: ticket.maxScans - ticket.scanCount,
            scanCount: ticket.scanCount,
            maxScans: ticket.maxScans
        });

    } catch (error) {
        console.error('Scan ticket error:', error);
        res.status(500).json({ message: 'Scan failed' });
    }
});

// ===============================
// Get scan history for a ticket
// ===============================
router.get('/scan-history/:ticketId', auth, async (req, res) => {
    try {
        const ticket = await DayTicket.findById(req.params.ticketId)
            .populate('scans.scannedBy', 'name employeeId');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only allow user to see their own ticket or admin
        if (ticket.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json({
            referenceNumber: ticket.referenceNumber,
            scanCount: ticket.scanCount,
            maxScans: ticket.maxScans,
            status: ticket.status,
            scans: ticket.scans
        });

    } catch (error) {
        console.error('Get scan history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
