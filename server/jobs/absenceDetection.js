const cron = require('node-cron');
const BusPass = require('../models/BusPass');
const DayTicket = require('../models/DayTicket');
const StudentJourneyLog = require('../models/StudentJourneyLog');

/**
 * Absence Detection Cron Job
 * Runs daily at 11:59 PM to mark students absent who didn't board
 */
function initAbsenceDetection() {
    // Run at 11:59 PM daily
    cron.schedule('59 23 * * *', async () => {
        console.log('[Absence Detection] Running end-of-day absence check...');
        await markEndOfDayAbsences();
    });

    console.log('[Absence Detection] Cron job initialized - runs daily at 11:59 PM');
}

async function markEndOfDayAbsences() {
    try {
        const today = getTodayString();

        // Get all active passes
        const activePasses = await BusPass.find({ status: 'approved' });

        // Get all active day tickets for today
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const activeDayTickets = await DayTicket.find({
            travelDate: {
                $gte: todayStart,
                $lte: todayEnd
            },
            status: 'active',
            paymentStatus: 'completed'
        });

        let absentCount = 0;

        // Check bus pass holders
        for (const pass of activePasses) {
            const journeyLog = await StudentJourneyLog.findOne({
                userId: pass.userId,
                date: today
            });

            // If no journey log OR journey not started (no onboarded time)
            if (!journeyLog || !journeyLog.onboarded?.time) {
                await StudentJourneyLog.findOneAndUpdate(
                    { userId: pass.userId, date: today },
                    {
                        $set: {
                            userId: pass.userId,
                            enrollmentNumber: pass.enrollmentNumber,
                            studentName: pass.studentName,
                            date: today,
                            shift: pass.shift,
                            routeId: pass.route,
                            passType: 'bus_pass',
                            passId: pass._id,
                            journeyStatus: 'absent',
                            isAbsent: true,
                            absentReason: 'not_boarded',
                            expectedToBoard: true,
                            markedAbsentAt: new Date(),
                            markedAbsentBy: 'system'
                        }
                    },
                    { upsert: true }
                );
                absentCount++;
            }
        }

        // Check day ticket holders
        for (const ticket of activeDayTickets) {
            const journeyLog = await StudentJourneyLog.findOne({
                userId: ticket.userId,
                date: today
            });

            if (!journeyLog || !journeyLog.onboarded?.time) {
                await StudentJourneyLog.findOneAndUpdate(
                    { userId: ticket.userId, date: today },
                    {
                        $set: {
                            userId: ticket.userId,
                            enrollmentNumber: ticket.enrollmentNumber,
                            studentName: ticket.studentName,
                            date: today,
                            shift: ticket.shift,
                            routeId: ticket.route,
                            passType: 'day_ticket',
                            passId: ticket._id,
                            ticketType: ticket.ticketType,
                            journeyStatus: 'absent',
                            isAbsent: true,
                            absentReason: 'not_boarded',
                            expectedToBoard: true,
                            markedAbsentAt: new Date(),
                            markedAbsentBy: 'system'
                        }
                    },
                    { upsert: true }
                );
                absentCount++;
            }
        }

        console.log(`[Absence Detection] Marked ${absentCount} students as absent for ${today}`);

    } catch (error) {
        console.error('[Absence Detection] Error:', error);
    }
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// Export for manual testing
module.exports = {
    initAbsenceDetection,
    markEndOfDayAbsences
};
