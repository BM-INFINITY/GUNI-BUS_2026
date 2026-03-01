const express = require('express');
const router = express.Router();
const StudentJourneyLog = require('../models/StudentJourneyLog');
const { auth, isAdmin } = require('../middleware/auth');
const { getTodayString } = require('../utils/timeProvider');

/**
 * GET /api/journey/my-logs
 * Get student's own journey history
 */
router.get('/my-logs', auth, async (req, res) => {
    try {
        const { days } = req.query;

        // Calculate date range
        const daysBack = parseInt(days) || 7;
        const endDate = getTodayString();
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - daysBack);
        const startDate = startDateObj.toISOString().split('T')[0];

        const logs = await StudentJourneyLog.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        })
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Get journey logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/journey/daily-summary/:date
 * Get daily summary for a specific date (admin/driver)
 */
router.get('/daily-summary/:date', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const { routeId, shift } = req.query;

        const filter = { date };
        if (routeId) filter.routeId = routeId;
        if (shift) filter.shift = shift;

        // If driver, only show their route
        if (req.user.role === 'driver') {
            filter.routeId = req.user.assignedRoute;
            filter.shift = req.user.shift;
        }

        const logs = await StudentJourneyLog.find(filter)
            .populate('userId', 'enrollmentNumber name department year')
            .populate('routeId', 'routeName routeNumber')
            .sort({ enrollmentNumber: 1 });

        // Calculate summary stats
        const summary = {
            totalExpected: logs.length,
            totalBoarded: logs.filter(l => l.onboarded?.time).length,
            journeyCompleted: logs.filter(l => l.journeyStatus === 'completed').length,
            absent: logs.filter(l => l.isAbsent).length,
            inProgress: logs.filter(l => l.journeyStatus === 'in_progress').length
        };

        res.json({ summary, logs });
    } catch (error) {
        console.error('Daily summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/journey/absence-report
 * Get absence analytics (admin only)
 */
router.get('/absence-report', auth, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate, routeId } = req.query;

        const filter = { isAbsent: true };

        // Date range filter
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        } else if (startDate) {
            filter.date = { $gte: startDate };
        }

        // Route filter
        if (routeId) {
            filter.routeId = routeId;
        }

        const absences = await StudentJourneyLog.find(filter)
            .populate('userId', 'enrollmentNumber name department mobile email')
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1, enrollmentNumber: 1 });

        // Group by student for analytics
        const studentAbsenceCount = {};
        absences.forEach(absence => {
            const enrollment = absence.enrollmentNumber;
            if (!studentAbsenceCount[enrollment]) {
                studentAbsenceCount[enrollment] = {
                    student: absence.userId,
                    count: 0,
                    dates: []
                };
            }
            studentAbsenceCount[enrollment].count++;
            studentAbsenceCount[enrollment].dates.push(absence.date);
        });

        res.json({
            absences,
            analytics: {
                totalAbsences: absences.length,
                uniqueStudents: Object.keys(studentAbsenceCount).length,
                studentBreakdown: studentAbsenceCount
            }
        });
    } catch (error) {
        console.error('Absence report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/journey/route-summary/:date
 * ERP-level daily summary: expected / boarded / absent per route+shift (admin only)
 */
router.get('/route-summary/:date', auth, isAdmin, async (req, res) => {
    try {
        const { date } = req.params; // YYYY-MM-DD

        const Route = require('../models/Route');
        const BusPass = require('../models/BusPass');
        const DayTicket = require('../models/DayTicket');
        const DailyAttendance = require('../models/DailyAttendance');

        const dateObj = new Date(date);
        const startOfDay = new Date(dateObj); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateObj); endOfDay.setHours(23, 59, 59, 999);

        const routes = await Route.find({ isActive: true });
        const data = [];

        for (const route of routes) {
            for (const shift of ['morning', 'afternoon']) {
                // Expected: active bus passes valid on this date for this route+shift
                const expectedPasses = await BusPass.countDocuments({
                    route: route._id,
                    shift,
                    status: 'approved',
                    validFrom: { $lte: endOfDay },
                    validUntil: { $gte: startOfDay },
                });

                // Expected: day tickets for this route+shift on this date
                const expectedTickets = await DayTicket.countDocuments({
                    route: route._id,
                    shift,
                    travelDate: { $gte: startOfDay, $lte: endOfDay },
                    status: { $in: ['active', 'used'] },
                });

                const totalExpected = expectedPasses + expectedTickets;
                if (totalExpected === 0) continue; // skip empty slots

                // Boarded: unique boarding scans for this route+shift+date
                const boarded = await DailyAttendance.countDocuments({
                    routeId: route._id,
                    shift,
                    date,
                    scanPhase: 'boarding',
                });

                const absent = Math.max(0, totalExpected - boarded);
                const attendanceRate = totalExpected > 0
                    ? Math.round((boarded / totalExpected) * 100)
                    : 0;

                // Return trip (optional info)
                const returned = await DailyAttendance.countDocuments({
                    routeId: route._id,
                    shift,
                    date,
                    scanPhase: 'return',
                });

                data.push({
                    routeId: route._id,
                    routeName: route.routeName,
                    routeNumber: route.routeNumber,
                    shift,
                    expectedPasses,
                    expectedTickets,
                    totalExpected,
                    boarded,
                    returned,
                    absent,
                    attendanceRate,
                });
            }
        }

        res.json({ date, summary: data });
    } catch (error) {
        console.error('Route summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/journey/student-search?q=
 * Search students by name or enrollment number (admin only)
 */
router.get('/student-search', auth, isAdmin, async (req, res) => {
    try {
        const { q = '' } = req.query;
        const User = require('../models/User');

        const users = await User.find({
            role: 'student',
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { enrollmentNumber: { $regex: q, $options: 'i' } },
            ],
        })
            .select('name enrollmentNumber department year mobile email profilePhoto')
            .limit(20);

        res.json(users);
    } catch (error) {
        console.error('Student search error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/journey/student/:userId
 * Get day-by-day journey history for a specific student (admin only)
 * Query: startDate, endDate (YYYY-MM-DD)
 */
router.get('/student/:userId', auth, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const filter = { userId };
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        } else {
            // Default: last 30 days
            const from = new Date();
            from.setDate(from.getDate() - 30);
            filter.date = { $gte: from.toISOString().split('T')[0] };
        }

        const logs = await StudentJourneyLog.find(filter)
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: -1 })
            .limit(90);

        // Also return student profile
        const User = require('../models/User');
        const student = await User.findById(userId)
            .select('name enrollmentNumber department year mobile email profilePhoto');

        // Journey stats for summary bar
        const total = logs.length;
        const boarded = logs.filter(l => l.onboarded?.time).length;
        const completed = logs.filter(l => l.journeyStatus === 'completed').length;
        const absent = logs.filter(l => l.isAbsent).length;

        res.json({
            student,
            logs,
            stats: { total, boarded, completed, absent },
        });
    } catch (error) {
        console.error('Student journey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

