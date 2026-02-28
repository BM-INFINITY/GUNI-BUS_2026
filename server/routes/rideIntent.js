const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const BusPass = require('../models/BusPass');
const RideIntent = require('../models/RideIntent');
const User = require('../models/User');

// Helper: Get date range [startOfDay, endOfDay]
function dayRange(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// Helper: Is editing locked? (after 10 PM of the previous day)
function isEditLocked(travelDate) {
    const now = new Date();
    const dayBefore = new Date(travelDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(22, 0, 0, 0); // 10 PM prev day
    return now >= dayBefore;
}

// ====================================================
// POST /api/ride-intent
// Student submits YES/NO intent for a travel date
// ====================================================
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can submit ride intent.' });
        }

        const { travelDate, intentStatus } = req.body;

        if (!travelDate || !intentStatus) {
            return res.status(400).json({ message: 'travelDate and intentStatus (YES/NO) are required.' });
        }

        if (!['YES', 'NO'].includes(intentStatus)) {
            return res.status(400).json({ message: 'intentStatus must be YES or NO.' });
        }

        const parsedDate = new Date(travelDate);
        parsedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);

        // Must be at least tomorrow
        if (parsedDate < tomorrow) {
            return res.status(400).json({ message: 'You can only declare intent for tomorrow or later.' });
        }

        // Max 7 days ahead
        if (parsedDate > maxDate) {
            return res.status(400).json({ message: 'You can only declare intent up to 7 days in advance.' });
        }

        // Check if editing is locked (past 10 PM of previous day)
        if (isEditLocked(parsedDate)) {
            return res.status(403).json({ message: 'Intent submission is locked. The cutoff for this date has passed (10 PM previous day).' });
        }

        // Validate active bus pass
        const activePass = await BusPass.findOne({
            userId: req.user._id,
            status: 'approved',
            validUntil: { $gte: parsedDate }
        }).populate('route');

        if (!activePass) {
            return res.status(403).json({ message: 'You must have an active bus pass to submit ride intent.' });
        }

        const routeId = activePass.route._id;

        // ML-readiness: capture features
        const mlFeatures = {
            dayOfWeek: parsedDate.getDay(),
            month: parsedDate.getMonth() + 1,
            consecutiveAbsences: 0 // Updated by cron
        };

        // Upsert: one entry per student per day
        const intent = await RideIntent.findOneAndUpdate(
            { studentId: req.user._id, travelDate: parsedDate },
            {
                $set: {
                    routeId,
                    intentStatus,
                    submittedAt: new Date(),
                    actualBoarded: false,
                    rewardPointsCalculated: false,
                    reliabilityScoreImpact: 0,
                    mlFeatures
                }
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: `Intent recorded: ${intentStatus} for ${parsedDate.toDateString()}`,
            intent,
            rewardPreview: intentStatus === 'YES'
                ? { onBoard: '+10 pts', absent: '-8 pts' }
                : { notBoarded: '+5 pts', boarded: '+0 pts' }
        });

    } catch (error) {
        console.error('Ride intent submit error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================================================
// GET /api/ride-intent/upcoming
// Student sees their upcoming declarations
// ====================================================
router.get('/upcoming', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Students only.' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const intents = await RideIntent.find({
            studentId: req.user._id,
            travelDate: { $gte: today }
        })
            .populate('routeId', 'routeName routeNumber')
            .sort({ travelDate: 1 });

        // Also return score so students see their current standing
        const user = await User.findById(req.user._id).select('rewardPoints reliabilityScore');

        res.json({ intents, rewardPoints: user.rewardPoints, reliabilityScore: user.reliabilityScore });

    } catch (error) {
        console.error('Get upcoming intents error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================================================
// GET /api/ride-intent/history
// Student sees past declarations with actuals
// ====================================================
router.get('/history', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const intents = await RideIntent.find({
            studentId: req.user._id,
            travelDate: { $lt: today }
        })
            .populate('routeId', 'routeName routeNumber')
            .sort({ travelDate: -1 })
            .limit(30);

        res.json(intents);

    } catch (error) {
        console.error('Get intent history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
