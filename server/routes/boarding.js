const express = require('express');
const router = express.Router();
const BoardingLog = require('../models/BoardingLog');
const BusPass = require('../models/BusPass');
const Ticket = require('../models/Ticket');
const Bus = require('../models/Bus');
const { auth, isDriver } = require('../middleware/auth');
const { getCurrentShift } = require('../utils/helpers');

// Scan and verify pass/ticket
router.post('/scan', auth, isDriver, async (req, res) => {
    try {
        const { qrData, busId, verificationType } = req.body;

        const parsedData = JSON.parse(qrData);
        const currentShift = getCurrentShift();

        let isValid = false;
        let passOrTicket = null;
        let userId = null;

        // Check if it's a pass or ticket
        if (parsedData.type === 'pass') {
            const pass = await BusPass.findById(parsedData.passId).populate('userId');

            if (!pass) {
                return res.status(404).json({ message: 'Pass not found', isValid: false });
            }

            // Verify pass validity
            if (pass.status !== 'approved') {
                return res.status(400).json({ message: 'Pass not approved', isValid: false });
            }

            if (new Date() > new Date(pass.validUntil)) {
                return res.status(400).json({ message: 'Pass expired', isValid: false });
            }

            if (pass.paymentStatus === 'pending') {
                return res.status(400).json({ message: 'Payment pending', isValid: false });
            }

            isValid = true;
            passOrTicket = pass;
            userId = pass.userId._id;
        } else if (parsedData.type === 'ticket') {
            const ticket = await Ticket.findOne({ ticketNumber: parsedData.ticketNumber }).populate('userId');

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found', isValid: false });
            }

            // Check if already used
            if (ticket.isUsed) {
                return res.status(400).json({ message: 'Ticket already used', isValid: false });
            }

            // Check if valid for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const ticketDate = new Date(ticket.validDate);
            ticketDate.setHours(0, 0, 0, 0);

            if (ticketDate.getTime() !== today.getTime()) {
                return res.status(400).json({ message: 'Ticket not valid for today', isValid: false });
            }

            // Check if correct shift
            if (ticket.shift !== currentShift) {
                return res.status(400).json({ message: `Ticket valid for ${ticket.shift} shift only`, isValid: false });
            }

            // Mark ticket as used
            ticket.isUsed = true;
            ticket.usedAt = new Date();
            ticket.usedOn = busId;
            await ticket.save();

            isValid = true;
            passOrTicket = ticket;
            userId = ticket.userId?._id || null;
        }

        if (isValid) {
            // Create boarding log
            const boardingLog = new BoardingLog({
                passId: parsedData.type === 'pass' ? parsedData.passId : null,
                ticketId: parsedData.type === 'ticket' ? passOrTicket._id : null,
                userId,
                busId,
                shift: currentShift,
                scannedBy: req.user._id,
                verificationType
            });

            await boardingLog.save();

            // Increment bus occupancy
            const bus = await Bus.findById(busId);
            if (bus) {
                bus.currentOccupancy += 1;
                await bus.save();

                // Broadcast occupancy update
                req.app.get('io').emit('bus:occupancy:update', {
                    busId: bus._id,
                    occupancy: bus.currentOccupancy,
                    capacity: bus.capacity
                });
            }

            // Broadcast pass verified event
            req.app.get('io').emit('pass:verified', {
                busId,
                timestamp: new Date()
            });

            res.json({
                message: 'Access granted',
                isValid: true,
                type: parsedData.type,
                userName: passOrTicket.userId?.name || 'Guest',
                occupancy: bus?.currentOccupancy || 0
            });
        }
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ message: 'Server error', isValid: false });
    }
});

// Get boarding history for user
router.get('/history/:userId', auth, async (req, res) => {
    try {
        const logs = await BoardingLog.find({ userId: req.params.userId })
            .populate('busId', 'busNumber')
            .populate('passId')
            .populate('ticketId')
            .sort({ boardingTime: -1 })
            .limit(50);

        res.json(logs);
    } catch (error) {
        console.error('Get boarding history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all boarding logs (Admin only)
router.get('/logs', auth, async (req, res) => {
    try {
        const logs = await BoardingLog.find()
            .populate('userId', 'name enrollmentNumber')
            .populate('busId', 'busNumber')
            .populate('scannedBy', 'name')
            .sort({ boardingTime: -1 })
            .limit(100);

        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get boarding logs by shift
router.get('/shift/:shift', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const logs = await BoardingLog.find({
            shift: req.params.shift,
            boardingTime: { $gte: today, $lt: tomorrow }
        })
            .populate('userId', 'name enrollmentNumber')
            .populate('busId', 'busNumber')
            .sort({ boardingTime: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Get shift logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
