const express = require('express');
const router = express.Router();
const { Complaint, generateComplaintRef } = require('../models/Complaint');
const BusPass = require('../models/BusPass');
const { auth, isAdmin } = require('../middleware/auth');

// ─── Category display names ────────────────────────────────────────────────
const CATEGORY_LABELS = {
    bus_late_no_show: 'Bus Late / No-Show',
    driver_behaviour: 'Driver Behaviour',
    bus_condition: 'Bus Condition',
    route_deviation: 'Route Deviation',
    qr_pass_issue: 'QR / Pass Issue',
    overcharging: 'Overcharging',
    safety_concern: 'Safety Concern',
    stop_issue: 'Stop Issue',
    other: 'Other',
};

// ══════════════════════════════════════════════════════════════════════════
//  STUDENT ROUTES
// ══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/complaints
 * Student raises a new complaint
 */
router.post('/', auth, async (req, res) => {
    try {
        const {
            category, title, description,
            incidentDate, shift, photo, followUp,
        } = req.body;

        if (!category || !title || !description) {
            return res.status(400).json({ message: 'Category, title and description are required.' });
        }

        // Try to auto-fill route from student's active pass
        let routeId = null;
        let routeName = '';
        const pass = await BusPass.findOne({ userId: req.user._id, status: 'approved' })
            .populate('route', 'routeName');
        if (pass?.route) {
            routeId = pass.route._id;
            routeName = pass.route.routeName;
        }

        // Seed the thread with the initial description as a student message
        const messages = [{
            senderRole: 'student',
            senderName: req.user.name,
            text: description.trim(),
            createdAt: new Date(),
        }];

        // Generate ref number and set priority inline (no mongoose hooks)
        const referenceNumber = generateComplaintRef();
        const priority = category === 'safety_concern' ? 'urgent' : 'normal';

        const complaint = await Complaint.create({
            referenceNumber,
            priority,
            userId: req.user._id,
            studentName: req.user.name,
            enrollmentNumber: req.user.enrollmentNumber,
            mobile: req.user.mobile,
            category,
            title: title.trim(),
            description: description.trim(),
            routeId,
            routeName,
            incidentDate: incidentDate || '',
            shift: shift || '',
            photo: photo || '',
            messages,
            statusHistory: [{
                status: 'pending',
                remark: 'Complaint submitted',
                changedBy: req.user._id,
            }],
        });

        res.status(201).json({ message: 'Complaint submitted successfully', complaint });
    } catch (err) {
        console.error('Submit complaint error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/complaints/my
 * Student views their own complaints
 */
router.get('/my', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.user._id })
            .populate('routeId', 'routeName routeNumber')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        console.error('My complaints error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/complaints/:id/message
 * Student adds a message to the conversation thread
 */
router.post('/my/:id/message', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

        const complaint = await Complaint.findOne({ _id: req.params.id, userId: req.user._id });
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        if (['resolved', 'rejected'].includes(complaint.status)) {
            return res.status(400).json({ message: 'Cannot send message on a closed complaint.' });
        }

        const newMessage = {
            senderRole: 'student',
            senderName: req.user.name,
            text: text.trim(),
            createdAt: new Date(),
        };

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: newMessage } },
            { new: true }
        );

        res.json({ message: 'Message sent', newMessage, messages: updated.messages });
    } catch (err) {
        console.error('Message error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ══════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/complaints/admin/all
 * List all complaints with filters
 */
router.get('/admin/all', auth, isAdmin, async (req, res) => {
    try {
        const { status, category, priority, startDate, endDate, search } = req.query;
        const filter = {};

        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        if (priority && priority !== 'all') filter.priority = priority;

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate + 'T23:59:59.999Z'),
            };
        }

        if (search) {
            const rx = { $regex: search, $options: 'i' };
            filter.$or = [
                { studentName: rx },
                { enrollmentNumber: rx },
                { referenceNumber: rx },
                { title: rx },
            ];
        }

        const complaints = await Complaint.find(filter)
            .populate('userId', 'name enrollmentNumber profilePhoto')
            .populate('routeId', 'routeName routeNumber')
            .sort({ priority: -1, createdAt: -1 });

        res.json(complaints);
    } catch (err) {
        console.error('Admin list complaints error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/complaints/admin/analytics
 * Dashboard stats
 */
router.get('/admin/analytics', auth, isAdmin, async (req, res) => {
    try {
        const [
            total,
            pending,
            reviewing,
            resolved,
            rejected,
            urgent,
        ] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'pending' }),
            Complaint.countDocuments({ status: 'reviewing' }),
            Complaint.countDocuments({ status: 'resolved' }),
            Complaint.countDocuments({ status: 'rejected' }),
            Complaint.countDocuments({ priority: 'urgent' }),
        ]);

        // Category breakdown
        const byCategoryRaw = await Complaint.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const byCategory = byCategoryRaw.map(r => ({
            category: r._id,
            label: CATEGORY_LABELS[r._id] || r._id,
            count: r.count,
        }));

        // Recent unresolved complaint dates for SLA tracking
        const avgResolutionRaw = await Complaint.aggregate([
            { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
            {
                $project: {
                    hoursToResolve: {
                        $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000],
                    },
                },
            },
            { $group: { _id: null, avg: { $avg: '$hoursToResolve' } } },
        ]);
        const avgResolutionHours = avgResolutionRaw[0]?.avg
            ? Math.round(avgResolutionRaw[0].avg)
            : null;

        res.json({
            total, pending, reviewing, resolved, rejected, urgent,
            byCategory, avgResolutionHours,
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/complaints/admin/:id/status
 * Admin updates status + adds remark
 */
router.put('/admin/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status, remark } = req.body;
        const allowed = ['pending', 'reviewing', 'resolved', 'rejected'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        complaint.status = status;
        complaint.adminRemark = remark || complaint.adminRemark;
        complaint.statusHistory.push({
            status,
            remark: remark || '',
            changedBy: req.user._id,
            changedAt: new Date(),
        });

        // Also push admin remark to the conversation thread
        if (remark?.trim()) {
            complaint.messages.push({
                senderRole: 'admin',
                senderName: req.user.name || 'Admin',
                text: `[Status → ${status}] ${remark.trim()}`,
                createdAt: new Date(),
            });
        } else {
            complaint.messages.push({
                senderRole: 'admin',
                senderName: req.user.name || 'Admin',
                text: `Status changed to ${status}.`,
                createdAt: new Date(),
            });
        }

        if (status === 'resolved' || status === 'rejected') {
            complaint.resolvedBy = req.user._id;
            complaint.resolvedAt = new Date();
        }

        await complaint.save();
        await complaint.populate('userId', 'name enrollmentNumber profilePhoto');
        await complaint.populate('routeId', 'routeName routeNumber');

        res.json({ message: 'Status updated', complaint });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/complaints/admin/:id/message
 * Admin replies in the conversation thread
 */
router.post('/admin/:id/message', auth, isAdmin, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

        const newMessage = {
            senderRole: 'admin',
            senderName: req.user.name || 'Support Team',
            text: text.trim(),
            createdAt: new Date(),
        };

        const updated = await Complaint.findByIdAndUpdate(
            req.params.id,
            { $push: { messages: newMessage } },
            { new: true }
        );

        res.json({ message: 'Reply sent', newMessage, messages: updated.messages });
    } catch (err) {
        console.error('Admin message error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/complaints/admin/:id
 * Get single complaint detail
 */
router.get('/admin/:id', auth, isAdmin, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('userId', 'name enrollmentNumber mobile profilePhoto department year')
            .populate('routeId', 'routeName routeNumber')
            .populate('statusHistory.changedBy', 'name role');
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.json(complaint);
    } catch (err) {
        console.error('Get complaint error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
