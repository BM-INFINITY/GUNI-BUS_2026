const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const DayTicket = require('../models/DayTicket');
const Route = require('../models/Route');
const QRCode = require('qrcode');

// Lazy Razorpay initialization — prevents crash if keys are missing from .env
let _razorpay = null;
const getRazorpay = () => {
    if (!_razorpay) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay keys not configured in .env');
        }
        _razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
    return _razorpay;
};

// ===============================
// Create Razorpay order
// ===============================
router.post('/create-order', auth, async (req, res) => {
    try {
        const { ticketApplicationId } = req.body;

        const ticketApplication = await DayTicket.findById(ticketApplicationId).populate('route');

        if (!ticketApplication) {
            return res.status(404).json({ message: 'Ticket application not found' });
        }

        if (ticketApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (ticketApplication.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Payment already completed' });
        }

        // Create Razorpay order (SAME PATTERN AS BUS PASS)
        const options = {
            amount: ticketApplication.amount * 100, // Convert to paise
            currency: 'INR',
            receipt: ticketApplication.referenceNumber,
            notes: {
                ticketApplicationId: ticketApplication._id.toString(),
                studentId: req.user._id.toString(),
                routeName: ticketApplication.route.routeName,
                travelDate: ticketApplication.travelDate.toISOString(),
                ticketType: ticketApplication.ticketType
            }
        };

        const order = await getRazorpay().orders.create(options);

        // Update ticket with order ID
        ticketApplication.razorpayOrderId = order.id;
        await ticketApplication.save();

        res.json({
            orderId: order.id,
            amount: ticketApplication.amount,
            currency: 'INR',
            referenceNumber: ticketApplication.referenceNumber
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

// ===============================
// Verify and complete payment
// AUTO-APPROVE & GENERATE QR (DIFFERENT FROM BUS PASS)
// ===============================
router.post('/verify', auth, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            ticketApplicationId
        } = req.body;

        // Verify signature (SAME AS BUS PASS)
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const ticketApplication = await DayTicket.findById(ticketApplicationId).populate('route');

        if (!ticketApplication) {
            return res.status(404).json({ message: 'Ticket application not found' });
        }

        if (ticketApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update payment status
        ticketApplication.razorpayPaymentId = razorpay_payment_id;
        ticketApplication.paymentStatus = 'completed';

        // AUTO-APPROVE (DIFFERENT FROM BUS PASS - no admin approval needed)
        ticketApplication.status = 'active';

        // 🔐 Generate Secure QR Payload (SAME SECURITY AS BUS PASS)
        const expiry = ticketApplication.validUntil.toISOString();
        const rawData = `${ticketApplication._id}|${ticketApplication.userId}|${expiry}`;

        const signature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(rawData)
            .digest('hex');

        const qrPayload = `GUNI|${rawData}|${signature}`;
        ticketApplication.qrCode = await QRCode.toDataURL(qrPayload);

        await ticketApplication.save();

        res.json({
            success: true,
            message: 'Payment successful! Your day ticket is now active.',
            ticket: ticketApplication
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

// ===============================
// Handle payment failure
// ===============================
router.post('/failed', auth, async (req, res) => {
    try {
        const { ticketApplicationId, error } = req.body;

        const ticket = await DayTicket.findById(ticketApplicationId);

        if (ticket && ticket.userId.toString() === req.user._id.toString()) {
            ticket.paymentStatus = 'failed';
            ticket.status = 'cancelled';
            ticket.paymentFailureReason = error;
            await ticket.save();
        }

        res.json({ message: 'Payment marked as failed' });
    } catch (error) {
        console.error('Payment failure handler error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
