const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const DayTicket = require('../models/DayTicket');
const BusPass = require('../models/BusPass');
const User = require('../models/User');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { generateReferenceNumber } = require('../utils/referenceGenerator');

// ===============================
// Get All Tickets (Admin — with filters)
// ===============================
router.get('/all', auth, isAdmin, async (req, res) => {
    try {
        const { date, routeId, status } = req.query;
        const filter = {};

        // Filter by travel date (exact day)
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end = new Date(date); end.setHours(23, 59, 59, 999);
            filter.travelDate = { $gte: start, $lte: end };
        }

        if (routeId) filter.route = routeId;

        // Status mapping: frontend sends 'completed' for used tickets
        if (status && status !== 'all') {
            filter.status = status === 'completed' ? 'used' : status;
        }

        const tickets = await DayTicket.find(filter)
            .populate('route', 'routeName routeNumber')
            .sort({ travelDate: -1, createdAt: -1 })
            .limit(500);

        // Flatten routeName so frontend can use ticket.routeName directly
        const result = tickets.map(t => ({
            ...t.toObject(),
            routeName: t.route?.routeName || '—',
            routeNumber: t.route?.routeNumber || '—',
        }));

        res.json(result);
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Search Student by Enrollment
// ===============================

router.get('/search-student', auth, isAdmin, async (req, res) => {
    try {
        const { enrollment } = req.query;

        if (!enrollment) {
            return res.status(400).json({ message: 'Enrollment number required' });
        }

        const student = await User.findOne({
            enrollmentNumber: enrollment,
            role: 'student'
        });

        if (!student) {
            return res.json({ found: false });
        }

        // Check for active bus pass
        const activeBusPass = await BusPass.findOne({
            userId: student._id,
            status: 'approved'
        }).populate('route', 'routeName routeNumber');

        res.json({
            found: true,
            student: {
                _id: student._id,
                name: student.name,
                enrollmentNumber: student.enrollmentNumber,
                mobile: student.mobile,
                email: student.email,
                department: student.department,
                year: student.year,
                profilePhoto: student.profilePhoto,
                dateOfBirth: student.dateOfBirth,
                activeBusPass: activeBusPass ? {
                    route: activeBusPass.route._id,
                    routeName: activeBusPass.route.routeName,
                    routeNumber: activeBusPass.route.routeNumber,
                    shift: activeBusPass.shift
                } : null
            }
        });
    } catch (error) {
        console.error('Search student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Quick Create User
// ===============================
router.post('/create-user', auth, isAdmin, async (req, res) => {
    try {
        const { name, enrollmentNumber, mobile } = req.body;

        if (!name || !enrollmentNumber || !mobile) {
            return res.status(400).json({ message: 'Name, enrollment number, and mobile are required' });
        }

        // Check if user already exists
        const existing = await User.findOne({ enrollmentNumber });
        if (existing) {
            return res.status(400).json({ message: 'User with this enrollment number already exists' });
        }

        // Hash the default password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123', salt);

        // Create user with defaults
        const user = new User({
            name,
            enrollmentNumber,
            mobile,
            email: `${enrollmentNumber}@temp.edu`, // Temporary email
            role: 'student',
            password: hashedPassword,
            department: 'Not Set',
            year: 1,
            dateOfBirth: new Date('2000-01-01'), // Default DOB
            isProfileComplete: false,
            isAutoCreated: true,
            mustChangePassword: true
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            userId: user._id,
            defaultPassword: '123',
            note: 'Student can login with enrollment number and password: 123'
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===============================
// Create Day Ticket (Admin)
// ===============================
router.post('/create', auth, isAdmin, async (req, res) => {
    try {
        const {
            studentId,
            routeId,
            selectedStop,
            shift,
            travelDate,
            ticketType,
            paymentMethod,
            priceOverride,
            overrideReason
        } = req.body;

        // Validate required fields
        if (!studentId || !routeId || !selectedStop || !shift || !travelDate || !ticketType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get student
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Get route
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Validate travel date
        const requestedDate = new Date(travelDate);
        requestedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (requestedDate < today) {
            return res.status(400).json({ message: 'Cannot create ticket for past dates' });
        }

        // Check route's allowed days (e.g. Sunday blocked if not in allowedDays)
        const allowedDays = route.bookingRules?.allowedDays ?? [1, 2, 3, 4, 5, 6];
        const requestedDayOfWeek = requestedDate.getDay(); // 0 = Sunday
        if (!allowedDays.includes(requestedDayOfWeek)) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return res.status(400).json({
                message: `Tickets cannot be issued for ${dayNames[requestedDayOfWeek]}. This day is not operational for route "${route.routeName}".`
            });
        }

        // Check for active bus pass conflict (same route + same shift)
        const activeBusPass = await BusPass.findOne({
            userId: studentId,
            status: 'approved'
        });

        if (activeBusPass) {
            // Check if same route AND same shift
            if (activeBusPass.route.toString() === routeId && activeBusPass.shift === shift) {
                return res.status(400).json({
                    message: 'Student already has an active bus pass for this route and shift. Cannot create day ticket for same route+shift combination.'
                });
            }
            // Different route OR different shift is allowed
        }

        // Check if student already has ticket for this date
        const existingTicket = await DayTicket.findOne({
            userId: studentId,
            travelDate: {
                $gte: requestedDate,
                $lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            status: { $in: ['pending', 'active'] }
        });

        if (existingTicket) {
            return res.status(400).json({
                message: 'Student already has a ticket for this date'
            });
        }

        // Determine price (REUSE EXISTING LOGIC)
        let finalPrice = priceOverride !== undefined ? priceOverride : route.ticketPrices?.[ticketType];

        if (finalPrice === undefined) {
            return res.status(400).json({ message: 'Invalid ticket type or price not configured' });
        }

        // Generate unique reference number (REUSE EXISTING LOGIC)
        let referenceNumber;
        let isUnique = false;
        while (!isUnique) {
            referenceNumber = generateReferenceNumber(route.routeNumber);
            const existing = await DayTicket.findOne({ referenceNumber });
            if (!existing) isUnique = true;
        }

        // Set validity times (REUSE EXISTING LOGIC)
        const validFrom = new Date(requestedDate);
        validFrom.setHours(0, 0, 0, 0);

        const validUntil = new Date(requestedDate);
        validUntil.setHours(23, 59, 59, 999);

        // Generate receipt number for cash payments
        let receiptNumber = null;
        if (paymentMethod === 'cash') {
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const count = await DayTicket.countDocuments({
                receiptNumber: { $regex: `^RCP-${today}` }
            });
            receiptNumber = `RCP-${today}-${String(count + 1).padStart(3, '0')}`;
        }

        // Create ticket
        const dayTicket = new DayTicket({
            referenceNumber,
            userId: studentId,
            enrollmentNumber: student.enrollmentNumber,
            studentName: student.name,
            studentPhoto: student.profilePhoto,
            dateOfBirth: student.dateOfBirth,
            mobile: student.mobile,
            email: student.email,
            department: student.department,
            year: student.year,
            route: routeId,
            selectedStop,
            shift,
            ticketType,
            travelDate: requestedDate,
            validFrom,
            validUntil,
            amount: finalPrice,
            maxScans: ticketType === 'round' ? 2 : 1,
            status: paymentMethod === 'cash' ? 'active' : 'pending',
            paymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
            createdBy: req.user._id,
            paymentMethod,
            receiptNumber,
            priceOverride: priceOverride !== undefined ? priceOverride : null,
            overrideReason: overrideReason || null
        });

        // Generate QR code for cash payments (REUSE EXISTING LOGIC)
        if (paymentMethod === 'cash') {
            const expiry = dayTicket.validUntil.toISOString();
            const rawData = `${dayTicket._id}|${dayTicket.userId}|${expiry}`;

            const signature = crypto
                .createHmac('sha256', process.env.QR_SECRET)
                .update(rawData)
                .digest('hex');

            const qrPayload = `GUNI-TICKET|${rawData}|${signature}`;
            const qrCode = await QRCode.toDataURL(qrPayload);

            dayTicket.qrCode = qrCode;
        }

        await dayTicket.save();

        // Populate route for response
        await dayTicket.populate('route', 'routeName routeNumber');

        res.status(201).json({
            success: true,
            message: paymentMethod === 'cash'
                ? 'Ticket created successfully with cash payment'
                : 'Ticket created. Student will see it in dashboard for payment',
            ticket: {
                _id: dayTicket._id,
                referenceNumber: dayTicket.referenceNumber,
                receiptNumber: dayTicket.receiptNumber,
                qrCode: dayTicket.qrCode,
                status: dayTicket.status,
                paymentStatus: dayTicket.paymentStatus,
                studentName: dayTicket.studentName,
                enrollmentNumber: dayTicket.enrollmentNumber,
                route: dayTicket.route,
                shift: dayTicket.shift,
                travelDate: dayTicket.travelDate,
                amount: dayTicket.amount
            }
        });
    } catch (error) {
        console.error('Create day ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
