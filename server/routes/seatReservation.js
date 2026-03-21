const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const SeatReservation = require('../models/SeatReservation');
const Bus = require('../models/Bus');
const User = require('../models/User');
const BusPass = require('../models/BusPass');

// Helper: normalize a date to midnight UTC
function toMidnight(dateStr) {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

// ============================================================
// GET /api/seat-reservation/available-buses
// Student: list buses with seat reservation enabled on their route
// ============================================================
router.get('/available-buses', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Students only.' });
        }

        // Get student's active bus pass to know their route
        const activePass = await BusPass.findOne({
            userId: req.user._id,
            status: 'approved',
            validUntil: { $gte: new Date() }
        }).populate('route');

        if (!activePass) {
            return res.status(403).json({ message: 'You need an active bus pass to reserve seats.' });
        }

        const routeId = activePass.route._id;

        // Find buses assigned to this route (directly or via allowedRoutes)
        const buses = await Bus.find({
            seatReservationEnabled: true,
            isActive: true,
            status: 'active',
            $or: [
                { assignedRoute: routeId },
                { allowedRoutes: routeId }
            ]
        })
            .select('busNumber registrationNumber capacity manufacturer model busType pointCostPerSeat assignedRoute allowedRoutes')
            .populate('assignedRoute', 'routeName routeNumber');

        res.json({ buses, route: activePass.route, rewardPoints: req.user.rewardPoints });
    } catch (error) {
        console.error('Available buses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
// GET /api/seat-reservation/seat-map/:busId/:date/:routeId
// Returns which seat numbers are already taken for that trip
// ============================================================
router.get('/seat-map/:busId/:date/:routeId', auth, async (req, res) => {
    try {
        const { busId, date, routeId } = req.params;
        const { direction = 'home_to_uni' } = req.query;

        const bus = await Bus.findById(busId).select('capacity busNumber busType seatReservationEnabled pointCostPerSeat');
        if (!bus) return res.status(404).json({ message: 'Bus not found' });
        if (!bus.seatReservationEnabled) return res.status(400).json({ message: 'Seat reservation not enabled on this bus.' });

        const travelDate = toMidnight(date);

        const reservations = await SeatReservation.find({
            busId,
            routeId,
            date: travelDate,
            direction,
            status: 'active'
        }).select('seatNumber studentId');

        // Mark if student already has a seat reserved for this trip
        const myReservation = reservations.find(r => r.studentId.toString() === req.user._id.toString());

        const takenSeats = reservations.map(r => r.seatNumber);

        res.json({
            bus,
            totalSeats: bus.capacity,
            takenSeats,
            myReservedSeat: myReservation?.seatNumber || null,
            pointCostPerSeat: bus.pointCostPerSeat
        });
    } catch (error) {
        console.error('Seat map error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
// POST /api/seat-reservation
// Student books seat(s). Deducts reward points.
// Body: { busId, routeId, dates: ['YYYY-MM-DD', ...], seatNumber, tripType, directions: ['home_to_uni', ...] }
// For round_trip: directions = ['home_to_uni', 'uni_to_home'], same date
// For multi_day: dates = multiple dates, same direction/seat
// ============================================================
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Students only.' });
        }

        const { busId, routeId, dates, seatNumber, tripType, directions } = req.body;

        if (!busId || !routeId || !dates || !seatNumber || !tripType || !directions) {
            return res.status(400).json({ message: 'busId, routeId, dates, seatNumber, tripType, directions are all required.' });
        }
        if (!Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({ message: 'dates must be a non-empty array.' });
        }
        if (!Array.isArray(directions) || directions.length === 0) {
            return res.status(400).json({ message: 'directions must be a non-empty array.' });
        }
        if (!['one_way', 'round_trip', 'multi_day'].includes(tripType)) {
            return res.status(400).json({ message: 'tripType must be one_way, round_trip, or multi_day.' });
        }

        // Validate bus
        const bus = await Bus.findById(busId);
        if (!bus || !bus.isActive || !bus.seatReservationEnabled) {
            return res.status(400).json({ message: 'Bus not found or seat reservation not enabled.' });
        }

        if (seatNumber < 1 || seatNumber > bus.capacity) {
            return res.status(400).json({ message: `Seat number must be between 1 and ${bus.capacity}.` });
        }

        // Validate student has active bus pass for this route
        const activePass = await BusPass.findOne({
            userId: req.user._id,
            status: 'approved',
            validUntil: { $gte: new Date() },
            route: routeId
        });
        if (!activePass) {
            return res.status(403).json({ message: 'You need an active bus pass for this route to reserve seats.' });
        }

        // Build list of (date, direction) pairs to create
        const pairs = [];
        if (tripType === 'round_trip') {
            // Both directions for all selected dates
            for (const dateStr of dates) {
                const travelDate = toMidnight(dateStr);
                for (const dir of directions) {
                    pairs.push({ date: travelDate, direction: dir });
                }
            }
        } else {
            // one_way or multi_day: each date × first direction
            const dir = directions[0];
            for (const dateStr of dates) {
                pairs.push({ date: toMidnight(dateStr), direction: dir });
            }
        }

        // Calculate total points needed
        const totalPointsNeeded = bus.pointCostPerSeat * pairs.length;

        // Fetch fresh user to check current points
        const student = await User.findById(req.user._id);
        if (student.rewardPoints < totalPointsNeeded) {
            return res.status(400).json({
                message: `Not enough reward points. Need ${totalPointsNeeded} pts, you have ${student.rewardPoints} pts.`
            });
        }

        // Check no seats already taken for any of these pairs
        for (const pair of pairs) {
            const conflict = await SeatReservation.findOne({
                busId,
                routeId,
                date: pair.date,
                direction: pair.direction,
                seatNumber,
                status: 'active'
            });
            if (conflict) {
                return res.status(409).json({
                    message: `Seat ${seatNumber} is already reserved for ${pair.date.toDateString()} (${pair.direction}).`
                });
            }

            // Also check student doesn't already have a reservation for same slot
            const studentConflict = await SeatReservation.findOne({
                busId,
                routeId,
                date: pair.date,
                direction: pair.direction,
                studentId: req.user._id,
                status: 'active'
            });
            if (studentConflict) {
                return res.status(409).json({
                    message: `You already have seat ${studentConflict.seatNumber} reserved for ${pair.date.toDateString()} (${pair.direction}).`
                });
            }
        }

        // Deduct points atomically
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { rewardPoints: -totalPointsNeeded }
        });

        // Create all reservation documents
        const created = await SeatReservation.insertMany(
            pairs.map(pair => ({
                studentId: req.user._id,
                busId,
                routeId,
                date: pair.date,
                direction: pair.direction,
                seatNumber,
                tripType,
                pointsSpent: bus.pointCostPerSeat,
                status: 'active'
            }))
        );

        res.status(201).json({
            message: `${created.length} seat reservation(s) created successfully.`,
            reservations: created,
            pointsDeducted: totalPointsNeeded,
            remainingPoints: student.rewardPoints - totalPointsNeeded
        });

    } catch (error) {
        console.error('Seat reservation booking error:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Seat conflict: one of the selected slots is already taken. Please try again.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
// GET /api/seat-reservation/my
// Student sees their own reservations
// ============================================================
router.get('/my', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Students only.' });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const [upcoming, past] = await Promise.all([
            SeatReservation.find({ studentId: req.user._id, date: { $gte: today } })
                .populate('busId', 'busNumber registrationNumber busType')
                .populate('routeId', 'routeName routeNumber')
                .sort({ date: 1 }),
            SeatReservation.find({ studentId: req.user._id, date: { $lt: today } })
                .populate('busId', 'busNumber registrationNumber busType')
                .populate('routeId', 'routeName routeNumber')
                .sort({ date: -1 })
                .limit(20)
        ]);

        const user = await User.findById(req.user._id).select('rewardPoints');

        res.json({ upcoming, past, rewardPoints: user.rewardPoints });
    } catch (error) {
        console.error('My reservations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
// DELETE /api/seat-reservation/:id
// Student cancels a reservation. Refund if > 24h before travel.
// ============================================================
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Students only.' });
        }

        const reservation = await SeatReservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });

        if (reservation.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not your reservation.' });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({ message: 'Reservation is already cancelled.' });
        }

        // Check if ≥ 24h before travel date for refund
        const now = new Date();
        const travelDate = new Date(reservation.date);
        const hoursUntilTravel = (travelDate - now) / (1000 * 60 * 60);
        const isRefundable = hoursUntilTravel >= 24;

        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        await reservation.save();

        let refundedPoints = 0;
        if (isRefundable) {
            refundedPoints = reservation.pointsSpent;
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { rewardPoints: refundedPoints }
            });
        }

        res.json({
            message: isRefundable
                ? `Reservation cancelled. ${refundedPoints} points refunded.`
                : 'Reservation cancelled. No refund (less than 24 hours before travel).',
            refundedPoints,
            isRefundable
        });
    } catch (error) {
        console.error('Cancel reservation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============================================================
// GET /api/seat-reservation/admin/all
// Admin: view all reservations with optional filters
// ============================================================
router.get('/admin/all', auth, isAdmin, async (req, res) => {
    try {
        const { busId, routeId, date, status, page = 1, limit = 30 } = req.query;

        const filter = {};
        if (busId) filter.busId = busId;
        if (routeId) filter.routeId = routeId;
        if (status) filter.status = status;
        if (date) {
            const d = toMidnight(date);
            filter.date = d;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await SeatReservation.countDocuments(filter);

        const reservations = await SeatReservation.find(filter)
            .populate('studentId', 'name enrollmentNumber mobile')
            .populate('busId', 'busNumber registrationNumber busType')
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            reservations,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Admin reservations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
