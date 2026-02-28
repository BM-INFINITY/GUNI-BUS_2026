const express = require('express');
const router = express.Router();
const { auth, isAdmin, isDriver } = require('../middleware/auth');
const LostFoundItem = require('../models/LostFoundItem');
const LostReport = require('../models/LostReport');
const LostFoundComment = require('../models/LostFoundComment');
const User = require('../models/User');

// ==============================================
// 1. PUBLIC NOTICEBOARD (GET ACTIVE ITEMS)
// ==============================================

// Helper to get date 30 days ago
const getThirtyDaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
};

// GET /api/lost-found/board/found — Public board of active found items
router.get('/board/found', auth, async (req, res) => {
    try {
        const { category, routeId, page = 1, limit = 20 } = req.query;

        // Only show ACTIVE items on the public board that are less than 30 days old
        const query = {
            status: 'ACTIVE',
            createdAt: { $gte: getThirtyDaysAgo() }
        };
        if (category) query.category = category;
        if (routeId) query.routeId = routeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await LostFoundItem.countDocuments(query);

        const items = await LostFoundItem.find(query)
            .populate('busId', 'busNumber registrationNumber')
            .populate('routeId', 'routeName routeNumber')
            .sort({ foundDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            items,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Get board found items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/lost-found/board/reports — Public board of active lost reports (Privacy-Safe)
router.get('/board/reports', auth, async (req, res) => {
    try {
        const { category, routeId, page = 1, limit = 20 } = req.query;

        // Show ACTIVE and ADMIN_FOUND reports that are less than 30 days old
        const query = {
            status: { $in: ['ACTIVE', 'ADMIN_FOUND'] },
            createdAt: { $gte: getThirtyDaysAgo() }
        };
        if (category) query.category = category;
        if (routeId) query.busRouteId = routeId;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await LostReport.countDocuments(query);

        const reports = await LostReport.find(query)
            // Privacy: Only expose name and enrollmentNumber to the public board
            .populate('reportedBy', 'name enrollmentNumber')
            .populate('busRouteId', 'routeName routeNumber')
            .sort({ lostDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Get board reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==============================================
// 2. ITEM DETAILS & COMMENTING
// ==============================================

// GET /api/lost-found/board/:type/:id — Get details of a single item/report
router.get('/board/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        let item;

        if (type === 'found') {
            item = await LostFoundItem.findById(id)
                // Admin gets full details of finder, students only get name
                .populate('foundBy', req.user.role === 'admin' ? 'name employeeId mobile' : 'name')
                .populate('busId', 'busNumber registrationNumber')
                .populate('routeId', 'routeName routeNumber startPoint endPoint');
        } else if (type === 'report') {
            item = await LostReport.findById(id)
                // Admin gets full details of reporter, students only get name & enrollment
                .populate('reportedBy', req.user.role === 'admin' ? '-password' : 'name enrollmentNumber')
                .populate('busRouteId', 'routeName routeNumber startPoint endPoint');
        } else {
            return res.status(400).json({ message: 'Invalid type. Use "found" or "report"' });
        }

        if (!item) return res.status(404).json({ message: 'Item not found' });

        res.json(item);
    } catch (error) {
        console.error('Get details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/lost-found/:type/:id/comments — Fetch comments for an item
router.get('/:type/:id/comments', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const modelTarget = type === 'found' ? 'LostFoundItem' : 'LostReport';

        const comments = await LostFoundComment.find({ itemId: id, itemModel: modelTarget })
            // Privacy: Students only see name/enrollment of commenters. Admins see everything.
            .populate('userId', req.user.role === 'admin' ? '-password' : 'name enrollmentNumber role')
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/lost-found/:type/:id/comments — Add a comment to an item
router.post('/:type/:id/comments', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        const modelTarget = type === 'found' ? 'LostFoundItem' : 'LostReport';

        // Verify item exists and check if chat is enabled
        const Model = type === 'found' ? LostFoundItem : LostReport;
        const item = await Model.findById(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.isChatEnabled === false) {
            return res.status(403).json({ message: 'This chat thread has been locked by an administrator.' });
        }

        const newComment = new LostFoundComment({
            itemId: id,
            itemModel: modelTarget,
            userId: req.user._id,
            message: message.trim()
        });

        await newComment.save();

        // Return populated comment
        const populatedComment = await LostFoundComment.findById(newComment._id)
            .populate('userId', req.user.role === 'admin' ? '-password' : 'name enrollmentNumber role');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Post comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==============================================
// 3. CREATION (POSTING TO BOARDS)
// ==============================================

// POST /api/lost-found/items — Driver/Admin reports a found item
router.post('/items', auth, async (req, res) => {
    try {
        // Can be driver or admin
        if (req.user.role === 'student') {
            return res.status(403).json({ message: 'Students cannot post found items directly. Please hand to driver/admin.' });
        }

        const { itemName, category, description, foundDate, imageBase64, storageLocation, routeId } = req.body;

        if (!itemName || !category || !description || !foundDate) {
            return res.status(400).json({ message: 'itemName, category, description, and foundDate are required' });
        }

        let assignedBusId = null;
        let assignedRouteId = routeId || null;

        // Auto-link if driver
        if (req.user.role === 'driver') {
            const driver = await User.findById(req.user._id).populate('assignedBus').populate('assignedRoute');
            assignedBusId = driver?.assignedBus?._id || null;
            if (!assignedRouteId) assignedRouteId = driver?.assignedRoute?._id || null;
        }

        const expiry = new Date(foundDate);
        expiry.setDate(expiry.getDate() + 30);

        const item = new LostFoundItem({
            itemName,
            category,
            description,
            foundBy: req.user._id,
            busId: assignedBusId,
            routeId: assignedRouteId,
            foundDate: new Date(foundDate),
            imageBase64: imageBase64 || null,
            storageLocation: storageLocation || { location: '', rack: '', box: '' },
            status: 'ACTIVE',
            expiryDate: expiry,
            auditLog: [{
                action: 'ITEM_REPORTED',
                by: req.user._id,
                note: `Reported by ${req.user.role} ${req.user.name}`
            }]
        });

        await item.save();
        res.status(201).json({ message: 'Found item posted to board successfully', item });
    } catch (error) {
        console.error('Report found item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/lost-found/reports — Student reports a lost item
router.post('/reports', auth, async (req, res) => {
    try {
        const { itemName, category, description, lostDate, busRouteId, identifyingDetails } = req.body;

        if (!itemName || !lostDate || !identifyingDetails) {
            return res.status(400).json({ message: 'itemName, lostDate, and identifyingDetails are required' });
        }

        const report = new LostReport({
            reportedBy: req.user._id,
            itemName,
            category: category || 'other',
            description: description || '',
            lostDate: new Date(lostDate),
            busRouteId: busRouteId || null,
            identifyingDetails,
            status: 'ACTIVE'
        });

        await report.save();
        res.status(201).json({ message: 'Lost report posted to board successfully', report });
    } catch (error) {
        console.error('Lost item report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/lost-found/reports/my — Student gets their own reports
router.get('/reports/my', auth, async (req, res) => {
    try {
        const reports = await LostReport.find({ reportedBy: req.user._id })
            .populate('busRouteId', 'routeName routeNumber')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==============================================
// 4. ADMIN ACTIONS & DASHBOARD
// ==============================================

// GET /api/lost-found/items/all — Admin sees all items (including RESOLVED)
router.get('/items/all', auth, async (req, res) => {
    try {
        // Only allow admin or driver
        if (req.user.role === 'student') return res.status(403).json({ message: 'Not authorized' });

        const items = await LostFoundItem.find()
            .populate('foundBy', 'name employeeId')
            .populate('busId', 'busNumber registrationNumber')
            .populate('routeId', 'routeName routeNumber')
            .sort({ foundDate: -1 });
        res.json(items);
    } catch (error) {
        console.error('Admin get items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/lost-found/reports/all — Admin sees all reports (including RESOLVED)
router.get('/reports/all', auth, isAdmin, async (req, res) => {
    try {
        const reports = await LostReport.find()
            .populate('reportedBy', 'name enrollmentNumber mobile')
            .populate('busRouteId', 'routeName routeNumber')
            .sort({ lostDate: -1 });
        res.json(reports);
    } catch (error) {
        console.error('Admin get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lost-found/items/:id/resolve — Admin marks found item as resolved (handed over)
router.put('/items/:id/resolve', auth, isAdmin, async (req, res) => {
    try {
        const { handoverTo, note } = req.body;
        const item = await LostFoundItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        item.status = 'RESOLVED';
        item.handoverDetails = {
            handoverTo: handoverTo || '',
            note: note || '',
            date: new Date()
        };
        item.auditLog.push({
            action: 'ITEM_RESOLVED',
            by: req.user._id,
            note: `Handed over to ${handoverTo || 'Owner'} by admin`
        });

        await item.save();
        res.json({ message: 'Item resolved and removed from public board', item });
    } catch (error) {
        console.error('Resolve item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lost-found/reports/:id/mark-found — Admin secures a reported lost item at the depot
router.put('/reports/:id/mark-found', auth, isAdmin, async (req, res) => {
    try {
        const { foundBy, location, note } = req.body;
        const report = await LostReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = 'ADMIN_FOUND';
        report.adminFoundDetails = {
            foundBy: foundBy || '',
            location: location || '',
            note: note || '',
            date: new Date()
        };
        await report.save();

        res.json({ message: 'Report marked as found at depot', report });
    } catch (error) {
        console.error('Mark report found error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lost-found/reports/:id/resolve — Admin marks lost report as resolved (handed over)
router.put('/reports/:id/resolve', auth, isAdmin, async (req, res) => {
    try {
        const { handoverTo, note } = req.body;
        const report = await LostReport.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.status = 'RESOLVED';
        report.handoverDetails = {
            handoverTo: handoverTo || '',
            note: note || '',
            date: new Date()
        };
        await report.save();

        res.json({ message: 'Report resolved and removed from public board', report });
    } catch (error) {
        console.error('Resolve report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==============================================
// 5. ADMIN CHAT MODERATION
// ==============================================

// DELETE /api/lost-found/comments/:id — Admin deletes a specific comment
router.delete('/comments/:id', auth, isAdmin, async (req, res) => {
    try {
        const comment = await LostFoundComment.findByIdAndDelete(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lost-found/items/:id/chat-toggle — Admin locks/unlocks chat for a Found Item
router.put('/items/:id/chat-toggle', auth, isAdmin, async (req, res) => {
    try {
        const { isChatEnabled } = req.body;
        const item = await LostFoundItem.findByIdAndUpdate(
            req.params.id,
            { isChatEnabled },
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: `Chat ${isChatEnabled ? 'enabled' : 'disabled'}`, isChatEnabled: item.isChatEnabled });
    } catch (error) {
        console.error('Toggle chat item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/lost-found/reports/:id/chat-toggle — Admin locks/unlocks chat for a Lost Report
router.put('/reports/:id/chat-toggle', auth, isAdmin, async (req, res) => {
    try {
        const { isChatEnabled } = req.body;
        const report = await LostReport.findByIdAndUpdate(
            req.params.id,
            { isChatEnabled },
            { new: true }
        );
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json({ message: `Chat ${isChatEnabled ? 'enabled' : 'disabled'}`, isChatEnabled: report.isChatEnabled });
    } catch (error) {
        console.error('Toggle chat report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
