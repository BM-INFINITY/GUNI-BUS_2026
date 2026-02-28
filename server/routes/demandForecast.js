const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const RideIntent = require('../models/RideIntent');
const DemandForecast = require('../models/DemandForecast');
const DailyAttendance = require('../models/DailyAttendance');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const User = require('../models/User');

// Helper: Parse a date string to midnight UTC
function parseDateToMidnight(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ====================================================
// GET /api/forecast/date/:date
// Aggregate RideIntent for a specific date, generate/update DemandForecast
// ====================================================
router.get('/date/:date', auth, isAdmin, async (req, res) => {
    try {
        const targetDate = parseDateToMidnight(req.params.date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Aggregate YES counts by route
        const aggregation = await RideIntent.aggregate([
            { $match: { travelDate: { $gte: targetDate, $lt: nextDay } } },
            {
                $group: {
                    _id: '$routeId',
                    yesCount: { $sum: { $cond: [{ $eq: ['$intentStatus', 'YES'] }, 1, 0] } },
                    noCount: { $sum: { $cond: [{ $eq: ['$intentStatus', 'NO'] }, 1, 0] } },
                    total: { $sum: 1 }
                }
            }
        ]);

        const forecastResults = [];

        for (const agg of aggregation) {
            const route = await Route.findById(agg._id).select('routeName routeNumber');

            // Find the bus assigned to this route to get capacity
            const assignedBus = await Bus.findOne({ currentRoute: agg._id }).select('capacity busNumber');
            const busCapacity = assignedBus?.capacity || 40; // fallback

            const recommendedBuses = Math.ceil(agg.yesCount / busCapacity) || 1;

            const forecast = await DemandForecast.findOneAndUpdate(
                { routeId: agg._id, date: targetDate },
                {
                    $set: {
                        expectedPassengers: agg.yesCount,
                        recommendedBuses,
                        yesIntentCount: agg.yesCount,
                        noIntentCount: agg.noCount,
                        busCapacitySnapshot: busCapacity,
                        generatedAt: new Date()
                    }
                },
                { upsert: true, new: true }
            );

            forecastResults.push({
                routeId: agg._id,
                routeName: route?.routeName || 'Unknown Route',
                routeNumber: route?.routeNumber,
                yesCount: agg.yesCount,
                noCount: agg.noCount,
                totalDeclarations: agg.total,
                expectedPassengers: agg.yesCount,
                recommendedBuses,
                busCapacity,
                forecast
            });
        }

        // Emit socket event to admin dashboard
        const io = req.app.get('io');
        if (io) io.emit('demand-forecast-updated', { date: targetDate, routes: forecastResults });

        res.json({ date: targetDate, routes: forecastResults });

    } catch (error) {
        console.error('Forecast date error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================================================
// GET /api/forecast/analytics
// Return historical prediction accuracy across dates (last 30 days)
// ====================================================
router.get('/analytics', auth, isAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const forecasts = await DemandForecast.find({
            date: { $gte: thirtyDaysAgo },
            predictionAccuracy: { $ne: null }
        })
            .populate('routeId', 'routeName routeNumber')
            .sort({ date: 1 });

        // Aggregate by date for a daily trend
        const byDate = {};
        forecasts.forEach(f => {
            const dateKey = f.date.toISOString().split('T')[0];
            if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, totalAccuracy: 0, count: 0 };
            byDate[dateKey].totalAccuracy += f.predictionAccuracy || 0;
            byDate[dateKey].count++;
        });

        const trend = Object.values(byDate).map(d => ({
            date: d.date,
            avgAccuracy: d.count > 0 ? Math.round(d.totalAccuracy / d.count) : 0
        }));

        res.json({ forecasts, trend });

    } catch (error) {
        console.error('Forecast analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================================================
// GET /api/forecast/leaderboard
// Top students by reward points
// ====================================================
router.get('/leaderboard', auth, isAdmin, async (req, res) => {
    try {
        const topStudents = await User.find({ role: 'student', rewardPoints: { $gt: 0 } })
            .select('name enrollmentNumber rewardPoints reliabilityScore department year')
            .sort({ rewardPoints: -1 })
            .limit(25);

        res.json(topStudents);

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====================================================
// GET /api/forecast/summary
// Quick summary for the admin dashboard widget
// ====================================================
router.get('/summary', auth, isAdmin, async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const tomorrowIntents = await RideIntent.aggregate([
            { $match: { travelDate: { $gte: tomorrow, $lt: dayAfter } } },
            { $group: { _id: '$intentStatus', count: { $sum: 1 } } }
        ]);

        const yesCount = tomorrowIntents.find(i => i._id === 'YES')?.count || 0;
        const noCount = tomorrowIntents.find(i => i._id === 'NO')?.count || 0;

        const latestForecast = await DemandForecast.find({ date: { $gte: tomorrow, $lt: dayAfter } })
            .populate('routeId', 'routeName');

        res.json({ tomorrow: tomorrow.toISOString().split('T')[0], yesCount, noCount, latestForecast });

    } catch (error) {
        console.error('Forecast summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
