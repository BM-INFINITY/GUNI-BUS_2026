const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { auth } = require('../middleware/auth');
const { generateQRCode, generateTicketNumber } = require('../utils/helpers');

// Purchase one-day ticket
router.post('/purchase', auth, async (req, res) => {
    try {
        const { routeId, shift, paymentId } = req.body;

        const ticketNumber = generateTicketNumber();

        // Generate QR code
        const qrData = {
            ticketNumber,
            userId: req.user._id,
            shift,
            type: 'ticket'
        };

        const qrCode = await generateQRCode(qrData);

        // Set valid date to today
        const validDate = new Date();
        validDate.setHours(0, 0, 0, 0);

        const ticket = new Ticket({
            userId: req.user._id,
            ticketNumber,
            qrCode,
            shift,
            route: routeId,
            validDate,
            paymentStatus: paymentId ? 'paid' : 'pending',
            paymentAmount: 50, // One-day ticket price
            paymentId
        });

        await ticket.save();

        res.status(201).json({
            message: 'Ticket purchased successfully',
            ticket: await ticket.populate('route')
        });
    } catch (error) {
        console.error('Purchase ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get ticket details
router.get('/:id', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('route');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's tickets
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const tickets = await Ticket.find({ userId: req.params.userId })
            .populate('route')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Validate and mark ticket as used
router.put('/:id/validate', auth, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.isUsed) {
            return res.status(400).json({ message: 'Ticket already used' });
        }

        // Check if ticket is valid for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const ticketDate = new Date(ticket.validDate);
        ticketDate.setHours(0, 0, 0, 0);

        if (ticketDate.getTime() !== today.getTime()) {
            return res.status(400).json({ message: 'Ticket expired or not valid for today' });
        }

        ticket.isUsed = true;
        ticket.usedAt = new Date();
        ticket.usedOn = req.body.busId;

        await ticket.save();

        res.json({ message: 'Ticket validated successfully', ticket });
    } catch (error) {
        console.error('Validate ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
