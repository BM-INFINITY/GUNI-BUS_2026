const cron = require('node-cron');
const RideIntent = require('../models/RideIntent');
const DemandForecast = require('../models/DemandForecast');
const DailyAttendance = require('../models/DailyAttendance');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const User = require('../models/User');

/**
 * Ride Intent Cron Jobs
 * Follows the same pattern as absenceDetection.js
 * Requires: app.set('io', io) to be set before calling initRideIntentJobs(io)
 */
function initRideIntentJobs(io) {

    // ─────────────────────────────────────────────
    // 5:00 PM Daily — Reminder to students
    // ─────────────────────────────────────────────
    cron.schedule('0 17 * * *', () => {
        console.log('[RideIntent] 5 PM reminder — emitting ride-intent-reminder');
        if (io) io.emit('ride-intent-reminder', {
            message: 'Don\'t forget to declare your travel plans for upcoming days!',
            timestamp: new Date()
        });
    });

    // ─────────────────────────────────────────────
    // 10:00 PM Daily — Lock intents + Generate tomorrow's forecast
    // ─────────────────────────────────────────────
    cron.schedule('0 22 * * *', async () => {
        console.log('[RideIntent] 10 PM — Generating DemandForecast for tomorrow...');
        await generateForecastForTomorrow(io);
    });

    // ─────────────────────────────────────────────
    // 11:30 PM Daily — Reconcile actuals + Award rewards
    // ─────────────────────────────────────────────
    cron.schedule('30 23 * * *', async () => {
        console.log('[RideIntent] 11:30 PM — Reconciling intents with actual attendance...');
        await reconcileAndAwardRewards(io);
    });

    console.log('[RideIntent] Cron jobs initialized — 5 PM reminder, 10 PM forecast, 11:30 PM reconcile');
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate DemandForecast for tomorrow
// ─────────────────────────────────────────────────────────────────────────────
async function generateForecastForTomorrow(io) {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const aggregation = await RideIntent.aggregate([
            { $match: { travelDate: { $gte: tomorrow, $lt: dayAfter } } },
            {
                $group: {
                    _id: '$routeId',
                    yesCount: { $sum: { $cond: [{ $eq: ['$intentStatus', 'YES'] }, 1, 0] } },
                    noCount: { $sum: { $cond: [{ $eq: ['$intentStatus', 'NO'] }, 1, 0] } },
                    total: { $sum: 1 }
                }
            }
        ]);

        const results = [];
        for (const agg of aggregation) {
            const assignedBus = await Bus.findOne({ currentRoute: agg._id }).select('capacity');
            const busCapacity = assignedBus?.capacity || 40;
            const recommendedBuses = Math.max(1, Math.ceil(agg.yesCount / busCapacity));

            const forecast = await DemandForecast.findOneAndUpdate(
                { routeId: agg._id, date: tomorrow },
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
            results.push(forecast);
        }

        console.log(`[RideIntent] Generated ${results.length} route forecasts for ${tomorrow.toISOString().split('T')[0]}`);

        if (io) io.emit('demand-forecast-updated', {
            date: tomorrow.toISOString().split('T')[0],
            count: results.length
        });

    } catch (error) {
        console.error('[RideIntent] Forecast generation error:', error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconcile RideIntent vs DailyAttendance, award reward points
// ─────────────────────────────────────────────────────────────────────────────
async function reconcileAndAwardRewards(io) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayStr = today.toISOString().split('T')[0];

        // Find all unprocessed intents for today
        const intents = await RideIntent.find({
            travelDate: { $gte: today, $lt: tomorrow },
            rewardPointsCalculated: false
        });

        let processed = 0;

        for (const intent of intents) {
            // Check if student actually boarded today on this route
            const attendance = await DailyAttendance.findOne({
                userId: intent.studentId,
                routeId: intent.routeId,
                date: todayStr,
                scanPhase: 'boarding'
            });

            const actualBoarded = !!attendance;
            let pointsDelta = 0;
            let scoreDelta = 0;

            if (intent.intentStatus === 'YES' && actualBoarded) {
                // ✅ Said YES, boarded
                pointsDelta = 10;
                scoreDelta = 0;  // No penalty, positive reinforcement via points
            } else if (intent.intentStatus === 'NO' && !actualBoarded) {
                // ✅ Said NO, didn't board
                pointsDelta = 5;
                scoreDelta = 0;
            } else if (intent.intentStatus === 'YES' && !actualBoarded) {
                // ❌ Said YES, didn't show up
                pointsDelta = -8;
                scoreDelta = -5; // reliability takes a hit
            } else if (intent.intentStatus === 'NO' && actualBoarded) {
                // Surprise boarding — no reward, no penalty
                pointsDelta = 0;
                scoreDelta = 0;
            }

            // Update the intent record
            await RideIntent.findByIdAndUpdate(intent._id, {
                actualBoarded,
                rewardPointsCalculated: true,
                reliabilityScoreImpact: scoreDelta
            });

            // Update the student's reward points and reliability score (floor at 0 for points)
            await User.findByIdAndUpdate(intent.studentId, {
                $inc: {
                    rewardPoints: pointsDelta,
                    reliabilityScore: scoreDelta
                }
            });

            // Make sure rewardPoints never drops below 0
            await User.updateOne(
                { _id: intent.studentId, rewardPoints: { $lt: 0 } },
                { $set: { rewardPoints: 0 } }
            );

            // Clamp reliabilityScore between 0 and 100
            await User.updateOne(
                { _id: intent.studentId, reliabilityScore: { $lt: 0 } },
                { $set: { reliabilityScore: 0 } }
            );
            await User.updateOne(
                { _id: intent.studentId, reliabilityScore: { $gt: 100 } },
                { $set: { reliabilityScore: 100 } }
            );

            processed++;
        }

        // Update DemandForecast actual counts for today's routes
        const actualsByRoute = await DailyAttendance.aggregate([
            { $match: { date: todayStr, scanPhase: 'boarding' } },
            { $group: { _id: '$routeId', actualPassengers: { $sum: 1 } } }
        ]);

        for (const actual of actualsByRoute) {
            const forecast = await DemandForecast.findOne({
                routeId: actual._id,
                date: today
            });

            if (forecast) {
                const accuracy = forecast.expectedPassengers > 0
                    ? Math.min(100, Math.round((actual.actualPassengers / forecast.expectedPassengers) * 100))
                    : null;

                await DemandForecast.findByIdAndUpdate(forecast._id, {
                    actualPassengers: actual.actualPassengers,
                    predictionAccuracy: accuracy,
                    reconciledAt: new Date()
                });
            }
        }

        console.log(`[RideIntent] Reconciled ${processed} intents and updated forecasts for ${todayStr}`);

        if (io) io.emit('prediction-accuracy-updated', {
            date: todayStr,
            processed,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('[RideIntent] Reconciliation error:', error);
    }
}

module.exports = {
    initRideIntentJobs,
    generateForecastForTomorrow,
    reconcileAndAwardRewards
};
