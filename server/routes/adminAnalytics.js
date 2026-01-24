const express = require('express');
const router = express.Router();
const DailyAttendance = require('../models/DailyAttendance');
const BusPass = require('../models/BusPass');
const Route = require('../models/Route');
const { auth, isAdmin } = require('../middleware/auth');



// ==========================
// Today Route-wise Summary
// ==========================
router.get('/today-summary', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const summary = await DailyAttendance.aggregate([
            { $match: { date: today } },
            {
                $group: {
                    _id: "$routeId",
                    totalCheckIns: {
                        $sum: { $cond: [{ $ifNull: ["$checkInTime", false] }, 1, 0] }
                    },
                    totalCheckOuts: {
                        $sum: { $cond: [{ $ifNull: ["$checkOutTime", false] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = await Route.populate(summary, { path: "_id" });

        res.json(result);
    } catch (error) {
        console.error("Today summary error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Students Currently In Bus
// ==========================
router.get('/active-students', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const active = await DailyAttendance.find({
            date: today,
            checkInTime: { $ne: null },
            checkOutTime: null
        })
            .populate('userId', 'name enrollmentNumber department year')
            .populate('routeId', 'routeName routeNumber');

        res.json(active);
    } catch (error) {
        console.error("Active students error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Daily Report (By Date)
// ==========================
router.get('/daily-report', auth, isAdmin, async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ message: "Date required" });
        }

        const report = await DailyAttendance.find({ date })
            .populate('userId', 'name enrollmentNumber department year')
            .populate('routeId', 'routeName routeNumber');

        res.json(report);
    } catch (error) {
        console.error("Daily report error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Route-wise Report
// ==========================
router.get('/route-report/:routeId', auth, isAdmin, async (req, res) => {
    try {
        const { routeId } = req.params;

        const report = await DailyAttendance.find({ routeId: routeId })
            .populate('userId', 'name enrollmentNumber department year')
            .populate('routeId', 'routeName routeNumber')
            .sort({ createdAt: -1 });

        res.json(report);
    } catch (error) {
        console.error("Route report error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


// ==========================
// Live Attendance Analytics
// ==========================
router.get('/live', auth, isAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch all routes
        const routes = await Route.find({ isActive: true });

        // Fetch today's analytics for all routes
        const RouteAnalytics = require('../models/RouteAnalytics');
        const analytics = await RouteAnalytics.find({ date: today })
            .populate('busId', 'busNumber registrationNumber capacity');

        // Fetch all active buses to map capacity if not in analytics yet
        const Bus = require('../models/Bus');
        const allBuses = await Bus.find({ status: 'active' });

        const liveData = [];

        // Helper to infer shift if no data exists
        const currentShift = new Date().getHours() < 14 ? 'morning' : 'afternoon';

        for (const route of routes) {
            // Find ALL stats for this route (Morning/Afternoon)
            const routeStats = analytics.filter(a => a.routeId.toString() === route._id.toString());

            // If no data yet, push a placeholder for the CURRENT shift
            if (routeStats.length === 0) {
                const busInfo = allBuses.find(b => b.assignedRoute?.toString() === route._id.toString());
                const totalSeats = busInfo?.capacity || 0;

                liveData.push({
                    uniqueKey: `${route._id}-${currentShift}`, // React Key
                    routeId: route._id,
                    routeNumber: route.routeNumber,
                    routeName: route.routeName,
                    shift: currentShift, // Default to current time-based shift
                    totalPassengers: 0,
                    checkedIn: 0,
                    checkedOut: 0,
                    busNumber: busInfo?.busNumber || 'Unassigned',
                    regNumber: busInfo?.registrationNumber || '',
                    totalSeats: totalSeats,
                    occupancy: 0,
                    availableSeats: totalSeats,
                    updatedAt: new Date()
                });
                continue;
            }

            // Push a card for EACH shift found (e.g. Morning stats AND Afternoon stats if both exist)
            routeStats.forEach(stat => {
                const busInfo = stat.busId || allBuses.find(b => b.assignedRoute?.toString() === route._id.toString());
                const totalSeats = busInfo?.capacity || 0;
                const checkedIn = stat.checkedIn || 0;
                const occupancy = totalSeats > 0 ? Math.round((checkedIn / totalSeats) * 100) : 0;
                const availableSeats = totalSeats - checkedIn;

                liveData.push({
                    uniqueKey: `${route._id}-${stat.shift}`,
                    routeId: route._id,
                    routeNumber: route.routeNumber,
                    routeName: route.routeName,
                    shift: stat.shift, // 'morning' or 'afternoon'
                    totalPassengers: stat.totalPassengers || 0,
                    checkedIn: checkedIn,
                    checkedOut: stat.checkedOut || 0,
                    busNumber: busInfo?.busNumber || 'Unassigned',
                    regNumber: busInfo?.registrationNumber || '',
                    totalSeats: totalSeats,
                    occupancy: occupancy,
                    availableSeats: availableSeats > 0 ? availableSeats : 0,
                    updatedAt: stat.updatedAt || new Date()
                });
            });
        }

        res.json(liveData);
    } catch (error) {
        console.error("Live analytics error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

