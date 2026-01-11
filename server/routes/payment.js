const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const BusPass = require('../models/BusPass');
const Route = require('../models/Route');
const QRCode = require('qrcode');
const { generateReferenceNumber } = require('../utils/referenceGenerator');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', auth, async (req, res) => {
    try {
        const { passApplicationId } = req.body;

        // Get the pass application
        const passApplication = await BusPass.findById(passApplicationId).populate('route');

        if (!passApplication) {
            return res.status(404).json({ message: 'Pass application not found' });
        }

        if (passApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (passApplication.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Payment already completed' });
        }

        // Create Razorpay order
        const options = {
            amount: passApplication.amount * 100, // Convert to paise
            currency: 'INR',
            receipt: passApplication.referenceNumber,
            notes: {
                passApplicationId: passApplication._id.toString(),
                studentId: req.user._id.toString(),
                routeName: passApplication.route.routeName
            }
        };

        const order = await razorpay.orders.create(options);

        // Update pass with order ID
        passApplication.razorpayOrderId = order.id;
        await passApplication.save();

        res.json({
            orderId: order.id,
            amount: passApplication.amount,
            currency: 'INR',
            referenceNumber: passApplication.referenceNumber
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Failed to create payment order' });
    }
});

// Verify and complete payment
router.post('/verify', auth, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            passApplicationId
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Get pass application
        const passApplication = await BusPass.findById(passApplicationId).populate('route');

        if (!passApplication) {
            return res.status(404).json({ message: 'Pass application not found' });
        }

        if (passApplication.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update pass - mark as paid and approved
        passApplication.razorpayPaymentId = razorpay_payment_id;
        passApplication.paymentStatus = 'completed';
        passApplication.status = 'approved';
        passApplication.approvedAt = new Date();

        // Set validity (6 months from now)
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 6);
        passApplication.validUntil = validUntil;

        // Generate QR code
        const qrData = JSON.stringify({
            ref: passApplication.referenceNumber,
            student: passApplication.enrollmentNumber,
            route: passApplication.route.routeNumber,
            valid: validUntil.toISOString()
        });
        passApplication.qrCode = await QRCode.toDataURL(qrData);

        await passApplication.save();

        res.json({
            success: true,
            message: 'Payment successful! Your bus pass is now active.',
            pass: passApplication
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ message: 'Payment verification failed' });
    }
});

// Handle payment failure
router.post('/failed', auth, async (req, res) => {
  const { passApplicationId, error } = req.body;

  const pass = await BusPass.findById(passApplicationId);

  if (pass) {
    pass.paymentStatus = 'failed';
    pass.status = 'rejected';   // or 'failed'
    pass.paymentFailureReason = error;
    await pass.save();
  }

  res.json({ message: 'Payment marked as failed' });
});


module.exports = router;
