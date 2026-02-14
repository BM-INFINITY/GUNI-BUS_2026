const express = require('express');
const router = express.Router();
const DayTicket = require('../models/DayTicket');
const BusPass = require('../models/BusPass');
const AllowedBookingDays = require('../models/AllowedBookingDays');
const User = require('../models/User');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { generateReferenceNumber } = require('../utils/referenceGenerator');
const mongoose = require('mongoose');

// ===============================
// Apply for One-Day Ticket (Student)
// ===============================
router.post('/apply', auth, async (req, res) => {
    try {
        const { routeId, selectedStop, shift, ticketType, travelDate } = req.body;

        const user = req.user;
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.isProfileComplete) {
            return res.status(400).json({
                message: 'Please complete your profile before purchasing a day ticket',
                requiresProfile: true
            });
        }

        // Validate travel date
        const requestedDate = new Date(travelDate);
        requestedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
            return res.status(400).json({ message: 'Cannot purchase ticket for past dates' });
        }

        const route = await Route.findById(routeId);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        // ===== VALIDATION 1: Check if student has active pass for THIS route+shift =====
        const conflictingPass = await BusPass.findOne({
            userId: req.user._id,
            status: 'approved',
            route: routeId,
            shift: shift,
            validUntil: { $gte: requestedDate } // Pass is still valid on travel date
        });

        if (conflictingPass) {
            return res.status(403).json({
                message: `You already have an active ${shift} pass for this route. Day tickets are only available for routes/shifts not covered by your pass.`,
                conflictingPass: {
                    route: route.routeName,
                    shift: shift,
                    validUntil: conflictingPass.validUntil
                }
            });
        }

        // ===== VALIDATION 2: Check if booking is allowed for this day of week =====
        const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Check route's default allowed days
        const isDefaultAllowed = route.bookingRules?.allowedDays?.includes(dayOfWeek);

        // Check for admin overrides (both specific route and all-routes)
        // Priority: specific route disable > all-routes disable > specific route enable > all-routes enable > default
        const specificRouteRule = await AllowedBookingDays.findOne({
            route: routeId,
            date: {
                $gte: requestedDate,
                $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            allowedShifts: shift
        });

        const allRoutesRule = await AllowedBookingDays.findOne({
            route: null, // All routes
            date: {
                $gte: requestedDate,
                $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            allowedShifts: shift
        });

        // Check for blocking rules first (highest priority)
        if (specificRouteRule?.mode === 'disable') {
            return res.status(400).json({
                message: `Booking blocked for ${dayNames[dayOfWeek]}, ${requestedDate.toLocaleDateString()}. Reason: ${specificRouteRule.reason}`,
                dayOfWeek: dayNames[dayOfWeek],
                blocked: true,
                reason: specificRouteRule.reason
            });
        }

        if (allRoutesRule?.mode === 'disable') {
            return res.status(400).json({
                message: `Booking blocked for all routes on ${dayNames[dayOfWeek]}, ${requestedDate.toLocaleDateString()}. Reason: ${allRoutesRule.reason}`,
                dayOfWeek: dayNames[dayOfWeek],
                blocked: true,
                reason: allRoutesRule.reason
            });
        }

        // If day is not normally allowed, check for enabling rules
        if (!isDefaultAllowed) {
            const hasEnableRule = (specificRouteRule?.mode === 'enable') || (allRoutesRule?.mode === 'enable');

            if (!hasEnableRule) {
                return res.status(400).json({
                    message: `Booking not available for ${dayNames[dayOfWeek]}. This route operates only on ${route.bookingRules?.allowedDays?.map(d => dayNames[d]).join(', ')}.`,
                    dayOfWeek: dayNames[dayOfWeek],
                    allowedDays: route.bookingRules?.allowedDays?.map(d => dayNames[d])
                });
            }
        }

        // ===== VALIDATION 3: Check for duplicate ticket (same route+shift+date) =====
        const existingTicket = await DayTicket.findOne({
            userId: req.user._id,
            route: routeId,
            shift: shift,
            travelDate: {
                $gte: requestedDate,
                $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            status: { $in: ['pending', 'active'] },
            paymentStatus: { $in: ['pending', 'completed'] }
        });

        if (existingTicket) {
            return res.status(400).json({
                message: `You already have a ${shift} ticket for this route on ${dayNames[dayOfWeek]}, ${requestedDate.toLocaleDateString()}`,
                ticketId: existingTicket._id,
                paymentStatus: existingTicket.paymentStatus,
                referenceNumber: existingTicket.referenceNumber
            });
        }

        // Get price from route
        const price = route.ticketPrices?.[ticketType];
        if (!price) {
            return res.status(400).json({ message: 'Invalid ticket type or price not configured' });
        }

        // Generate unique reference number
        let referenceNumber;
        let isUnique = false;
        while (!isUnique) {
            referenceNumber = generateReferenceNumber(route.routeNumber);
            const existing = await DayTicket.findOne({ referenceNumber });
            if (!existing) isUnique = true;
        }

        // Set validity times (00:00 to 23:59 of travel date)
        const validFrom = new Date(requestedDate);
        validFrom.setHours(0, 0, 0, 0);

        const validUntil = new Date(requestedDate);
        validUntil.setHours(23, 59, 59, 999);

        // Create ticket (SAME PATTERN AS BUS PASS)
        const dayTicket = new DayTicket({
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
            ticketType,
            travelDate: requestedDate,
            validFrom,
            validUntil,
            amount: price,
            maxScans: ticketType === 'round' ? 2 : 1,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await dayTicket.save();

        res.status(201).json({
            message: 'Day ticket application created. Please complete payment.',
            applicationId: dayTicket._id,
            referenceNumber: dayTicket.referenceNumber,
            amount: price,
            routeName: route.routeName,
            travelDate: requestedDate
        });

    } catch (error) {
        console.error('Apply day ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Get current user's day tickets
// ===============================
router.get('/my-tickets', auth, async (req, res) => {
    try {
        const tickets = await DayTicket.find({ userId: req.user._id })
            .populate('route', 'routeName routeNumber startPoint endPoint')
            .sort({ travelDate: -1, createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Get active ticket for today
// ===============================
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const ticket = await DayTicket.findOne({
            userId: req.user._id,
            travelDate: {
                $gte: today,
                $lt: tomorrow
            },
            status: 'active',
            paymentStatus: 'completed'
        }).populate('route', 'routeName routeNumber');

        res.json(ticket);
    } catch (error) {
        console.error('Get today ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Admin: Get all day tickets
// ===============================
router.get('/admin/all', auth, isAdmin, async (req, res) => {
    try {
        const { date, routeId, status } = req.query;
        let query = {};

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.travelDate = { $gte: startDate, $lte: endDate };
        }

        if (routeId) {
            query.route = routeId;
        }

        if (status) {
            query.status = status;
        }

        const tickets = await DayTicket.find(query)
            .populate('userId', 'name email enrollmentNumber')
            .populate('route', 'routeName routeNumber')
            .sort({ travelDate: -1, createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('Admin get tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Admin: Get tickets by route
// ===============================
router.get('/admin/by-route', auth, isAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        let query = { status: 'active', paymentStatus: 'completed' };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.travelDate = { $gte: startDate, $lte: endDate };
        }

        const tickets = await DayTicket.find(query)
            .populate('route', 'routeName routeNumber')
            .populate('userId', 'name enrollmentNumber');

        const grouped = {};

        tickets.forEach(ticket => {
            const routeId = ticket.route._id.toString();

            if (!grouped[routeId]) {
                grouped[routeId] = {
                    route: ticket.route,
                    ticketCount: 0,
                    revenue: 0,
                    tickets: []
                };
            }

            grouped[routeId].ticketCount++;
            grouped[routeId].revenue += ticket.amount;
            grouped[routeId].tickets.push(ticket);
        });

        res.json(Object.values(grouped));
    } catch (error) {
        console.error('Tickets by route error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;