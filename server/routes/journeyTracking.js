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

module.exports = router;
