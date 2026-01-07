const express = require('express');
const router = express.Router();
const BusPass = require('../models/BusPass');
const User = require('../models/User');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');
const { generateQRCode } = require('../utils/helpers');

const { generateReferenceNumber } = require('../utils/referenceGenerator');

// Apply for bus pass
router.post('/apply', auth, async (req, res) => {
    try {
        const { routeId, selectedStop, shift, paymentMethod } = req.body;

        // Get user details
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if profile is complete
        if (!user.isProfileComplete) {
            return res.status(400).json({
                message: 'Please complete your profile before applying for bus pass',
                requiresProfile: true
            });
        }

        // Get route for pricing
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Check if user already has an active or pending pass
        const existingPass = await BusPass.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'approved'] }
        });

        if (existingPass) {
            return res.status(400).json({
                message: 'You already have an active or pending bus pass application',
                existingReference: existingPass.referenceNumber
            });
        }

        // Generate unique reference number
        let referenceNumber;
        let isUnique = false;
        while (!isUnique) {
            referenceNumber = generateReferenceNumber();
            const existing = await BusPass.findOne({ referenceNumber });
            if (!existing) isUnique = true;
        }

        const busPass = new BusPass({
            referenceNumber,
            userId: req.user._id,
            enrollmentNumber: req.user.enrollmentNumber,
            // Copy student details from profile
            studentName: user.name,
            studentPhoto: user.profilePhoto,
            studentEmail: user.email,
            studentPhone: user.phone,
            studentDepartment: user.department,
            studentYear: user.year,
            route: routeId,
            selectedStop,
            shift,
            semesterCharge: route.semesterCharge || 15000, // Use route's price
            paymentStatus: paymentMethod === 'cash' ? 'cash' : 'pending',
            paymentAmount: route.semesterCharge || 15000
        });

        await busPass.save();

        res.status(201).json({
            message: 'Bus pass application submitted successfully',
            referenceNumber: busPass.referenceNumber,
            pass: busPass
        });
    } catch (error) {
        console.error('Apply pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's passes
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const passes = await BusPass.find({ userId: req.params.userId })
            .populate('route')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(passes);
    } catch (error) {
        console.error('Get user passes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all pending pass applications (Admin)
router.get('/pending', auth, isAdmin, async (req, res) => {
    try {
        const pendingPasses = await BusPass.find({ status: 'pending' })
            .populate('userId', 'name email enrollmentNumber')
            .populate('route', 'routeName routeNumber startPoint endPoint')
            .sort({ applicationDate: -1 });

        res.json(pendingPasses);
    } catch (error) {
        console.error('Get pending passes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve pass (Admin only)
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
    try {
        const pass = await BusPass.findById(req.params.id);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        // Generate QR code
        const qrData = {
            passId: pass._id,
            userId: pass.userId,
            enrollmentNumber: pass.enrollmentNumber,
            type: 'pass'
        };

        const qrCode = await generateQRCode(qrData);

        // Set validity period (6 months for semester)
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 6);

        pass.status = 'approved';
        pass.qrCode = qrCode;
        pass.validFrom = validFrom;
        pass.validUntil = validUntil;
        pass.approvedBy = req.user._id;
        pass.approvedDate = new Date();

        await pass.save();

        res.json({
            message: 'Bus pass approved successfully',
            pass: await pass.populate('userId route')
        });
    } catch (error) {
        console.error('Approve pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reject pass (Admin only)
router.put('/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const pass = await BusPass.findById(req.params.id);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        pass.status = 'rejected';
        await pass.save();

        res.json({ message: 'Bus pass rejected', pass });
    } catch (error) {
        console.error('Reject pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Renew pass
router.put('/:id/renew', auth, async (req, res) => {
    try {
        const pass = await BusPass.findById(req.params.id);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        if (pass.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Add to renewal history
        pass.renewalHistory.push({
            renewedDate: new Date(),
            validFrom: pass.validFrom,
            validUntil: pass.validUntil,
            amount: 500
        });

        // Reset to pending for admin approval
        pass.status = 'pending';
        pass.paymentStatus = 'pending';

        await pass.save();

        res.json({ message: 'Renewal request submitted', pass });
    } catch (error) {
        console.error('Renew pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
