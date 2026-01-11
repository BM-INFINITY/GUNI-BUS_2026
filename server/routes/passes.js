const express = require('express');
const router = express.Router();
const BusPass = require('../models/BusPass');
const User = require('../models/User');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { generateReferenceNumber } = require('../utils/referenceGenerator');


// ===============================
// Apply for bus pass (Student)
// ===============================
router.post('/apply', auth, async (req, res) => {
    try {
        const { routeId, selectedStop, shift } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isProfileComplete) {
            return res.status(400).json({
                message: 'Please complete your profile before applying for bus pass',
                requiresProfile: true
            });
        }

        const route = await Route.findById(routeId);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        const existingPass = await BusPass.findOne({
            userId: req.user._id,
            status: { $in: ['pending', 'approved', 'failed'] }
        });

        if (existingPass) {
            return res.status(400).json({
                message: 'You already have a bus pass application. Please retry payment.',
                applicationId: existingPass._id,
                paymentStatus: existingPass.paymentStatus
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
            enrollmentNumber: user.enrollmentNumber,
            studentName: user.name,
            studentPhoto: user.profilePhoto,
            dateOfBirth: user.dateOfBirth,
            mobile: user.mobile,
            email: user.email,
            department: user.department,
            year: user.year,
            route: routeId,
            selectedStop,
            shift,
            amount: route.semesterCharge,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await busPass.save();

        res.status(201).json({
            message: 'Bus pass application created. Please complete payment.',
            applicationId: busPass._id,
            referenceNumber: busPass.referenceNumber,
            amount: route.semesterCharge,
            routeName: route.routeName
        });

    } catch (error) {
        console.error('Apply pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===============================
// Get current user's passes
// ===============================
router.get('/my-passes', auth, async (req, res) => {
    try {
        const passes = await BusPass.find({ userId: req.user._id })
            .populate('route', 'routeName routeNumber startPoint endPoint')
            .sort({ createdAt: -1 });

        res.json(passes);
    } catch (error) {
        console.error('Get my passes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===============================
// Admin Pending Passes
// ===============================
router.get('/admin/pending', auth, isAdmin, async (req, res) => {
    try {
        const query = {
            status: 'pending',
            paymentStatus: 'pending'
        };

        const pendingPasses = await BusPass.find(query)
            .populate('userId', 'name email enrollmentNumber')
            .populate('route', 'routeName routeNumber startPoint endPoint')
            .sort({ createdAt: -1 });

        res.json(pendingPasses);
    } catch (error) {
        console.error('Get pending passes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===============================
// Admin Approved Passes
// ===============================
router.get('/admin/approved', auth, isAdmin, async (req, res) => {
    try {
        const approvedPasses = await BusPass.find({ status: 'approved' })
            .populate('userId', 'name email enrollmentNumber')
            .populate('route', 'routeName routeNumber startPoint endPoint')
            .populate('approvedBy', 'name')
            .sort({ approvedAt: -1 });

        res.json(approvedPasses);
    } catch (error) {
        console.error('Get approved passes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Admin Pending Passes By Route
// ===============================
router.get('/admin/pending/by-route', auth, isAdmin, async (req, res) => {
    try {
        const pendingPasses = await BusPass.find({
            status: 'pending',
            paymentStatus: 'pending'
        }).populate('route', 'routeName routeNumber startPoint endPoint');

        const grouped = {};

        pendingPasses.forEach(pass => {
            const routeId = pass.route._id.toString();

            if (!grouped[routeId]) {
                grouped[routeId] = {
                    route: pass.route,
                    pendingCount: 0,
                    applications: []
                };
            }

            grouped[routeId].pendingCount++;
            grouped[routeId].applications.push(pass);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        console.error('Pending by route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ===============================
// Admin Approved Passes By Route
// ===============================
router.get('/admin/approved/by-route', auth, isAdmin, async (req, res) => {
    try {
        const approvedPasses = await BusPass.find({ status: 'approved' })
            .populate('route', 'routeName routeNumber startPoint endPoint');

        const grouped = {};

        approvedPasses.forEach(pass => {
            const routeId = pass.route._id.toString();

            if (!grouped[routeId]) {
                grouped[routeId] = {
                    route: pass.route,
                    approvedCount: 0,
                    passes: []
                };
            }

            grouped[routeId].approvedCount++;
            grouped[routeId].passes.push(pass);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        console.error('Approved by route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===============================
// Approve Pass (Generate Secure QR)
// ===============================
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
    try {
        const pass = await BusPass.findById(req.params.id);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        // Set validity period (6 months)
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 6);

        // 🔐 Generate Secure QR Payload
        const expiry = validUntil.toISOString();
        const rawData = `${pass._id}|${pass.userId}|${expiry}`;

        const signature = crypto
            .createHmac('sha256', process.env.QR_SECRET)
            .update(rawData)
            .digest('hex');

        const qrPayload = `GUNI|${rawData}|${signature}`;

        const qrCode = await QRCode.toDataURL(qrPayload);

        pass.status = 'approved';
        pass.qrCode = qrCode;
        pass.validFrom = validFrom;
        pass.validUntil = validUntil;
        pass.approvedBy = req.user._id;
        pass.approvedAt = new Date();

        await pass.save();

        res.json({
            message: 'Bus pass approved successfully',
            pass: await pass.populate('userId route approvedBy')
        });

    } catch (error) {
        console.error('Approve pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===============================
// Reject Pass
// ===============================
router.put('/:id/reject', auth, isAdmin, async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        const pass = await BusPass.findById(req.params.id);

        if (!pass) {
            return res.status(404).json({ message: 'Pass not found' });
        }

        pass.status = 'rejected';
        pass.rejectionReason = rejectionReason || 'Application rejected by admin';
        await pass.save();

        res.json({ message: 'Bus pass rejected', pass });
    } catch (error) {
        console.error('Reject pass error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
