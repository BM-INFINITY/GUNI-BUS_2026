const express = require('express');
const router = express.Router();
const AllowedBookingDays = require('../models/AllowedBookingDays');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');

// ===============================
// Admin: Create/Update booking rule for specific date+route+shift
// ===============================
router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { routeId, date, mode, allowedShifts, reason } = req.body;

        if (!date || !allowedShifts || allowedShifts.length === 0 || !mode) {
            return res.status(400).json({
                message: 'Date, mode (enable/disable), and at least one shift are required'
            });
        }

        // Validate mode
        if (!['enable', 'disable'].includes(mode)) {
            return res.status(400).json({ message: 'Mode must be either "enable" or "disable"' });
        }

        // If routeId is provided (not "all"), validate it
        let routeFilter = null;
        if (routeId && routeId !== 'all') {
            const route = await Route.findById(routeId);
            if (!route) {
                return res.status(404).json({ message: 'Route not found' });
            }
            routeFilter = routeId;
        }
        // If routeId is "all" or not provided, routeFilter stays null (applies to all routes)

        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        // Check if rule already exists for this route+date combination
        const existing = await AllowedBookingDays.findOne({
            route: routeFilter,
            date: {
                $gte: bookingDate,
                $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existing) {
            // Update existing rule
            existing.mode = mode;
            existing.allowedShifts = allowedShifts;
            existing.reason = reason || existing.reason;
            existing.enabledBy = req.user._id;
            await existing.save();

            return res.json({
                message: 'Booking rule updated successfully',
                rule: existing
            });
        }

        // Create new rule
        const newRule = new AllowedBookingDays({
            route: routeFilter,
            date: bookingDate,
            mode,
            allowedShifts,
            reason: reason || (mode === 'disable' ? 'Holiday/Blocked day' : 'Admin override'),
            enabledBy: req.user._id
        });

        await newRule.save();

        res.status(201).json({
            message: 'Booking rule created successfully',
            rule: newRule
        });

    } catch (error) {
        console.error('Create allowed booking day error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Admin: Get all booking exceptions
// ===============================
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const { routeId, upcoming } = req.query;

        let query = {};

        if (routeId) {
            query.route = routeId;
        }

        if (upcoming === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            query.date = { $gte: today };
        }

        const exceptions = await AllowedBookingDays.find(query)
            .populate('route', 'routeName routeNumber')
            .populate('enabledBy', 'name email')
            .sort({ date: 1 });

        res.json(exceptions);

    } catch (error) {
        console.error('Get allowed booking days error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Admin: Delete booking exception
// ===============================
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const exception = await AllowedBookingDays.findByIdAndDelete(req.params.id);

        if (!exception) {
            return res.status(404).json({ message: 'Exception not found' });
        }

        res.json({
            message: 'Booking exception removed successfully',
            exception
        });

    } catch (error) {
        console.error('Delete allowed booking day error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Student: Check available dates for a route
// ===============================
router.get('/check-availability', auth, async (req, res) => {
    try {
        const { routeId, date, shift } = req.query;

        if (!routeId || !date || !shift) {
            return res.status(400).json({
                message: 'Route, date, and shift are required'
            });
        }

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        const requestedDate = new Date(date);
        requestedDate.setHours(0, 0, 0, 0);

        const dayOfWeek = requestedDate.getDay();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Check if day is normally allowed
        const isDefaultAllowed = route.bookingRules?.allowedDays?.includes(dayOfWeek);

        if (isDefaultAllowed) {
            return res.json({
                available: true,
                reason: 'Regular operating day',
                dayOfWeek: dayNames[dayOfWeek]
            });
        }

        // Check for admin exception
        const exception = await AllowedBookingDays.findOne({
            route: routeId,
            date: {
                $gte: requestedDate,
                $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            allowedShifts: shift
        });

        if (exception) {
            return res.json({
                available: true,
                reason: exception.reason || 'Special exception',
                dayOfWeek: dayNames[dayOfWeek],
                isException: true
            });
        }

        res.json({
            available: false,
            reason: `Booking not available for ${dayNames[dayOfWeek]}`,
            dayOfWeek: dayNames[dayOfWeek],
            allowedDays: route.bookingRules?.allowedDays?.map(d => dayNames[d])
        });

    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
